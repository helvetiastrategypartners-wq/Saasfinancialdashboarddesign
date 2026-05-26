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
export const financeMetricsMethods = {
// ── FINANCE ───────────────────────────────────────────────────────────────

/** Marge brute M-1 moins les charges opex (hors coûts directs). */
calculateEBITDA(this: MetricsCalculator): number {
const opex = sumAmounts(
    this.filterTx(this.monthStart(1), this.monthStart(0), "expense")
        .filter((t) => t.category !== "Direct Costs")
);
return this.getLastMonthData().grossMargin - opex;
},

calculateTotalDebt(this: MetricsCalculator): number {
return this.debts.reduce((s, d) => s + d.remaining_amount, 0);
},

getRevenueByChannel(this: MetricsCalculator): Record<string, number> {
const result: Record<string, number> = {};
this.filterTx(this.monthStart(1), this.monthStart(0), "income").forEach((t) => {
    const channel = t.linked_channel || "Unknown";
    result[channel] = (result[channel] || 0) + t.amount;
});
return result;
},

/** Spend / clients acquis, par canal marketing (Mois dernier uniquement) */
getCACByChannel(this: MetricsCalculator): Record<string, number> {
const byChannel: Record<string, { spend: number; customers: number }> = {};
const ref = this._refDate;
const firstDayLastMonth = getMonthStart(ref, 1);
const lastDayLastMonth  = new Date(Date.UTC(ref.getFullYear(), ref.getMonth(), 0));

const monthlyMetrics = this.marketingMetrics.filter(m => {
    if (!m.period_start) return false;
    const pStart = new Date(m.period_start);
    return pStart >= firstDayLastMonth && pStart <= lastDayLastMonth;
});

monthlyMetrics.forEach((m) => {
    const channel = m.channel_id || "Unknown";
    if (!byChannel[channel]) byChannel[channel] = { spend: 0, customers: 0 };
    byChannel[channel].spend     += m.spend;
    byChannel[channel].customers += m.customers_acquired;
});

const result: Record<string, number> = {};
Object.entries(byChannel).forEach(([channel, data]) => {
    result[channel] = data.customers > 0 ? data.spend / data.customers : 0;
});

return result;
},

getExpensesByCategory(this: MetricsCalculator): Record<string, number> {
const result: Record<string, number> = {};
this.filterTx(this.monthStart(1), this.monthStart(0), "expense").forEach((t) => {
    const category = t.category || "Uncategorized";
    result[category] = (result[category] || 0) + t.amount;
});
return result;
},

/** Revenus sur une période custom (KML). */
getRevenueForPeriod(this: MetricsCalculator, start: Date, end: Date): number {
return sumAmounts(this.filterTx(start, end, "income"));
},

/** Dépenses sur une période custom (KML). */
getExpensesForPeriod(this: MetricsCalculator, start: Date, end: Date): number {
return sumAmounts(this.filterTx(start, end, "expense"));
},
};
