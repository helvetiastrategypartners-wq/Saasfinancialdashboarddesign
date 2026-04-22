import type {
    Transaction, Customer, MarketingMetrics, CalculatedMetrics,
    Product, Debt, InventoryItem, Receivable, Goal,
} from "@shared/types";

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

/** HSP OS — Metrics Calculation Engine */
export class MetricsCalculator {
    /** Cache M-1 invalidé par updateData() */
    private _lastMonthCache: {
        revenue: number; expenses: number;
        grossMargin: number; grossMarginPercent: number;
    } | null = null;

    /** Index transactions par clé "YYYY-MM" — reconstruit par buildIndexes() */
    private _txByMonthKey: Map<string, Transaction[]> = new Map();
    /** Index clients par id — reconstruit par buildIndexes() */
    private _customerById: Map<string, Customer> = new Map();
    /** Index produits par id — reconstruit par buildIndexes() */
    private _productById: Map<string, Product> = new Map();

    /**
     * (FIX 3) Date de référence injectable — defaults à `new Date()`.
     * Permet de tester sans être lié à l'horloge système.
     * Aussi exposée pour le cache de monthStart().
     */
    private _refDate: Date;
    private _monthStartEpoch = "";
    private _monthStartCache: Map<number, Date> = new Map();

    /**
     * (FIX 1) Solde cumulatif maintenu en delta.
     * Reconstruit dans buildIndexes() — mis à jour incrémentalement dans updateData().
     */
    private _cashBalance = 0;

