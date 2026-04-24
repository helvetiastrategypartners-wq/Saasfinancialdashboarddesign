import { useMemo } from "react";
import { useMetrics } from "../../../contexts/MetricsContext";
import { useCurrency } from "../../../contexts/CurrencyContext";

export const SCENARIO_PARAMS = [
  {
    name: "Conservateur",
    description: "Croissance moderee +5% revenu/mois, burn +3%, churn 5%",
    revenueChange: 5,
    expenseChange: 3,
  },
  {
    name: "Base (Realiste)",
    description: "Croissance +12% revenu/mois, burn +5%, churn 3%",
    revenueChange: 12,
    expenseChange: 5,
  },
  {
    name: "Ambitieux",
    description: "Croissance +25% revenu/mois, burn +8%, churn 2%",
    revenueChange: 25,
    expenseChange: 8,
  },
];

export const WHAT_IF_PRESETS = [
  { id: "ads", label: "Double le budget Ads", revenueChange: 15, expenseChange: 20, hiringCost: 0 },
  { id: "churn", label: "Reduit le churn de 50%", revenueChange: 8, expenseChange: 0, hiringCost: 0 },
  { id: "hire", label: "Embauche 2 devs", revenueChange: 5, expenseChange: 0, hiringCost: 12000 },
  { id: "cut", label: "Coupe 20% des depenses", revenueChange: 0, expenseChange: -20, hiringCost: 0 },
  { id: "boost", label: "Revenue +30%", revenueChange: 30, expenseChange: 8, hiringCost: 0 },
] as const;

export interface SimParams {
  revenueChange: number;
  expenseChange: number;
  hiringCost: number;
}

export interface ScenarioSimulation {
  projectedRevenue: number;
  projectedExpenses: number;
  projectedNetCashflow: number;
  projectedRunway: number;
  projectedBurnRate: number;
}

function toScenarioSimulation(result: Record<string, number>): ScenarioSimulation {
  return {
    projectedRevenue: result.projectedRevenue ?? 0,
    projectedExpenses: result.projectedExpenses ?? 0,
    projectedNetCashflow: result.projectedNetCashflow ?? 0,
    projectedRunway: result.projectedRunway ?? 0,
    projectedBurnRate: result.projectedBurnRate ?? 0,
  };
}

export function projectCash(
  initialCash: number,
  monthlyRevenue: number,
  burnRate: number,
  revenueGrowth: number,
  expenseGrowth: number,
  months = 12,
) {
  const data: { month: string; cash: number; revenue: number; burnRate: number }[] = [];
  let cash = initialCash;
  let revenue = monthlyRevenue;
  let burn = burnRate;

  for (let index = 1; index <= months; index += 1) {
    revenue *= 1 + revenueGrowth / 100;
    burn *= 1 + expenseGrowth / 100;
    cash += revenue - burn;
    data.push({
      month: `M${index}`,
      cash: Math.round(cash),
      revenue: Math.round(revenue),
      burnRate: Math.round(burn),
    });
  }

  return data;
}

export function useForecastData(selectedScenario: string, simParams: SimParams) {
  const metricsApi = useMetrics();
  const { format } = useCurrency();
  const { metrics, calculator } = metricsApi;

  const scenarioResults = useMemo(
    () =>
      Object.fromEntries(
        SCENARIO_PARAMS.map((scenario) => [
          scenario.name,
          toScenarioSimulation(
            calculator.simulateScenario({
              revenueChange: scenario.revenueChange,
              expenseChange: scenario.expenseChange,
            }),
          ),
        ]),
      ),
    [calculator],
  );

  const projectionData = useMemo(
    () =>
      Object.fromEntries(
        SCENARIO_PARAMS.map((scenario) => [
          scenario.name,
          projectCash(
            metrics.cash,
            metrics.monthlyRevenue,
            metrics.burnRate,
            scenario.revenueChange,
            scenario.expenseChange,
          ),
        ]),
      ),
    [metrics],
  );

  const activeScenario = SCENARIO_PARAMS.find((scenario) => scenario.name === selectedScenario) ?? SCENARIO_PARAMS[1];
  const activeProjection = projectionData[selectedScenario];
  const activeResult = scenarioResults[selectedScenario];

  const cashEvolutionData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        month: `M${index + 1}`,
        conservateur: projectionData.Conservateur[index].cash,
        base: projectionData["Base (Realiste)"][index].cash,
        ambitieux: projectionData.Ambitieux[index].cash,
      })),
    [projectionData],
  );

  const simResult = useMemo(
    () =>
      toScenarioSimulation(
        calculator.simulateScenario({
          revenueChange: simParams.revenueChange,
          expenseChange: simParams.expenseChange,
          hiringCost: simParams.hiringCost,
        }),
      ),
    [calculator, simParams],
  );

  const simProjection = useMemo(
    () =>
      projectCash(
        metrics.cash,
        metrics.monthlyRevenue,
        metrics.burnRate,
        simParams.revenueChange,
        simParams.expenseChange,
      ),
    [metrics, simParams],
  );

  const baseProjection = useMemo(
    () => projectCash(metrics.cash, metrics.monthlyRevenue, metrics.burnRate, 0, 0),
    [metrics],
  );

  const simComparisonData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        month: `M${index + 1}`,
        actuel: baseProjection[index].cash,
        simule: simProjection[index].cash,
      })),
    [baseProjection, simProjection],
  );

  return {
    ...metricsApi,
    format,
    scenarioResults,
    projectionData,
    activeScenario,
    activeProjection,
    activeResult,
    cashEvolutionData,
    simResult,
    simComparisonData,
  };
}
