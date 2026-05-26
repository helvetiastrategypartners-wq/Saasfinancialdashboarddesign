import type { Customer, MarketingMetrics, Transaction } from "@shared/types";

export function sumAmounts(txs: Transaction[]): number {
    let sum = 0;
    for (const transaction of txs) {
        sum += transaction.amount;
    }
    return sum;
}

export function filterTxPure(
    index: ReadonlyMap<string, Transaction[]>,
    startKey: string,
    endKey: string,
    type?: "income" | "expense",
    status = "completed",
): Transaction[] {
    const result: Transaction[] = [];
    for (const [key, txs] of index) {
        if (key < startKey || key >= endKey) {
            continue;
        }
        for (const transaction of txs) {
            if (
                transaction.payment_status === status &&
                (type === undefined || transaction.type === type)
            ) {
                result.push(transaction);
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
    for (const transaction of txs) {
        if (transaction.payment_status !== "completed") {
            continue;
        }
        cash += transaction.type === "income"
            ? transaction.amount
            : -transaction.amount;
    }
    return cash;
}

export function computeCAC(
    customers: Customer[],
    marketingMetrics: MarketingMetrics[],
    startKey: string,
    endKey: string,
): number {
    const newCustomers = customers.filter((customer) =>
        customer.acquisition_date >= startKey &&
        customer.acquisition_date < endKey
    ).length;
    if (newCustomers === 0) {
        return 0;
    }
    const spend = marketingMetrics
        .filter((metric) =>
            metric.period_start &&
            metric.period_start.slice(0, 7) >= startKey &&
            metric.period_start.slice(0, 7) < endKey
        )
        .reduce((sum, metric) => sum + metric.spend, 0);
    return spend / newCustomers;
}

export function computeLTV(
    arpu: number,
    grossMarginPercent: number,
    churnRate: number,
    maxLifetimeMonths = 60,
): number {
    if (grossMarginPercent <= 0) {
        return 0;
    }
    const rawLifetime = churnRate > 0 ? 1 / (churnRate / 100) : Infinity;
    const lifetime = !isFinite(rawLifetime) || isNaN(rawLifetime)
        ? maxLifetimeMonths
        : Math.min(rawLifetime, maxLifetimeMonths);
    return arpu * (grossMarginPercent / 100) * lifetime;
}

export function computeBurnRate(
    index: ReadonlyMap<string, Transaction[]>,
    startKey: string,
    endKey: string,
    months: number,
): number {
    const expenses = filterTxPure(index, startKey, endKey, "expense");
    return expenses.length > 0 ? sumAmounts(expenses) / months : 0;
}
