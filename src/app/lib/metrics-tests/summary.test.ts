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

// Tests de synthese : dernieres branches transverses de calculateAll/updateData.
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
