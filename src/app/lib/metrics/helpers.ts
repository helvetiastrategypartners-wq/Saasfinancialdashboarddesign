import type { Transaction, Customer, MarketingMetrics } from "@shared/types";
// Extraits de la classe pour être unit-testables sans instancier MetricsCalculator.
// Import direct : import { sumAmounts, filterTxPure, ... } from "./metrics"
/** Somme les montants d'un tableau de transactions. */
export function sumAmounts(txs: Transaction[]): number {
    let sum = 0;
    for (const t of txs)
        sum += t.amount;
    return sum;
}
/**
 * Filtre un index YYYY-MM → Transaction[] dans [startKey, endKey).
 * Pas de `new Date()` — compare uniquement des strings "YYYY-MM".
 */
export function filterTxPure(index: ReadonlyMap<string, Transaction[]>, startKey: string, endKey: string, type?: "income" | "expense", status = "completed"): Transaction[] {
    const result: Transaction[] = [];
    for (const [key, txs] of index) {
        if (key < startKey || key >= endKey)
            continue;
        for (const t of txs) {
            if (t.payment_status === status && (type === undefined || t.type === type)) {
                result.push(t);
            }
        }
    }
    return result;
}
export function getMonthStart(ref: Date, monthsAgo = 0): Date {
    return new Date(Date.UTC(ref.getFullYear(), ref.getMonth() - monthsAgo, 1));
}
export function computeCashBalance(txs: Transaction[]): number {
    let cash = 0;
    for (const t of txs) {
        if (t.payment_status !== "completed")
            continue;
        cash += t.type === "income" ? t.amount : -t.amount;
    }
    return cash;
}
export function computeCAC(customers: Customer[], marketingMetrics: MarketingMetrics[], startKey: string, endKey: string): number {
    const newCustomers = customers.filter((c) => c.acquisition_date >= startKey && c.acquisition_date < endKey).length;
    if (newCustomers === 0)
        return 0;
    const spend = marketingMetrics
        .filter((m) => m.period_start && m.period_start.slice(0, 7) >= startKey
            && m.period_start.slice(0, 7) < endKey)
        .reduce((sum, m) => sum + m.spend, 0);
    return spend / newCustomers;
}
export function computeLTV(arpu: number, grossMarginPercent: number, churnRate: number, maxLifetimeMonths = 60): number {
    if (grossMarginPercent <= 0)
        return 0;
    const rawLifetime = churnRate > 0 ? 1 / (churnRate / 100) : Infinity;
    const lifetime = !isFinite(rawLifetime) || isNaN(rawLifetime)
        ? maxLifetimeMonths
        : Math.min(rawLifetime, maxLifetimeMonths);
    return arpu * (grossMarginPercent / 100) * lifetime;
}
export function computeBurnRate(index: ReadonlyMap<string, Transaction[]>, startKey: string, endKey: string, months: number): number {
    const expenses = filterTxPure(index, startKey, endKey, "expense");
    return expenses.length > 0 ? sumAmounts(expenses) / months : 0;
}
