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

// Analyses cohortes : clients par mois d'acquisition puis revenus mensuels rattaches.
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

describe("MetricsCalculator.getCohortRevenueAnalysis", () => {
    it("agrege les revenus par cohorte et mois depuis les clients lies", () => {
        const customers = [
            makeCustomer({ id: "c1", acquisition_date: "2025-01-15" }),
            makeCustomer({ id: "c2", acquisition_date: "2025-01-20" }),
            makeCustomer({ id: "c3", acquisition_date: "2025-02-05" }),
        ];
        const txs = [
            makeTx({ date: "2025-01-25", type: "income", amount: 1000, linked_customer: "c1" }),
            makeTx({ id: "tx2", date: "2025-02-10", type: "income", amount: 2000, linked_customer: "c2" }),
            makeTx({ id: "tx3", date: "2025-02-12", type: "income", amount: 3000, linked_customer: "c3" }),
            makeTx({ id: "tx4", date: "2025-02-14", type: "income", amount: 999, linked_customer: "unknown" }),
            makeTx({ id: "tx5", date: "2025-02-16", type: "expense", amount: 500, linked_customer: "c1" }),
            makeTx({ id: "tx6", date: "2025-02-20", type: "income", amount: 700, payment_status: "pending", linked_customer: "c1" }),
        ];

        const result = makeCalc({ customers, transactions: txs }).getCohortRevenueAnalysis();

        expect(result.map(cohort => cohort.cohort)).toEqual(["2025-01", "2025-02"]);
        expect(result[0].size).toBe(2);
        expect(result[0].months[0]).toMatchObject({ label: "M+0", revenue: 1000, avgPerCustomer: 500 });
        expect(result[0].months[1]).toMatchObject({ label: "M+1", revenue: 2000, avgPerCustomer: 1000 });
        expect(result[1].months[0]).toMatchObject({ label: "M+0", revenue: 3000, avgPerCustomer: 3000 });
    });

    it("retourne un tableau vide si aucun client n'existe", () => {
        expect(makeCalc().getCohortRevenueAnalysis()).toEqual([]);
    });

    it("limite l'historique d'une cohorte a 12 mois", () => {
        const customers = [makeCustomer({ id: "c1", acquisition_date: "2023-01-15" })];
        const calc = makeCalc({ customers, refDate: new Date("2025-03-15T12:00:00Z") });

        expect(calc.getCohortRevenueAnalysis()[0].months).toHaveLength(12);
    });
});
