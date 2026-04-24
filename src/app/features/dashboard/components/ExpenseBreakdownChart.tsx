import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { GlassCard } from "../../../components/ui/GlassCard";
import { CHART_TOOLTIP } from "../../../lib/chartConfig";

interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

interface ExpenseBreakdownChartProps {
  rangeLabel: string;
  periodExpensesByCategory: ExpenseCategory[];
  formatCurrency: (value: number) => string;
}

export function ExpenseBreakdownChart({
  rangeLabel,
  periodExpensesByCategory,
  formatCurrency,
}: ExpenseBreakdownChartProps) {
  return (
    <GlassCard delay={0.2}>
      <h3 className="text-xl font-semibold text-foreground mb-6">Repartition des depenses - {rangeLabel}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={periodExpensesByCategory}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            dataKey="value"
          >
            {periodExpensesByCategory.map(entry => (
              <Cell key={`pie-${entry.name}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => [formatCurrency(value)]} />
        </PieChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
