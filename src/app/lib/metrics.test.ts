/**
 * metrics.test.ts — Tests unitaires — coverage 100 %
 *
 * Compatible Vitest / Jest (même API).
 * Lance avec : npx vitest run metrics.test.ts
 */

import { describe, it, expect } from "vitest";
import {
    sumAmounts,
    filterTxPure,
    getMonthStart,
    computeCashBalance,
    computeCAC,
    computeLTV,
    computeBurnRate,
    MetricsCalculator,
} from "./metrics";
import type {
    Transaction, Customer, MarketingMetrics,
    Product, Debt, InventoryItem, Receivable, Goal,
} from "@shared/types";

// ── FIXTURES ──────────────────────────────────────────────────────────────────

const REF_DATE = new Date("2025-03-15T12:00:00Z");

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
    return {
        id: "tx1",
        date: "2025-02-10",
        amount: 1000,
        type: "income",
        payment_status: "completed",
        category: "Sales",
        recurring: false,
        ...overrides,
    } as Transaction;
}

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
    return {
        id: "c1",
        name: "Client A",
        status: "active",
        acquisition_date: "2025-02-05",
        monthly_revenue: 500,
        acquisition_channel: "web",
        ...overrides,
    } as Customer;
}

function makeMktg(overrides: Partial<MarketingMetrics> = {}): MarketingMetrics {
    return {
        id: "m1",
        channel_id: "web",
        period_start: "2025-02-01",
        period_end: "2025-02-28",
        spend: 2000,
        customers_acquired: 4,
        revenue_generated: 5000,
        leads: 40,
        ...overrides,
    } as MarketingMetrics;
}

function makeProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: "p1",
        name: "Produit A",
        unit_cost: 100,
        units_sold: 10,
        ...overrides,
    } as Product;
}

function makeDebt(overrides: Partial<Debt> = {}): Debt {
    return {
        id: "d1",
        label: "Emprunt",
        remaining_amount: 50000,
        monthly_repayment: 1000,
        ...overrides,
    } as Debt;
}

function makeInventory(overrides: Partial<InventoryItem> = {}): InventoryItem {
    return {
        id: "i1",
        name: "Stock A",
        quantity: 10,
        unit_cost: 200,
        ...overrides,
    } as InventoryItem;
}

function makeReceivable(overrides: Partial<Receivable> = {}): Receivable {
    return {
        id: "r1",
        customer_id: "c1",
        amount: 3000,
        due_date: "2025-03-31",
        ...overrides,
    } as Receivable;
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
    return {
        id: "g1",
        metric_name: "Revenue",
        target_value: 10000,
        current_value: 8000,
        ...overrides,
    } as Goal;
}

/** Construit un MetricsCalculator avec REF_DATE et des données minimales. */
function makeCalc(overrides: {
    transactions?: Transaction[];
    customers?: Customer[];
    marketingMetrics?: MarketingMetrics[];
    products?: Product[];
    debts?: Debt[];
    receivables?: Receivable[];
    inventory?: InventoryItem[];
    goals?: Goal[];
    refDate?: Date;
} = {}) {
    return new MetricsCalculator(
        overrides.transactions ?? [],
        overrides.customers    ?? [],
        overrides.marketingMetrics ?? [],
        overrides.products     ?? [],
        overrides.debts        ?? [],
        overrides.receivables  ?? [],
        overrides.inventory    ?? [],
        overrides.goals        ?? [],
        overrides.refDate ?? REF_DATE,
    );
}

// ── PURE HELPERS ──────────────────────────────────────────────────────────────

describe("sumAmounts", () => {
    it("additionne les montants", () => {
        expect(sumAmounts([makeTx({ amount: 100 }), makeTx({ amount: 250 })])).toBe(350);
    });
    it("retourne 0 sur tableau vide", () => {
        expect(sumAmounts([])).toBe(0);
    });
});

describe("filterTxPure", () => {
    const index: Map<string, Transaction[]> = new Map([
        ["2025-01", [makeTx({ date: "2025-01-15", amount: 100 })]],
        ["2025-02", [
            makeTx({ date: "2025-02-10", amount: 200, type: "income" }),
            makeTx({ date: "2025-02-20", amount: 50, type: "expense", payment_status: "pending" }),
        ]],
        ["2025-03", [makeTx({ date: "2025-03-01", amount: 300 })]],
    ]);

    it("filtre correctement par fenêtre temporelle", () => {
        const result = filterTxPure(index, "2025-02", "2025-03");
        expect(result).toHaveLength(1);
        expect(result[0].amount).toBe(200);
    });

    it("exclut la borne endKey", () => {
        const result = filterTxPure(index, "2025-01", "2025-02");
        expect(result).toHaveLength(1);
        expect(result[0].date).toContain("2025-01");
    });

    it("filtre par type expense", () => {
        const result = filterTxPure(index, "2025-01", "2025-04", "expense");
        expect(result).toHaveLength(0); // la seule expense est pending
    });

    it("accepte un status custom (pending)", () => {
        const result = filterTxPure(index, "2025-01", "2025-04", "expense", "pending");
        expect(result).toHaveLength(1);
        expect(result[0].amount).toBe(50);
    });

    it("retourne vide si la clé est hors fenêtre", () => {
        const result = filterTxPure(index, "2025-04", "2025-06");
        expect(result).toHaveLength(0);
    });
});

describe("getMonthStart", () => {
    it("retourne le 1er du mois courant UTC", () => {
        expect(getMonthStart(REF_DATE, 0).toISOString()).toBe("2025-03-01T00:00:00.000Z");
    });

    it("retourne le 1er du mois précédent avec monthsAgo=1", () => {
        expect(getMonthStart(REF_DATE, 1).toISOString()).toBe("2025-02-01T00:00:00.000Z");
    });

    it("gère le passage d'année", () => {
        const jan = new Date("2025-01-15T00:00:00Z");
        expect(getMonthStart(jan, 1).toISOString()).toBe("2024-12-01T00:00:00.000Z");
    });
});

describe("computeCashBalance", () => {
    it("income - expense sur les completed uniquement", () => {
        const txs = [
            makeTx({ type: "income",  amount: 5000, payment_status: "completed" }),
            makeTx({ type: "expense", amount: 2000, payment_status: "completed" }),
            makeTx({ type: "expense", amount: 1000, payment_status: "pending" }),
        ];
        expect(computeCashBalance(txs)).toBe(3000);
    });
});