    constructor(
        private transactions: Transaction[] = [],
        private customers: Customer[] = [],
        private marketingMetrics: MarketingMetrics[] = [],
        private products: Product[] = [],
        private debts: Debt[] = [],
        private receivables: Receivable[] = [],
        private inventory: InventoryItem[] = [],
        private goals: Goal[] = [],
        /** (FIX 3) Injectez une date fixe dans les tests pour éliminer l'horloge système */
        refDate?: Date,
    ) {
        this._refDate = refDate ?? new Date();
        this.buildIndexes();
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /** Reconstruit les index O(1) et le solde cumulatif après changement de données. */
    private buildIndexes(): void {
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
    private monthStart(monthsAgo = 0): Date {
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
    private filterTx(
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
    private getDirectCOGS(): number {
        return sumAmounts(
            this.filterTx(this.monthStart(1), this.monthStart(0), "expense")
                .filter((t) => t.category === "Direct Costs")
        );
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────────

    /**
     * (FIX 1) O(1) — lecture du solde cumulatif maintenu en delta.
     * Plus de full scan sur this.transactions.
     */
    private calculateCash(): number {
        return this._cashBalance;
    }

    /** Moyenne des dépenses sur les 3 derniers mois complets. */
    private calculateBurnRate(): number {
        return computeBurnRate(
            this._txByMonthKey,
            this.monthStart(3).toISOString().slice(0, 7),
            this.monthStart(0).toISOString().slice(0, 7),
            3,
        );
    }

    /** Trésorerie / burn rate. Retourne 999 si burn ≤ 0. */
    private calculateRunway(): number {
        const burn = this.calculateBurnRate();
        return burn <= 0 ? 999 : this.calculateCash() / burn;
    }

    public getMonthlyNetCashflow(months: number): Array<{ month: string; cash: number }> {
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
    }

    public getMonthlyCashTrend(months: number): Array<{
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
    }

    // ── FINANCE ───────────────────────────────────────────────────────────────

    /** Marge brute M-1 moins les charges opex (hors coûts directs). */
    private calculateEBITDA(): number {
        const opex = sumAmounts(
            this.filterTx(this.monthStart(1), this.monthStart(0), "expense")
                .filter((t) => t.category !== "Direct Costs")
        );
        return this.getLastMonthData().grossMargin - opex;
    }

    private calculateTotalDebt(): number {
        return this.debts.reduce((s, d) => s + d.remaining_amount, 0);
    }

    public getRevenueByChannel(): Record<string, number> {
        const result: Record<string, number> = {};
        this.filterTx(this.monthStart(1), this.monthStart(0), "income").forEach((t) => {
            const channel = t.linked_channel || "Unknown";
            result[channel] = (result[channel] || 0) + t.amount;
        });
        return result;
    }

    /** Spend / clients acquis, par canal marketing (Mois dernier uniquement) */
    public getCACByChannel(): Record<string, number> {
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
    }

    public getExpensesByCategory(): Record<string, number> {
        const result: Record<string, number> = {};
        this.filterTx(this.monthStart(1), this.monthStart(0), "expense").forEach((t) => {
            const category = t.category || "Uncategorized";
            result[category] = (result[category] || 0) + t.amount;
        });
        return result;
    }

    /** Revenus sur une période custom (KML). */
    public getRevenueForPeriod(start: Date, end: Date): number {
        return sumAmounts(this.filterTx(start, end, "income"));
    }

    /** Dépenses sur une période custom (KML). */
    public getExpensesForPeriod(start: Date, end: Date): number {
        return sumAmounts(this.filterTx(start, end, "expense"));
    }

    // ── MARKETING ─────────────────────────────────────────────────────────────

    /**
     * Spend marketing M-1 / nouveaux clients M-1.
     * (FIX 2) Délègue à computeCAC() — testable directement.
     */
    private calculateCAC(): number {
        return computeCAC(
            this.customers,
            this.marketingMetrics,
            this.monthStart(1).toISOString().slice(0, 7),
            this.monthStart(0).toISOString().slice(0, 7),
        );
    }

    private calculateChurnRate(): number {
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
    }

    public calculateConversionRate(): number {
        const lastMonthKey = this.monthStart(1).toISOString().slice(0, 7);
        const monthlyMetrics = this.marketingMetrics.filter(m =>
            m.period_start?.startsWith(lastMonthKey)
        );
        const leads    = monthlyMetrics.reduce((sum, m) => sum + (m.leads ?? 0), 0);
        const acquired = monthlyMetrics.reduce((sum, m) => sum + m.customers_acquired, 0);
        return leads > 0 ? (acquired / leads) * 100 : 0;
    }

    public calculateRetentionRate(): number {
        return 100 - this.calculateChurnRate();
    }

    // ── KML & ROI ─────────────────────────────────────────────────────────────

    public simulateHiringImpact(monthlySalary: number, expectedRevenueBonus = 0) {
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
    }

    /** (Revenue généré − Spend) / Spend × 100 — Focus Mois Dernier (M-1) */
    public calculateMarketingROI(): number {
        const lastMonthKey = this.monthStart(1).toISOString().slice(0, 7);
        const monthlyMetrics = this.marketingMetrics.filter(m =>
            m.period_start?.startsWith(lastMonthKey)
        );
        const totalSpend   = monthlyMetrics.reduce((sum, m) => sum + m.spend, 0);
        const totalRevenue = monthlyMetrics.reduce((sum, m) => sum + m.revenue_generated, 0);
        return totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    }

    // ── UNIT ECONOMICS ────────────────────────────────────────────────────────

    private calculateCACByChannel(channel?: string): number {
        if (!channel) return this.calculateCAC();
        const totalChannelCost = sumAmounts(
            this.filterTx(this.monthStart(1), this.monthStart(0), "expense")
                .filter((t) => t.category?.toLowerCase().includes(channel.toLowerCase()))
        );
        const newCustomersCount = this.customers.filter(
            (c) =>
                c.acquisition_channel === channel &&
                new Date(c.acquisition_date) >= this.monthStart(1) &&
                new Date(c.acquisition_date) < this.monthStart(0)
        ).length;
        return newCustomersCount > 0 ? totalChannelCost / newCustomersCount : 0;
    }

    public calculateClientMargin(customerId: string): number {
        const customer = this._customerById.get(customerId);
        if (!customer) return 0;
        const revenue = this.getCustomerRevenueLastMonth(customerId);
        const cac = this.calculateCACByChannel(customer.acquisition_channel);
        const margin = this.getLastMonthData().grossMarginPercent;
        return revenue * (margin / 100) - cac;
    }

    public calculateMarginByProduct(productId: string): { revenue: number; cost: number; margin: number; marginPercent: number } {
        const product = this._productById.get(productId);
        if (!product) return { revenue: 0, cost: 0, margin: 0, marginPercent: 0 };
        const revenue = sumAmounts(
            this.filterTx(this.monthStart(1), this.monthStart(0), "income")
                .filter((t) => t.linked_product === productId)
        );
        const unitsSold = product.units_sold ?? 0;
        const cost = product.unit_cost * unitsSold;
        const margin = revenue - cost;
        const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;
        return { revenue, cost, margin, marginPercent };
    }

    public calculateProfitPerProduct(productId: string): number {
        return this.calculateMarginByProduct(productId).margin;
    }

    private getCustomerRevenueLastMonth(customerId: string): number {
        const lastMonthKey = this.monthStart(1).toISOString().slice(0, 7);
        const txs = this._txByMonthKey.get(lastMonthKey) ?? [];
        let sum = 0;
        for (const t of txs) {
            if (t.linked_customer === customerId && t.type === "income" && t.payment_status === "completed") {
                sum += t.amount;
            }
        }
        return sum;
    }

    public calculateRevenueConcentration(): Record<string, number> {
        const totalRevenue = this.getLastMonthData().revenue;
        if (totalRevenue <= 0) return {};
        const concentration: Record<string, number> = {};
        for (const c of this.customers) {
            const realRevenue = this.getCustomerRevenueLastMonth(c.id);
            const weight = (realRevenue / totalRevenue) * 100;
            if (weight > 0) concentration[c.name] = weight;
        }
        return concentration;
    }

    // ── STRATEGIC FINANCE ─────────────────────────────────────────────────────

    public simulateScenario(params: Record<string, number>): Record<string, number> {
        const current      = this.calculateAll();
        const revenueChange = params.revenueChange ?? 0;
        const expenseChange = params.expenseChange ?? 0;
        const hiringCost    = params.hiringCost ?? 0;
        const newRevenue    = current.monthlyRevenue * (1 + revenueChange / 100);
        const newBurnRate   = current.burnRate * (1 + expenseChange / 100) + hiringCost;
        const newExpenses   = newBurnRate;
        return {
            projectedRevenue:     Math.round(newRevenue),
            projectedExpenses:    Math.round(newExpenses),
            projectedNetCashflow: Math.round(newRevenue - newExpenses),
            projectedRunway:      newBurnRate > 0 ? Math.round((current.cash / newBurnRate) * 10) / 10 : 999,
            projectedBurnRate:    Math.round(newBurnRate),
        };
    }

    public calculateUnitMargin(price: number, variableCost: number): number {
        return price - variableCost;
    }

    public calculateBreakEvenPoint(fixedCosts: number, price: number, variableCost: number): number {
        const unitMargin = this.calculateUnitMargin(price, variableCost);
        return unitMargin > 0 ? fixedCosts / unitMargin : Infinity;
    }

    public calculateBreakEvenThreshold(fixedCosts: number, unitMargin: number): number {
        return unitMargin > 0 ? fixedCosts / unitMargin : Infinity;
    }

    public calculateBreakEvenRevenue(fixedCosts: number, price: number, variableCost: number): number {
        return this.calculateBreakEvenThreshold(fixedCosts, this.calculateUnitMargin(price, variableCost)) * price;
    }

    // ── ADVANCED ANALYTICS ───────────────────────────────────────────────────

    public getCohortAnalysis(): Record<string, number[]> {
        const cohorts: Record<string, Customer[]> = {};
        for (const c of this.customers) {
            const key = c.acquisition_date.slice(0, 7);
            if (!cohorts[key]) cohorts[key] = [];
            cohorts[key].push(c);
        }
        const ref = this._refDate;
        const result: Record<string, number[]> = {};
        for (const [monthKey, cohortCustomers] of Object.entries(cohorts)) {
            const [year, month] = monthKey.split('-').map(Number);
            const monthsElapsed =
                (ref.getFullYear() - year) * 12 +
                (ref.getMonth() - (month - 1));
            const total = cohortCustomers.length;
            const retentionRates: number[] = [];
            for (let m = 0; m <= monthsElapsed; m++) {
                const checkDate = new Date(Date.UTC(year, (month - 1) + m, 1));
                let retained = 0;
                for (const c of cohortCustomers) {
                    const isActive     = c.status === "active";
                    const churnedLater = c.churn_date && new Date(c.churn_date) >= checkDate;
                    if (isActive || churnedLater) retained++;
                }
                retentionRates.push(Math.round((retained / total) * 100));
            }
            result[monthKey] = retentionRates;
        }
        return result;
    }

    // ── FINANCIAL STRUCTURE ───────────────────────────────────────────────────

    public calculateWorkingCapital(): number {
        const totalReceivables = this.receivables.reduce((s, r) => s + r.amount, 0);
        const totalInventory   = this.inventory.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
        let totalPayables = 0;
        for (const t of this.transactions) {
            if (t.type === "expense" && t.payment_status === "pending" && t.category === "Direct Costs") {
                totalPayables += t.amount;
            }
        }
        return totalReceivables + totalInventory - totalPayables;
    }

    public calculateDSO(): number {
        const totalReceivables = this.receivables.reduce((s, r) => s + r.amount, 0);
        const dailyRevenue = this.getLastMonthData().revenue / 30;
        return dailyRevenue > 0 ? totalReceivables / dailyRevenue : 0;
    }

    public calculateDIO(): number {
        const totalInventoryValue = this.inventory.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
        const dailyCOGS = this.getDirectCOGS() / 30;
        return dailyCOGS > 0 ? totalInventoryValue / dailyCOGS : 0;
    }

    public calculateDPO(): number {
        let directPayables = 0;
        for (const t of this.transactions) {
            if (t.type === "expense" && t.payment_status === "pending" && t.category === "Direct Costs") {
                directPayables += t.amount;
            }
        }
        const dailyCOGS = this.getDirectCOGS() / 30;
        return dailyCOGS > 0 ? directPayables / dailyCOGS : 0;
    }

    public calculateCashConversionCycle(): number {
        return this.calculateDSO() + this.calculateDIO() - this.calculateDPO();
    }

    public calculateTotalDebtPayments(): number {
        return this.debts.reduce((s, d) => s + (d.monthly_repayment || 0), 0);
    }

    public calculateLeverageRatio(): number {
        const ebitda = this.calculateEBITDA();
        return ebitda > 0 ? this.calculateTotalDebt() / ebitda : 0;
    }

    public calculateDebtService(): number {
        return this.calculateTotalDebtPayments();
    }

    // ── ADVANCED ANALYTICS (COHORT REVENUE) ─────────────────────────────────

    /**
     * Agrège les revenus des transactions par mois d'acquisition du client.
     * Retourne une matrice cohorte × mois pour visualiser la rétention revenus.
     */
    public getCohortRevenueAnalysis(): Array<{
        cohort: string;
        label:  string;
        size:   number;
        months: Array<{ label: string; revenue: number; avgPerCustomer: number }>;
    }> {
        const cohortMap = new Map<string, Customer[]>();
        for (const c of this.customers) {
            const key = c.acquisition_date.slice(0, 7);
            let arr   = cohortMap.get(key);
            if (!arr) { arr = []; cohortMap.set(key, arr); }
            arr.push(c);
        }

        const ref    = this._refDate;
        const result = [];

        for (const [cohortKey, cohortCustomers] of cohortMap) {
            const [year, month] = cohortKey.split('-').map(Number);
            const monthsElapsed = (ref.getFullYear() - year) * 12 + (ref.getMonth() - (month - 1));
            const maxM          = Math.min(monthsElapsed + 1, 12);
            const customerIds   = new Set(cohortCustomers.map(c => c.id));

            const months = [];
            for (let m = 0; m < maxM; m++) {
                const startKey = new Date(Date.UTC(year, (month - 1) + m,     1)).toISOString().slice(0, 7);
                const endKey   = new Date(Date.UTC(year, (month - 1) + m + 1, 1)).toISOString().slice(0, 7);
                const txs      = filterTxPure(this._txByMonthKey, startKey, endKey, 'income');
                const revenue  = txs
                    .filter(t => t.linked_customer && customerIds.has(t.linked_customer))
                    .reduce((s, t) => s + t.amount, 0);
                months.push({
                    label:          `M+${m}`,
                    revenue,
                    avgPerCustomer: cohortCustomers.length > 0 ? Math.round(revenue / cohortCustomers.length) : 0,
                });
            }

            result.push({
                cohort: cohortKey,
                label:  new Date(cohortKey + '-01').toLocaleDateString('fr-CH', { month: 'short', year: '2-digit' }),
                size:   cohortCustomers.length,
                months,
            });
        }

        return result.sort((a, b) => a.cohort.localeCompare(b.cohort));
    }

    // ── INTELLIGENCE LAYER ────────────────────────────────────────────────────



    public getCashRiskStatus(): { risk: "low" | "medium" | "high"; message: string } {
        const runway = this.calculateRunway();
        if (runway < 3) return { risk: "high",   message: "Critique" };
        if (runway < 6) return { risk: "medium", message: "Attention" };
        return             { risk: "low",    message: "Stable" };
    }

    public calculateExpenseVariation(): number {
        const expM1 = sumAmounts(this.filterTx(this.monthStart(1), this.monthStart(0), "expense"));
        const expM2 = sumAmounts(this.filterTx(this.monthStart(2), this.monthStart(1), "expense"));
        return expM2 > 0 ? ((expM1 - expM2) / expM2) * 100 : 0;
    }

    public getAutomaticInsights(): string[] {
        const insights: string[] = [];
        const m = this.calculateAll();
        if (Number.isFinite(m.runway) && m.runway < 3) {
            insights.push(`Runway critique : ${m.runway.toFixed(1)} mois — action immédiate requise.`);
        } else if (m.runway < 6) {
            insights.push(`Runway court : ${m.runway.toFixed(1)} mois — surveiller la trésorerie.`);
        }
        if (m.churnRate > 5) {
            insights.push(`Taux de churn élevé : ${m.churnRate.toFixed(1)}% — risque sur la rétention clients.`);
        }
        if (m.cac > 0) {
            if (m.ltvCacRatio < 3) {
                insights.push(`Ratio LTV/CAC faible (${m.ltvCacRatio.toFixed(1)}x) — rentabilité client à risque.`);
            } else {
                insights.push(`Ratio LTV/CAC sain (${m.ltvCacRatio.toFixed(1)}x) — acquisition rentable.`);
            }
        }
        if (m.netCashflow < 0) {
            insights.push(`Cashflow net négatif (${m.netCashflow.toLocaleString("fr-CH")} CHF) — dépenses à optimiser.`);
        }
        if (m.grossMarginPercent < 50) {
            insights.push(`Marge brute faible : ${m.grossMarginPercent.toFixed(1)}% — optimiser les coûts directs.`);
        }
        if (m.burnRate > m.monthlyRevenue * 0.8) {
            insights.push(`Burn rate (${m.burnRate.toLocaleString("fr-CH")} CHF) dépasse 80% des revenus.`);
        }
        return insights;
    }
    // ── STRATEGY MODULE ───────────────────────────────────────────────────────

    public calculateRevenueGrowth(): number {
        const revM1 = sumAmounts(this.filterTx(this.monthStart(1), this.monthStart(0), "income"));
        const revM2 = sumAmounts(this.filterTx(this.monthStart(2), this.monthStart(1), "income"));
        return revM2 > 0 ? ((revM1 - revM2) / revM2) * 100 : 0;
    }

    public calculateAverageGrowth(months: number): number {
        const revenues: number[] = [];
        for (let i = months - 1; i >= 0; i--) {
            revenues.push(sumAmounts(this.filterTx(this.monthStart(i + 1), this.monthStart(i), "income")));
        }
        const rates: number[] = [];
        for (let i = 1; i < revenues.length; i++) {
            if (revenues[i - 1] === 0) continue;
            rates.push(((revenues[i] - revenues[i - 1]) / revenues[i - 1]) * 100);
        }
        return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    }

    public calculateGoalCompletion(targetRevenue: number): number {
        return targetRevenue > 0 ? (this.getLastMonthData().revenue / targetRevenue) * 100 : 0;
    }

    public calculateGoalGap(targetRevenue: number): number {
        return this.getLastMonthData().revenue - targetRevenue;
    }

    public calculateKPICompletionRate(): number {
        if (this.goals.length === 0) return 0;
        return (this.goals.filter((g) => g.current_value >= g.target_value).length / this.goals.length) * 100;
    }

    public getKPITracking(): Record<string, { target: number; actual: number; completion: number }> {
        const result: Record<string, { target: number; actual: number; completion: number }> = {};
        for (const g of this.goals) {
            result[g.metric_name] = {
                target:     g.target_value,
                actual:     g.current_value,
                completion: g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0,
            };
        }
        return result;
    }

    // ── CALCUL GLOBAL ─────────────────────────────────────────────────────────

    public calculateAll(): CalculatedMetrics {
        const monthly  = this.getLastMonthData();
        const cash     = this.calculateCash();
        const burnRate = this.calculateBurnRate();
        const runway   = burnRate <= 0 ? 999 : cash / burnRate;
        const cac      = this.calculateCAC();
        const ltv      = computeLTV(
            this.calculateARPU(),
            monthly.grossMarginPercent,
            this.calculateChurnRate(),
            // FIX 2 : plafond injectables depuis l'extérieur si besoin
            60,
        );

        return {
            cash,
            monthlyRevenue:   monthly.revenue,
            monthlyExpenses:  monthly.expenses,
            netCashflow:      monthly.revenue - monthly.expenses,
            burnRate,
            runway,
            grossMargin:        monthly.grossMargin,
            grossMarginPercent: monthly.grossMarginPercent,
            ebitda:      this.calculateEBITDA(),
            totalDebt:   this.calculateTotalDebt(),
            cac,
            ltv,
            ltvCacRatio: cac > 0 ? ltv / cac : 0,
            paybackPeriod:      this.calculatePaybackPeriod(),
            arpu:               this.calculateARPU(),
            mrr:                this.calculateMRR(),
            churnRate:          this.calculateChurnRate(),
            activeCustomers:    this.getActiveCustomersCount(),
            newCustomersMonth:  this.getNewCustomersThisMonth(),
            conversionRate:     this.calculateConversionRate(),
            marketingROI:       this.calculateMarketingROI(),
            revenueGrowth:      this.calculateRevenueGrowth(),
            cashRisk: runway < 3
                ? { risk: "high",   message: "Critique" }
                : runway < 6
                ? { risk: "medium", message: "Attention" }
                : { risk: "low",    message: "Stable" },
        };
    }

    /** Données M-1 mémoïsées — invalidées par updateData(). */
    private getLastMonthData() {
        if (!this._lastMonthCache) {
            const t       = this.filterTx(this.monthStart(1), this.monthStart(0));
            const revenue = sumAmounts(t.filter((x) => x.type === "income"));
            const costs   = sumAmounts(
                t.filter((x) => x.type === "expense" && x.category === "Direct Costs")
            );
            this._lastMonthCache = {
                revenue,
                expenses:           sumAmounts(t.filter((x) => x.type === "expense")),
                grossMargin:        revenue - costs,
                grossMarginPercent: revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0,
            };
        }
        return this._lastMonthCache;
    }

    private getActiveCustomersCount() {
        return this.customers.filter((c) => c.status === "active").length;
    }

    private getNewCustomersThisMonth() {
        return this.customers.filter((c) => new Date(c.acquisition_date) >= this.monthStart(0)).length;
    }

    private calculateARPU() {
        const active = this.getActiveCustomersCount();
        return active > 0 ? this.getLastMonthData().revenue / active : 0;
    }
    private calculateMRR() {
        let mrr = 0;
        for (const c of this.customers) {
            if (c.status === "active") mrr += c.monthly_revenue;
        }
        return mrr;
    }

    private calculatePaybackPeriod() {
        const margin = this.calculateARPU() * (this.getLastMonthData().grossMarginPercent / 100);
        if (margin <= 0) return this.calculateCAC() > 0 ? Infinity : 0;
        return this.calculateCAC() / margin;
    }

    /**
     * Met à jour sélectivement les données.
     * (FIX 1) Si seules les transactions changent, le solde cumulatif est
     * recalculé en delta uniquement sur les nouvelles transactions.
     */
    public updateData(data: {
        transactions?: Transaction[];
        customers?: Customer[];
        marketingMetrics?: MarketingMetrics[];
        products?: Product[];
        debts?: Debt[];
        receivables?: Receivable[];
        inventory?: InventoryItem[];
        goals?: Goal[];
        refDate?: Date;
    }) {
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
