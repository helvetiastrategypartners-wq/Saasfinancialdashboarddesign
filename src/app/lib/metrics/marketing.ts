import type {
    Transaction, Customer, MarketingMetrics, CalculatedMetrics,
    Product, Debt, InventoryItem, Receivable, Goal,
} from "@shared/types";
import type { MetricsCalculator } from "./MetricsCalculator";
import {
    sumAmounts,
    filterTxPure,
    getMonthStart,
    computeCAC,
    computeLTV,
    computeBurnRate,
} from "./helpers";
export const marketingMetricsMethods = {
// ── MARKETING ─────────────────────────────────────────────────────────────

/**
 * Spend marketing M-1 / nouveaux clients M-1.
 * (FIX 2) Délègue à computeCAC() — testable directement.
 */
calculateCAC(this: MetricsCalculator): number {
return computeCAC(
    this.customers,
    this.marketingMetrics,
    this.monthStart(1).toISOString().slice(0, 7),
    this.monthStart(0).toISOString().slice(0, 7),
);
},

calculateChurnRate(this: MetricsCalculator): number {
const lastMonth = this.monthStart(1);
const thisMonth = this.monthStart(0);
const churned = this.customers.filter((c) =>
    c.status === "churned" && c.churn_date &&
    new Date(c.churn_date) >= lastMonth && new Date(c.churn_date) < thisMonth
).length;
const activeAtStart = this.customers.filter((c) =>
    c.status === "active" ||
    (c.status === "churned" && c.churn_date && new Date(c.churn_date) >= lastMonth)
).length;
return activeAtStart === 0 ? 0 : (churned / activeAtStart) * 100;
},

calculateConversionRate(this: MetricsCalculator): number {
const lastMonthKey = this.monthStart(1).toISOString().slice(0, 7);
const monthlyMetrics = this.marketingMetrics.filter(m =>
    m.period_start?.startsWith(lastMonthKey)
);
const leads    = monthlyMetrics.reduce((sum, m) => sum + (m.leads ?? 0), 0);
const acquired = monthlyMetrics.reduce((sum, m) => sum + m.customers_acquired, 0);
return leads > 0 ? (acquired / leads) * 100 : 0;
},

calculateRetentionRate(this: MetricsCalculator): number {
return 100 - this.calculateChurnRate();
},

// ── KML & ROI ─────────────────────────────────────────────────────────────

simulateHiringImpact(this: MetricsCalculator, monthlySalary: number, expectedRevenueBonus = 0) {
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

/** (Revenue généré − Spend) / Spend × 100 — Focus Mois Dernier (M-1) */
calculateMarketingROI(this: MetricsCalculator): number {
const lastMonthKey = this.monthStart(1).toISOString().slice(0, 7);
const monthlyMetrics = this.marketingMetrics.filter(m =>
    m.period_start?.startsWith(lastMonthKey)
);
const totalSpend   = monthlyMetrics.reduce((sum, m) => sum + m.spend, 0);
const totalRevenue = monthlyMetrics.reduce((sum, m) => sum + m.revenue_generated, 0);
return totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
},
};
