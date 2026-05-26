import type {
    Transaction, Customer, MarketingMetrics,
    Product, Debt, InventoryItem, Receivable, Goal,
} from "@shared/types";
import {
    sumAmounts,
    filterTxPure,
    getMonthStart,
} from "./helpers";
import type { LastMonthData, MetricsDataUpdate, MetricsRuntime } from "./context";
import { metricsDomainMethods } from "./domains";
/** HSP OS — Metrics Calculation Engine */
export class MetricsCalculator {
    /** Cache M-1 invalidé par updateData() */
    _lastMonthCache: LastMonthData | null = null;

    /** Index transactions par clé "YYYY-MM" — reconstruit par buildIndexes() */
    _txByMonthKey: Map<string, Transaction[]> = new Map();
    /** Index clients par id — reconstruit par buildIndexes() */
    _customerById: Map<string, Customer> = new Map();
    /** Index produits par id — reconstruit par buildIndexes() */
    _productById: Map<string, Product> = new Map();

    /**
     * (FIX 3) Date de référence injectable — defaults à `new Date()`.
     * Permet de tester sans être lié à l'horloge système.
     * Aussi exposée pour le cache de monthStart().
     */
    _refDate: Date;
    _monthStartEpoch = "";
    _monthStartCache: Map<number, Date> = new Map();

    /**
     * (FIX 1) Solde cumulatif maintenu en delta.
     * Reconstruit dans buildIndexes() — mis à jour incrémentalement dans updateData().
     */
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
        /** (FIX 3) Injectez une date fixe dans les tests pour éliminer l'horloge système */
        refDate?: Date,
    ) {
        this._refDate = refDate ?? new Date();
        this.buildIndexes();
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /** Reconstruit les index O(1) et le solde cumulatif après changement de données. */
    buildIndexes(): void {
        this._txByMonthKey = new Map();
        // (FIX 1) Recalcul complet du solde cumulatif à la reconstruction
        this._cashBalance = 0;
        for (const t of this.transactions) {
            const key = t.date.slice(0, 7);
            let arr = this._txByMonthKey.get(key);
            if (!arr) { arr = []; this._txByMonthKey.set(key, arr); }
            arr.push(t);
            // Delta immédiat — pas de second passage
            if (t.payment_status === "completed") {
                this._cashBalance += t.type === "income" ? t.amount : -t.amount;
            }
        }
        this._customerById = new Map(this.customers.map(c => [c.id, c]));
        this._productById  = new Map(this.products.map(p => [p.id, p]));
    }

    /**
     * 1er du mois UTC, `monthsAgo` mois en arrière (0 = mois courant).
     * (FIX 3) Utilise this._refDate au lieu de new Date() — mémoïsé par mois calendaire.
     */
    monthStart(monthsAgo = 0): Date {
        const ref = this._refDate;
        const epoch = `${ref.getFullYear()}-${ref.getMonth()}`;
        if (epoch !== this._monthStartEpoch) {
            this._monthStartEpoch = epoch;
            this._monthStartCache = new Map();
        }
        let d = this._monthStartCache.get(monthsAgo);
        if (!d) {
            d = getMonthStart(ref, monthsAgo);
            this._monthStartCache.set(monthsAgo, d);
        }
        return d;
    }

    /**
     * Filtre les transactions dans [start, end) par type et statut.
     * Délègue à filterTxPure() — testable indépendamment.
     */
    filterTx(
        start: Date, end: Date,
        type?: "income" | "expense",
        status = "completed"
    ): Transaction[] {
        return filterTxPure(
            this._txByMonthKey,
            start.toISOString().slice(0, 7),
            end.toISOString().slice(0, 7),
            type,
            status,
        );
    }

    /** Dépenses "Direct Costs" du mois M-1 (partagé par DIO et DPO). */
    getDirectCOGS(): number {
        return sumAmounts(
            this.filterTx(this.monthStart(1), this.monthStart(0), "expense")
                .filter((t) => t.category === "Direct Costs")
        );
    }

        /**
     * Met à jour sélectivement les données.
     * (FIX 1) Si seules les transactions changent, le solde cumulatif est
     * recalculé en delta uniquement sur les nouvelles transactions.
     */
    public updateData(data: MetricsDataUpdate) {
        this._lastMonthCache = null;
        if (data.transactions)     this.transactions     = data.transactions;
        if (data.customers)        this.customers        = data.customers;
        if (data.marketingMetrics) this.marketingMetrics = data.marketingMetrics;
        if (data.products)         this.products         = data.products;
        if (data.debts)            this.debts            = data.debts;
        if (data.receivables)      this.receivables      = data.receivables;
        if (data.inventory)        this.inventory        = data.inventory;
        if (data.goals)            this.goals            = data.goals;
        if (data.refDate)          this._refDate         = data.refDate;
        this.buildIndexes();
    }
}

export interface MetricsCalculator extends MetricsRuntime {}

Object.assign(
    MetricsCalculator.prototype,
    ...metricsDomainMethods,
);
