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

function NumberInput({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-[#888] font-medium mb-2">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888] text-sm font-medium">{prefix}</span>
        )}
        <input
          type="number"
          min={0}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          className={`w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-3 text-white text-2xl font-bold text-center focus:outline-none focus:border-[#7AB648] focus:ring-1 focus:ring-[#7AB648]/50 transition-colors ${prefix ? "pl-8" : ""}`}
        />
      </div>
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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState(0);
  const [closed, setClosed] = useState(0);
  const [avgDealValue, setAvgDealValue] = useState(0);

  // Load saved values from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cic-dashboard-inputs");
      if (saved) {
        const parsed = JSON.parse(saved);
        setAppointments(parsed.appointments || 0);
        setClosed(parsed.closed || 0);
        setAvgDealValue(parsed.avgDealValue || 0);
      }
    } catch { /* ignore */ }
  }, []);

  // Save values to localStorage on change
  useEffect(() => {
    localStorage.setItem("cic-dashboard-inputs", JSON.stringify({ appointments, closed, avgDealValue }));
  }, [appointments, closed, avgDealValue]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/meta-insights");
      if (!res.ok) throw new Error("Failed to fetch data");
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
            onClick={() => { setLoading(true); fetchData(); }}
            className="mt-4 px-4 py-2 bg-[#7AB648] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#5A8F38] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, daily, adSets } = data;

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
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="p-2 rounded-lg bg-[#2A2A2A] hover:bg-[#7AB648]/20 text-[#888] hover:text-[#7AB648] transition-colors"
              title="Refresh data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Leads" value={formatNumber(summary.leads)} sub={`${formatCurrency(summary.costPerLead)} per lead`} accent />
          <MetricCard label="Total Spend" value={formatCurrency(summary.spend)} sub="Last 30 days" />
          <MetricCard label="Impressions" value={formatNumber(summary.impressions)} sub={`${formatNumber(summary.reach)} reach`} />
          <MetricCard label="Click-Through Rate" value={`${summary.ctr.toFixed(2)}%`} sub={`${formatNumber(summary.clicks)} clicks`} />
        </section>

        {/* Business Metrics — Manual Inputs + Calculations */}
        <section className="bg-[#222] rounded-2xl p-6 border border-[#2A2A2A]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Business Results</h2>
              <p className="text-sm text-[#888]">Enter your real-world numbers to see the full picture</p>
            </div>
          </div>

          {/* Input boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <NumberInput label="Appointments Booked" value={appointments} onChange={setAppointments} />
            <NumberInput label="Deals Closed" value={closed} onChange={setClosed} />
            <NumberInput label="Avg. Deal Value" value={avgDealValue} onChange={setAvgDealValue} prefix="R" />
          </div>

          {/* Calculated metrics */}
          {(appointments > 0 || closed > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <ResultMetric
                label="Booking Ratio"
                value={summary.leads > 0 ? `${((appointments / summary.leads) * 100).toFixed(1)}%` : "—"}
                description={summary.leads > 0 ? `${appointments} of ${summary.leads} leads booked` : "No leads yet"}
                color="green"
              />
              <ResultMetric
                label="Close Rate"
                value={appointments > 0 ? `${((closed / appointments) * 100).toFixed(1)}%` : "—"}
                description={appointments > 0 ? `${closed} of ${appointments} appointments closed` : "Enter appointments"}
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
                description={appointments > 0 ? `Ad spend per appointment` : "Enter appointments"}
                color="white"
              />
              <ResultMetric
                label="Return on Ad Spend"
                value={closed > 0 && avgDealValue > 0
                  ? `${(((closed * avgDealValue - summary.spend) / summary.spend) * 100).toFixed(0)}%`
                  : "—"}
                description={closed > 0 && avgDealValue > 0
                  ? `${formatCurrency(closed * avgDealValue)} revenue vs ${formatCurrency(summary.spend)} spend`
                  : "Enter deals closed & avg deal value"}
                color={closed > 0 && avgDealValue > 0 && (closed * avgDealValue) > summary.spend ? "green" : "amber"}
              />
            </div>
          )}

          {appointments === 0 && closed === 0 && (
            <div className="text-center py-6 text-[#666]">
              <p className="text-sm">Enter your appointments and closed deals above to see booking ratios, close rates, and ROI</p>
            </div>
          )}
        </section>

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
          <p>Powered by <span className="text-[#7AB648] font-semibold">Mort AI</span> — Data refreshes every 5 minutes</p>
        </footer>
      </main>
    </div>
  );
}
