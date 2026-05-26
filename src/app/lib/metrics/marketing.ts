import type { MetricsRuntime } from "./context";
import { computeCAC } from "./helpers";

export const marketingMetricsMethods = {
    calculateCAC(this: MetricsRuntime): number {
        return computeCAC(
            this.customers,
            this.marketingMetrics,
            this.monthStart(1).toISOString().slice(0, 7),
            this.monthStart(0).toISOString().slice(0, 7),
        );
    },

    calculateChurnRate(this: MetricsRuntime): number {
        const lastMonth = this.monthStart(1);
        const thisMonth = this.monthStart(0);

        const churned = this.customers.filter((customer) =>
            customer.status === "churned" &&
            customer.churn_date &&
            new Date(customer.churn_date) >= lastMonth &&
            new Date(customer.churn_date) < thisMonth
        ).length;

        const activeAtStart = this.customers.filter((customer) =>
            customer.status === "active" ||
            (
                customer.status === "churned" &&
                customer.churn_date &&
                new Date(customer.churn_date) >= lastMonth
            )
        ).length;

        return activeAtStart === 0 ? 0 : (churned / activeAtStart) * 100;
    },

    calculateConversionRate(this: MetricsRuntime): number {
        const lastMonthKey = this.monthStart(1).toISOString().slice(0, 7);
        const monthlyMetrics = this.marketingMetrics.filter((metric) =>
            metric.period_start?.startsWith(lastMonthKey)
        );

        const leads = monthlyMetrics.reduce((sum, metric) => sum + (metric.leads ?? 0), 0);
        const acquired = monthlyMetrics.reduce((sum, metric) => sum + metric.customers_acquired, 0);

        return leads > 0 ? (acquired / leads) * 100 : 0;
    },

    calculateRetentionRate(this: MetricsRuntime): number {
        return 100 - this.calculateChurnRate();
    },

    simulateHiringImpact(
        this: MetricsRuntime,
        monthlySalary: number,
        expectedRevenueBonus = 0,
    ) {
        const currentBurn = this.calculateBurnRate();
        const newBurn = currentBurn + monthlySalary;
        const newRunway = newBurn > 0
            ? Math.min(this.calculateCash() / newBurn, 999)
            : 999;

        return {
            impactOnBurn: monthlySalary,
            newBurn,
            newRunway,
            newNetCashflow: (this.calculateMRR() + expectedRevenueBonus) - newBurn,
            breakEvenMonths: expectedRevenueBonus > 0
                ? monthlySalary / expectedRevenueBonus
                : Infinity,
        };
    },

    calculateMarketingROI(this: MetricsRuntime): number {
        const lastMonthKey = this.monthStart(1).toISOString().slice(0, 7);
        const monthlyMetrics = this.marketingMetrics.filter((metric) =>
            metric.period_start?.startsWith(lastMonthKey)
        );

        const totalSpend = monthlyMetrics.reduce((sum, metric) => sum + metric.spend, 0);
        const totalRevenue = monthlyMetrics.reduce(
            (sum, metric) => sum + metric.revenue_generated,
            0,
        );

        return totalSpend > 0
            ? ((totalRevenue - totalSpend) / totalSpend) * 100
            : 0;
    },
};
