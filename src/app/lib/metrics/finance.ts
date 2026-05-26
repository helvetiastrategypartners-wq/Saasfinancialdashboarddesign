import type { MetricsRuntime } from "./context";
import { getMonthStart, sumAmounts } from "./helpers";

export const financeMetricsMethods = {
    calculateEBITDA(this: MetricsRuntime): number {
        const lastMonthExpenses = this.filterTx(
            this.monthStart(1),
            this.monthStart(0),
            "expense",
        );
        const opex = sumAmounts(
            lastMonthExpenses.filter((t) => t.category !== "Direct Costs"),
        );
        return this.getLastMonthData().grossMargin - opex;
    },

    calculateTotalDebt(this: MetricsRuntime): number {
        return this.debts.reduce((sum, debt) => sum + debt.remaining_amount, 0);
    },

    getRevenueByChannel(this: MetricsRuntime): Record<string, number> {
        const result: Record<string, number> = {};
        this.filterTx(this.monthStart(1), this.monthStart(0), "income")
            .forEach((transaction) => {
                const channel = transaction.linked_channel || "Unknown";
                result[channel] = (result[channel] || 0) + transaction.amount;
            });
        return result;
    },

    getCACByChannel(this: MetricsRuntime): Record<string, number> {
        const byChannel: Record<string, { spend: number; customers: number }> = {};
        const ref = this._refDate;
        const firstDayLastMonth = getMonthStart(ref, 1);
        const lastDayLastMonth = new Date(Date.UTC(ref.getFullYear(), ref.getMonth(), 0));
        const monthlyMetrics = this.marketingMetrics.filter((metric) => {
            if (!metric.period_start) {
                return false;
            }
            const periodStart = new Date(metric.period_start);
            return periodStart >= firstDayLastMonth && periodStart <= lastDayLastMonth;
        });
        monthlyMetrics.forEach((metric) => {
            const channel = metric.channel_id || "Unknown";
            if (!byChannel[channel]) {
                byChannel[channel] = { spend: 0, customers: 0 };
            }
            byChannel[channel].spend += metric.spend;
            byChannel[channel].customers += metric.customers_acquired;
        });
        const result: Record<string, number> = {};
        Object.entries(byChannel).forEach(([channel, data]) => {
            result[channel] = data.customers > 0 ? data.spend / data.customers : 0;
        });
        return result;
    },

    getExpensesByCategory(this: MetricsRuntime): Record<string, number> {
        const result: Record<string, number> = {};
        this.filterTx(this.monthStart(1), this.monthStart(0), "expense")
            .forEach((transaction) => {
                const category = transaction.category || "Uncategorized";
                result[category] = (result[category] || 0) + transaction.amount;
            });
        return result;
    },

    getRevenueForPeriod(this: MetricsRuntime, start: Date, end: Date): number {
        return sumAmounts(this.filterTx(start, end, "income"));
    },

    getExpensesForPeriod(this: MetricsRuntime, start: Date, end: Date): number {
        return sumAmounts(this.filterTx(start, end, "expense"));
    },
};