describe("computeCAC", () => {
    it("calcule spend / nouveaux clients correctement", () => {
        const customers = [makeCustomer({ acquisition_date: "2025-02-10" })];
        const mktg = [makeMktg({ spend: 4000, customers_acquired: 4 })];
        expect(computeCAC(customers, mktg, "2025-02", "2025-03")).toBe(4000);
    });

    it("retourne 0 si aucun nouveau client", () => {
        expect(computeCAC([], [makeMktg()], "2025-02", "2025-03")).toBe(0);
    });
});

describe("computeLTV", () => {
    it("calcule correctement avec churn non nul", () => {
        expect(computeLTV(500, 60, 10)).toBe(3000);
    });

    it("plafonne à maxLifetimeMonths si churn = 0", () => {
        expect(computeLTV(500, 60, 0)).toBe(500 * 0.6 * 60);
    });

    it("respecte un maxLifetimeMonths personnalisé", () => {
        expect(computeLTV(500, 60, 0, 24)).toBe(500 * 0.6 * 24);
    });

    it("retourne 0 si grossMarginPercent ≤ 0", () => {
        expect(computeLTV(500, 0, 5)).toBe(0);
        expect(computeLTV(500, -10, 5)).toBe(0);
    });
});

describe("computeBurnRate", () => {
    const index: Map<string, Transaction[]> = new Map([
        ["2025-01", [makeTx({ type: "expense", amount: 3000 })]],
        ["2025-02", [makeTx({ type: "expense", amount: 6000 })]],
    ]);

    it("calcule la moyenne mensuelle sur 2 mois", () => {
        expect(computeBurnRate(index, "2025-01", "2025-03", 2)).toBe(4500);
    });

    it("retourne 0 si aucune dépense", () => {
        const emptyIndex: Map<string, Transaction[]> = new Map();
        expect(computeBurnRate(emptyIndex, "2025-01", "2025-03", 2)).toBe(0);
    });
});

// ── FIX 1 : calculateCash O(1) via delta ─────────────────────────────────────

describe("MetricsCalculator — calculateCash (FIX 1)", () => {
    it("retourne le solde correct sans full scan", () => {
        const txs: Transaction[] = [
            makeTx({ type: "income",  amount: 10000, payment_status: "completed" }),
            makeTx({ type: "expense", amount: 3000,  payment_status: "completed" }),
            makeTx({ type: "expense", amount: 500,   payment_status: "pending" }),
        ];
        expect(makeCalc({ transactions: txs }).calculateAll().cash).toBe(7000);
    });

    it("met à jour le solde après updateData", () => {
        const txs1: Transaction[] = [makeTx({ type: "income", amount: 5000 })];
        const calc = makeCalc({ transactions: txs1 });
        calc.updateData({
            transactions: [
                ...txs1,
                makeTx({ id: "tx2", type: "expense", amount: 2000, date: "2025-02-15" }),
            ],
        });
        expect(calc.calculateAll().cash).toBe(3000);
    });
});

// ── FIX 3 : date injectable ───────────────────────────────────────────────────

describe("MetricsCalculator — date injectable (FIX 3)", () => {
    it("calcule M-1 depuis la refDate injectée", () => {
        const calc = makeCalc({
            transactions: [
                makeTx({ date: "2025-02-10", type: "income", amount: 8000 }),
                makeTx({ id: "tx_jan", date: "2025-01-05", type: "income", amount: 999 }),
            ],
        });
        expect(calc.calculateAll().monthlyRevenue).toBe(8000);
    });

    it("pivot vers un autre mois via updateData refDate", () => {
        const calc = makeCalc({
            transactions: [
                makeTx({ date: "2025-02-10", type: "income", amount: 8000 }),
                makeTx({ id: "tx_jan", date: "2025-01-05", type: "income", amount: 3000 }),
            ],
        });
        calc.updateData({ refDate: new Date("2025-02-15T00:00:00Z") });
        expect(calc.calculateAll().monthlyRevenue).toBe(3000);
    });
});

// ── getMonthlyNetCashflow ─────────────────────────────────────────────────────

describe("MetricsCalculator.getMonthlyNetCashflow", () => {
    it("retourne le cashflow net par mois", () => {
        const txs = [
            makeTx({ date: "2025-02-10", type: "income",  amount: 5000 }),
            makeTx({ id: "tx2", date: "2025-02-15", type: "expense", amount: 2000 }),
        ];
        const calc = makeCalc({ transactions: txs });
        const result = calc.getMonthlyNetCashflow(2);
        expect(result).toHaveLength(2);
        const feb = result.find(r => r.cash === 3000);
        expect(feb).toBeDefined();
    });

    it("retourne 0 pour les mois sans transactions", () => {
        const calc = makeCalc();
        const result = calc.getMonthlyNetCashflow(1);
        expect(result[0].cash).toBe(0);
    });
});

// ── getMonthlyCashTrend ───────────────────────────────────────────────────────

describe("MetricsCalculator.getMonthlyCashTrend", () => {
    it("calcule variationPercent et cumulativeBalance", () => {
        // ref=mars 2025, months=3 → [jan, fev, mar]
        // jan=1000, fev=2000, mar=0
        const txs = [
            makeTx({ date: "2025-01-10", type: "income", amount: 1000 }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "income", amount: 2000 }),
        ];
        const calc = makeCalc({ transactions: txs });
        const result = calc.getMonthlyCashTrend(3);
        expect(result).toHaveLength(3);
        // Jan (i=0): variationPercent null (premier mois)
        expect(result[0].variationPercent).toBeNull();
        // Feb (i=1): variation = (2000-1000)/1000*100 = 100%
        expect(result[1].variationPercent).toBe(100);
        // cumulativeBalance après fev = 1000+2000 = 3000
        expect(result[1].cumulativeBalance).toBe(3000);
    });

    it("gère prevNetFlow = 0 (variationPercent null)", () => {
        // ref=mars 2025, months=3 → [jan, fev, mar]
        // jan: income=1000, expense=1000 → netFlow=0
        // fev: income=500 → prevNetFlow was 0 → variationPercent=null
        const txs = [
            makeTx({ date: "2025-01-10", type: "income",  amount: 1000 }),
            makeTx({ id: "tx2", date: "2025-01-10", type: "expense", amount: 1000 }),
            makeTx({ id: "tx3", date: "2025-02-10", type: "income", amount: 500 }),
        ];
        const calc = makeCalc({ transactions: txs });
        const result = calc.getMonthlyCashTrend(3);
        // result[1] = fev : prevNetFlow = 0 → variationPercent = null
        expect(result[1].variationPercent).toBeNull();
    });

    it("intègre le solde antérieur à la fenêtre", () => {
        const txs = [
            makeTx({ date: "2024-12-10", type: "income", amount: 500 }),
            makeTx({ id: "tx2", date: "2025-01-10", type: "income", amount: 1000 }),
        ];
        const calc = makeCalc({ transactions: txs });
        const result = calc.getMonthlyCashTrend(1);
        // jan seulement, mais le solde antérieur (500) est inclus
        expect(result[0].cumulativeBalance).toBe(1500);
    });
});

