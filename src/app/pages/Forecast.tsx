import { motion } from "motion/react";
import { useState, useMemo } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMetrics }    from "../contexts/MetricsContext";
import { useCurrency }   from "../contexts/CurrencyContext";
import { GlassCard }     from "../components/ui/GlassCard";
import { PageHeader }    from "../components/ui/PageHeader";
import { StatCard }      from "../components/ui/StatCard";
import { CHART_TOOLTIP } from "../lib/chartConfig";

const SCENARIO_PARAMS = [
  { name: "Conservateur",    description: "Croissance modérée +5% revenu/mois, burn +3%, churn 5%",  revenueChange:  5, expenseChange: 3 },
  { name: "Base (Réaliste)", description: "Croissance +12% revenu/mois, burn +5%, churn 3%",         revenueChange: 12, expenseChange: 5 },
  { name: "Ambitieux",       description: "Croissance +25% revenu/mois, burn +8%, churn 2%",         revenueChange: 25, expenseChange: 8 },
];

function projectCash(
  initialCash: number, monthlyRevenue: number, burnRate: number,
  revenueGrowth: number, expenseGrowth: number, months = 12,
) {
  const data: { month: string; cash: number; revenue: number; burnRate: number }[] = [];
  let cash = initialCash, revenue = monthlyRevenue, burn = burnRate;
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
  const { format } = useCurrency();
  const [selectedScenario, setSelectedScenario] = useState("Base (Réaliste)");

  const scenarioResults = useMemo(() =>
    Object.fromEntries(
      SCENARIO_PARAMS.map(s => [s.name, calculator.simulateScenario({ revenueChange: s.revenueChange, expenseChange: s.expenseChange })])
    ),
  [calculator]);

  const projectionData = useMemo(() =>
    Object.fromEntries(
      SCENARIO_PARAMS.map(s => [s.name, projectCash(metrics.cash, metrics.monthlyRevenue, metrics.burnRate, s.revenueChange, s.expenseChange)])
    ),
  [metrics]);

  const active           = SCENARIO_PARAMS.find(s => s.name === selectedScenario) ?? SCENARIO_PARAMS[1];
  const activeProjection = projectionData[selectedScenario];
  const activeResult     = scenarioResults[selectedScenario];

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
      <PageHeader
        title="Prévisions & Scénarios"
        subtitle="Projections financières basées sur vos métriques actuelles"
      />

      {/* Scenario selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-foreground">Scénario :</label>
        <select
          value={selectedScenario}
          onChange={e => setSelectedScenario(e.target.value)}
          className="px-6 py-3 rounded-xl bg-secondary/50 border border-glass-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-xl min-w-[250px]"
        >
          {SCENARIO_PARAMS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {/* Scenario cards */}
      <div className="grid grid-cols-3 gap-6">
        {SCENARIO_PARAMS.map((s, index) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedScenario(s.name)}
            className={`rounded-2xl p-6 backdrop-blur-xl border cursor-pointer transition-all ${
              selectedScenario === s.name ? "border-blue-500/50" : "border-glass-border hover:border-glass-border/50"
            }`}
            style={{ background: selectedScenario === s.name ? "rgba(59,130,246,0.1)" : "var(--glass-bg)" }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">{s.name}</h3>
            <p className="text-sm text-muted-foreground">{s.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Projection KPIs */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Cash à 12 mois"    value={format(activeProjection.at(-1)!.cash)} />
        <StatCard label="Runway à 12 mois"  value={`${activeResult.projectedRunway} mois`} />
        <StatCard label="Revenu projeté"    value={format(activeResult.projectedRevenue)} />
        <StatCard label="Burn rate projeté" value={format(activeResult.projectedBurnRate)} />
      </div>

      {/* Charts */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-6">Évolution du Cash (3 scénarios)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={cashEvolutionData}>
            <defs>
              <linearGradient id="grad-base" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="var(--accent-blue)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => format(value)} />
            <Legend />
            <Area type="monotone" dataKey="conservateur" name="Conservateur" stroke="#f97316"              fill="transparent"       strokeWidth={2}   dot={false} />
            <Area type="monotone" dataKey="base"          name="Base"         stroke="var(--accent-blue)"  fill="url(#grad-base)"   strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="ambitieux"     name="Ambitieux"    stroke="#10b981"              fill="transparent"       strokeWidth={2}   dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard delay={0.1}>
        <h3 className="text-xl font-semibold text-foreground mb-6">Revenu vs Burn Rate — {active.name}</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={activeProjection}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => format(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue"  name="Revenu"    stroke="var(--accent-red)"  strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="burnRate" name="Burn Rate" stroke="var(--accent-blue)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Summary table */}
      <GlassCard delay={0.3} noPadding>
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
                { label: "Cash final (M12)",     fmt: (n: string) => format(projectionData[n].at(-1)!.cash) },
                { label: "Runway projeté",       fmt: (n: string) => `${scenarioResults[n].projectedRunway} mois` },
                { label: "Revenu projeté",       fmt: (n: string) => format(scenarioResults[n].projectedRevenue) },
                { label: "Cashflow net projeté", fmt: (n: string) => format(scenarioResults[n].projectedNetCashflow) },
                { label: "Burn rate projeté",    fmt: (n: string) => format(scenarioResults[n].projectedBurnRate) },
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
      </GlassCard>
    </div>
  );
}