import { motion } from "motion/react";
import { useState } from "react";
import type { CalculatedMetrics } from "@shared/types";
import { GlassCard } from "../../../components/ui/GlassCard";
import { WHAT_IF_PRESETS, type ScenarioSimulation, type SimParams } from "../hooks";

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

interface ForecastSimulatorProps {
  format: (value: number) => string;
  metrics: CalculatedMetrics;
  simParams: SimParams;
  simResult: ScenarioSimulation;
  onChange: (params: SimParams) => void;
}

export function ForecastSimulator({ format, metrics, simParams, simResult, onChange }: ForecastSimulatorProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  function updateParam<K extends keyof SimParams>(key: K, value: SimParams[K]) {
    onChange({ ...simParams, [key]: value });
  }

  return (
    <GlassCard delay={0.2}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Simulateur de scenarios</h3>
          <p className="text-sm text-muted-foreground mt-1">Modifiez les parametres pour voir l'impact en temps reel</p>
        </div>
        <button
          onClick={() => {
            onChange({ revenueChange: 0, expenseChange: 0, hiringCost: 0 });
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
              onChange({
                revenueChange: preset.revenueChange,
                expenseChange: preset.expenseChange,
                hiringCost: preset.hiringCost,
              });
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
                      updateParam(key, Math.min(max, Math.max(min, Number(editingValue) || 0)));
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
                  updateParam(key, Number(event.target.value));
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
    </GlassCard>
  );
}