// ── getRevenueByChannel ───────────────────────────────────────────────────────

describe("MetricsCalculator.getRevenueByChannel", () => {
    it("regroupe les revenus par canal", () => {
        const txs = [
            makeTx({ date: "2025-02-10", type: "income", amount: 3000, linked_channel: "web" }),
            makeTx({ id: "tx2", date: "2025-02-15", type: "income", amount: 1000, linked_channel: "web" }),
            makeTx({ id: "tx3", date: "2025-02-20", type: "income", amount: 2000, linked_channel: "social" }),
        ];
        const result = makeCalc({ transactions: txs }).getRevenueByChannel();
        expect(result["web"]).toBe(4000);
        expect(result["social"]).toBe(2000);
    });

    it("utilise 'Unknown' si linked_channel absent", () => {
        const txs = [makeTx({ date: "2025-02-10", type: "income", amount: 500 })];
        const result = makeCalc({ transactions: txs }).getRevenueByChannel();
        expect(result["Unknown"]).toBe(500);
    });
});

// ── getCACByChannel ───────────────────────────────────────────────────────────

describe("MetricsCalculator.getCACByChannel", () => {
    it("calcule le CAC par canal", () => {
        const mktg = [
            makeMktg({ channel_id: "web",    spend: 2000, customers_acquired: 4, period_start: "2025-02-01" }),
            makeMktg({ id: "m2", channel_id: "seo", spend: 1000, customers_acquired: 2, period_start: "2025-02-01" }),
        ];
        const result = makeCalc({ marketingMetrics: mktg }).getCACByChannel();
        expect(result["web"]).toBe(500);
        expect(result["seo"]).toBe(500);
    });

    it("utilise 'Unknown' si channel_id absent", () => {
        const mktg = [makeMktg({ channel_id: undefined, spend: 1000, customers_acquired: 2, period_start: "2025-02-01" })];
        const result = makeCalc({ marketingMetrics: mktg }).getCACByChannel();
        expect(result["Unknown"]).toBe(500);
    });

    it("retourne 0 si aucun client acquis pour ce canal", () => {
        const mktg = [makeMktg({ spend: 1000, customers_acquired: 0, period_start: "2025-02-01" })];
        const result = makeCalc({ marketingMetrics: mktg }).getCACByChannel();
        expect(result["web"]).toBe(0);
    });

    it("ignore les métriques sans period_start", () => {
        const mktg = [makeMktg({ period_start: undefined as any })];
        const result = makeCalc({ marketingMetrics: mktg }).getCACByChannel();
        expect(Object.keys(result)).toHaveLength(0);
    });
});

// ── getExpensesByCategory ─────────────────────────────────────────────────────

describe("MetricsCalculator.getExpensesByCategory", () => {
    it("regroupe les dépenses par catégorie", () => {
        const txs = [
            makeTx({ date: "2025-02-10", type: "expense", amount: 500,  category: "Software" }),
            makeTx({ id: "tx2", date: "2025-02-15", type: "expense", amount: 300, category: "Software" }),
            makeTx({ id: "tx3", date: "2025-02-20", type: "expense", amount: 200, category: "Marketing" }),
        ];
        const result = makeCalc({ transactions: txs }).getExpensesByCategory();
        expect(result["Software"]).toBe(800);
        expect(result["Marketing"]).toBe(200);
    });

    it("utilise 'Uncategorized' si catégorie absente", () => {
        const txs = [makeTx({ date: "2025-02-10", type: "expense", amount: 100, category: undefined as any })];
        const result = makeCalc({ transactions: txs }).getExpensesByCategory();
        expect(result["Uncategorized"]).toBe(100);
    });
});

// ── getRevenueForPeriod / getExpensesForPeriod ────────────────────────────────

describe("MetricsCalculator.getRevenueForPeriod / getExpensesForPeriod", () => {
    it("retourne les revenus sur une période custom", () => {
        const txs = [makeTx({ date: "2025-02-10", type: "income", amount: 4000 })];
        const calc = makeCalc({ transactions: txs });
        const start = new Date("2025-02-01T00:00:00Z");
        const end   = new Date("2025-03-01T00:00:00Z");
        expect(calc.getRevenueForPeriod(start, end)).toBe(4000);
    });

    it("retourne les dépenses sur une période custom", () => {
        const txs = [makeTx({ date: "2025-02-10", type: "expense", amount: 1500 })];
        const calc = makeCalc({ transactions: txs });
        const start = new Date("2025-02-01T00:00:00Z");
        const end   = new Date("2025-03-01T00:00:00Z");
        expect(calc.getExpensesForPeriod(start, end)).toBe(1500);
    });
});

// ── calculateConversionRate / calculateRetentionRate ─────────────────────────

describe("MetricsCalculator.calculateConversionRate", () => {
    it("calcule le taux de conversion leads → clients", () => {
        const mktg = [makeMktg({ period_start: "2025-02-01", leads: 100, customers_acquired: 10 })];
        const calc = makeCalc({ marketingMetrics: mktg });
        expect(calc.calculateConversionRate()).toBe(10);
    });

    it("retourne 0 si aucun lead", () => {
        expect(makeCalc().calculateConversionRate()).toBe(0);
    });

    it("retourne 0 si leads null/undefined", () => {
        const mktg = [makeMktg({ period_start: "2025-02-01", leads: undefined, customers_acquired: 5 })];
        expect(makeCalc({ marketingMetrics: mktg }).calculateConversionRate()).toBe(0);
    });
});

