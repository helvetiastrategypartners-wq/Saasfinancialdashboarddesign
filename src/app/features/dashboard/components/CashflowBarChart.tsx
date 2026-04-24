import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { GlassCard } from "../../../components/ui/GlassCard";
import { CHART_TOOLTIP } from "../../../lib/chartConfig";

interface CashflowPoint {
  month: string;
  netFlow: number;
}

interface CashflowBarChartProps {
  rangeLabel: string;
  periodCashTrend: CashflowPoint[];
  formatCurrency: (value: number) => string;
}

export function CashflowBarChart({
  rangeLabel,
  periodCashTrend,
  formatCurrency,
}: CashflowBarChartProps) {
  return (
    <GlassCard delay={0.25}>
      <h3 className="text-xl font-semibold text-foreground mb-6">Cashflow net mensuel - {rangeLabel}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={periodCashTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" tickFormatter={value => `${(value / 1000).toFixed(0)}k`} />
          <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => [formatCurrency(value), "Net"]} />
          <Bar dataKey="netFlow" name="Cashflow net" radius={[6, 6, 0, 0]}>
            {periodCashTrend.map((entry, index) => (
              <Cell key={`cf-${index}`} fill={entry.netFlow >= 0 ? "var(--accent-blue)" : "var(--accent-red)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
