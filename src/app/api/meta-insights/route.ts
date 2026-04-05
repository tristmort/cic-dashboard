import { NextResponse } from "next/server";

const TOKEN = process.env.META_ACCESS_TOKEN!;
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID!;
const API_VERSION = process.env.META_API_VERSION || "v21.0";
const CAMPAIGN_ID = process.env.META_CAMPAIGN_ID!;

const BASE = `https://graph.facebook.com/${API_VERSION}`;

async function fetchMeta(url: string) {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta API error: ${res.status} — ${err}`);
  }
  return res.json();
}

export async function GET() {
  try {
    // Fetch in parallel: account insights (30d), daily breakdown, ad set details, ad set insights
    const [accountInsights, dailyInsights, adSets] = await Promise.all([
      fetchMeta(
        `${BASE}/${AD_ACCOUNT}/insights?fields=impressions,clicks,spend,actions,cost_per_action_type,ctr,cpc,reach,frequency&date_preset=last_30d&access_token=${TOKEN}`
      ),
      fetchMeta(
        `${BASE}/${AD_ACCOUNT}/insights?fields=impressions,clicks,spend,actions,ctr&date_preset=last_30d&time_increment=1&access_token=${TOKEN}`
      ),
      fetchMeta(
        `${BASE}/${CAMPAIGN_ID}/adsets?fields=name,status,optimization_goal,daily_budget,lifetime_budget&access_token=${TOKEN}`
      ),
    ]);

    // Fetch per-adset insights
    const adSetIds = adSets.data.map((a: { id: string }) => a.id);
    const adSetInsights = await Promise.all(
      adSetIds.map((id: string) =>
        fetchMeta(
          `${BASE}/${id}/insights?fields=adset_name,impressions,clicks,spend,actions,ctr,cpc&date_preset=last_30d&access_token=${TOKEN}`
        )
      )
    );

    // Extract lead count and cost per lead from account data
    const acct = accountInsights.data[0] || {};
    const leads =
      acct.actions?.find(
        (a: { action_type: string }) => a.action_type === "lead"
      )?.value || "0";
    const costPerLead =
      acct.cost_per_action_type?.find(
        (a: { action_type: string }) => a.action_type === "lead"
      )?.value || "0";

    // Build daily data for charts
    const daily = (dailyInsights.data || []).map(
      (d: {
        date_start: string;
        impressions: string;
        clicks: string;
        spend: string;
        actions?: { action_type: string; value: string }[];
      }) => ({
        date: d.date_start,
        impressions: parseInt(d.impressions),
        clicks: parseInt(d.clicks),
        spend: parseFloat(d.spend),
        leads:
          parseInt(
            d.actions?.find(
              (a: { action_type: string }) => a.action_type === "lead"
            )?.value || "0"
          ) || 0,
      })
    );

    // Build ad set breakdown
    const adSetBreakdown = adSets.data.map(
      (
        set: { id: string; name: string; status: string },
        i: number
      ) => {
        const insight = adSetInsights[i]?.data?.[0];
        return {
          name: set.name
            .replace("META_CIC_Leads_Homeowners-25km_", "")
            .replace("_202503", ""),
          status: set.status,
          impressions: insight ? parseInt(insight.impressions) : 0,
          clicks: insight ? parseInt(insight.clicks) : 0,
          spend: insight ? parseFloat(insight.spend) : 0,
          leads: insight
            ? parseInt(
                insight.actions?.find(
                  (a: { action_type: string }) => a.action_type === "lead"
                )?.value || "0"
              )
            : 0,
          ctr: insight ? parseFloat(insight.ctr) : 0,
          cpc: insight ? parseFloat(insight.cpc) : 0,
        };
      }
    );

    return NextResponse.json({
      summary: {
        impressions: parseInt(acct.impressions || "0"),
        clicks: parseInt(acct.clicks || "0"),
        spend: parseFloat(acct.spend || "0"),
        leads: parseInt(leads),
        costPerLead: parseFloat(costPerLead),
        ctr: parseFloat(acct.ctr || "0"),
        cpc: parseFloat(acct.cpc || "0"),
        reach: parseInt(acct.reach || "0"),
        frequency: parseFloat(acct.frequency || "0"),
        dateStart: acct.date_start,
        dateEnd: acct.date_stop,
      },
      daily,
      adSets: adSetBreakdown,
    });
  } catch (error) {
    console.error("Meta API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