describe("MetricsCalculator.calculateRetentionRate", () => {
    it("retourne 100 - churnRate", () => {
        const customers = [
            makeCustomer({ id: "c1", status: "churned", churn_date: "2025-02-10" }),
            makeCustomer({ id: "c2", status: "active" }),
            makeCustomer({ id: "c3", status: "active" }),
            makeCustomer({ id: "c4", status: "active" }),
        ];
        const calc = makeCalc({ customers });
        const retention = calc.calculateRetentionRate();
        expect(retention).toBeGreaterThan(0);
        expect(retention).toBeLessThanOrEqual(100);
    });

    it("retourne 100 si aucun churn (activeAtStart = 0)", () => {
        expect(makeCalc().calculateRetentionRate()).toBe(100);
    });
});

// ── simulateHiringImpact ──────────────────────────────────────────────────────

describe("MetricsCalculator.simulateHiringImpact", () => {
    it("calcule l'impact sur burn et runway", () => {
        const txs = [
            makeTx({ date: "2024-12-10", type: "expense", amount: 3000 }),
            makeTx({ id: "tx2", date: "2025-01-10", type: "expense", amount: 3000 }),
            makeTx({ id: "tx3", date: "2025-02-10", type: "expense", amount: 3000 }),
        ];
        const calc = makeCalc({ transactions: txs });
        const result = calc.simulateHiringImpact(1000, 500);
        expect(result.impactOnBurn).toBe(1000);
        expect(result.newBurn).toBeCloseTo(4000);
        expect(result.breakEvenMonths).toBe(2);
    });

    it("retourne breakEvenMonths = Infinity si expectedRevenueBonus = 0", () => {
        const result = makeCalc().simulateHiringImpact(1000);
        expect(result.breakEvenMonths).toBe(Infinity);
    });

    it("retourne newRunway = 999 si newBurn ≤ 0", () => {
        // Pas de dépenses → burnRate=0 → newBurn = 0 + 0 = 0
        const result = makeCalc().simulateHiringImpact(0);
        expect(result.newRunway).toBe(999);
    });
});

// ── calculateMarketingROI ─────────────────────────────────────────────────────

describe("MetricsCalculator.calculateMarketingROI", () => {
    it("calcule (revenue - spend) / spend * 100", () => {
        const mktg = [makeMktg({ period_start: "2025-02-01", spend: 1000, revenue_generated: 3000 })];
        expect(makeCalc({ marketingMetrics: mktg }).calculateMarketingROI()).toBe(200);
    });

    it("retourne 0 si totalSpend = 0", () => {
        expect(makeCalc().calculateMarketingROI()).toBe(0);
    });
});

// ── calculateClientMargin ─────────────────────────────────────────────────────

describe("MetricsCalculator.calculateClientMargin", () => {
    it("retourne 0 si le client n'existe pas", () => {
        expect(makeCalc().calculateClientMargin("unknown")).toBe(0);
    });

    it("calcule la marge client avec revenu et CAC (déclenche le filter de calculateCACByChannel)", () => {
        const txs = [
            // revenu lié au client
            makeTx({
                date: "2025-02-10", type: "income", amount: 2000,
                linked_customer: "c1", payment_status: "completed",
            }),
            // dépense dont la catégorie contient le canal → couvre la ligne 474
            makeTx({
                id: "tx2", date: "2025-02-15", type: "expense", amount: 400,
                category: "web ads", payment_status: "completed",
            }),
        ];
        const customers = [makeCustomer({ id: "c1", acquisition_channel: "web" })];
        const calc = makeCalc({ transactions: txs, customers });
        const margin = calc.calculateClientMargin("c1");
        expect(typeof margin).toBe("number");
    });
});

// ── calculateMarginByProduct / calculateProfitPerProduct ─────────────────────

describe("MetricsCalculator.calculateMarginByProduct", () => {
    it("retourne zéros si le produit n'existe pas", () => {
        const result = makeCalc().calculateMarginByProduct("unknown");
        expect(result).toEqual({ revenue: 0, cost: 0, margin: 0, marginPercent: 0 });
    });

    it("calcule la marge correctement", () => {
        const products = [makeProduct({ id: "p1", unit_cost: 100, units_sold: 5 })];
        const txs = [
            makeTx({
                date: "2025-02-10", type: "income", amount: 1000,
                linked_product: "p1",
            }),
        ];
        const calc = makeCalc({ transactions: txs, products });
        const result = calc.calculateMarginByProduct("p1");
        expect(result.revenue).toBe(1000);
        expect(result.cost).toBe(500);
        expect(result.margin).toBe(500);
        expect(result.marginPercent).toBe(50);
    });

    it("marginPercent = 0 si revenue = 0", () => {
        const products = [makeProduct({ id: "p1", unit_cost: 100, units_sold: 5 })];
        const result = makeCalc({ products }).calculateMarginByProduct("p1");
        expect(result.marginPercent).toBe(0);
    });
});

describe("MetricsCalculator.calculateProfitPerProduct", () => {
    it("délègue à calculateMarginByProduct().margin", () => {
        const products = [makeProduct({ id: "p1", unit_cost: 50, units_sold: 10 })];
        const txs = [
            makeTx({ date: "2025-02-10", type: "income", amount: 800, linked_product: "p1" }),
        ];
        const calc = makeCalc({ transactions: txs, products });
        expect(calc.calculateProfitPerProduct("p1")).toBe(calc.calculateMarginByProduct("p1").margin);
    });
});

// ── calculateRevenueConcentration ─────────────────────────────────────────────

describe("MetricsCalculator.calculateRevenueConcentration", () => {
    it("retourne {} si totalRevenue = 0", () => {
        const customers = [makeCustomer({ id: "c1" })];
        expect(makeCalc({ customers }).calculateRevenueConcentration()).toEqual({});
    });

    it("calcule le poids de chaque client", () => {
        const customers = [
            makeCustomer({ id: "c1", name: "A" }),
            makeCustomer({ id: "c2", name: "B" }),
        ];
        const txs = [
            makeTx({ date: "2025-02-10", type: "income", amount: 3000, linked_customer: "c1" }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "income", amount: 1000, linked_customer: "c2" }),
        ];
        const result = makeCalc({ transactions: txs, customers }).calculateRevenueConcentration();
        expect(result["A"]).toBeCloseTo(75);
        expect(result["B"]).toBeCloseTo(25);
    });

    it("n'inclut pas les clients avec revenue = 0", () => {
        const customers = [
            makeCustomer({ id: "c1", name: "A" }),
            makeCustomer({ id: "c2", name: "B" }),
        ];
        const txs = [
            makeTx({ date: "2025-02-10", type: "income", amount: 4000, linked_customer: "c1" }),
        ];
        const result = makeCalc({ transactions: txs, customers }).calculateRevenueConcentration();
        expect(result["B"]).toBeUndefined();
    });
});

