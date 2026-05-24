import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ----------------------------------------------------------------
   Flowly — Product Analytics Dashboard
   React + Tailwind + recharts
   Clickable KPI cards drive the chart's active metric.
---------------------------------------------------------------- */

const RANGES = [
  { key: "7d",  label: "Last 7 days",  days:  7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
];

/* ----- Metric registry: drives KPI cards + chart styling ----- */
const METRICS = {
  users: {
    label: "Active Users",
    value: "12,847",
    delta: 8.2,
    color: "#6366F1",   // indigo-500
    accent: "indigo",
    chartLabel: "Daily active users",
    seriesLabel: "users",
    base: 10800,
    weekendDrop: 1400,
    noise: 2000,
    trend: 7,
    floor: 2800,
    axisFmt: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v),
    tipFmt: (v) => `${Math.round(v).toLocaleString()} users`,
  },
  revenue: {
    label: "Revenue",
    value: "$48.2K",
    delta: 12.5,
    color: "#10B981",   // emerald-500
    accent: "emerald",
    chartLabel: "Daily revenue",
    seriesLabel: "revenue",
    base: 1620,
    weekendDrop: 280,
    noise: 380,
    trend: 1.4,
    floor: 400,
    axisFmt: (v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`),
    tipFmt: (v) => `$${Math.round(v).toLocaleString()}`,
  },
  conversion: {
    label: "Conversion",
    value: "3.2%",
    delta: -0.4,
    color: "#F59E0B",   // amber-500
    accent: "amber",
    chartLabel: "Conversion rate",
    seriesLabel: "conversion",
    base: 3.2,
    weekendDrop: 0.2,
    noise: 0.6,
    trend: -0.005,
    floor: 1.6,
    axisFmt: (v) => `${v.toFixed(1)}%`,
    tipFmt: (v) => `${v.toFixed(2)}%`,
  },
  churn: {
    label: "Churn",
    value: "2.1%",
    delta: 0.3,
    color: "#F43F5E",   // rose-500
    accent: "rose",
    chartLabel: "Churn rate",
    seriesLabel: "churn",
    base: 2.1,
    weekendDrop: 0,
    noise: 0.4,
    trend: 0.003,
    floor: 1.0,
    axisFmt: (v) => `${v.toFixed(1)}%`,
    tipFmt: (v) => `${v.toFixed(2)}%`,
  },
};

const KPI_ORDER = ["users", "revenue", "conversion", "churn"];

const TOP_PAGES = [
  { path: "/dashboard",              views: 24813, avgTime: "3m 42s", bounce: "24%" },
  { path: "/pricing",                views: 18204, avgTime: "1m 58s", bounce: "38%" },
  { path: "/features/automations",   views: 12092, avgTime: "2m 11s", bounce: "31%" },
  { path: "/blog/launch-week",       views:  9347, avgTime: "4m 03s", bounce: "19%" },
  { path: "/integrations",           views:  7615, avgTime: "2m 27s", bounce: "29%" },
];

/* ----- deterministic pseudo-random for stable mock data ----- */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateSeries(days, metricKey) {
  const m = METRICS[metricKey];
  // Seed by metric+range so each combo is stable across renders
  const seed = days * 137 + metricKey.charCodeAt(0) * 31 + metricKey.length;
  const rng = seededRandom(seed);
  const today = new Date("2026-05-24T00:00:00");
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6 ? -m.weekendDrop : 0;
    const trend = (days - i) * m.trend;
    const noise = (rng() - 0.5) * m.noise;
    const raw = m.base + weekend + trend + noise;
    const value = Math.max(m.floor, raw);
    out.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: metricKey === "users" || metricKey === "revenue"
        ? Math.round(value)
        : Number(value.toFixed(2)),
    });
  }
  return out;
}

/* --------------------------- Icons --------------------------- */
const TrendUp = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
       strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);
const TrendDown = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
       strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </svg>
);
const Logo = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
       strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 18c0-7 4-12 16-12" />
    <path d="M4 12c0-3 2-6 8-6" />
    <path d="M4 6h3" />
  </svg>
);

/* ------------------------- KPI Card ------------------------- */
function KPICard({ kpiKey, active, onClick }) {
  const kpi = METRICS[kpiKey];
  const positive = kpi.delta >= 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative text-left bg-white rounded-xl border p-5 cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
        active
          ? "border-gray-300 shadow-md -translate-y-0.5"
          : "border-gray-200 hover:shadow-sm hover:border-gray-300 hover:-translate-y-0.5"
      }`}
      style={
        active
          ? { boxShadow: `0 1px 0 ${kpi.color} inset, 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px ${kpi.color}55` }
          : undefined
      }
    >
      {/* top accent bar */}
      <span
        aria-hidden="true"
        className="absolute left-5 right-5 top-0 h-[3px] rounded-b-full transition-all duration-300"
        style={{
          backgroundColor: kpi.color,
          opacity: active ? 1 : 0,
          transform: active ? "scaleX(1)" : "scaleX(0.4)",
        }}
      />
      <div className="text-sm text-gray-500 font-medium">{kpi.label}</div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <div className="text-[28px] leading-none font-semibold text-gray-900 tabular-nums tracking-tight">
          {kpi.value}
        </div>
        <div
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold tabular-nums ${
            positive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {positive ? <TrendUp className="w-3 h-3" /> : <TrendDown className="w-3 h-3" />}
          {positive ? "+" : ""}
          {kpi.delta}%
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400">vs. previous period</div>
    </button>
  );
}

/* ------------------------ Date Range ------------------------ */
function RangeSelector({ value, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Date range"
      className="inline-flex bg-white border border-gray-200 rounded-lg p-1"
    >
      {RANGES.map((r) => {
        const active = value === r.key;
        return (
          <button
            key={r.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
              active
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------- Custom Tooltip --------------------- */
function makeTooltip(metric) {
  return function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
        <div className="text-gray-500 font-medium mb-0.5">{label}</div>
        <div className="text-gray-900 font-semibold tabular-nums flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: metric.color }}
          />
          {metric.tipFmt(payload[0].value)}
        </div>
      </div>
    );
  };
}

/* =========================== MAIN =========================== */
export default function FlowlyDashboard() {
  const [range, setRange] = useState("30d");
  const [activeKpi, setActiveKpi] = useState("users");

  const days = RANGES.find((r) => r.key === range).days;
  const metric = METRICS[activeKpi];

  const chartData = useMemo(
    () => generateSeries(days, activeKpi),
    [days, activeKpi]
  );
  const tickInterval = Math.max(0, Math.floor(days / 7) - 1);

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      {/* Inter font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Local keyframes for chart crossfade */}
      <style>{`
        @keyframes flowlyChartIn {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .flowly-chart-fade {
          animation: flowlyChartIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .flowly-chart-fade { animation: none; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ---------------- Header ---------------- */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Logo className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight">Flowly</div>
              <div className="text-xs text-gray-500">Product analytics</div>
            </div>
          </div>
          <RangeSelector value={range} onChange={setRange} />
        </header>

        {/* ---------------- KPI Row ---------------- */}
        <section
          aria-label="Key performance indicators"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {KPI_ORDER.map((key) => (
            <KPICard
              key={key}
              kpiKey={key}
              active={activeKpi === key}
              onClick={() => setActiveKpi(key)}
            />
          ))}
        </section>

        {/* ---------------- Chart ---------------- */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 transition-all duration-300">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2
                className="text-base font-semibold text-gray-900 transition-colors duration-300"
              >
                {metric.chartLabel}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {RANGES.find((r) => r.key === range).label.toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <span
                className="inline-block w-2 h-2 rounded-full transition-colors duration-300"
                style={{ backgroundColor: metric.color }}
              />
              {metric.label}
            </div>
          </div>

          {/* key forces re-mount on metric change → crossfade + redraw */}
          <div
            key={`${activeKpi}-${range}`}
            className="h-72 -ml-2 flowly-chart-fade"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="flowlyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={metric.color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={metric.axisFmt}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }}
                  content={makeTooltip(metric)}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={metric.color}
                  strokeWidth={2}
                  fill="url(#flowlyFill)"
                  animationDuration={520}
                  animationEasing="ease-out"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-3 text-[11px] text-gray-400">
            Tip: click a KPI card above to switch the chart metric.
          </p>
        </section>

        {/* ---------------- Top Pages ---------------- */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Top pages</h2>
              <p className="text-sm text-gray-500 mt-0.5">By total views</p>
            </div>
            <span className="text-xs text-gray-400 font-medium">5 of 142</span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-200">
                <th className="text-left  text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Page</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Views</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Avg. time</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Bounce</th>
              </tr>
            </thead>
            <tbody>
              {TOP_PAGES.map((row, i) => (
                <tr
                  key={row.path}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors duration-150 cursor-pointer"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-gray-100 text-gray-500 text-[11px] font-semibold flex items-center justify-center tabular-nums">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900 font-mono">
                        {row.path}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm text-gray-900 tabular-nums font-medium">
                    {row.views.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm text-gray-600 tabular-nums">
                    {row.avgTime}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm text-gray-600 tabular-nums">
                    {row.bounce}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="mt-8 text-xs text-gray-400 text-center">
          Flowly &middot; mock data for demo purposes
        </footer>
      </div>
    </div>
  );
}
