import type {
    Customer,
    Debt,
    Goal,
    InventoryItem,
    MarketingMetrics,
    Product,
    Receivable,
    Transaction,
} from "@shared/types";

import type { LastMonthData, MetricsDataUpdate, MetricsRuntime } from "./context";
import { metricsDomainMethods } from "./domains";
import { filterTxPure, getMonthStart, sumAmounts } from "./helpers";

export class MetricsCalculator {
    _lastMonthCache: LastMonthData | null = null;
    _txByMonthKey: Map<string, Transaction[]> = new Map();
    _customerById: Map<string, Customer> = new Map();
    _productById: Map<string, Product> = new Map();

    _refDate: Date;
    _monthStartEpoch = "";
    _monthStartCache: Map<number, Date> = new Map();
    _cashBalance = 0;

    constructor(
        public transactions: Transaction[] = [],
        public customers: Customer[] = [],
        public marketingMetrics: MarketingMetrics[] = [],
        public products: Product[] = [],
        public debts: Debt[] = [],
        public receivables: Receivable[] = [],
        public inventory: InventoryItem[] = [],
        public goals: Goal[] = [],
        refDate?: Date,
    ) {
        this._refDate = refDate ?? new Date();
        this.buildIndexes();
    }

    buildIndexes(): void {
        this._txByMonthKey = new Map();
        this._cashBalance = 0;

        for (const transaction of this.transactions) {
            const key = transaction.date.slice(0, 7);
            let monthTransactions = this._txByMonthKey.get(key);

            if (!monthTransactions) {
                monthTransactions = [];
                this._txByMonthKey.set(key, monthTransactions);
            }

            monthTransactions.push(transaction);

            if (transaction.payment_status === "completed") {
                this._cashBalance += transaction.type === "income"
                    ? transaction.amount
                    : -transaction.amount;
            }
        }

        this._customerById = new Map(
            this.customers.map((customer) => [customer.id, customer]),
        );
        this._productById = new Map(
            this.products.map((product) => [product.id, product]),
        );
    }

    monthStart(monthsAgo = 0): Date {
        const ref = this._refDate;
        const epoch = `${ref.getFullYear()}-${ref.getMonth()}`;

        if (epoch !== this._monthStartEpoch) {
            this._monthStartEpoch = epoch;
            this._monthStartCache = new Map();
        }

        let date = this._monthStartCache.get(monthsAgo);

        if (!date) {
            date = getMonthStart(ref, monthsAgo);
            this._monthStartCache.set(monthsAgo, date);
        }

        return date;
    }

    filterTx(
        start: Date,
        end: Date,
        type?: "income" | "expense",
        status = "completed",
    ): Transaction[] {
        return filterTxPure(
            this._txByMonthKey,
            start.toISOString().slice(0, 7),
            end.toISOString().slice(0, 7),
            type,
            status,
        );
    }

    getDirectCOGS(): number {
        const directCosts = this.filterTx(
            this.monthStart(1),
            this.monthStart(0),
            "expense",
        ).filter((transaction) => transaction.category === "Direct Costs");

        return sumAmounts(directCosts);
    }

    public updateData(data: MetricsDataUpdate) {
        this._lastMonthCache = null;

        if (data.transactions) {
            this.transactions = data.transactions;
        }
        if (data.customers) {
            this.customers = data.customers;
        }
        if (data.marketingMetrics) {
            this.marketingMetrics = data.marketingMetrics;
        }
        if (data.products) {
            this.products = data.products;
        }
        if (data.debts) {
            this.debts = data.debts;
        }
        if (data.receivables) {
            this.receivables = data.receivables;
        }
        if (data.inventory) {
            this.inventory = data.inventory;
        }
        if (data.goals) {
            this.goals = data.goals;
        }
        if (data.refDate) {
            this._refDate = data.refDate;
        }

        this.buildIndexes();
    }
}

export interface MetricsCalculator extends MetricsRuntime {}

Object.assign(
    MetricsCalculator.prototype,
    ...metricsDomainMethods,
);