// ── simulateScenario ──────────────────────────────────────────────────────────

describe("MetricsCalculator.simulateScenario", () => {
    it("projette revenus, dépenses et runway", () => {
        const txs = [
            makeTx({ date: "2025-02-10", type: "income",  amount: 10000 }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "expense", amount: 4000 }),
        ];
        const calc = makeCalc({ transactions: txs });
        const result = calc.simulateScenario({ revenueChange: 10, expenseChange: 5, hiringCost: 500 });
        expect(result.projectedRevenue).toBeGreaterThan(10000);
        expect(result.projectedExpenses).toBeGreaterThan(0);
        expect(typeof result.projectedRunway).toBe("number");
    });

    it("retourne runway = 999 si newBurnRate = 0", () => {
        const result = makeCalc().simulateScenario({});
        expect(result.projectedRunway).toBe(999);
    });
});

// ── calculateUnitMargin / calculateBreakEvenThreshold / calculateBreakEvenRevenue

describe("MetricsCalculator — break-even", () => {
    it("calculateUnitMargin = price - variableCost", () => {
        expect(makeCalc().calculateUnitMargin(100, 60)).toBe(40);
    });

    it("calculateBreakEvenThreshold = fixedCosts / unitMargin", () => {
        expect(makeCalc().calculateBreakEvenThreshold(4000, 40)).toBe(100);
    });

    it("calculateBreakEvenThreshold retourne Infinity si unitMargin ≤ 0", () => {
        expect(makeCalc().calculateBreakEvenThreshold(4000, 0)).toBe(Infinity);
    });

    it("calculateBreakEvenRevenue = threshold * price", () => {
        expect(makeCalc().calculateBreakEvenRevenue(4000, 100, 60)).toBe(10000);
    });
});

// ── getCohortAnalysis ─────────────────────────────────────────────────────────

describe("MetricsCalculator.getCohortAnalysis", () => {
    it("retourne un tableau de taux de rétention par cohorte", () => {
        const customers = [
            makeCustomer({ id: "c1", acquisition_date: "2025-01-15", status: "active" }),
            makeCustomer({ id: "c2", acquisition_date: "2025-01-20", status: "churned", churn_date: "2025-02-20" }),
        ];
        const result = makeCalc({ customers }).getCohortAnalysis();
        expect(result["2025-01"]).toBeDefined();
        expect(result["2025-01"][0]).toBe(100); // 100% au départ
    });

    it("retourne {} si aucun client", () => {
        expect(makeCalc().getCohortAnalysis()).toEqual({});
    });
});

// ── calculateWorkingCapital / DSO / DIO / DPO / CCC ──────────────────────────

describe("MetricsCalculator — fonds de roulement", () => {
    const txs = [
        makeTx({ date: "2025-02-10", type: "income",  amount: 6000 }),
        makeTx({ id: "tx2", date: "2025-02-15", type: "expense", amount: 1000, payment_status: "pending", category: "Direct Costs" }),
    ];
    const receivables = [makeReceivable({ amount: 3000 })];
    const inventory   = [makeInventory({ quantity: 5, unit_cost: 200 })];

    it("calculateWorkingCapital = receivables + inventory - payables", () => {
        const calc = makeCalc({ transactions: txs, receivables, inventory });
        // 3000 + 1000 - 1000 = 3000
        expect(calc.calculateWorkingCapital()).toBe(3000);
    });

    it("calculateDSO = totalReceivables / (revenue/30)", () => {
        const calc = makeCalc({ transactions: txs, receivables });
        // dailyRevenue = 6000/30 = 200 → 3000/200 = 15
        expect(calc.calculateDSO()).toBe(15);
    });

    it("calculateDSO retourne 0 si revenue = 0", () => {
        expect(makeCalc({ receivables }).calculateDSO()).toBe(0);
    });

    it("calculateDIO retourne 0 si COGS = 0", () => {
        expect(makeCalc({ inventory }).calculateDIO()).toBe(0);
    });

    it("calculateDIO avec COGS > 0", () => {
        const txsDirectCosts = [
            makeTx({ date: "2025-02-10", type: "expense", amount: 3000, category: "Direct Costs" }),
        ];
        const calc = makeCalc({ transactions: txsDirectCosts, inventory });
        // totalInventoryValue = 5*200=1000, dailyCOGS=3000/30=100 → 10
        expect(calc.calculateDIO()).toBe(10);
    });

    it("calculateDPO retourne 0 si COGS = 0", () => {
        expect(makeCalc({ transactions: txs }).calculateDPO()).toBe(0);
    });

    it("calculateDPO avec COGS > 0", () => {
        const txsMixed = [
            makeTx({ date: "2025-02-10", type: "expense", amount: 3000, category: "Direct Costs" }),
            makeTx({ id: "tx2", date: "2025-02-15", type: "expense", amount: 600, payment_status: "pending", category: "Direct Costs" }),
        ];
        const calc = makeCalc({ transactions: txsMixed });
        // dailyCOGS = 3000/30 = 100, directPayables = 600 → 6
        expect(calc.calculateDPO()).toBe(6);
    });

    it("calculateCashConversionCycle = DSO + DIO - DPO", () => {
        const calc = makeCalc({ transactions: txs, receivables, inventory });
        expect(calc.calculateCashConversionCycle()).toBe(
            calc.calculateDSO() + calc.calculateDIO() - calc.calculateDPO()
        );
    });
});

// ── calculateLeverageRatio / calculateDebtService ────────────────────────────

describe("MetricsCalculator — dette", () => {
    it("calculateDebtService = somme des monthly_repayment", () => {
        const debts = [makeDebt({ monthly_repayment: 1000 }), makeDebt({ id: "d2", monthly_repayment: 500 })];
        expect(makeCalc({ debts }).calculateDebtService()).toBe(1500);
    });

    it("calculateLeverageRatio = totalDebt / EBITDA si EBITDA > 0", () => {
        // EBITDA > 0 : besoin revenu > dépenses opex
        const txs = [
            makeTx({ date: "2025-02-10", type: "income",  amount: 10000 }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "expense", amount: 2000, category: "Salaries" }),
        ];
        const debts = [makeDebt({ remaining_amount: 30000 })];
        const calc = makeCalc({ transactions: txs, debts });
        expect(calc.calculateLeverageRatio()).toBeGreaterThan(0);
    });

    it("calculateLeverageRatio retourne 0 si EBITDA ≤ 0", () => {
        expect(makeCalc().calculateLeverageRatio()).toBe(0);
    });
});

