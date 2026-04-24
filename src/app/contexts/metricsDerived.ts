import { useMemo } from "react";
import { MetricsCalculator, getMonthStart } from "../lib/metrics";
import {
  mockProducts,
  mockDebts,
  mockReceivables,
  mockInventory,
  mockGoals,
} from "../lib/mockData";
import type { MetricsBaseState, MonthlyDataPoint } from "./metricsTypes";

const CATEGORY_COLORS: Record<string, string> = {
  Salaries: "#dc2626",
  Marketing: "#ef4444",
  "Direct Costs": "#3b82f6",
  Operations: "#60a5fa",
  Financing: "#10b981",
  Consulting: "#8b5cf6",
};

export function useMetricsDerivedState({
  transactions,
  customers,
  marketingMetrics,
}: MetricsBaseState) {
  const calculator = useMemo(() => new MetricsCalculator(
    transactions,
    customers,
    marketingMetrics,
    mockProducts,
    mockDebts,
    mockReceivables,
    mockInventory,
    mockGoals,
  ), [transactions, customers, marketingMetrics]);

  const metrics = useMemo(() => calculator.calculateAll(), [calculator]);

  const monthlyChartData = useMemo((): MonthlyDataPoint[] => {
    const referenceDate = new Date();

    return Array.from({ length: 6 }, (_, index) => {
      const monthsAgo = 5 - index;
      const start = getMonthStart(referenceDate, monthsAgo);
      const end = getMonthStart(referenceDate, monthsAgo - 1);

      return {
        month: start.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" }),
        revenue: calculator.getRevenueForPeriod(start, end),
        expenses: calculator.getExpensesForPeriod(start, end),
      };
    });
  }, [calculator]);

  const expensesByCategory = useMemo(() => {
    const raw = calculator.getExpensesByCategory();

    return Object.entries(raw)
      .sort(([, left], [, right]) => right - left)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] ?? "#a3a3a3",
      }));
  }, [calculator]);

  return {
    calculator,
    metrics,
    monthlyChartData,
    expensesByCategory,
  };
}
