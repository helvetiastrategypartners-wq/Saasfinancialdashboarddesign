import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "../../../components/ui/GlassCard";
import { CHART_TOOLTIP } from "../../../lib/chartConfig";

interface MarketingChartsSectionProps {
  avgRatio: number;
  formatCurrency: (value: number) => string;
  ltvCacData: Array<{ canal: string; ltv: number; cac: number }>;
  roiData: Array<{ canal: string; roi: number }>;
  spendVsRevenue: Array<{ canal: string; spend: number; revenue: number }>;
}

export function MarketingChartsSection({
  avgRatio,
  formatCurrency,
  ltvCacData,
  roiData,
  spendVsRevenue,
}: MarketingChartsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-xl font-semibold text-foreground mb-6">Depense vs revenu par canal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendVsRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="canal" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => [formatCurrency(value)]} />
              <Bar dataKey="spend" name="Depense" fill="var(--accent-red)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="revenue" name="Revenu" fill="var(--accent-blue)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.1}>
          <h3 className="text-xl font-semibold text-foreground mb-6">ROI % par canal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} unit="%" />
              <YAxis dataKey="canal" type="category" stroke="var(--muted-foreground)" fontSize={12} width={90} />
              <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => [`${value}%`, "ROI"]} />
              <Bar dataKey="roi" name="ROI" radius={[0, 8, 8, 0]}>
                {roiData.map((_, index) => (
                  <Cell key={`roi-${index}`} fill="var(--accent-blue)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard delay={0.2}>
        <h3 className="text-xl font-semibold text-foreground mb-2">LTV vs CAC par canal</h3>
        <p className="text-sm text-muted-foreground mb-6">Seuil sain : LTV au moins 3x CAC</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ltvCacData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="canal" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => [formatCurrency(value)]} />
            <Legend />
            <Bar dataKey="ltv" name="LTV" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="cac" name="CAC" fill="var(--accent-red)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className={`font-semibold ${avgRatio >= 3 ? "text-blue-400" : "text-red-400"}`}>
            Ratio global : {avgRatio.toFixed(1)}
          </span>
          <span>- {avgRatio >= 3 ? "Sain" : avgRatio >= 1.5 ? "A surveiller" : "Critique"}</span>
        </div>
      </GlassCard>
    </>
  );
}
