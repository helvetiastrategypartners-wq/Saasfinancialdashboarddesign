import { GlassCard } from "../../../components/ui/GlassCard";
import { SCENARIO_PARAMS } from "../hooks/useForecastData";

interface ScenarioSummaryTableProps {
  projectionData: Record<string, Array<{ cash: number }>>;
  scenarioResults: Record<
    string,
    {
      projectedRunway: number;
      projectedRevenue: number;
      projectedNetCashflow: number;
      projectedBurnRate: number;
    }
  >;
  format: (value: number) => string;
}

export function ScenarioSummaryTable({
  projectionData,
  scenarioResults,
  format,
}: ScenarioSummaryTableProps) {
  const rows = [
    { label: "Cash final (M12)", formatValue: (name: string) => format(projectionData[name].at(-1)!.cash) },
    { label: "Runway projete", formatValue: (name: string) => `${scenarioResults[name].projectedRunway} mois` },
    { label: "Revenu projete", formatValue: (name: string) => format(scenarioResults[name].projectedRevenue) },
    { label: "Cashflow net projete", formatValue: (name: string) => format(scenarioResults[name].projectedNetCashflow) },
    { label: "Burn rate projete", formatValue: (name: string) => format(scenarioResults[name].projectedBurnRate) },
  ];

  return (
    <GlassCard delay={0.3} noPadding>
      <div className="p-6 border-b border-glass-border">
        <h3 className="text-xl font-semibold text-foreground">Resume des scenarios (12 mois)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Metrique</th>
              {SCENARIO_PARAMS.map((scenario) => (
                <th key={scenario.name} className="text-right p-4 text-sm font-semibold text-muted-foreground">
                  {scenario.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-glass-border/50">
                <td className="p-4 text-sm text-foreground">{row.label}</td>
                {SCENARIO_PARAMS.map((scenario) => (
                  <td
                    key={scenario.name}
                    className={`p-4 text-sm text-right ${scenario.name === "Ambitieux" ? "text-[#eab308]" : scenario.name === "Conservateur" ? "text-[#f97316]" : "text-accent-blue"}`}
                  >
                    {row.formatValue(scenario.name)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
