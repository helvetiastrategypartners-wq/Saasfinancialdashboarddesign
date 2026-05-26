import type { Transaction, Customer, MarketingMetrics } from "@shared/types";

// ── PURE HELPERS (FIX 2) ─────────────────────────────────────────────────────
// Extraits de la classe pour être unit-testables sans instancier MetricsCalculator.
// Import direct : import { sumAmounts, filterTxPure, ... } from "./metrics"

/** Somme les montants d'un tableau de transactions. */
export function sumAmounts(txs: Transaction[]): number {
    let sum = 0;
    for (const t of txs) sum += t.amount;
    return sum;
}

/**
 * Filtre un index YYYY-MM → Transaction[] dans [startKey, endKey).
 * Pas de `new Date()` — compare uniquement des strings "YYYY-MM".
 */
export function filterTxPure(
    index: ReadonlyMap<string, Transaction[]>,
    startKey: string,
    endKey: string,
    type?: "income" | "expense",
    status = "completed",
): Transaction[] {
    const result: Transaction[] = [];
    for (const [key, txs] of index) {
        if (key < startKey || key >= endKey) continue;
        for (const t of txs) {
            if (t.payment_status === status && (type === undefined || t.type === type)) {
                result.push(t);
            }
        }
    }
    return result;
}

/**
 * Calcule le 1er du mois UTC `monthsAgo` en arrière depuis une date de référence.
 * (FIX 3) La date de référence est injectée — plus de `new Date()` implicite.
 */
export function getMonthStart(ref: Date, monthsAgo = 0): Date {
    return new Date(Date.UTC(ref.getFullYear(), ref.getMonth() - monthsAgo, 1));
}

/**
 * Calcul du solde de trésorerie cumulé sur toutes les transactions complètes.
 * (FIX 1) Séparé en helper pur pour être utilisé à la fois dans calculateCash()
 * et dans updateData() pour maintenir un delta incrémental.
 */
export function computeCashBalance(txs: Transaction[]): number {
    let cash = 0;
    for (const t of txs) {
        if (t.payment_status !== "completed") continue;
        cash += t.type === "income" ? t.amount : -t.amount;
    }
    return cash;
}

/**
 * Calcule CAC : spend marketing / nouveaux clients sur [startKey, endKey).
 * (FIX 2) Extrait pour unit tests directs.
 */
export function computeCAC(
    customers: Customer[],
    marketingMetrics: MarketingMetrics[],
    startKey: string,
    endKey: string,
): number {
    const newCustomers = customers.filter(
        (c) => c.acquisition_date >= startKey && c.acquisition_date < endKey
    ).length;
    if (newCustomers === 0) return 0;
    const spend = marketingMetrics
        .filter((m) => m.period_start && m.period_start.slice(0, 7) >= startKey
                                      && m.period_start.slice(0, 7) < endKey)
        .reduce((sum, m) => sum + m.spend, 0);
    return spend / newCustomers;
}

/**
 * Calcule LTV : ARPU × marge brute × durée de vie.
 * (FIX 2) Plafond externalisé via `maxLifetimeMonths` — plus de magic number 60.
 */
export function computeLTV(
    arpu: number,
    grossMarginPercent: number,
    churnRate: number,
    maxLifetimeMonths = 60,   // FIX : configurable, pas hardcodé
): number {
    if (grossMarginPercent <= 0) return 0;
    const rawLifetime = churnRate > 0 ? 1 / (churnRate / 100) : Infinity;
    const lifetime = !isFinite(rawLifetime) || isNaN(rawLifetime)
        ? maxLifetimeMonths
        : Math.min(rawLifetime, maxLifetimeMonths);
    return arpu * (grossMarginPercent / 100) * lifetime;
}

/**
 * Calcule le burn rate : moyenne des dépenses sur N mois complets.
 * (FIX 2) Extrait pour unit tests directs.
 */
export function computeBurnRate(
    index: ReadonlyMap<string, Transaction[]>,
    startKey: string,
    endKey: string,
    months: number,
): number {
    const expenses = filterTxPure(index, startKey, endKey, "expense");
    return expenses.length > 0 ? sumAmounts(expenses) / months : 0;
}