// ── getCashRiskStatus ─────────────────────────────────────────────────────────

describe("MetricsCalculator.getCashRiskStatus", () => {
    it("high si runway < 3", () => {
        // cash=100, burn=50 → runway=2
        const txs = [
            makeTx({ type: "income",  amount: 100 }),
            makeTx({ id: "tx2", date: "2024-12-10", type: "expense", amount: 50 }),
            makeTx({ id: "tx3", date: "2025-01-10", type: "expense", amount: 50 }),
            makeTx({ id: "tx4", date: "2025-02-10", type: "expense", amount: 50 }),
        ];
        const calc = makeCalc({ transactions: txs });
        expect(calc.getCashRiskStatus().risk).toBe("high");
    });

    it("medium si 3 ≤ runway < 6", () => {
        // burn=100/mois (300 sur 3 mois), income=850 → cash=850-300=550 → runway=5.5
        const txs = [
            makeTx({ type: "income",  amount: 850 }),
            makeTx({ id: "tx2", date: "2024-12-10", type: "expense", amount: 100 }),
            makeTx({ id: "tx3", date: "2025-01-10", type: "expense", amount: 100 }),
            makeTx({ id: "tx4", date: "2025-02-10", type: "expense", amount: 100 }),
        ];
        const calc = makeCalc({ transactions: txs });
        expect(calc.getCashRiskStatus().risk).toBe("medium");
    });

    it("low si runway ≥ 6", () => {
        // burn=0 → runway=999
        expect(makeCalc().getCashRiskStatus().risk).toBe("low");
    });
});

// ── calculateExpenseVariation ─────────────────────────────────────────────────

describe("MetricsCalculator.calculateExpenseVariation", () => {
    it("calcule la variation des dépenses M-1 vs M-2", () => {
        const txs = [
            makeTx({ date: "2025-01-10", type: "expense", amount: 1000 }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "expense", amount: 1500 }),
        ];
        const calc = makeCalc({ transactions: txs });
        expect(calc.calculateExpenseVariation()).toBe(50);
    });

    it("retourne 0 si M-2 = 0", () => {
        expect(makeCalc().calculateExpenseVariation()).toBe(0);
    });
});

// ── getAutomaticInsights ──────────────────────────────────────────────────────

describe("MetricsCalculator.getAutomaticInsights", () => {
    it("génère des insights pour runway critique (<3)", () => {
        const txs = [
            makeTx({ type: "income", amount: 100 }),
            makeTx({ id: "tx2", date: "2024-12-10", type: "expense", amount: 50 }),
            makeTx({ id: "tx3", date: "2025-01-10", type: "expense", amount: 50 }),
            makeTx({ id: "tx4", date: "2025-02-10", type: "expense", amount: 50 }),
        ];
        const insights = makeCalc({ transactions: txs }).getAutomaticInsights();
        expect(insights.some(i => i.includes("critique"))).toBe(true);
    });

    it("génère un insight pour runway court (3-6)", () => {
        // burn=100/mois, income=850 → cash=550, runway=5.5 (medium)
        const txs = [
            makeTx({ type: "income", amount: 850 }),
            makeTx({ id: "tx2", date: "2024-12-10", type: "expense", amount: 100 }),
            makeTx({ id: "tx3", date: "2025-01-10", type: "expense", amount: 100 }),
            makeTx({ id: "tx4", date: "2025-02-10", type: "expense", amount: 100 }),
        ];
        const insights = makeCalc({ transactions: txs }).getAutomaticInsights();
        expect(insights.some(i => i.includes("court"))).toBe(true);
    });

    it("génère un insight pour churn élevé (>5%)", () => {
        // Forcer un churn élevé : 1 churné sur 2 actifs = 50%
        const customers = [
            makeCustomer({ id: "c1", status: "churned", churn_date: "2025-02-10" }),
            makeCustomer({ id: "c2", status: "active" }),
        ];
        const insights = makeCalc({ customers }).getAutomaticInsights();
        expect(insights.some(i => i.includes("churn"))).toBe(true);
    });

    it("génère un insight LTV/CAC faible si ratio < 3 (branche if)", () => {
        // ltvCacRatio=0 < 3 → "faible"
        const insights = makeCalc().getAutomaticInsights();
        expect(insights.some(i => i.includes("faible"))).toBe(true);
    });

    it("génère un insight LTV/CAC sain si ratio ≥ 3 (branche else — ligne 678)", () => {
        // Pour ltvCacRatio ≥ 3 : besoin cac > 0 et ltv/cac ≥ 3
        // churn=10% → lifetime=10 mois, arpu=500, margin=80% → ltv=4000
        // Un client acquis en fev-2025, marketing spend=500 → cac=500 → ratio=8
        const customers = [makeCustomer({ id: "c1", status: "active", acquisition_date: "2025-02-05", monthly_revenue: 500 })];
        const mktg = [makeMktg({ period_start: "2025-02-01", spend: 500, customers_acquired: 1, revenue_generated: 500 })];
        const txs = [
            makeTx({ date: "2025-02-10", type: "income", amount: 500 }),
            // churn: 1 client churné sur 2 actifs = 50% → ltv bas mais ratio encore ≥ 3
            makeTx({ id: "tx2", date: "2025-02-10", type: "expense", amount: 50, category: "Direct Costs" }),
        ];
        // Construire un cas où ltvCacRatio ≥ 3 :
        // arpu = 500/1 actif = 500, grossMarginPercent = (500-50)/500*100 = 90%
        // churn = 0 (aucun churné en fev) → ltv = 500*0.9*60 = 27000
        // cac = 500/1 = 500 → ratio = 54 ≥ 3 → branche "sain"
        const calc = makeCalc({ transactions: txs, customers, marketingMetrics: mktg });
        const insights = calc.getAutomaticInsights();
        expect(insights.some(i => i.includes("sain"))).toBe(true);
    });

    it("génère un insight cashflow négatif", () => {
        const txs = [
            makeTx({ date: "2025-02-10", type: "expense", amount: 5000 }),
        ];
        const insights = makeCalc({ transactions: txs }).getAutomaticInsights();
        expect(insights.some(i => i.includes("Cashflow"))).toBe(true);
    });

    it("génère un insight marge brute faible (<50%)", () => {
        const txs = [
            makeTx({ date: "2025-02-10", type: "income",  amount: 1000 }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "expense", amount: 600, category: "Direct Costs" }),
        ];
        const insights = makeCalc({ transactions: txs }).getAutomaticInsights();
        expect(insights.some(i => i.includes("Marge brute"))).toBe(true);
    });

    it("génère un insight burn rate > 80% revenus", () => {
        const txs = [
            makeTx({ date: "2025-02-10", type: "income",  amount: 1000 }),
            makeTx({ id: "tx2", date: "2024-12-10", type: "expense", amount: 900 }),
            makeTx({ id: "tx3", date: "2025-01-10", type: "expense", amount: 900 }),
            makeTx({ id: "tx4", date: "2025-02-10", type: "expense", amount: 900 }),
        ];
        const insights = makeCalc({ transactions: txs }).getAutomaticInsights();
        expect(insights.some(i => i.includes("Burn rate"))).toBe(true);
    });
});

