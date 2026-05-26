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

    it("génère un insight LTV/CAC faible si ratio < 3 (branche if, ligne 685)", () => {
        // cac=5000 (1 nouveau client, spend=5000), arpu=100, margin=50%, churn=0 → lifetime=60
        // ltv = 100 * 0.5 * 60 = 3000 → ratio = 3000/5000 = 0.6 < 3 → ligne 685 atteinte
        const customers = [makeCustomer({ id: "c1", status: "active", acquisition_date: "2025-02-05", monthly_revenue: 100 })];
        const mktg = [makeMktg({ period_start: "2025-02-01", spend: 5000, customers_acquired: 1, revenue_generated: 100 })];
        const txs = [
            makeTx({ date: "2025-02-10", type: "income", amount: 100 }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "expense", amount: 50, category: "Direct Costs" }),
        ];
        const insights = makeCalc({ transactions: txs, customers, marketingMetrics: mktg }).getAutomaticInsights();
        expect(insights.some(i => i.includes("LTV/CAC") && i.includes("risque"))).toBe(true);
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
