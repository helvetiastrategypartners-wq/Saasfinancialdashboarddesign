import { motion } from "motion/react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { CHART_TOOLTIP } from "../../lib/chartConfig";
import {
  SCENARIO_PARAMS,
  WHAT_IF_PRESETS,
  useForecastData,
  type SimParams,
} from "./hooks/useForecastData";
import { ScenarioSummaryTable } from "./components/ScenarioSummaryTable";

function DeltaBadge({ base, simulated }: { base: number; simulated: number }) {
  const diff = simulated - base;
  const percentage = base !== 0 ? ((diff / Math.abs(base)) * 100).toFixed(1) : null;
  const positive = diff >= 0;

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${positive ? "bg-accent-blue/20 text-accent-blue" : "bg-accent-red-muted text-accent-red"}`}>
      {positive ? "+" : ""}
      {percentage !== null ? `${percentage}%` : "-"}
    </span>
  );
}

export function Forecast() {
  const [selectedScenario, setSelectedScenario] = useState("Base (Realiste)");
  const [simParams, setSimParams] = useState<SimParams>({
    revenueChange: 0,
    expenseChange: 0,
    hiringCost: 0,
  });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const {
    metrics,
    format,
    scenarioResults,
    projectionData,
    activeScenario,
    activeProjection,
    activeResult,
    cashEvolutionData,
    simResult,
    simComparisonData,
  } = useForecastData(selectedScenario, simParams);

  return (
    <div className="p-8 space-y-8">
      <PageHeader title="Previsions & Scenarios" subtitle="Projections financieres basees sur vos metriques actuelles" />

      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-foreground">Scenario :</label>
        <select value={selectedScenario} onChange={(event) => setSelectedScenario(event.target.value)} className="px-6 py-3 rounded-xl bg-secondary/50 border border-glass-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-xl min-w-[250px]">
          {SCENARIO_PARAMS.map((scenario) => (
            <option key={scenario.name} value={scenario.name}>
              {scenario.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {SCENARIO_PARAMS.map((scenario, index) => (
          <motion.div
            key={scenario.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedScenario(scenario.name)}
            className={`rounded-2xl p-6 backdrop-blur-xl border cursor-pointer transition-all ${selectedScenario === scenario.name ? "border-blue-500/50" : "border-glass-border hover:border-glass-border/50"}`}
            style={{ background: selectedScenario === scenario.name ? "rgba(59,130,246,0.1)" : "var(--glass-bg)" }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">{scenario.name}</h3>
            <p className="text-sm text-muted-foreground">{scenario.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Cash a 12 mois" value={format(activeProjection.at(-1)!.cash)} />
        <StatCard label="Runway a 12 mois" value={`${activeResult.projectedRunway} mois`} />
        <StatCard label="Revenu projete" value={format(activeResult.projectedRevenue)} />
        <StatCard label="Burn rate projete" value={format(activeResult.projectedBurnRate)} />
      </div>

      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-6">Evolution du cash (3 scenarios)</h3>
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
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => format(value)} />
            <Legend />
            <Area type="monotone" dataKey="conservateur" name="Conservateur" stroke="#f97316" fill="transparent" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="base" name="Base" stroke="var(--accent-blue)" fill="url(#grad-base)" strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="ambitieux" name="Ambitieux" stroke="#eab308" fill="transparent" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard delay={0.1}>
        <h3 className="text-xl font-semibold text-foreground mb-6">Revenu vs burn rate - {activeScenario.name}</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={activeProjection}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => format(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="Revenu" stroke="var(--accent-red)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="burnRate" name="Burn Rate" stroke="var(--accent-blue)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard delay={0.2}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Simulateur de scenarios</h3>
            <p className="text-sm text-muted-foreground mt-1">Modifiez les parametres pour voir l'impact en temps reel</p>
          </div>
          <button
            onClick={() => {
              setSimParams({ revenueChange: 0, expenseChange: 0, hiringCost: 0 });
              setActivePreset(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-glass-border hover:bg-secondary/50"
          >
            Reinitialiser
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {WHAT_IF_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                const params = {
                  revenueChange: preset.revenueChange,
                  expenseChange: preset.expenseChange,
                  hiringCost: preset.hiringCost,
                };
                setSimParams(params);
                setActivePreset(activePreset === preset.id ? null : preset.id);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${activePreset === preset.id ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-secondary/50 border-glass-border text-muted-foreground hover:text-foreground"}`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8 mb-8">
          {([
            { key: "revenueChange" as const, label: "Variation revenus", unit: "%", min: -50, max: 100, step: 1, color: "text-accent-blue" },
            { key: "expenseChange" as const, label: "Variation depenses", unit: "%", min: -50, max: 100, step: 1, color: "text-red-400" },
            { key: "hiringCost" as const, label: "Cout embauche / mois", unit: "EUR", min: 0, max: 50000, step: 500, color: "text-blue-400" },
          ] as const).map(({ key, label, unit, min, max, step, color }) => {
            const value = simParams[key];
            const pct = ((value - min) / (max - min)) * 100;

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
                      onChange={(event) => setEditingValue(event.target.value)}
                      onBlur={() => {
                        const nextValue = Math.min(max, Math.max(min, Number(editingValue) || 0));
                        setSimParams((current) => ({ ...current, [key]: nextValue }));
                        setActivePreset(null);
                        setEditingKey(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") (event.target as HTMLInputElement).blur();
                        if (event.key === "Escape") setEditingKey(null);
                      }}
                      className="w-20 text-right text-sm font-semibold tabular-nums bg-secondary/60 border border-accent-blue/40 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent-blue/60"
                    />
                  ) : (
                    <span
                      title="Cliquer pour saisir une valeur"
                      onClick={() => {
                        setEditingKey(key);
                        setEditingValue(String(value));
                      }}
                      className={`text-sm font-semibold tabular-nums cursor-text select-none rounded px-1 hover:bg-secondary/60 transition-colors ${color}`}
                    >
                      {key === "hiringCost" ? format(value) : `${value > 0 ? "+" : ""}${value}${unit}`}
                    </span>
                  )}
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(event) => {
                    setActivePreset(null);
                    setSimParams((current) => ({ ...current, [key]: Number(event.target.value) }));
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
                  style={{ background: `linear-gradient(to right, var(--accent-blue) 0%, var(--accent-blue) ${pct}%, var(--border) ${pct}%, var(--border) 100%)` }}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{key === "hiringCost" ? "0 EUR" : `${min}%`}</span>
                  <span>{key === "hiringCost" ? format(max) : `+${max}%`}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Revenu mensuel", base: metrics.monthlyRevenue, simulated: simResult.projectedRevenue, isMonths: false },
            { label: "Burn rate", base: metrics.burnRate, simulated: simResult.projectedBurnRate, isMonths: false },
            { label: "Cashflow net", base: metrics.netCashflow, simulated: simResult.projectedNetCashflow, isMonths: false },
            { label: "Runway", base: metrics.runway, simulated: simResult.projectedRunway, isMonths: true },
          ].map(({ label, base, simulated, isMonths }) => (
            <div key={label} className="rounded-xl p-4 border border-glass-border bg-secondary/30">
              <p className="text-xs font-medium text-muted-foreground mb-3">{label}</p>
              <div className="flex items-end justify-between gap-1 mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Actuel</p>
                  <p className="text-sm font-medium text-foreground">{isMonths ? `${Number(base).toFixed(1)} m` : format(base)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Projete</p>
                  <p className={`text-sm font-semibold ${simulated > base ? "text-accent-blue" : simulated < base ? "text-accent-red" : "text-foreground"}`}>
                    {isMonths ? `${Number(simulated).toFixed(1)} m` : format(simulated)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <DeltaBadge base={base} simulated={simulated} />
              </div>
            </div>
          ))}
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-4">Projection de tresorerie - base vs scenario simule</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={simComparisonData}>
              <defs>
                <linearGradient id="grad-sim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-base-sim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => format(value)} />
              <Legend />
              <Area type="monotone" dataKey="actuel" name="Base (actuel)" stroke="var(--accent-blue)" fill="url(#grad-base-sim)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              <Area type="monotone" dataKey="simule" name="Scenario simule" stroke="#f97316" fill="url(#grad-sim)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <ScenarioSummaryTable projectionData={projectionData} scenarioResults={scenarioResults} format={format} />
    </div>
  );
}
