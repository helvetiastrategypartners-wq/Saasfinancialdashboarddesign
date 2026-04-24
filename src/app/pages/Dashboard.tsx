import { motion } from "motion/react";
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Flame, Clock, type LucideIcon } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, ReferenceLine,
} from "recharts";
import { useMetrics }    from "../contexts/MetricsContext";
import { useCurrency }   from "../contexts/CurrencyContext";
import { useDateRange }  from "../contexts/DateRangeContext";
import { DateRangeBar }  from "../components/DateRangeBar";
import ExportButton      from "../components/ExportButton";
import { GlassCard }     from "../components/ui/GlassCard";
import { PageHeader }    from "../components/ui/PageHeader";
import { CHART_TOOLTIP } from "../lib/chartConfig";
import { calcPeriodMetrics } from "../lib/periodUtils";
import type { Transaction } from "@shared/types";

// ─── CandlestickShape ────────────────────────────────────────────────────────
function CandlestickShape(props: {
  x?: number; y?: number; width?: number; height?: number;
  payload?: { open: number; close: number; high: number; low: number };
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload || height <= 0 || width <= 0) return null;

  const { open, close, high, low } = payload;
  const range = high - low;
  if (range <= 0) return null;

  const cx      = x + width / 2;
  const hw      = Math.max(3, width * 0.55);
  const toY     = (v: number) => (y + height) - ((v - low) / range) * height;
  const yOpen   = toY(open);
  const yClose  = toY(close);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyH   = Math.max(1, Math.abs(yClose - yOpen));
  const isUp    = close >= open;
  const color   = isUp ? "var(--accent-blue)" : "var(--accent-red)";

  return (
    <g>
      <line x1={cx} y1={y} x2={cx} y2={y + height} stroke={color} strokeWidth={1.5} />
      <rect x={cx - hw / 2} y={bodyTop} width={hw} height={bodyH} fill={color} fillOpacity={isUp ? 0.25 : 0.75} stroke={color} strokeWidth={1.5} rx={2} />
    </g>
  );
}

// ─── KPICard ─────────────────────────────────────────────────────────────────
interface KPICardProps {
  icon: LucideIcon; label: string; value: string;
  sub?: string; trend?: string; trendUp?: boolean;
  highlight?: boolean; compValue?: string;
}

