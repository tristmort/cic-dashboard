"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";

interface Summary {
  impressions: number;
  clicks: number;
  linkClicks: number;
  spend: number;
  leads: number;
  costPerLead: number;
  ctr: number;
  cpc: number;
  reach: number;
  frequency: number;
  dateStart: string;
  dateEnd: string;
}

interface DailyData {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
}

interface AdSetData {
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  ctr: number;
  cpc: number;
}

interface DashboardData {
  summary: Summary;
  daily: DailyData[];
  adSets: AdSetData[];
}

interface BusinessMetrics {
  appointments: number;
  closed: number;
  avgDealValue: number;
}

const COLORS = {
  green: "#7AB648",
  darkGreen: "#5A8F38",
  lime: "#A3D977",
};

const PIE_COLORS = ["#7AB648", "#5A8F38", "#A3D977", "#3D6B1E"];

function formatCurrency(n: number) {
  return `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(n: number) {
  return n.toLocaleString("en-ZA");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isActive
          ? "bg-[#7AB648]/20 text-[#7AB648]"
          : "bg-[#888]/20 text-[#888]"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${isActive ? "bg-[#7AB648] animate-pulse" : "bg-[#888]"}`}
      />
      {status}
    </span>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#222] rounded-2xl p-6 border border-[#2A2A2A]">
      <p className="text-sm text-[#888] font-medium mb-1">{label}</p>
      <p
        className={`text-3xl font-bold tracking-tight ${accent ? "text-[#7AB648]" : "text-white"}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-[#888] mt-1">{sub}</p>}
    </div>
  );
}

function ResultMetric({
  label,
  value,
  description,
  color,
}: {
  label: string;
  value: string;
  description: string;
  color?: "green" | "white" | "amber";
}) {
  const colorClass = color === "green" ? "text-[#7AB648]" : color === "amber" ? "text-[#F59E0B]" : "text-white";
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]/50">
      <p className="text-xs text-[#888] font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</p>
      <p className="text-xs text-[#666] mt-1">{description}</p>
    </div>
  );
}

export default function ViewDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [metrics, setMetrics] = useState<BusinessMetrics>({ appointments: 0, closed: 0, avgDealValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAdData = useCallback(async () => {
    try {
      const res = await fetch("/api/meta-insights");
      if (!res.ok) throw new Error("Failed to fetch ad data");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/business-metrics");
      if (res.ok) {
        const json = await res.json();
        setMetrics({
          appointments: json.appointments || 0,
          closed: json.closed || 0,
          avgDealValue: json.avgDealValue || 0,
        });
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchAdData();
    fetchMetrics();
    // Ad data refreshes every 6 hours
    const adInterval = setInterval(fetchAdData, 6 * 60 * 60 * 1000);
    // Business metrics poll every 15 seconds so edits show up fast
    const metricsInterval = setInterval(fetchMetrics, 15 * 1000);
    return () => { clearInterval(adInterval); clearInterval(metricsInterval); };
  }, [fetchAdData, fetchMetrics]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#111" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#7AB648]/30 border-t-[#7AB648] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#888]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#111" }}>
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg font-semibold mb-2">Unable to load data</p>
          <p className="text-[#888] text-sm">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchAdData(); fetchMetrics(); }}
            className="mt-4 px-4 py-2 bg-[#7AB648] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#5A8F38] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, daily, adSets } = data;
  const { appointments, closed, avgDealValue } = metrics;

  const spendPieData = adSets
    .filter((a) => a.spend > 0)
    .map((a) => ({ name: a.name, value: a.spend }));

  const cplData = adSets
    .filter((a) => a.leads > 0)
    .map((a) => ({ name: a.name, costPerLead: a.spend / a.leads, leads: a.leads }));

  return (
    <div className="min-h-screen" style={{ background: "#111" }}>
      {/* Header */}
      <header className="border-b border-[#2A2A2A] bg-[#1A1A1A]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/cic-logo.png"
              alt="CIC Projects"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white">CIC Projects</h1>
              <p className="text-xs text-[#888]">Ad Performance Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[#888]">
                {summary.dateStart && `${formatDate(summary.dateStart)} — ${formatDate(summary.dateEnd)}`}
              </p>
              {lastUpdated && (
                <p className="text-xs text-[#888]">
                  Updated {lastUpdated.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Social Proof Hero */}
        {appointments > 0 && (
          <section className="relative overflow-hidden rounded-2xl border border-[#7AB648]/30 bg-gradient-to-br from-[#7AB648]/10 via-[#1A1A1A] to-[#222] p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7AB648]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7AB648] animate-pulse" />
                  <h2 className="text-sm font-semibold text-[#7AB648] uppercase tracking-widest">Live Client Results</h2>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#888]">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#7AB648]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    &lt; 60s response time
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#7AB648]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    24/7 AI follow-up
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <p className="text-sm text-[#888] font-medium mb-2">Appointments Booked</p>
                  <p className="text-4xl md:text-6xl font-black text-white tracking-tight">{appointments}</p>
                  <p className="text-sm text-[#888] mt-2">from {summary.leads} leads generated</p>
                </div>
                <div>
                  <p className="text-sm text-[#888] font-medium mb-2">Booking Rate</p>
                  <p className="text-4xl md:text-6xl font-black text-[#7AB648] tracking-tight">
                    {summary.leads > 0 ? `${((appointments / summary.leads) * 100).toFixed(0)}%` : "—"}
                  </p>
                  <p className="text-sm text-[#888] mt-2">lead to appointment conversion</p>
                </div>
                <div>
                  <p className="text-sm text-[#888] font-medium mb-2">Cost per Appointment</p>
                  <p className="text-4xl md:text-6xl font-black text-white tracking-tight">
                    {formatCurrency(Math.round(summary.spend / appointments))}
                  </p>
                  <p className="text-sm text-[#888] mt-2">total ad spend per booking</p>
                </div>
                <div>
                  <p className="text-sm text-[#888] font-medium mb-2">{closed > 0 ? "Jobs Closed" : "Cost per Lead"}</p>
                  <p className="text-4xl md:text-6xl font-black text-white tracking-tight">
                    {closed > 0 ? closed : formatCurrency(Math.round(summary.costPerLead))}
                  </p>
                  <p className="text-sm text-[#888] mt-2">
                    {closed > 0 && appointments > 0
                      ? `${((closed / appointments) * 100).toFixed(0)}% close rate`
                      : "average across all leads"}
                  </p>
                </div>
              </div>
              {closed > 0 && avgDealValue > 0 && (
                <div className="mt-8 pt-6 border-t border-[#7AB648]/20 grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-[#888] font-medium mb-1">Revenue Generated</p>
                    <p className="text-2xl font-bold text-[#7AB648]">{formatCurrency(closed * avgDealValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#888] font-medium mb-1">Cost per Acquisition</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(Math.round(summary.spend / closed))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#888] font-medium mb-1">Return on Ad Spend</p>
                    <p className="text-2xl font-bold text-[#7AB648]">
                      {(((closed * avgDealValue) / summary.spend)).toFixed(1)}x
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Leads" value={formatNumber(summary.leads)} sub={`${formatCurrency(summary.costPerLead)} per lead`} accent />
          <MetricCard label="Total Spend" value={formatCurrency(summary.spend)} sub="Last 30 days" />
          <MetricCard label="Impressions" value={formatNumber(summary.impressions)} sub={`${formatNumber(summary.reach)} reach`} />
          <MetricCard label="Click-Through Rate" value={`${summary.ctr.toFixed(2)}%`} sub={`${formatNumber(summary.clicks)} clicks`} />
        </section>

        {/* Conversion Funnel */}
        <section className="bg-[#222] rounded-2xl p-6 border border-[#2A2A2A]">
          <h2 className="text-lg font-semibold text-white mb-1">Conversion Funnel</h2>
          <p className="text-sm text-[#888] mb-6">Full pipeline from ad impression to closed deal</p>
          <div className="space-y-3">
            {(() => {
              const steps = [
                { label: "Impressions", value: summary.impressions },
                { label: "Link Clicks", value: summary.linkClicks },
                { label: "Leads", value: summary.leads },
                ...(appointments > 0 ? [{ label: "Appointments", value: appointments }] : []),
                ...(closed > 0 ? [{ label: "Closed Deals", value: closed }] : []),
              ];
              const maxVal = steps[0].value || 1;
              return steps.map((step, i) => {
                const width = Math.max((step.value / maxVal) * 100, 5);
                const prevValue = i > 0 ? steps[i - 1].value : 0;
                const convRate = i > 0 && prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : null;
                const intensity = 0.15 + (i / Math.max(steps.length - 1, 1)) * 0.85;
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className="w-28 shrink-0 text-right">
                      <p className="text-sm text-[#888] font-medium">{step.label}</p>
                    </div>
                    <div className="w-14 shrink-0 text-right">
                      {convRate ? (
                        <span className="text-xs text-[#7AB648] font-semibold">{convRate}%</span>
                      ) : (
                        <span />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="h-10 rounded-lg flex items-center px-3"
                        style={{
                          width: `${width}%`,
                          minWidth: "3rem",
                          backgroundColor: `rgba(122, 182, 72, ${intensity})`,
                        }}
                      >
                        <span className="text-white font-bold text-sm whitespace-nowrap">
                          {formatNumber(step.value)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          {appointments > 0 && summary.leads > 0 && (
            <div className="mt-6 pt-4 border-t border-[#2A2A2A] flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-[#888]">Click to Lead: </span>
                <span className="text-white font-semibold">
                  {summary.linkClicks > 0 ? ((summary.leads / summary.linkClicks) * 100).toFixed(1) : "0"}%
                </span>
              </div>
              <div>
                <span className="text-[#888]">Lead to Appointment: </span>
                <span className="text-[#7AB648] font-semibold">
                  {((appointments / summary.leads) * 100).toFixed(1)}%
                </span>
              </div>
              {closed > 0 && (
                <div>
                  <span className="text-[#888]">Appointment to Close: </span>
                  <span className="text-[#7AB648] font-semibold">
                    {((closed / appointments) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              <div>
                <span className="text-[#888]">End-to-End: </span>
                <span className="text-white font-semibold">
                  {((appointments / summary.impressions) * 100).toFixed(3)}%
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Business Results — Read Only (no inputs) */}
        {(appointments > 0 || closed > 0) && (
          <section className="bg-[#222] rounded-2xl p-6 border border-[#2A2A2A]">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-1">Business Results</h2>
              <p className="text-sm text-[#888]">Real-world performance tied to ad spend</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <ResultMetric
                label="Booking Ratio"
                value={summary.leads > 0 ? `${((appointments / summary.leads) * 100).toFixed(1)}%` : "—"}
                description={summary.leads > 0 ? `${appointments} of ${summary.leads} leads booked` : "No leads yet"}
                color="green"
              />
              <ResultMetric
                label="Close Rate"
                value={appointments > 0 ? `${((closed / appointments) * 100).toFixed(1)}%` : "—"}
                description={appointments > 0 ? `${closed} of ${appointments} appointments closed` : "—"}
                color={appointments > 0 && (closed / appointments) >= 0.25 ? "green" : "amber"}
              />
              <ResultMetric
                label="Lead-to-Sale"
                value={summary.leads > 0 ? `${((closed / summary.leads) * 100).toFixed(1)}%` : "—"}
                description={`${closed} sales from ${summary.leads} leads`}
                color="white"
              />
              <ResultMetric
                label="Cost per Booking"
                value={appointments > 0 ? formatCurrency(summary.spend / appointments) : "—"}
                description={appointments > 0 ? `Ad spend per appointment` : "—"}
                color="white"
              />
              <ResultMetric
                label="Return on Ad Spend"
                value={closed > 0 && avgDealValue > 0
                  ? `${(((closed * avgDealValue - summary.spend) / summary.spend) * 100).toFixed(0)}%`
                  : "—"}
                description={closed > 0 && avgDealValue > 0
                  ? `${formatCurrency(closed * avgDealValue)} revenue vs ${formatCurrency(summary.spend)} spend`
                  : "—"}
                color={closed > 0 && avgDealValue > 0 && (closed * avgDealValue) > summary.spend ? "green" : "amber"}
              />
              <ResultMetric
                label="Cost per Acquisition"
                value={closed > 0 ? formatCurrency(summary.spend / closed) : "—"}
                description={closed > 0 ? `Ad spend per paying customer` : "—"}
                color="white"
              />
              <ResultMetric
                label="Revenue Generated"
                value={closed > 0 && avgDealValue > 0 ? formatCurrency(closed * avgDealValue) : "—"}
                description={closed > 0 && avgDealValue > 0 ? `${closed} deals at ${formatCurrency(avgDealValue)} avg` : "—"}
                color="green"
              />
              <ResultMetric
                label="Pipeline Value"
                value={appointments > 0 && closed >= 0 && avgDealValue > 0
                  ? formatCurrency((appointments - closed) * avgDealValue)
                  : "—"}
                description={appointments > closed && avgDealValue > 0
                  ? `${appointments - closed} open appointments`
                  : "—"}
                color="amber"
              />
            </div>
          </section>
        )}

        {/* Daily Spend & Clicks Trend */}
        <section className="bg-[#222] rounded-2xl p-6 border border-[#2A2A2A]">
          <h2 className="text-lg font-semibold text-white mb-1">Daily Spend & Performance</h2>
          <p className="text-sm text-[#888] mb-6">Daily ad spend and clicks over the last 30 days</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#666" fontSize={12} />
                <YAxis yAxisId="spend" stroke="#666" fontSize={12} tickFormatter={(v) => `R${v}`} />
                <YAxis yAxisId="clicks" orientation="right" stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#222", border: "1px solid #7AB648", borderRadius: "8px", color: "#fff" }}
                  labelFormatter={(label) => formatDate(String(label))}
                  formatter={(value, name) => {
                    if (name === "Spend") return [formatCurrency(Number(value)), name];
                    return [formatNumber(Number(value)), name];
                  }}
                />
                <Legend />
                <Area yAxisId="spend" type="monotone" dataKey="spend" name="Spend" stroke={COLORS.green} fill="url(#spendGradient)" strokeWidth={2} />
                <Area yAxisId="clicks" type="monotone" dataKey="clicks" name="Clicks" stroke={COLORS.lime} fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Cost Per Lead + Budget Allocation */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#222] rounded-2xl p-6 border border-[#2A2A2A]">
            <h2 className="text-lg font-semibold text-white mb-1">Cost Per Lead by Ad Set</h2>
            <p className="text-sm text-[#888] mb-6">How much each lead costs per service category</p>
            <div className="h-64">
              {cplData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cplData} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `R${v}`} />
                    <Tooltip
                      contentStyle={{ background: "#222", border: "1px solid #7AB648", borderRadius: "8px", color: "#fff" }}
                      formatter={(value) => [formatCurrency(Number(value)), "Cost per Lead"]}
                    />
                    <Bar dataKey="costPerLead" name="Cost per Lead" fill={COLORS.green} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#888]">No lead data available yet</div>
              )}
            </div>
          </div>

          <div className="bg-[#222] rounded-2xl p-6 border border-[#2A2A2A]">
            <h2 className="text-lg font-semibold text-white mb-1">Budget Allocation</h2>
            <p className="text-sm text-[#888] mb-6">How spend is distributed across ad sets</p>
            <div className="h-64">
              {spendPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: "#666" }}
                    >
                      {spendPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#222", border: "1px solid #7AB648", borderRadius: "8px", color: "#fff" }}
                      formatter={(value) => [formatCurrency(Number(value)), "Spend"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#888]">No spend data available</div>
              )}
            </div>
          </div>
        </section>

        {/* Ad Sets Table */}
        <section className="bg-[#222] rounded-2xl p-6 border border-[#2A2A2A]">
          <h2 className="text-lg font-semibold text-white mb-4">Ad Set Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A] text-[#888]">
                  <th className="text-left py-3 px-4 font-medium">Ad Set</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Impressions</th>
                  <th className="text-right py-3 px-4 font-medium">Clicks</th>
                  <th className="text-right py-3 px-4 font-medium">CTR</th>
                  <th className="text-right py-3 px-4 font-medium">Spend</th>
                  <th className="text-right py-3 px-4 font-medium">Leads</th>
                  <th className="text-right py-3 px-4 font-medium">Cost/Lead</th>
                </tr>
              </thead>
              <tbody>
                {adSets.map((set) => (
                  <tr key={set.name} className="border-b border-[#2A2A2A]/50 hover:bg-[#2A2A2A]/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{set.name}</td>
                    <td className="py-3 px-4"><StatusBadge status={set.status} /></td>
                    <td className="py-3 px-4 text-right">{formatNumber(set.impressions)}</td>
                    <td className="py-3 px-4 text-right">{formatNumber(set.clicks)}</td>
                    <td className="py-3 px-4 text-right">{set.ctr.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(set.spend)}</td>
                    <td className="py-3 px-4 text-right text-[#7AB648] font-semibold">{set.leads}</td>
                    <td className="py-3 px-4 text-right">{set.leads > 0 ? formatCurrency(set.spend / set.leads) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-[#888]">
          <p>Powered by <span className="text-[#7AB648] font-semibold">Mort AI</span> — Data refreshes every 6 hours</p>
        </footer>
      </main>
    </div>
  );
}
