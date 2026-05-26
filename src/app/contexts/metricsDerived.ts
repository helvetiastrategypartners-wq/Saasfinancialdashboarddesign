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

function parseDateValue(value?: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getReportingReferenceDate({
  transactions,
  customers,
  marketingMetrics,
}: MetricsBaseState): Date {
  const timestamps = [
    ...transactions.flatMap(transaction => [
      parseDateValue(transaction.date),
      parseDateValue(transaction.created_at),
      parseDateValue(transaction.updated_at),
    ]),
    ...customers.flatMap(customer => [
      parseDateValue(customer.acquisition_date),
      parseDateValue(customer.churn_date),
      parseDateValue(customer.created_at),
      parseDateValue(customer.updated_at),
    ]),
    ...marketingMetrics.flatMap(metric => [
      parseDateValue(metric.period_start),
      parseDateValue(metric.period_end),
      parseDateValue(metric.created_at),
      parseDateValue(metric.updated_at),
    ]),
  ].filter((timestamp): timestamp is number => timestamp !== null);

  if (timestamps.length === 0) {
    return new Date();
  }

  return new Date(Math.min(Date.now(), Math.max(...timestamps)));
}

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
  const referenceDate = useMemo(
    () => getReportingReferenceDate({ transactions, customers, marketingMetrics }),
    [transactions, customers, marketingMetrics],
  );

  const calculator = useMemo(() => new MetricsCalculator(
    transactions,
    customers,
    marketingMetrics,
    mockProducts,
    mockDebts,
    mockReceivables,
    mockInventory,
    mockGoals,
    referenceDate,
  ), [transactions, customers, marketingMetrics, referenceDate]);

  const metrics = useMemo(() => calculator.calculateAll(), [calculator]);

  const monthlyChartData = useMemo((): MonthlyDataPoint[] => {
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