function KPICard({ icon: Icon, label, value, sub, trend, trendUp, highlight, compValue }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border hover:border-accent-red/20 transition-all duration-300"
      style={{ background: "var(--glass-bg)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${highlight ? "bg-accent-blue/10" : "bg-accent-red-muted"}`}>
          <Icon className={`w-6 h-6 ${highlight ? "text-accent-blue" : "text-accent-red"}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
            trendUp ? "bg-accent-blue/10 text-accent-blue" : "bg-accent-red-muted text-accent-red"
          }`}>
            {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      {sub       && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
      {compValue && <p className="text-xs text-muted-foreground/60 mt-1.5 tabular-nums">vs {compValue}</p>}
    </motion.div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function Dashboard() {
  const { metrics, transactions } = useMetrics();
  const { format }                = useCurrency();
  const { dateRange, comparisonRange } = useDateRange();
  const [chartMode, setChartMode] = useState<"line" | "candle">("line");

  const periodMetrics = useMemo(
    () => calcPeriodMetrics(transactions, { start: dateRange.from, end: dateRange.to }),
    [transactions, dateRange],
  );
  const prevMetrics = useMemo(
    () => comparisonRange
      ? calcPeriodMetrics(transactions, { start: comparisonRange.from, end: comparisonRange.to })
      : null,
    [transactions, comparisonRange],
  );

  const mkTrend = (curr: number, prev: number | null | undefined) => {
    if (prev == null) return { trend: undefined, trendUp: undefined, compValue: undefined };
    const pct = prev !== 0 ? (curr - prev) / Math.abs(prev) * 100 : 0;
    return { trend: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, trendUp: pct >= 0, compValue: format(prev) };
  };

  const periodDurationMonths = (dateRange.to.getTime() - dateRange.from.getTime()) / (30.44 * 86400000);
  const periodBurnRate = periodDurationMonths > 0.1 ? periodMetrics.exp / periodDurationMonths : metrics.burnRate;
  const periodRunway   = periodBurnRate > 0 ? metrics.cash / periodBurnRate : metrics.runway;

  const prevBurnRate = prevMetrics && comparisonRange
    ? (() => {
        const d = (comparisonRange.to.getTime() - comparisonRange.from.getTime()) / (30.44 * 86400000);
        return d > 0.1 ? prevMetrics.exp / d : null;
      })()
    : null;

  const rangeLabel = useMemo(() => {
    const f    = dateRange.from.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" });
    const tEnd = new Date(dateRange.to.getTime() - 86400000);
    const t    = tEnd.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" });
    return f === t ? f : `${f} – ${t}`;
  }, [dateRange]);

  const grossMarginAmt     = periodMetrics.rev * (periodMetrics.gm / 100);
  const prevGrossMarginAmt = prevMetrics ? prevMetrics.rev * (prevMetrics.gm / 100) : null;

  const recentTx = [...transactions]
    .filter(t => t.payment_status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  // ── Chart data helpers ────────────────────────────────────────────────────
  const sumTx = (type: "income" | "expense", f: string, t: string) =>
    transactions
      .filter(tx => tx.payment_status === "completed" && tx.type === type && tx.date >= f && tx.date < t)
      .reduce((s, tx) => s + tx.amount, 0);

  const dateRangeChartData = useMemo(() => {
    const durationDays = (dateRange.to.getTime() - dateRange.from.getTime()) / 86400000;

    if (durationDays <= 14) {
      return Array.from({ length: Math.max(1, Math.ceil(durationDays)) }, (_, i) => {
        const d = new Date(dateRange.from.getTime() + i * 86400000);
        const f = d.toISOString().slice(0, 10);
        const t = new Date(d.getTime() + 86400000).toISOString().slice(0, 10);
        return { month: d.toLocaleDateString("fr-CH", { day: "numeric", month: "short" }), revenue: sumTx("income", f, t), expenses: sumTx("expense", f, t) };
      });
    }
    if (durationDays <= 90) {
      const weeks = Math.ceil(durationDays / 7);
      return Array.from({ length: weeks }, (_, i) => {
        const from = new Date(dateRange.from.getTime() + i * 7 * 86400000);
        const to   = new Date(Math.min(from.getTime() + 7 * 86400000, dateRange.to.getTime()));
        const f = from.toISOString().slice(0, 10);
        const t = to.toISOString().slice(0, 10);
        return { month: from.toLocaleDateString("fr-CH", { day: "numeric", month: "short" }), revenue: sumTx("income", f, t), expenses: sumTx("expense", f, t) };
      });
    }
    const result: { month: string; revenue: number; expenses: number }[] = [];
    let cur = new Date(Date.UTC(dateRange.from.getUTCFullYear(), dateRange.from.getUTCMonth(), 1));
    while (cur < dateRange.to) {
      const next = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
      const f = (cur < dateRange.from ? dateRange.from : cur).toISOString().slice(0, 10);
      const t = (next > dateRange.to ? dateRange.to : next).toISOString().slice(0, 10);
      result.push({ month: cur.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" }), revenue: sumTx("income", f, t), expenses: sumTx("expense", f, t) });
      cur = next;
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, dateRange]);

  const CATEGORY_COLORS: Record<string, string> = {
    Salaries: "var(--accent-red)", Marketing: "var(--accent-blue)",
    Operations: "#8b5cf6", "Direct Costs": "#f59e0b",
    Financing: "#10b981", Consulting: "#ec4899", Subscriptions: "#06b6d4",
  };
  const FALLBACK_COLORS = ["#ef4444","#3b82f6","#8b5cf6","#f59e0b","#10b981","#ec4899","#06b6d4"];

  const periodExpensesByCategory = useMemo(() => {
    const fromStr = dateRange.from.toISOString().slice(0, 10);
    const toStr   = dateRange.to.toISOString().slice(0, 10);
    const map = new Map<string, number>();
    transactions.forEach(t => {
      if (t.type !== "expense" || t.payment_status !== "completed") return;
      const d = t.date.slice(0, 10);
      if (d < fromStr || d >= toStr) return;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
    let fi = 0;
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] ?? FALLBACK_COLORS[fi++ % FALLBACK_COLORS.length] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, dateRange]);

  const periodCashTrend = useMemo(() => {
    const result: { month: string; netFlow: number }[] = [];
    let cur = new Date(Date.UTC(dateRange.from.getUTCFullYear(), dateRange.from.getUTCMonth(), 1));
    while (cur < dateRange.to) {
      const next = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
      const f = (cur < dateRange.from ? dateRange.from : cur).toISOString().slice(0, 10);
      const t = (next > dateRange.to ? dateRange.to : next).toISOString().slice(0, 10);
      result.push({ month: cur.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" }), netFlow: sumTx("income", f, t) - sumTx("expense", f, t) });
      cur = next;
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, dateRange]);

  const candleData = useMemo(() => {
    let prevClose = 0;
    return dateRangeChartData.map(d => {
      const net  = d.revenue - d.expenses;
      const open = prevClose; const close = net;
      const high = Math.max(d.revenue, open, close);
      const low  = Math.min(-d.expenses, open, close, 0);
      prevClose  = net;
      return { month: d.month, open, close, high, low, revenue: d.revenue, expenses: d.expenses };
    });
  }, [dateRangeChartData]);

  const candleOffset    = Math.abs(Math.min(0, ...candleData.map(d => d.low)));
  const candleProcessed = candleData.map(d => ({ ...d, spacer: d.low + candleOffset, range: d.high - d.low }));

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Vue d'ensemble — ${rangeLabel}`}
        action={<ExportButton title="Monthly_Sales_Report" />}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <DateRangeBar />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6">
        <KPICard icon={DollarSign}  label="Cash disponible"           value={format(metrics.cash)}                                      highlight />
        <KPICard icon={TrendingUp}  label={`Revenus — ${rangeLabel}`} value={format(periodMetrics.rev)} {...mkTrend(periodMetrics.rev, prevMetrics?.rev)} />
        <KPICard icon={TrendingDown} label={`Dépenses — ${rangeLabel}`} value={format(periodMetrics.exp)} {...mkTrend(periodMetrics.exp, prevMetrics?.exp)} />
        <KPICard icon={BarChart2}   label={`Marge brute — ${rangeLabel}`} value={`${periodMetrics.gm.toFixed(2)}%`} sub={format(grossMarginAmt)} {...mkTrend(periodMetrics.gm, prevMetrics?.gm)} compValue={prevGrossMarginAmt != null ? format(prevGrossMarginAmt) : undefined} />
        <KPICard icon={Flame}       label="Burn rate (période)"       value={format(periodBurnRate)} {...mkTrend(periodBurnRate, prevBurnRate)} />
        <KPICard icon={Clock}       label="Runway estimé"             value={`${periodRunway.toFixed(1)} mois`} trend={metrics.cashRisk?.message} trendUp={periodRunway >= 6} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Revenus vs Dépenses */}
        <GlassCard delay={0.1}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">Revenus vs Dépenses — {rangeLabel}</h3>
            <div className="flex gap-1 p-1 rounded-xl bg-secondary/30 border border-glass-border">
              {(["line", "candle"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setChartMode(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartMode === m ? "bg-accent-blue text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "line" ? "📈 Lignes" : "🕯 Bougies"}
                </button>
              ))}
            </div>
          </div>

          {chartMode === "line" ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dateRangeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--muted-foreground)" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [format(v)]} />
                <Line type="monotone" dataKey="revenue"  stroke="var(--accent-red)"  strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="Revenus" />
                <Line type="monotone" dataKey="expenses" stroke="var(--accent-blue)" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="Dépenses" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={candleProcessed} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--muted-foreground)" tickFormatter={v => `${((v - candleOffset) / 1000).toFixed(0)}k`} />
                <ReferenceLine y={candleOffset} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1} />
                <Tooltip
                  {...CHART_TOOLTIP}
                  formatter={(_v: number, name: string, item: { payload: typeof candleProcessed[0] }) => {
                    const p = item.payload;
                    if (name === "spacer") return [null, null];
                    return [
                      <span key="tip" style={{ color: "var(--popover-foreground)" }}>
                        Revenus: {format(p.revenue)} · Dépenses: {format(p.expenses)}<br />
                        Open: {format(p.open)} · Close: {format(p.close)}
                      </span>,
                      "",
                    ];
                  }}
                />
                <Bar dataKey="spacer" stackId="c" fill="transparent" stroke="none" legendType="none" />
                <Bar dataKey="range"  stackId="c" shape={<CandlestickShape />}      legendType="none" />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          <div className="flex items-center justify-center gap-6 mt-2">
            {chartMode === "line" ? (
              <>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-red" /><span className="text-sm text-muted-foreground">Revenus</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-blue" /><span className="text-sm text-muted-foreground">Dépenses</span></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-blue" /><span className="text-sm text-muted-foreground">Haussier (net +)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-red" /><span className="text-sm text-muted-foreground">Baissier (net −)</span></div>
              </>
            )}
          </div>
        </GlassCard>

        {/* Répartition des dépenses */}
        <GlassCard delay={0.2}>
          <h3 className="text-xl font-semibold text-foreground mb-6">Répartition des dépenses — {rangeLabel}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={periodExpensesByCategory} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                {periodExpensesByCategory.map(entry => <Cell key={`pie-${entry.name}`} fill={entry.color} />)}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [format(v)]} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Cashflow net mensuel */}
      <GlassCard delay={0.25}>
        <h3 className="text-xl font-semibold text-foreground mb-6">Cashflow net mensuel — {rangeLabel}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={periodCashTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [format(v), "Net"]} />
            <Bar dataKey="netFlow" name="Cashflow net" radius={[6,6,0,0]}>
              {periodCashTrend.map((entry, idx) => (
                <Cell key={`cf-${idx}`} fill={entry.netFlow >= 0 ? "var(--accent-blue)" : "var(--accent-red)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Transactions récentes */}
      <GlassCard delay={0.3}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">Transactions récentes</h3>
          <span className="text-sm text-muted-foreground">{recentTx.length} transactions</span>
        </div>
        <div className="space-y-3">
          {recentTx.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl border border-glass-border hover:bg-glass-hover transition-all"
              style={{ background: "var(--glass-bg)" }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${tx.type === "income" ? "bg-accent-blue" : "bg-accent-red"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.label}</p>
                  <p className="text-xs text-muted-foreground">{tx.date} · {tx.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${tx.type === "income" ? "text-accent-blue" : "text-accent-red"}`}>
                  {tx.type === "income" ? "+" : "-"}{format(tx.amount)}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{tx.payment_status}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Bottom summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "MRR",             value: format(metrics.mrr) },
          { label: "Clients actifs",  value: `${metrics.activeCustomers}` },
          { label: "Nouveaux (mois)", value: `+${metrics.newCustomersMonth}` },
          { label: `Cashflow net — ${rangeLabel}`, value: format(periodMetrics.net) },
        ].map(item => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 backdrop-blur-xl border border-glass-border text-center"
            style={{ background: "var(--glass-bg)" }}
          >
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-xl font-semibold ${item.label.startsWith("Cashflow") && periodMetrics.net < 0 ? "text-accent-red" : "text-foreground"}`}>
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}