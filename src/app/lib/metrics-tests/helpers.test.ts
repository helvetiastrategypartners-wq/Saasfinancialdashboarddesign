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
