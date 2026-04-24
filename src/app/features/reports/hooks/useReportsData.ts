import { useMemo } from "react";
import { AlertTriangle, CheckCircle, Info, type LucideIcon } from "lucide-react";
import type { CalculatedMetrics } from "@shared/types";
import type { MetricsCalculator } from "../../../lib/metrics";

const CONCENTRATION_COLORS = ["#3b82f6", "#dc2626", "#f97316", "#60a5fa", "#ef4444", "#6b7280"];

interface InsightCard {
  id: number;
  text: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  border: string;
}

interface UseReportsDataParams {
  metrics: CalculatedMetrics;
  calculator: MetricsCalculator;
}

export function useReportsData({ metrics, calculator }: UseReportsDataParams) {
  const revenueGrowth = calculator.calculateRevenueGrowth();
  const expenseVariation = calculator.calculateExpenseVariation();
  const retentionRate = calculator.calculateRetentionRate();
  const autoInsights = calculator.getAutomaticInsights();
  const leverageRatio = calculator.calculateLeverageRatio();
  const dso = calculator.calculateDSO();
  const dio = calculator.calculateDIO();
  const dpo = calculator.calculateDPO();
  const ccc = calculator.calculateCashConversionCycle();

  const revenueTrendLabel = `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% vs mois dernier`;
  const expenseTrendLabel = `${expenseVariation >= 0 ? "+" : ""}${expenseVariation.toFixed(1)}% vs mois dernier`;
  const cashflowPositive = metrics.netCashflow >= 0;

  const insightCards: InsightCard[] = autoInsights.map((text, index) => {
    const isCritical = text.includes("critique") || text.includes("Critique");
    const isWarning = text.includes("eleve") || text.includes("court") || text.includes("depasse");
    const isPositive = text.includes("sain") || text.includes("rentable") || text.includes("positif");

    return {
      id: index,
      text,
      icon: isPositive ? CheckCircle : isWarning || isCritical ? AlertTriangle : Info,
      color: isPositive ? "text-accent-blue" : isCritical ? "text-accent-red" : "text-muted-foreground",
      bgColor: isPositive ? "bg-accent-blue/10" : isCritical ? "bg-accent-red-muted" : "bg-muted",
      border: isPositive ? "border-accent-blue/30" : isCritical ? "border-accent-red/40" : "border-border",
    };
  });

  const lastMonthLabel = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleDateString("fr-CH", { month: "long", year: "numeric" });

  const concentrationData = useMemo(() => {
    const raw = calculator.calculateRevenueConcentration();
    const sorted = Object.entries(raw).sort((left, right) => right[1] - left[1]);
    const topFive = sorted.slice(0, 5).map(([name, value], index) => ({
      name,
      value: Math.round(value * 10) / 10,
      fill: CONCENTRATION_COLORS[index],
    }));
    const rest = sorted.slice(5).reduce((sum, [, value]) => sum + value, 0);
    if (rest > 0.1) {
      topFive.push({ name: "Autres", value: Math.round(rest * 10) / 10, fill: CONCENTRATION_COLORS[5] });
    }
    return topFive;
  }, [calculator]);

  const cohortData = useMemo(() => calculator.getCohortRevenueAnalysis(), [calculator]);
  const maxAvg = useMemo(
    () => Math.max(...cohortData.flatMap(cohort => cohort.months.map(month => month.avgPerCustomer)), 1),
    [cohortData],
  );
  const maxCols = useMemo(() => Math.max(...cohortData.map(cohort => cohort.months.length), 1), [cohortData]);

  const previousMonthExpenses = metrics.monthlyExpenses / (1 + expenseVariation / 100);

  return {
    revenueGrowth,
    expenseVariation,
    retentionRate,
    leverageRatio,
    dso,
    dio,
    dpo,
    ccc,
    revenueTrendLabel,
    expenseTrendLabel,
    cashflowPositive,
    insightCards,
    lastMonthLabel,
    concentrationData,
    cohortData,
    maxAvg,
    maxCols,
    previousMonthExpenses,
  };
}
