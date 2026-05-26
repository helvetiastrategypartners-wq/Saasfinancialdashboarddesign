import type { MetricsRuntime } from "./context";
import { computeBurnRate, getMonthStart } from "./helpers";

export const dashboardMetricsMethods = {
    calculateCash(this: MetricsRuntime): number {
        return this._cashBalance;
    },

    calculateBurnRate(this: MetricsRuntime): number {
        return computeBurnRate(
            this._txByMonthKey,
            this.monthStart(3).toISOString().slice(0, 7),
            this.monthStart(0).toISOString().slice(0, 7),
            3,
        );
    },

    calculateRunway(this: MetricsRuntime): number {
        const burn = this.calculateBurnRate();
        return burn <= 0 ? 999 : this.calculateCash() / burn;
    },

    getMonthlyNetCashflow(this: MetricsRuntime, months: number): Array<{
        month: string;
        cash: number;
    }> {
        const ref = this._refDate;

        return Array.from({ length: months }, (_, i) => {
            const date = getMonthStart(ref, months - 1 - i);
            const key = date.toISOString().slice(0, 7);
            const txs = this._txByMonthKey.get(key) ?? [];
            let cash = 0;

            for (const transaction of txs) {
                if (transaction.payment_status !== "completed") {
                    continue;
                }

                cash += transaction.type === "income"
                    ? transaction.amount
                    : -transaction.amount;
            }

            return {
                month: date.toLocaleDateString("fr-CH", {
                    month: "short",
                    year: "2-digit",
                }),
                cash,
            };
        });
    },

    getMonthlyCashTrend(this: MetricsRuntime, months: number): Array<{
        month: string;
        netFlow: number;
        variationPercent: number | null;
        cumulativeBalance: number;
    }> {
        const ref = this._refDate;
        const firstMonthDate = getMonthStart(ref, months - 1);
        const firstMonthKey = firstMonthDate.toISOString().slice(0, 7);
        let runningBalance = 0;

        for (const [key, txs] of this._txByMonthKey) {
            if (key >= firstMonthKey) {
                continue;
            }

            for (const transaction of txs) {
                if (transaction.payment_status !== "completed") {
                    continue;
                }

                runningBalance += transaction.type === "income"
                    ? transaction.amount
                    : -transaction.amount;
            }
        }

        let prevNetFlow: number | null = null;

        return Array.from({ length: months }, (_, i) => {
            const date = getMonthStart(ref, months - 1 - i);
            const key = date.toISOString().slice(0, 7);
            const txs = this._txByMonthKey.get(key) ?? [];
            let netFlow = 0;

            for (const transaction of txs) {
                if (transaction.payment_status !== "completed") {
                    continue;
                }

                netFlow += transaction.type === "income"
                    ? transaction.amount
                    : -transaction.amount;
            }

            const variationPercent = prevNetFlow !== null && prevNetFlow !== 0
                ? ((netFlow - prevNetFlow) / Math.abs(prevNetFlow)) * 100
                : null;

            runningBalance += netFlow;
            prevNetFlow = netFlow;

            return {
                month: date.toLocaleDateString("fr-CH", {
                    month: "short",
                    year: "2-digit",
                }),
                netFlow,
                variationPercent,
                cumulativeBalance: runningBalance,
            };
        });
    },
};
