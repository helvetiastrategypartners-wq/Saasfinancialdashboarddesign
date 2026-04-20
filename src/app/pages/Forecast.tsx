import { motion } from "motion/react";
import { useState, useMemo } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMetrics } from "../contexts/MetricsContext";
import { formatCurrencyShort } from "../utils/currency";

const SCENARIO_PARAMS = [
  { name: "Conservateur",    description: "Croissance modérée +5% revenu/mois, burn +3%, churn 5%",  revenueChange:  5, expenseChange: 3 },
  { name: "Base (Réaliste)", description: "Croissance +12% revenu/mois, burn +5%, churn 3%",         revenueChange: 12, expenseChange: 5 },
  { name: "Ambitieux",       description: "Croissance +25% revenu/mois, burn +8%, churn 2%",         revenueChange: 25, expenseChange: 8 },
];

function projectCash(
  initialCash: number,
  monthlyRevenue: number,
  burnRate: number,
  revenueGrowth: number,
  expenseGrowth: number,
  months = 12,
) {
  const data: { month: string; cash: number; revenue: number; burnRate: number }[] = [];
  let cash    = initialCash;
  let revenue = monthlyRevenue;
  let burn    = burnRate;
  for (let i = 1; i <= months; i++) {
    revenue = revenue * (1 + revenueGrowth / 100);
    burn    = burn    * (1 + expenseGrowth / 100);
    cash   += revenue - burn;
    data.push({ month: `M${i}`, cash: Math.round(cash), revenue: Math.round(revenue), burnRate: Math.round(burn) });
  }
  return data;
}

export function Forecast() {
  const { metrics, calculator } = useMetrics();
  const [selectedScenario, setSelectedScenario] = useState("Base (Réaliste)");

  const scenarioResults = useMemo(() =>
    Object.fromEntries(
      SCENARIO_PARAMS.map(s => [
        s.name,
        calculator.simulateScenario({ revenueChange: s.revenueChange, expenseChange: s.expenseChange }),
      ])
    ),
  [calculator]);

  const projectionData = useMemo(() =>
    Object.fromEntries(
      SCENARIO_PARAMS.map(s => [
        s.name,
        projectCash(
          metrics.cash,
          metrics.monthlyRevenue,
          metrics.burnRate,
          s.revenueChange,
          s.expenseChange,
        ),
      ])
    ),
  [metrics, calculator]);

  const active = SCENARIO_PARAMS.find(s => s.name === selectedScenario) ?? SCENARIO_PARAMS[1];
  const activeProjection = projectionData[selectedScenario];
  const activeResult     = scenarioResults[selectedScenario];

  // Combined 3-scenario cash chart
  const cashEvolutionData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      month:        `M${i + 1}`,
      conservateur: projectionData["Conservateur"][i].cash,
      base:         projectionData["Base (Réaliste)"][i].cash,
      ambitieux:    projectionData["Ambitieux"][i].cash,
    })),
  [projectionData]);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">Prévisions & Scénarios</h1>
        <p className="text-muted-foreground text-lg">Projections financières basées sur vos métriques actuelles</p>
      </div>

      {/* Scenario Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-foreground">Scénario :</label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="px-6 py-3 rounded-xl bg-secondary/50 border border-glass-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-xl min-w-[250px]"
          >
            {SCENARIO_PARAMS.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-3 gap-6">
        {SCENARIO_PARAMS.map((s, index) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedScenario(s.name)}
            className={`rounded-2xl p-6 backdrop-blur-xl border cursor-pointer transition-all ${
              selectedScenario === s.name
                ? "border-blue-500/50 bg-blue-500/10"
                : "border-glass-border hover:border-glass-border/50"
            }`}
            style={{ background: selectedScenario === s.name ? "rgba(59,130,246,0.1)" : "var(--glass-bg)" }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">{s.name}</h3>
            <p className="text-sm text-muted-foreground">{s.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Projection Cards — computed from real metrics */}
      <div className="grid grid-cols-4 gap-6">
        <ProjectionCard label="Cash à 12 mois"   value={formatCurrencyShort(activeProjection.at(-1)!.cash)} />
        <ProjectionCard label="Runway à 12 mois" value={`${activeResult.projectedRunway} mois`} />
        <ProjectionCard label="Revenu projeté"   value={formatCurrencyShort(activeResult.projectedRevenue)} />
        <ProjectionCard label="Burn rate projeté" value={formatCurrencyShort(activeResult.projectedBurnRate)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Cash Evolution — 3 scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
          style={{ background: "var(--glass-bg)" }}
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">Évolution du Cash (3 scénarios)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={cashEvolutionData}>
              <defs>
                <linearGradient id="grad-base" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px" }}
                labelStyle={{ color: "var(--popover-foreground)" }}
                itemStyle={{ color: "var(--popover-foreground)" }}
                formatter={(value: number) => `CHF ${value.toLocaleString("fr-CH")}`}
              />
              <Legend />
              <Area type="monotone" dataKey="conservateur" name="Conservateur" stroke="#f97316" fill="transparent" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="base"         name="Base"         stroke="var(--accent-blue)" fill="url(#grad-base)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="ambitieux"    name="Ambitieux"    stroke="#10b981" fill="transparent" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue vs Burn Rate — selected scenario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
          style={{ background: "var(--glass-bg)" }}
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">Revenu vs Burn Rate — {active.name}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={activeProjection}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px" }}
                labelStyle={{ color: "var(--popover-foreground)" }}
                itemStyle={{ color: "var(--popover-foreground)" }}
                formatter={(value: number) => `CHF ${value.toLocaleString("fr-CH")}`}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue"  name="Revenu"    stroke="var(--accent-red)"  strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="burnRate" name="Burn Rate" stroke="var(--accent-blue)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Scenario Summary Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl backdrop-blur-xl border border-glass-border overflow-hidden"
        style={{ background: "var(--glass-bg)" }}
      >
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-xl font-semibold text-foreground">Résumé des scénarios (12 mois)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left  p-4 text-sm font-semibold text-muted-foreground">Métrique</th>
                {SCENARIO_PARAMS.map(s => (
                  <th key={s.name} className="text-right p-4 text-sm font-semibold text-muted-foreground">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Cash final (M12)",     fmt: (n: string) => formatCurrencyShort(projectionData[n].at(-1)!.cash) },
                { label: "Runway projeté",       fmt: (n: string) => `${scenarioResults[n].projectedRunway} mois` },
                { label: "Revenu projeté",       fmt: (n: string) => formatCurrencyShort(scenarioResults[n].projectedRevenue) },
                { label: "Cashflow net projeté", fmt: (n: string) => `CHF ${scenarioResults[n].projectedNetCashflow.toLocaleString("fr-CH")}` },
                { label: "Burn rate projeté",    fmt: (n: string) => formatCurrencyShort(scenarioResults[n].projectedBurnRate) },
              ].map(row => (
                <tr key={row.label} className="border-b border-glass-border/50">
                  <td className="p-4 text-sm text-foreground">{row.label}</td>
                  {SCENARIO_PARAMS.map(s => (
                    <td key={s.name} className={`p-4 text-sm text-right ${s.name === "Ambitieux" ? "text-accent-blue" : "text-foreground"}`}>
                      {row.fmt(s.name)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function ProjectionCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
      style={{ background: "var(--glass-bg)" }}
    >
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </motion.div>
  );
}
