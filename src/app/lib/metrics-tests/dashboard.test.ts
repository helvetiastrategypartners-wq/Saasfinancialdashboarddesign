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

// Indicateurs dashboard : fenetres temporelles, solde cash et flux pending.
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

describe("MetricsCalculator — constructeur sans refDate (L157)", () => {
    it("utilise new Date() si refDate non injecté", () => {
        // Pas de refDate → this._refDate = new Date() → couvre la branche ?? new Date()
        const calc = new MetricsCalculator([], [], [], [], [], [], [], []);
        expect(typeof calc.calculateAll().cash).toBe("number");
    });
});

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

describe("MetricsCalculator.getMonthlyNetCashflow — tous les flux pending", () => {
    it("retourne cash = 0 quand toutes les transactions du mois sont pending", () => {
        const calc = makeCalc({
            transactions: [
                makeTx({ date: "2025-02-10", type: "income",  amount: 800,  payment_status: "pending" }),
                makeTx({ id: "tx2", date: "2025-02-12", type: "expense", amount: 200, payment_status: "pending" }),
            ],
        });
        // months=2 → [fev(i=0), mar(i=1)]
        const cashFlow = calc.getMonthlyNetCashflow(2);
        expect(cashFlow[0].cash).toBe(0);
    });
});

describe("MetricsCalculator.getMonthlyCashTrend — aucune transaction antérieure", () => {
    it("calcule cumulativeBalance = netFlow quand il n'y a pas de solde antérieur", () => {
        const calc = makeCalc({
            transactions: [
                makeTx({ date: "2025-02-10", type: "income", amount: 1500 }),
            ],
        });
        // months=1 → [fev] ; aucune tx avant fev → runningBalance part de 0
        const trend = calc.getMonthlyCashTrend(1);
        expect(trend[0].cumulativeBalance).toBe(1500);
    });
});
