import { describe, expect, it, vi } from "vitest";
import {
    sumAmounts,
    filterTxPure,
    getMonthStart,
    computeCashBalance,
    computeCAC,
    computeLTV,
    computeBurnRate,
    MetricsCalculator,
} from "../metrics";
import {
    REF_DATE,
    makeCalc,
    makeCustomer,
    makeDebt,
    makeGoal,
    makeInventory,
    makeMktg,
    makeProduct,
    makeReceivable,
    makeTx,
} from "./fixtures";
import type { Transaction, MarketingMetrics } from "@shared/types";

// Agregations finance : regroupements par canal/categorie et periodes custom.
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

describe("MetricsCalculator — calculateTotalDebt", () => {
    it("additionne les remaining_amount : CHF 80 000 + CHF 15 000 = CHF 95 000", () => {
        const debts = [
            makeDebt({ id: "d1", remaining_amount: 80000 }),
            makeDebt({ id: "d2", remaining_amount: 15000 }),
        ];
        expect(makeCalc({ debts }).calculateAll().totalDebt).toBe(95000);
    });

    it("retourne 0 si debts = []", () => {
        expect(makeCalc().calculateAll().totalDebt).toBe(0);
    });
});

describe("MetricsCalculator — calculateEBITDA", () => {
    it("EBITDA = grossMargin − OPEX hors Direct Costs : CHF 68 000 − CHF 49 000 = CHF 19 000", () => {
        // grossMargin = revenue(68000) - direct_costs(0) = 68000
        // opex (hors Direct Costs) = 49000 (Salaries)
        // EBITDA = 68000 - 49000 = 19000
        const txs = [
            makeTx({ date: "2025-02-10", type: "income",  amount: 68000 }),
            makeTx({ id: "tx2", date: "2025-02-15", type: "expense", amount: 49000, category: "Salaries" }),
        ];
        expect(makeCalc({ transactions: txs }).calculateAll().ebitda).toBe(19000);
    });

    it("EBITDA inclut les Direct Costs dans grossMargin mais pas dans opex", () => {
        // revenue=10000, direct_costs=2000 → grossMargin=8000
        // opex (Salaries)=3000 → EBITDA=5000
        const txs = [
            makeTx({ date: "2025-02-10", type: "income",  amount: 10000 }),
            makeTx({ id: "tx2", date: "2025-02-15", type: "expense", amount: 2000, category: "Direct Costs" }),
            makeTx({ id: "tx3", date: "2025-02-20", type: "expense", amount: 3000, category: "Salaries" }),
        ];
        expect(makeCalc({ transactions: txs }).calculateAll().ebitda).toBe(5000);
    });

    it("EBITDA nul ou négatif → calculateLeverageRatio retourne 0 (protection division par zéro)", () => {
        // Aucune donnée → grossMargin=0, opex=0 → EBITDA=0 → leverageRatio=0
        expect(makeCalc().calculateLeverageRatio()).toBe(0);
    });

    it("EBITDA négatif → calculateLeverageRatio retourne 0", () => {
        // opex > grossMargin → EBITDA < 0 → leverageRatio=0
        const txs = [
            makeTx({ date: "2025-02-10", type: "income",  amount: 1000 }),
            makeTx({ id: "tx2", date: "2025-02-15", type: "expense", amount: 5000, category: "Salaries" }),
        ];
        const debts = [makeDebt({ remaining_amount: 50000 })];
        expect(makeCalc({ transactions: txs, debts }).calculateLeverageRatio()).toBe(0);
    });
});
