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
export const dashboardMetricsMethods = {
// ── DASHBOARD ─────────────────────────────────────────────────────────────

/**
 * (FIX 1) O(1) — lecture du solde cumulatif maintenu en delta.
 * Plus de full scan sur this.transactions.
 */
calculateCash(this: MetricsCalculator): number {
return this._cashBalance;
},

/** Moyenne des dépenses sur les 3 derniers mois complets. */
calculateBurnRate(this: MetricsCalculator): number {
return computeBurnRate(
    this._txByMonthKey,
    this.monthStart(3).toISOString().slice(0, 7),
    this.monthStart(0).toISOString().slice(0, 7),
    3,
);
},

/** Trésorerie / burn rate. Retourne 999 si burn ≤ 0. */
calculateRunway(this: MetricsCalculator): number {
const burn = this.calculateBurnRate();
return burn <= 0 ? 999 : this.calculateCash() / burn;
},

getMonthlyNetCashflow(this: MetricsCalculator, months: number): Array<{ month: string; cash: number }> {
const ref = this._refDate;
return Array.from({ length: months }, (_, i) => {
    const date = getMonthStart(ref, months - 1 - i);
    const key  = date.toISOString().slice(0, 7);
    const txs  = this._txByMonthKey.get(key) ?? [];
    let cash = 0;
    for (const t of txs) {
        if (t.payment_status !== "completed") continue;
        cash += t.type === "income" ? t.amount : -t.amount;
    }
    return {
        month: date.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" }),
        cash,
    };
});
},

getMonthlyCashTrend(this: MetricsCalculator, months: number): Array<{
month: string;
netFlow: number;
variationPercent: number | null;
cumulativeBalance: number;
}> {
const ref = this._refDate;
const firstMonthDate = getMonthStart(ref, months - 1);
const firstMonthKey  = firstMonthDate.toISOString().slice(0, 7);

// Balance cumulée antérieure à la fenêtre — une seule passe sur l'index
let runningBalance = 0;
for (const [key, txs] of this._txByMonthKey) {
    if (key >= firstMonthKey) continue;
    for (const t of txs) {
        if (t.payment_status !== "completed") continue;
        runningBalance += t.type === "income" ? t.amount : -t.amount;
    }
}

let prevNetFlow: number | null = null;

return Array.from({ length: months }, (_, i) => {
    const date = getMonthStart(ref, months - 1 - i);
    const key  = date.toISOString().slice(0, 7);
    const txs  = this._txByMonthKey.get(key) ?? [];

    let netFlow = 0;
    for (const t of txs) {
        if (t.payment_status !== "completed") continue;
        netFlow += t.type === "income" ? t.amount : -t.amount;
    }

    const variationPercent =
        prevNetFlow !== null && prevNetFlow !== 0
            ? ((netFlow - prevNetFlow) / Math.abs(prevNetFlow)) * 100
            : null;
    runningBalance += netFlow;
    prevNetFlow = netFlow;

    return {
        month: date.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" }),
        netFlow,
        variationPercent,
        cumulativeBalance: runningBalance,
    };
});
},
};
