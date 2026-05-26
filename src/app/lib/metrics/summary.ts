import type { CalculatedMetrics } from "@shared/types";

import type { MetricsRuntime } from "./context";
import { computeLTV, sumAmounts } from "./helpers";

export const summaryMetricsMethods = {
    calculateAll(this: MetricsRuntime): CalculatedMetrics {
        const monthly = this.getLastMonthData();
        const cash = this.calculateCash();
        const burnRate = this.calculateBurnRate();
        const runway = burnRate <= 0 ? 999 : cash / burnRate;
        const cac = this.calculateCAC();
        const ltv = computeLTV(
            this.calculateARPU(),
            monthly.grossMarginPercent,
            this.calculateChurnRate(),
            60,
        );
        return {
            cash,
            monthlyRevenue: monthly.revenue,
            monthlyExpenses: monthly.expenses,
            netCashflow: monthly.revenue - monthly.expenses,
            burnRate,
            runway,
            grossMargin: monthly.grossMargin,
            grossMarginPercent: monthly.grossMarginPercent,
            ebitda: this.calculateEBITDA(),
            totalDebt: this.calculateTotalDebt(),
            cac,
            ltv,
            ltvCacRatio: cac > 0 ? ltv / cac : 0,
            paybackPeriod: this.calculatePaybackPeriod(),
            arpu: this.calculateARPU(),
            mrr: this.calculateMRR(),
            churnRate: this.calculateChurnRate(),
            activeCustomers: this.getActiveCustomersCount(),
            newCustomersMonth: this.getNewCustomersThisMonth(),
            conversionRate: this.calculateConversionRate(),
            marketingROI: this.calculateMarketingROI(),
            revenueGrowth: this.calculateRevenueGrowth(),
            cashRisk: runway < 3
                ? { risk: "high", message: "Critique" }
                : runway < 6
                    ? { risk: "medium", message: "Attention" }
                    : { risk: "low", message: "Stable" },
        };
    },

    getLastMonthData(this: MetricsRuntime) {
        if (!this._lastMonthCache) {
            const transactions = this.filterTx(this.monthStart(1), this.monthStart(0));
            const revenue = sumAmounts(
                transactions.filter((transaction) => transaction.type === "income"),
            );
            const costs = sumAmounts(
                transactions.filter((transaction) =>
                    transaction.type === "expense" &&
                    transaction.category === "Direct Costs"
                ),
            );
            this._lastMonthCache = {
                revenue,
                expenses: sumAmounts(
                    transactions.filter((transaction) => transaction.type === "expense"),
                ),
                grossMargin: revenue - costs,
                grossMarginPercent: revenue > 0
                    ? ((revenue - costs) / revenue) * 100
                    : 0,
            };
        }
        return this._lastMonthCache;
    },

    getActiveCustomersCount(this: MetricsRuntime) {
        return this.customers.filter((customer) => customer.status === "active").length;
    },

    getNewCustomersThisMonth(this: MetricsRuntime) {
        return this.customers.filter((customer) =>
            new Date(customer.acquisition_date) >= this.monthStart(0)
        ).length;
    },

    calculateARPU(this: MetricsRuntime) {
        const active = this.getActiveCustomersCount();
        return active > 0 ? this.getLastMonthData().revenue / active : 0;
    },

    calculateMRR(this: MetricsRuntime) {
        let mrr = 0;
        for (const customer of this.customers) {
            if (customer.status === "active") {
                mrr += customer.monthly_revenue;
            }
        }
        return mrr;
    },

    calculatePaybackPeriod(this: MetricsRuntime) {
        const margin = this.calculateARPU() *
            (this.getLastMonthData().grossMarginPercent / 100);
        if (margin <= 0) {
            return this.calculateCAC() > 0 ? Infinity : 0;
        }
        return this.calculateCAC() / margin;
    },
};
