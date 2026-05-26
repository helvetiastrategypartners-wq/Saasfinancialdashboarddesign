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

// Structure financiere : BFR, cycle de conversion cash et dette.
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

describe("MetricsCalculator — dette", () => {
    it("calculateDebtService = somme des monthly_repayment", () => {
        const debts = [makeDebt({ monthly_repayment: 1000 }), makeDebt({ id: "d2", monthly_repayment: 500 })];
        expect(makeCalc({ debts }).calculateDebtService()).toBe(1500);
    });

    it("calculateDebtService utilise 0 si monthly_repayment absent (L652 branche ||)", () => {
        const debts = [makeDebt({ monthly_repayment: undefined as any }), makeDebt({ id: "d2", monthly_repayment: 400 })];
        expect(makeCalc({ debts }).calculateDebtService()).toBe(400);
    });

    it("calculateTotalDebtPayments = somme des monthly_repayment (L643)", () => {
        const debts = [makeDebt({ monthly_repayment: 800 }), makeDebt({ id: "d2", monthly_repayment: 200 })];
        expect(makeCalc({ debts }).calculateTotalDebtPayments()).toBe(1000);
    });

    it("calculateTotalDebtPayments utilise 0 si monthly_repayment absent (L643 branche ||)", () => {
        const debts = [makeDebt({ monthly_repayment: undefined as any }), makeDebt({ id: "d2", monthly_repayment: 300 })];
        expect(makeCalc({ debts }).calculateTotalDebtPayments()).toBe(300);
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

describe("MetricsCalculator.calculateDIO — stocks à unit_cost = 0", () => {
    it("retourne 0 si unit_cost = 0 (inventaire sans valeur)", () => {
        const inventory = [makeInventory({ quantity: 100, unit_cost: 0 })];
        const txs = [
            makeTx({ date: "2025-02-10", type: "expense", amount: 3000, category: "Direct Costs" }),
        ];
        // totalInventoryValue = 100*0 = 0 → DIO = 0
        expect(makeCalc({ transactions: txs, inventory }).calculateDIO()).toBe(0);
    });
});
