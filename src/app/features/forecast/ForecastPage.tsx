import { motion } from "motion/react";
import { lazy, Suspense, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import {
  SCENARIO_PARAMS,
  useForecastData,
  type SimParams,
} from "./hooks";
import { ForecastSimulator, ScenarioSummaryTable } from "./components";

const ForecastChartsSection = lazy(() =>
  import("./components/ForecastChartsSection").then((module) => ({ default: module.ForecastChartsSection })),
);

function ChartSectionFallback() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-glass-border animate-pulse" style={{ background: "var(--glass-bg)", minHeight: 350 }} />
      <div className="rounded-2xl border border-glass-border animate-pulse" style={{ background: "var(--glass-bg)", minHeight: 350 }} />
    </div>
  );
}

export function Forecast() {
  const [selectedScenario, setSelectedScenario] = useState("Base (Realiste)");
  const [simParams, setSimParams] = useState<SimParams>({
    revenueChange: 0,
    expenseChange: 0,
    hiringCost: 0,
  });

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

      <Suspense fallback={<ChartSectionFallback />}>
        <ForecastChartsSection
          activeScenarioName={activeScenario.name}
          activeProjection={activeProjection}
          cashEvolutionData={cashEvolutionData}
          formatCurrency={format}
          simComparisonData={simComparisonData}
        />
      </Suspense>

      <ForecastSimulator
        format={format}
        metrics={metrics}
        simParams={simParams}
        simResult={simResult}
        onChange={setSimParams}
      />

      <ScenarioSummaryTable projectionData={projectionData} scenarioResults={scenarioResults} format={format} />
    </div>
  );
}
