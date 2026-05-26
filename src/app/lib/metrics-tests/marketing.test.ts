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

// Marketing et retention : gardes anti-division par zero et seuils de simulation.
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

describe("MetricsCalculator.calculateMarketingROI", () => {
    it("calcule (revenue - spend) / spend * 100", () => {
        const mktg = [makeMktg({ period_start: "2025-02-01", spend: 1000, revenue_generated: 3000 })];
        expect(makeCalc({ marketingMetrics: mktg }).calculateMarketingROI()).toBe(200);
    });

    it("retourne 0 si totalSpend = 0", () => {
        expect(makeCalc().calculateMarketingROI()).toBe(0);
    });
});
