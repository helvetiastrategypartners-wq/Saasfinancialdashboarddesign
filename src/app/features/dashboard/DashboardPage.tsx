import { Suspense, lazy, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, BarChart2, Flame, Clock } from "lucide-react";
import { useMetrics } from "../../contexts/MetricsContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useDateRange } from "../../contexts/DateRangeContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { DeferredExportButton, KpiCard, RecentTransactionsCard, SummaryGrid } from "./components";
import { useDashboardData } from "./hooks";

const DateRangeBar = lazy(() =>
  import("../../components/DateRangeBar").then((module) => ({ default: module.DateRangeBar })),
);
const RevenueExpensesChart = lazy(() =>
  import("./components/RevenueExpensesChart").then((module) => ({ default: module.RevenueExpensesChart })),
);
const ExpenseBreakdownChart = lazy(() =>
  import("./components/ExpenseBreakdownChart").then((module) => ({ default: module.ExpenseBreakdownChart })),
);
const CashflowBarChart = lazy(() =>
  import("./components/CashflowBarChart").then((module) => ({ default: module.CashflowBarChart })),
);

function ChartFallback({ height = 300 }: { height?: number }) {
  return (
    <div
      className="rounded-2xl border border-glass-border animate-pulse"
      style={{ background: "var(--glass-bg)", minHeight: height }}
    />
  );
}

function ToolbarFallback() {
  return (
    <div
      className="h-11 rounded-xl border border-glass-border animate-pulse"
      style={{ background: "var(--glass-bg)", width: 420, maxWidth: "100%" }}
    />
  );
}

export function Dashboard() {
  const { metrics, transactions } = useMetrics();
  const { format } = useCurrency();
  const { dateRange, comparisonRange } = useDateRange();
  const [chartMode, setChartMode] = useState<"line" | "candle">("line");

  const {
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
  } = useDashboardData({
    metrics,
    transactions,
    formatCurrency: format,
    ranges: { dateRange, comparisonRange },
  });

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Vue d'ensemble - ${rangeLabel}`}
        action={<DeferredExportButton title="Monthly_Sales_Report" />}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <Suspense fallback={<ToolbarFallback />}>
          <DateRangeBar />
        </Suspense>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <KpiCard icon={DollarSign} label="Cash disponible" value={format(metrics.cash)} highlight />
        <KpiCard
          icon={TrendingUp}
          label={`Revenus - ${rangeLabel}`}
          value={format(periodMetrics.rev)}
          {...buildTrend(periodMetrics.rev, prevMetrics?.rev)}
        />
        <KpiCard
          icon={TrendingDown}
          label={`Depenses - ${rangeLabel}`}
          value={format(periodMetrics.exp)}
          {...buildTrend(periodMetrics.exp, prevMetrics?.exp)}
        />
        <KpiCard
          icon={BarChart2}
          label={`Marge brute - ${rangeLabel}`}
          value={`${periodMetrics.gm.toFixed(2)}%`}
          sub={format(grossMarginAmount)}
          {...buildTrend(periodMetrics.gm, prevMetrics?.gm)}
          compValue={previousGrossMarginAmount != null ? format(previousGrossMarginAmount) : undefined}
        />
        <KpiCard
          icon={Flame}
          label="Burn rate (periode)"
          value={format(periodBurnRate)}
          {...buildTrend(periodBurnRate, prevBurnRate)}
        />
        <KpiCard
          icon={Clock}
          label="Runway estime"
          value={`${periodRunway.toFixed(1)} mois`}
          trend={metrics.cashRisk?.message}
          trendUp={periodRunway >= 6}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Suspense fallback={<ChartFallback />}>
          <RevenueExpensesChart
            rangeLabel={rangeLabel}
            chartMode={chartMode}
            onChartModeChange={setChartMode}
            dateRangeChartData={dateRangeChartData}
            candleProcessed={candleProcessed}
            candleOffset={candleOffset}
            formatCurrency={format}
          />
        </Suspense>
        <Suspense fallback={<ChartFallback />}>
          <ExpenseBreakdownChart
            rangeLabel={rangeLabel}
            periodExpensesByCategory={periodExpensesByCategory}
            formatCurrency={format}
          />
        </Suspense>
      </div>

      <Suspense fallback={<ChartFallback height={200} />}>
        <CashflowBarChart
          rangeLabel={rangeLabel}
          periodCashTrend={periodCashTrend}
          formatCurrency={format}
        />
      </Suspense>

      <RecentTransactionsCard recentTransactions={recentTransactions} formatCurrency={format} />

      <SummaryGrid items={summaryItems} netCashflow={periodMetrics.net} />
    </div>
  );
}
