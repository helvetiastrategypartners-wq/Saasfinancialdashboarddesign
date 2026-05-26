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

// Strategie et objectifs : projection, break-even et evolution du revenu.
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

    it("calculateBreakEvenPoint = fixedCosts / (price - variableCost)", () => {
        expect(makeCalc().calculateBreakEvenPoint(4000, 100, 60)).toBe(100);
    });

    it("calculateBreakEvenPoint retourne Infinity si price <= variableCost", () => {
        expect(makeCalc().calculateBreakEvenPoint(4000, 60, 60)).toBe(Infinity);
    });
});

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
