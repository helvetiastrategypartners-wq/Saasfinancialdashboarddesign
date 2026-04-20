import { motion } from "motion/react";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Flame, Clock, type LucideIcon } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useMetrics } from "../contexts/MetricsContext";
import { formatCurrencyShort } from "../utils/currency";
import ExportButton from '../components/ExportButton';
// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  highlight?: boolean;
}

function KPICard({ icon: Icon, label, value, trend, trendUp, highlight }: KPICardProps) {
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
    </motion.div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { metrics, monthlyChartData, expensesByCategory, transactions, calculator } = useMetrics();
  // Trend vs previous month (M-2 → M-1)
  const prevRevenue  = monthlyChartData.at(-2)?.revenue  ?? 0;
  const prevExpenses = monthlyChartData.at(-2)?.expenses ?? 0;
  const revTrend     = prevRevenue  > 0 ? ((metrics.monthlyRevenue  - prevRevenue)  / prevRevenue  * 100) : 0;
  const expTrend     = prevExpenses > 0 ? ((metrics.monthlyExpenses - prevExpenses) / prevExpenses * 100) : 0;
  const marginPrev   = prevRevenue > 0 ? ((prevRevenue - (monthlyChartData.at(-2)?.expenses ?? 0)) / prevRevenue * 100) : 0;
  const marginCurr   = metrics.monthlyRevenue > 0 ? (metrics.grossMargin / metrics.monthlyRevenue * 100) : 0;

  // Recent transactions — last 6, sorted by date descending
  const recentTx = [...transactions]
    .filter(t => t.payment_status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  // Monthly net cashflow for bar chart
  const cashTrendData = calculator.getMonthlyCashTrend(6);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Vue d'ensemble de vos finances — Mars 2026</p>
        </div>
        <ExportButton title="Monthly_Sales_Report" />
      </div>

      {/* KPI Cards — 6 KPIs du PDF Dashboard */}
      <div className="grid grid-cols-3 gap-6">
        <KPICard
          icon={DollarSign}
          label="Cash disponible"
          value={formatCurrencyShort(metrics.cash)}
          highlight
        />
        <KPICard
          icon={TrendingUp}
          label="Revenus mensuels"
          value={formatCurrencyShort(metrics.monthlyRevenue)}
          trend={`${revTrend >= 0 ? "+" : ""}${revTrend.toFixed(1)}%`}
          trendUp={revTrend >= 0}
        />
        <KPICard
          icon={TrendingDown}
          label="Dépenses mensuelles"
          value={formatCurrencyShort(metrics.monthlyExpenses)}
          trend={`${expTrend >= 0 ? "+" : ""}${expTrend.toFixed(1)}%`}
          trendUp={false}
        />
        <KPICard
          icon={BarChart2}
          label="Marge brute"
          value={`${marginCurr.toFixed(1)}%`}
          trend={`${(marginCurr - marginPrev).toFixed(1)}pts`}
          trendUp={marginCurr >= marginPrev}
        />
        <KPICard
          icon={Flame}
          label="Burn rate (moy. 3 mois)"
          value={formatCurrencyShort(metrics.burnRate)}
        />
        <KPICard
          icon={Clock}
          label="Runway estimé"
          value={`${metrics.runway.toFixed(1)} mois`}
          trend={metrics.cashRisk?.message}
          trendUp={metrics.runway >= 6}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">

        {/* Revenus vs Dépenses — 6 mois */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
          style={{ background: "var(--glass-bg)" }}
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">Revenus vs Dépenses (6 mois)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px" }}
                labelStyle={{ color: "var(--popover-foreground)" }}
                itemStyle={{ color: "var(--popover-foreground)" }}
                formatter={(v: number) => [`CHF ${v.toLocaleString("fr-CH")}`]}
              />
              <Line type="monotone" dataKey="revenue"  stroke="var(--accent-red)"  strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="Revenus" />
              <Line type="monotone" dataKey="expenses" stroke="var(--accent-blue)" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="Dépenses" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-red" /><span className="text-sm text-muted-foreground">Revenus</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-blue" /><span className="text-sm text-muted-foreground">Dépenses</span></div>
          </div>
        </motion.div>

        {/* Répartition des dépenses — Mars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
          style={{ background: "var(--glass-bg)" }}
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">Répartition des dépenses — Mars</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {expensesByCategory.map(entry => (
                  <Cell key={`pie-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px" }}
                labelStyle={{ color: "var(--popover-foreground)" }}
                itemStyle={{ color: "var(--popover-foreground)" }}
                formatter={(v: number) => [`CHF ${v.toLocaleString("fr-CH")}`]}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Cashflow net mensuel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
        style={{ background: "var(--glass-bg)" }}
      >
        <h3 className="text-xl font-semibold text-foreground mb-6">Cashflow net mensuel (6 mois)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cashTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px" }}
              labelStyle={{ color: "var(--popover-foreground)" }}
              itemStyle={{ color: "var(--popover-foreground)" }}
              formatter={(v: number) => [`CHF ${v.toLocaleString("fr-CH")}`, "Net"]}
            />
            <Bar
              dataKey="netFlow"
              name="Cashflow net"
              radius={[6, 6, 0, 0]}
            >
              {cashTrendData.map((entry, idx) => (
                <Cell
                  key={`cf-${idx}`}
                  fill={entry.netFlow >= 0 ? "var(--accent-blue)" : "var(--accent-red)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Transactions récentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
        style={{ background: "var(--glass-bg)" }}
      >
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
              className="flex items-center justify-between p-4 rounded-xl border hover:bg-glass-hover transition-all border-glass-border"
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
                  {tx.type === "income" ? "+" : "-"}CHF {tx.amount.toLocaleString("fr-CH")}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{tx.payment_status}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Résumé bas de page */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "MRR",            value: `CHF ${metrics.mrr.toLocaleString("fr-CH")}` },
          { label: "Clients actifs", value: `${metrics.activeCustomers}` },
          { label: "Nouveaux (mars)",value: `+${metrics.newCustomersMonth}` },
          { label: "Cashflow net",   value: `CHF ${metrics.netCashflow.toLocaleString("fr-CH")}` },
        ].map(item => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 backdrop-blur-xl border border-glass-border text-center"
            style={{ background: "var(--glass-bg)" }}
          >
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-xl font-semibold ${item.label === "Cashflow net" && metrics.netCashflow < 0 ? "text-accent-red" : "text-foreground"}`}>
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
