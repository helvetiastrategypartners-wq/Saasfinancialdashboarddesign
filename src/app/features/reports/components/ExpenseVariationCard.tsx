import { TrendingDown, TrendingUp } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";

interface ExpenseVariationCardProps {
  expenseVariation: number;
  format: (value: number) => string;
  monthlyExpenses: number;
  previousMonthExpenses: number;
}

export function ExpenseVariationCard({
  expenseVariation,
  format,
  monthlyExpenses,
  previousMonthExpenses,
}: ExpenseVariationCardProps) {
  const isIncreasing = expenseVariation > 0;

  return (
    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-4">Variation des depenses</h2>
      <GlassCard>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ background: isIncreasing ? "var(--accent-red-muted)" : "var(--accent-blue-muted)" }}>
            {isIncreasing
              ? <TrendingUp className="w-6 h-6 text-accent-red" />
              : <TrendingDown className="w-6 h-6 text-accent-blue" />}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Variation depenses (M-1 vs M-2)</p>
            <p className={`text-2xl font-semibold ${isIncreasing ? "text-accent-red" : "text-accent-blue"}`}>
              {expenseVariation >= 0 ? "+" : ""}{expenseVariation.toFixed(1)}%
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Mars vs Fevrier 2026</p>
            <p className="text-sm text-foreground">
              {format(monthlyExpenses)} vs {format(previousMonthExpenses)}
            </p>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
