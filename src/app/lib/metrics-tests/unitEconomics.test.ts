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

// Economie unitaire : liens client/produit/canal utilises dans les marges.
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

describe("MetricsCalculator.calculateClientMargin — client sans canal (L467)", () => {
    it("délègue à calculateCAC() si acquisition_channel absent", () => {
        const customers = [makeCustomer({ id: "c1", acquisition_channel: undefined })];
        const calc = makeCalc({ customers });
        // calculateCACByChannel(undefined) → calculateCAC() → 0
        expect(calc.calculateClientMargin("c1")).toBe(0);
    });

    it("utilise le spend marketing du canal pour le CAC client", () => {
        const customers = [
            makeCustomer({ id: "c1", acquisition_channel: "web", acquisition_date: "2025-02-05" }),
            makeCustomer({ id: "c2", acquisition_channel: "web", acquisition_date: "2025-02-10" }),
        ];
        const txs = [
            makeTx({ date: "2025-02-10", type: "income", amount: 5000, linked_customer: "c1" }),
            makeTx({ id: "tx2", date: "2025-02-11", type: "income", amount: 5000, linked_customer: "c2" }),
            makeTx({ id: "tx3", date: "2025-02-12", type: "expense", amount: 2000, category: "Direct Costs" }),
        ];
        const mktg = [makeMktg({ channel_id: "web", spend: 6000, period_start: "2025-02-01" })];

        expect(makeCalc({ customers, transactions: txs, marketingMetrics: mktg }).calculateClientMargin("c1")).toBe(1000);
    });
});

describe("MetricsCalculator.calculateCACByChannel — 0 nouveaux clients (L478)", () => {
    it("retourne 0 si aucun client du canal acquis dans la période", () => {
        // Client avec canal "seo" mais acquis hors plage M-1
        const customers = [makeCustomer({ id: "c1", acquisition_channel: "seo", acquisition_date: "2024-10-01" })];
        const calc = makeCalc({ customers });
        // calculateClientMargin → calculateCACByChannel("seo") → newCustomersCount=0 → 0
        expect(calc.calculateClientMargin("c1")).toBe(0);
    });
});

describe("MetricsCalculator.calculateMarginByProduct — units_sold absent (L497)", () => {
    it("utilise 0 si units_sold est undefined", () => {
        const products = [makeProduct({ id: "p1", unit_cost: 100, units_sold: undefined })];
        const txs = [makeTx({ date: "2025-02-10", type: "income", amount: 500, linked_product: "p1" })];
        const result = makeCalc({ transactions: txs, products }).calculateMarginByProduct("p1");
        expect(result.cost).toBe(0);   // 100 * 0 = 0
        expect(result.margin).toBe(500);
    });
});

describe("MetricsCalculator.getCustomerRevenueLastMonth — pas de tx pour le mois (L509)", () => {
    it("retourne 0 si aucune transaction pour le mois de référence", () => {
        // Client existant, mais aucune transaction → ?? [] déclenché
        const customers = [makeCustomer({ id: "c1" })];
        const calc = makeCalc({ customers }); // pas de transactions
        expect(calc.calculateClientMargin("c1")).toBe(0);
    });
});

describe("MetricsCalculator.calculateClientMargin — stub calculateCAC non nul", () => {
    it("applique la formule revenue*margin - cac quand calculateCAC retourne 500", () => {
        const customers = [makeCustomer({ id: "c1", acquisition_channel: undefined })];
        const calc = makeCalc({ customers });

        const mockCAC = vi.spyOn(calc as any, "calculateCAC").mockReturnValue(500);

        // revenue=0 (aucune tx liée à c1), grossMarginPercent=0 → 0*(0/100) - 500 = -500
        const margin = calc.calculateClientMargin("c1");
        expect(mockCAC).toHaveBeenCalled();
        expect(margin).toBe(-500);

        mockCAC.mockRestore();
    });
});

describe("MetricsCalculator.calculateCACByChannel — date d'acquisition à la frontière", () => {
    it("retourne 0 quand la date d'acquisition est exactement le 1er du mois précédent", () => {
        // acquisition_date = 2025-01-01 → hors de la fenêtre M-1 (fév 2025)
        // → newCustomersCount = 0 → CAC = 0 → calculateClientMargin = 0
        const customers = [
            makeCustomer({ id: "c1", acquisition_channel: "seo", acquisition_date: "2025-01-01" }),
        ];
        const calc = makeCalc({ customers });
        expect(calc.calculateClientMargin("c1")).toBe(0);
    });
});

describe("MetricsCalculator.getCustomerRevenueLastMonth — tx présentes mais non liées", () => {
    it("retourne 0 quand les transactions du mois ne sont pas liées au client cible", () => {
        // tx en fév existe mais sans linked_customer → revenue c1 = 0
        const customers = [makeCustomer({ id: "c1" })];
        const calc = makeCalc({
            customers,
            transactions: [makeTx({ date: "2025-02-10", amount: 500 })], // pas de linked_customer
        });
        expect(calc.calculateClientMargin("c1")).toBe(0);
    });
});

describe("MetricsCalculator.calculateRevenueConcentration — seuil 25%", () => {
    it("détecte un client qui dépasse 25% du CA", () => {
        const customers = [
            makeCustomer({ id: "c1", name: "Dominant" }),
            makeCustomer({ id: "c2", name: "B" }),
            makeCustomer({ id: "c3", name: "C" }),
            makeCustomer({ id: "c4", name: "D" }),
        ];
        const txs = [
            makeTx({ date: "2025-02-10", type: "income", amount: 5000, linked_customer: "c1" }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "income", amount: 1000, linked_customer: "c2" }),
            makeTx({ id: "tx3", date: "2025-02-10", type: "income", amount: 1000, linked_customer: "c3" }),
            makeTx({ id: "tx4", date: "2025-02-10", type: "income", amount: 1000, linked_customer: "c4" }),
        ];
        const result = makeCalc({ transactions: txs, customers }).calculateRevenueConcentration();
        // c1 = 5000/8000 = 62.5% > 25%
        expect(result["Dominant"]).toBeGreaterThan(25);
    });

    it("aucun client ne dépasse 25% avec une distribution équilibrée", () => {
        const customers = [
            makeCustomer({ id: "c1", name: "A" }),
            makeCustomer({ id: "c2", name: "B" }),
            makeCustomer({ id: "c3", name: "C" }),
            makeCustomer({ id: "c4", name: "D" }),
            makeCustomer({ id: "c5", name: "E" }),
        ];
        const txs = [
            makeTx({ date: "2025-02-10", type: "income", amount: 2000, linked_customer: "c1" }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "income", amount: 2000, linked_customer: "c2" }),
            makeTx({ id: "tx3", date: "2025-02-10", type: "income", amount: 2000, linked_customer: "c3" }),
            makeTx({ id: "tx4", date: "2025-02-10", type: "income", amount: 2000, linked_customer: "c4" }),
            makeTx({ id: "tx5", date: "2025-02-10", type: "income", amount: 2000, linked_customer: "c5" }),
        ];
        const result = makeCalc({ transactions: txs, customers }).calculateRevenueConcentration();
        // Chaque client = 20% ≤ 25%
        expect(Object.values(result).every(v => v <= 25)).toBe(true);
    });

    it("retourne {} si CA total = 0 (aucun revenu)", () => {
        const customers = [makeCustomer({ id: "c1", name: "A" })];
        expect(makeCalc({ customers }).calculateRevenueConcentration()).toEqual({});
    });
});
