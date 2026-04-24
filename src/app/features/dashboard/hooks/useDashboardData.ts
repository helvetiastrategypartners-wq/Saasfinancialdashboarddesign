import { useMemo } from "react";
import type { Transaction, CalculatedMetrics } from "@shared/types";
import { calcPeriodMetrics } from "../../../lib/periodUtils";
import type { DateRange } from "../../../contexts/DateRangeContext";

interface DashboardDateRange {
  dateRange: DateRange;
  comparisonRange: DateRange | null;
}

interface UseDashboardDataParams {
  metrics: CalculatedMetrics;
  transactions: Transaction[];
  formatCurrency: (value: number) => string;
  ranges: DashboardDateRange;
}

interface TrendData {
  trend?: string;
  trendUp?: boolean;
  compValue?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Salaries: "var(--accent-red)",
  Marketing: "var(--accent-blue)",
  Operations: "#8b5cf6",
  "Direct Costs": "#f59e0b",
  Financing: "#10b981",
  Consulting: "#ec4899",
  Subscriptions: "#06b6d4",
};

const FALLBACK_COLORS = ["#ef4444", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4"];

export function useDashboardData({
  metrics,
  transactions,
  formatCurrency,
  ranges,
}: UseDashboardDataParams) {
  const { dateRange, comparisonRange } = ranges;

  const periodMetrics = useMemo(
    () => calcPeriodMetrics(transactions, { start: dateRange.from, end: dateRange.to }),
    [transactions, dateRange],
  );

  const prevMetrics = useMemo(
    () => (
      comparisonRange
        ? calcPeriodMetrics(transactions, { start: comparisonRange.from, end: comparisonRange.to })
        : null
    ),
    [transactions, comparisonRange],
  );

  const periodDurationMonths = (dateRange.to.getTime() - dateRange.from.getTime()) / (30.44 * 86400000);
  const periodBurnRate = periodDurationMonths > 0.1 ? periodMetrics.exp / periodDurationMonths : metrics.burnRate;
  const periodRunway = periodBurnRate > 0 ? metrics.cash / periodBurnRate : metrics.runway;

  const prevBurnRate = prevMetrics && comparisonRange
    ? (() => {
        const duration = (comparisonRange.to.getTime() - comparisonRange.from.getTime()) / (30.44 * 86400000);
        return duration > 0.1 ? prevMetrics.exp / duration : null;
      })()
    : null;

  const rangeLabel = useMemo(() => {
    const fromLabel = dateRange.from.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" });
    const toEnd = new Date(dateRange.to.getTime() - 86400000);
    const toLabel = toEnd.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" });
    return fromLabel === toLabel ? fromLabel : `${fromLabel} - ${toLabel}`;
  }, [dateRange]);

  const grossMarginAmount = periodMetrics.rev * (periodMetrics.gm / 100);
  const previousGrossMarginAmount = prevMetrics ? prevMetrics.rev * (prevMetrics.gm / 100) : null;

  const recentTransactions = useMemo(
    () => (
      [...transactions]
        .filter(transaction => transaction.payment_status === "completed")
        .sort((left, right) => right.date.localeCompare(left.date))
        .slice(0, 6)
    ),
    [transactions],
  );

  const sumTransactions = (type: "income" | "expense", from: string, to: string) =>
    transactions
      .filter(transaction => (
        transaction.payment_status === "completed"
        && transaction.type === type
        && transaction.date >= from
        && transaction.date < to
      ))
      .reduce((sum, transaction) => sum + transaction.amount, 0);

  const dateRangeChartData = useMemo(() => {
    const durationDays = (dateRange.to.getTime() - dateRange.from.getTime()) / 86400000;

    if (durationDays <= 14) {
      return Array.from({ length: Math.max(1, Math.ceil(durationDays)) }, (_, index) => {
        const current = new Date(dateRange.from.getTime() + index * 86400000);
        const from = current.toISOString().slice(0, 10);
        const to = new Date(current.getTime() + 86400000).toISOString().slice(0, 10);

        return {
          month: current.toLocaleDateString("fr-CH", { day: "numeric", month: "short" }),
          revenue: sumTransactions("income", from, to),
          expenses: sumTransactions("expense", from, to),
        };
      });
    }

    if (durationDays <= 90) {
      const weeks = Math.ceil(durationDays / 7);
      return Array.from({ length: weeks }, (_, index) => {
        const fromDate = new Date(dateRange.from.getTime() + index * 7 * 86400000);
        const toDate = new Date(Math.min(fromDate.getTime() + 7 * 86400000, dateRange.to.getTime()));
        const from = fromDate.toISOString().slice(0, 10);
        const to = toDate.toISOString().slice(0, 10);

        return {
          month: fromDate.toLocaleDateString("fr-CH", { day: "numeric", month: "short" }),
          revenue: sumTransactions("income", from, to),
          expenses: sumTransactions("expense", from, to),
        };
      });
    }

    const result: Array<{ month: string; revenue: number; expenses: number }> = [];
    let current = new Date(Date.UTC(dateRange.from.getUTCFullYear(), dateRange.from.getUTCMonth(), 1));

    while (current < dateRange.to) {
      const next = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1));
      const from = (current < dateRange.from ? dateRange.from : current).toISOString().slice(0, 10);
      const to = (next > dateRange.to ? dateRange.to : next).toISOString().slice(0, 10);

      result.push({
        month: current.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" }),
        revenue: sumTransactions("income", from, to),
        expenses: sumTransactions("expense", from, to),
      });

      current = next;
    }

    return result;
  }, [transactions, dateRange]);

  const periodExpensesByCategory = useMemo(() => {
    const from = dateRange.from.toISOString().slice(0, 10);
    const to = dateRange.to.toISOString().slice(0, 10);
    const categoryMap = new Map<string, number>();

    transactions.forEach(transaction => {
      if (transaction.type !== "expense" || transaction.payment_status !== "completed") {
        return;
      }

      const currentDate = transaction.date.slice(0, 10);
      if (currentDate < from || currentDate >= to) {
        return;
      }

      categoryMap.set(transaction.category, (categoryMap.get(transaction.category) ?? 0) + transaction.amount);
    });

    let fallbackIndex = 0;
    return Array.from(categoryMap.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] ?? FALLBACK_COLORS[fallbackIndex++ % FALLBACK_COLORS.length],
      }));
  }, [transactions, dateRange]);

  const periodCashTrend = useMemo(() => {
    const result: Array<{ month: string; netFlow: number }> = [];
    let current = new Date(Date.UTC(dateRange.from.getUTCFullYear(), dateRange.from.getUTCMonth(), 1));

    while (current < dateRange.to) {
      const next = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1));
      const from = (current < dateRange.from ? dateRange.from : current).toISOString().slice(0, 10);
      const to = (next > dateRange.to ? dateRange.to : next).toISOString().slice(0, 10);

      result.push({
        month: current.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" }),
        netFlow: sumTransactions("income", from, to) - sumTransactions("expense", from, to),
      });

      current = next;
    }

    return result;
  }, [transactions, dateRange]);

  const candleData = useMemo(() => {
    let previousClose = 0;

    return dateRangeChartData.map(point => {
      const net = point.revenue - point.expenses;
      const open = previousClose;
      const close = net;
      const high = Math.max(point.revenue, open, close);
      const low = Math.min(-point.expenses, open, close, 0);
      previousClose = net;

      return { ...point, open, close, high, low };
    });
  }, [dateRangeChartData]);

  const candleOffset = Math.abs(Math.min(0, ...candleData.map(point => point.low)));
  const candleProcessed = candleData.map(point => ({
    ...point,
    spacer: point.low + candleOffset,
    range: point.high - point.low,
  }));

  const buildTrend = (current: number, previous: number | null | undefined): TrendData => {
    if (previous == null) {
      return { trend: undefined, trendUp: undefined, compValue: undefined };
    }

    const percent = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;
    return {
      trend: `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`,
      trendUp: percent >= 0,
      compValue: formatCurrency(previous),
    };
  };

  const summaryItems = [
    { label: "MRR", value: formatCurrency(metrics.mrr) },
    { label: "Clients actifs", value: `${metrics.activeCustomers}` },
    { label: "Nouveaux (mois)", value: `+${metrics.newCustomersMonth}` },
    { label: `Cashflow net - ${rangeLabel}`, value: formatCurrency(periodMetrics.net) },
  ];

  return {
    periodMetrics,
    prevMetrics,
    periodBurnRate,
    periodRunway,
    prevBurnRate,
    rangeLabel,
    grossMarginAmount,
    previousGrossMarginAmount,
    recentTransactions,
    dateRangeChartData,
    periodExpensesByCategory,
    periodCashTrend,
    candleOffset,
    candleProcessed,
    buildTrend,
    summaryItems,
  };
}
