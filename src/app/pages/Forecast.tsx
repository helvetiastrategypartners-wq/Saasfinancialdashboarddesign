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

const WHAT_IF_PRESETS = [
  { id: "ads",   label: "Double le budget Ads",   revenueChange: 15,  expenseChange: 20,  hiringCost: 0     },
  { id: "churn", label: "Réduit le churn de 50%", revenueChange: 8,   expenseChange: 0,   hiringCost: 0     },
  { id: "hire",  label: "Embauche 2 devs",         revenueChange: 5,   expenseChange: 0,   hiringCost: 12000 },
  { id: "cut",   label: "Coupe 20% des dépenses",  revenueChange: 0,   expenseChange: -20, hiringCost: 0     },
  { id: "boost", label: "Revenue +30%",             revenueChange: 30,  expenseChange: 8,   hiringCost: 0     },
] as const;

function DeltaBadge({ base, sim }: { base: number; sim: number }) {
  const diff = sim - base;
  const pct  = base !== 0 ? ((diff / Math.abs(base)) * 100).toFixed(1) : null;
  const pos  = diff >= 0;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pos ? "bg-accent-blue/20 text-accent-blue" : "bg-accent-red-muted text-accent-red"}`}>
      {pos ? "+" : ""}{pct !== null ? `${pct}%` : "—"}
    </span>
  );
}

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
  const [simParams, setSimParams]   = useState({ revenueChange: 0, expenseChange: 0, hiringCost: 0 });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

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

  const simResult = useMemo(() =>
    calculator.simulateScenario(simParams),
  [calculator, simParams]);

  const simProjection = useMemo(() =>
    projectCash(metrics.cash, metrics.monthlyRevenue, metrics.burnRate, simParams.revenueChange, simParams.expenseChange),
  [metrics, simParams]);

  const baseProjection = useMemo(() =>
    projectCash(metrics.cash, metrics.monthlyRevenue, metrics.burnRate, 0, 0),
  [metrics]);

  const simComparisonData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      month:  `M${i + 1}`,
      actuel: baseProjection[i].cash,
      simulé: simProjection[i].cash,
    })),
  [baseProjection, simProjection]);

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
            <Area type="monotone" dataKey="ambitieux"     name="Ambitieux"    stroke="#eab308"              fill="transparent"       strokeWidth={2}   dot={false} />
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

      {/* What-If Simulator */}
      <GlassCard delay={0.2}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Simulateur de scénarios</h3>
            <p className="text-sm text-muted-foreground mt-1">Modifiez les paramètres pour voir l'impact en temps réel</p>
          </div>
          <button
            onClick={() => { setSimParams({ revenueChange: 0, expenseChange: 0, hiringCost: 0 }); setActivePreset(null); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-glass-border hover:bg-secondary/50"
          >
            Réinitialiser
          </button>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 mb-8">
          {WHAT_IF_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => {
                const params = { revenueChange: p.revenueChange, expenseChange: p.expenseChange, hiringCost: p.hiringCost };
                setSimParams(params);
                setActivePreset(activePreset === p.id ? null : p.id);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                activePreset === p.id
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                  : "bg-secondary/50 border-glass-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          {([
            { key: "revenueChange" as const, label: "Variation revenus",    unit: "%", min: -50,  max: 100,  step: 1,   color: "text-accent-blue" },
            { key: "expenseChange" as const, label: "Variation dépenses",   unit: "%", min: -50,  max: 100,  step: 1,   color: "text-red-400"     },
            { key: "hiringCost"   as const,  label: "Coût embauche / mois", unit: "€", min: 0,    max: 50000, step: 500, color: "text-blue-400"   },
          ] as const).map(({ key, label, unit, min, max, step, color }) => {
            const val = simParams[key];
            const pct = ((val - min) / (max - min)) * 100;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  {editingKey === key ? (
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      value={editingValue}
                      autoFocus
                      onChange={e => setEditingValue(e.target.value)}
                      onBlur={() => {
                        const n = Math.min(max, Math.max(min, Number(editingValue) || 0));
                        setSimParams(prev => ({ ...prev, [key]: n }));
                        setActivePreset(null);
                        setEditingKey(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditingKey(null);
                      }}
                      className="w-20 text-right text-sm font-semibold tabular-nums bg-secondary/60 border border-accent-blue/40 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent-blue/60"
                    />
                  ) : (
                    <span
                      title="Cliquer pour saisir une valeur"
                      onClick={() => { setEditingKey(key); setEditingValue(String(val)); }}
                      className={`text-sm font-semibold tabular-nums cursor-text select-none rounded px-1 hover:bg-secondary/60 transition-colors ${color}`}
                    >
                      {key === "hiringCost" ? format(val) : `${val > 0 ? "+" : ""}${val}${unit}`}
                    </span>
                  )}
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={val}
                  onChange={e => {
                    setActivePreset(null);
                    setSimParams(prev => ({ ...prev, [key]: Number(e.target.value) }));
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
                  style={{ background: `linear-gradient(to right, var(--accent-blue) 0%, var(--accent-blue) ${pct}%, var(--border) ${pct}%, var(--border) 100%)` }}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{key === "hiringCost" ? "0€" : `${min}%`}</span>
                  <span>{key === "hiringCost" ? `${format(max)}` : `+${max}%`}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Before / After comparison */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Revenu mensuel", base: metrics.monthlyRevenue, sim: simResult.projectedRevenue,    isMonths: false },
            { label: "Burn rate",      base: metrics.burnRate,       sim: simResult.projectedBurnRate,   isMonths: false },
            { label: "Cashflow net",   base: metrics.netCashflow,    sim: simResult.projectedNetCashflow, isMonths: false },
            { label: "Runway",         base: metrics.runway,         sim: simResult.projectedRunway,     isMonths: true  },
          ].map(({ label, base, sim, isMonths }) => (
            <div key={label} className="rounded-xl p-4 border border-glass-border bg-secondary/30">
              <p className="text-xs font-medium text-muted-foreground mb-3">{label}</p>
              <div className="flex items-end justify-between gap-1 mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Actuel</p>
                  <p className="text-sm font-medium text-foreground">
                    {isMonths ? `${Number(base).toFixed(1)} m` : format(base)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Projeté</p>
                  <p className={`text-sm font-semibold ${sim > base ? "text-accent-blue" : sim < base ? "text-accent-red" : "text-foreground"}`}>
                    {isMonths ? `${Number(sim).toFixed(1)} m` : format(sim)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <DeltaBadge base={base} sim={sim} />
              </div>
            </div>
          ))}
        </div>

        {/* Comparison chart */}
        <div>
          <p className="text-sm font-medium text-foreground mb-4">Projection de trésorerie — Base vs Scénario simulé</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={simComparisonData}>
              <defs>
                <linearGradient id="grad-sim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-base-sim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--accent-blue)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => format(value)} />
              <Legend />
              <Area type="monotone" dataKey="actuel" name="Base (actuel)"    stroke="var(--accent-blue)" fill="url(#grad-base-sim)" strokeWidth={2}   dot={false} strokeDasharray="5 3" />
              <Area type="monotone" dataKey="simulé" name="Scénario simulé" stroke="#f97316"              fill="url(#grad-sim)"      strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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
                    <td key={s.name} className={`p-4 text-sm text-right ${s.name === "Ambitieux" ? "text-[#eab308]" : s.name === "Conservateur" ? "text-[#f97316]" : "text-accent-blue"}`}>
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