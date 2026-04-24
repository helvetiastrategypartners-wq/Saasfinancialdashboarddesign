import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GlassCard } from "../../../components/ui/GlassCard";
import { CHART_TOOLTIP } from "../../../lib/chartConfig";

interface ConcentrationEntry {
  name: string;
  value: number;
  fill: string;
}

interface RevenueConcentrationSectionProps {
  concentrationData: ConcentrationEntry[];
}

export function RevenueConcentrationSection({
  concentrationData,
}: RevenueConcentrationSectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-4">Concentration des Revenus</h2>
      <div className="grid grid-cols-2 gap-6">
        <GlassCard>
          <p className="text-sm font-medium text-muted-foreground mb-2">Repartition par client (mois dernier)</p>
          {concentrationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={concentrationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={42}
                  paddingAngle={3}
                >
                  {concentrationData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => [`${value.toFixed(1)}%`, "Part du revenu"]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">Aucune donnee de revenu ce mois.</p>
          )}
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-medium text-muted-foreground mb-4">Top clients par contribution</p>
          <div className="space-y-4">
            {concentrationData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: entry.fill }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{entry.name}</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground ml-2">{entry.value.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${entry.value}%`, background: entry.fill }} />
                  </div>
                </div>
              </div>
            ))}
            {concentrationData.length === 0 && (
              <p className="text-muted-foreground text-sm">Aucune donnee disponible.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