// ── calculateRevenueGrowth / calculateAverageGrowth ──────────────────────────

describe("MetricsCalculator — croissance revenus", () => {
    it("calculateRevenueGrowth = (M-1 - M-2) / M-2 * 100", () => {
        const txs = [
            makeTx({ date: "2025-01-10", type: "income", amount: 1000 }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "income", amount: 1200 }),
        ];
        expect(makeCalc({ transactions: txs }).calculateRevenueGrowth()).toBe(20);
    });

    it("calculateRevenueGrowth retourne 0 si M-2 = 0", () => {
        expect(makeCalc().calculateRevenueGrowth()).toBe(0);
    });

    it("calculateAverageGrowth sur N mois", () => {
        const txs = [
            makeTx({ date: "2024-12-10", type: "income", amount: 1000 }),
            makeTx({ id: "tx2", date: "2025-01-10", type: "income", amount: 1100 }),
            makeTx({ id: "tx3", date: "2025-02-10", type: "income", amount: 1210 }),
        ];
        const avg = makeCalc({ transactions: txs }).calculateAverageGrowth(3);
        expect(avg).toBeCloseTo(10, 1);
    });

    it("calculateAverageGrowth retourne 0 si pas de taux calculable", () => {
        expect(makeCalc().calculateAverageGrowth(1)).toBe(0);
    });
});

// ── calculateGoalCompletion / calculateGoalGap / KPI ─────────────────────────

describe("MetricsCalculator — objectifs et KPI", () => {
    it("calculateGoalCompletion = (revenue M-1 / target) * 100", () => {
        const txs = [makeTx({ date: "2025-02-10", type: "income", amount: 5000 })];
        expect(makeCalc({ transactions: txs }).calculateGoalCompletion(10000)).toBe(50);
    });

    it("calculateGoalCompletion retourne 0 si target = 0", () => {
        expect(makeCalc().calculateGoalCompletion(0)).toBe(0);
    });

    it("calculateGoalGap = revenue M-1 - target", () => {
        const txs = [makeTx({ date: "2025-02-10", type: "income", amount: 7000 })];
        expect(makeCalc({ transactions: txs }).calculateGoalGap(10000)).toBe(-3000);
    });

    it("calculateKPICompletionRate retourne 0 si goals = []", () => {
        expect(makeCalc().calculateKPICompletionRate()).toBe(0);
    });

    it("calculateKPICompletionRate = % goals atteints", () => {
        const goals = [
            makeGoal({ id: "g1", target_value: 10000, current_value: 12000 }),
            makeGoal({ id: "g2", target_value: 5000,  current_value: 3000  }),
        ];
        expect(makeCalc({ goals }).calculateKPICompletionRate()).toBe(50);
    });

    it("getKPITracking retourne la structure par metric_name", () => {
        const goals = [
            makeGoal({ metric_name: "Revenue", target_value: 10000, current_value: 8000 }),
        ];
        const result = makeCalc({ goals }).getKPITracking();
        expect(result["Revenue"]).toEqual({ target: 10000, actual: 8000, completion: 80 });
    });

    it("getKPITracking — completion = 0 si target_value = 0", () => {
        const goals = [makeGoal({ metric_name: "X", target_value: 0, current_value: 5 })];
        const result = makeCalc({ goals }).getKPITracking();
        expect(result["X"].completion).toBe(0);
    });
});

// ── calculateAll — runway = 999 branch ───────────────────────────────────────

describe("MetricsCalculator.calculateAll — branches restantes", () => {
    it("runway = 999 quand burnRate = 0", () => {
        expect(makeCalc().calculateAll().runway).toBe(999);
    });

    it("ltvCacRatio = 0 quand cac = 0", () => {
        expect(makeCalc().calculateAll().ltvCacRatio).toBe(0);
    });

    it("updateData met à jour plusieurs champs simultanément", () => {
        const calc = makeCalc();
        const debts = [makeDebt({ remaining_amount: 20000 })];
        const goals = [makeGoal({ metric_name: "MRR", target_value: 5000, current_value: 4000 })];
        const inventory = [makeInventory({ quantity: 3, unit_cost: 100 })];
        const receivables = [makeReceivable({ amount: 1500 })];
        const products = [makeProduct({ id: "p1" })];
        calc.updateData({ debts, goals, inventory, receivables, products });
        expect(calc.calculateAll().totalDebt).toBe(20000);
    });

    // L845-846 : branches if(data.customers) et if(data.marketingMetrics) non prises
    it("updateData accepte customers et marketingMetrics (couvre L845-846)", () => {
        const calc = makeCalc();
        const customers = [makeCustomer({ id: "cx" })];
        const marketingMetrics = [makeMktg({ id: "mx" })];
        calc.updateData({ customers, marketingMetrics });
        expect(calc.calculateAll().activeCustomers).toBe(1);
    });
});

// ── Branches manquantes — constructeur sans refDate (L157) ────────────────────

describe("MetricsCalculator — constructeur sans refDate (L157)", () => {
    it("utilise new Date() si refDate non injecté", () => {
        // Pas de refDate → this._refDate = new Date() → couvre la branche ?? new Date()
        const calc = new MetricsCalculator([], [], [], [], [], [], [], []);
        expect(typeof calc.calculateAll().cash).toBe("number");
    });
});

// ── Branches manquantes — pending tx dans getMonthlyNetCashflow (L261) ────────

describe("MetricsCalculator.getMonthlyNetCashflow — pending ignoré (L261)", () => {
    it("ignore les transactions pending dans le cashflow mensuel", () => {
        const txs = [
            makeTx({ date: "2025-02-10", type: "income",  amount: 3000, payment_status: "completed" }),
            makeTx({ id: "tx2", date: "2025-02-15", type: "income", amount: 500, payment_status: "pending" }),
        ];
        // months=2 → [fev(i=0), mar(i=1)] ; result[0]=fev
        const result = makeCalc({ transactions: txs }).getMonthlyNetCashflow(2);
        expect(result[0].cash).toBe(3000);
    });
});

// ── Branches manquantes — getMonthlyCashTrend L286/L287/L300 ─────────────────

describe("MetricsCalculator.getMonthlyCashTrend — branches pending/expense (L286-L300)", () => {
    it("ignore les tx pending dans la balance antérieure (L286)", () => {
        // tx antérieure pending → non comptée dans runningBalance
        const txs = [
            makeTx({ date: "2024-12-10", type: "income", amount: 999, payment_status: "pending" }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "income", amount: 1000 }),
        ];
        const result = makeCalc({ transactions: txs }).getMonthlyCashTrend(1);
        // balance antérieure = 0 (pending ignoré), puis fev=1000
        expect(result[0].cumulativeBalance).toBe(1000);
    });

    it("compte les expenses dans la balance antérieure (L287 branche false)", () => {
        // tx antérieure expense completed → soustrait du runningBalance
        const txs = [
            makeTx({ date: "2024-12-10", type: "expense", amount: 200, payment_status: "completed" }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "income", amount: 1000 }),
        ];
        const result = makeCalc({ transactions: txs }).getMonthlyCashTrend(1);
        // runningBalance avant fev = -200, après fev = -200+1000 = 800
        expect(result[0].cumulativeBalance).toBe(800);
    });

    it("ignore les tx pending dans la fenêtre principale (L300)", () => {
        const txs = [
            makeTx({ date: "2025-02-10", type: "income", amount: 2000 }),
            makeTx({ id: "tx2", date: "2025-02-15", type: "income", amount: 500, payment_status: "pending" }),
        ];
        // months=2 → [fev(i=0), mar(i=1)] ; result[0]=fev
        const result = makeCalc({ transactions: txs }).getMonthlyCashTrend(2);
        expect(result[0].netFlow).toBe(2000); // pending ignoré
    });
});

// ── Branche L359 : même canal deux fois dans getCACByChannel ─────────────────

describe("MetricsCalculator.getCACByChannel — même canal deux fois (L359)", () => {
    it("agrège deux métriques pour le même canal", () => {
        const mktg = [
            makeMktg({ id: "m1", channel_id: "web", spend: 1000, customers_acquired: 2, period_start: "2025-02-01" }),
            makeMktg({ id: "m2", channel_id: "web", spend: 2000, customers_acquired: 2, period_start: "2025-02-15" }),
        ];
        const result = makeCalc({ marketingMetrics: mktg }).getCACByChannel();
        // total spend=3000, total customers=4 → 750
        expect(result["web"]).toBe(750);
    });

    it("exclut les métriques dont la date dépasse lastDayLastMonth", () => {
        // period_start en mars → hors de la fenêtre de février
        const mktg = [
            makeMktg({ id: "m1", channel_id: "web", spend: 1000, customers_acquired: 2, period_start: "2025-03-01" }),
        ];
        const result = makeCalc({ marketingMetrics: mktg }).getCACByChannel();
        expect(Object.keys(result)).toHaveLength(0);
    });
});

// ── Branche L467 : calculateCACByChannel(!channel) ───────────────────────────

describe("MetricsCalculator.calculateClientMargin — client sans canal (L467)", () => {
    it("délègue à calculateCAC() si acquisition_channel absent", () => {
        const customers = [makeCustomer({ id: "c1", acquisition_channel: undefined })];
        const calc = makeCalc({ customers });
        // calculateCACByChannel(undefined) → calculateCAC() → 0
        expect(calc.calculateClientMargin("c1")).toBe(0);
    });
});

// ── Branche L478 : calculateCACByChannel retourne 0 (aucun nouveau client) ───

describe("MetricsCalculator.calculateCACByChannel — 0 nouveaux clients (L478)", () => {
    it("retourne 0 si aucun client du canal acquis dans la période", () => {
        // Client avec canal "seo" mais acquis hors plage M-1
        const customers = [makeCustomer({ id: "c1", acquisition_channel: "seo", acquisition_date: "2024-10-01" })];
        const calc = makeCalc({ customers });
        // calculateClientMargin → calculateCACByChannel("seo") → newCustomersCount=0 → 0
        expect(calc.calculateClientMargin("c1")).toBe(0);
    });
});

// ── Branche L497 : product.units_sold ?? 0 ───────────────────────────────────

describe("MetricsCalculator.calculateMarginByProduct — units_sold absent (L497)", () => {
    it("utilise 0 si units_sold est undefined", () => {
        const products = [makeProduct({ id: "p1", unit_cost: 100, units_sold: undefined })];
        const txs = [makeTx({ date: "2025-02-10", type: "income", amount: 500, linked_product: "p1" })];
        const result = makeCalc({ transactions: txs, products }).calculateMarginByProduct("p1");
        expect(result.cost).toBe(0);   // 100 * 0 = 0
        expect(result.margin).toBe(500);
    });
});

// ── Branche L509 : txByMonthKey.get(lastMonthKey) ?? [] ──────────────────────

describe("MetricsCalculator.getCustomerRevenueLastMonth — pas de tx pour le mois (L509)", () => {
    it("retourne 0 si aucune transaction pour le mois de référence", () => {
        // Client existant, mais aucune transaction → ?? [] déclenché
        const customers = [makeCustomer({ id: "c1" })];
        const calc = makeCalc({ customers }); // pas de transactions
        expect(calc.calculateClientMargin("c1")).toBe(0);
    });
});

// ── Branche L703 : calculateAverageGrowth avec revenues[i-1] = 0 ─────────────

describe("MetricsCalculator.calculateAverageGrowth — mois à revenu zéro (L703)", () => {
    it("ignore les mois à revenu nul dans le calcul des taux", () => {
        // Seulement jan=1000, dec=0, fev=0 → revenues=[0,1000,0]
        // i=1: revenues[0]=0 → skip (couvre la branche false)
        // i=2: revenues[1]=1000>0 → rate=(0-1000)/1000*100=-100%
        const txs = [
            makeTx({ date: "2025-01-10", type: "income", amount: 1000 }),
        ];
        const avg = makeCalc({ transactions: txs }).calculateAverageGrowth(3);
        expect(avg).toBe(-100);
    });
});
