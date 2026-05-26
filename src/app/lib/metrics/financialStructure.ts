import type { MetricsRuntime } from "./context";

export const financialStructureMetricsMethods = {
    calculateWorkingCapital(this: MetricsRuntime): number {
        const totalReceivables = this.receivables.reduce(
            (sum, receivable) => sum + receivable.amount,
            0,
        );
        const totalInventory = this.inventory.reduce(
            (sum, item) => sum + item.quantity * item.unit_cost,
            0,
        );
        let totalPayables = 0;

        for (const transaction of this.transactions) {
            if (
                transaction.type === "expense" &&
                transaction.payment_status === "pending" &&
                transaction.category === "Direct Costs"
            ) {
                totalPayables += transaction.amount;
            }
        }

        return totalReceivables + totalInventory - totalPayables;
    },

    calculateDSO(this: MetricsRuntime): number {
        const totalReceivables = this.receivables.reduce(
            (sum, receivable) => sum + receivable.amount,
            0,
        );
        const dailyRevenue = this.getLastMonthData().revenue / 30;

        return dailyRevenue > 0 ? totalReceivables / dailyRevenue : 0;
    },

    calculateDIO(this: MetricsRuntime): number {
        const totalInventoryValue = this.inventory.reduce(
            (sum, item) => sum + item.quantity * item.unit_cost,
            0,
        );
        const dailyCOGS = this.getDirectCOGS() / 30;

        return dailyCOGS > 0 ? totalInventoryValue / dailyCOGS : 0;
    },

    calculateDPO(this: MetricsRuntime): number {
        let directPayables = 0;

        for (const transaction of this.transactions) {
            if (
                transaction.type === "expense" &&
                transaction.payment_status === "pending" &&
                transaction.category === "Direct Costs"
            ) {
                directPayables += transaction.amount;
            }
        }

        const dailyCOGS = this.getDirectCOGS() / 30;
        return dailyCOGS > 0 ? directPayables / dailyCOGS : 0;
    },

    calculateCashConversionCycle(this: MetricsRuntime): number {
        return this.calculateDSO() + this.calculateDIO() - this.calculateDPO();
    },

    calculateTotalDebtPayments(this: MetricsRuntime): number {
        return this.debts.reduce(
            (sum, debt) => sum + (debt.monthly_repayment || 0),
            0,
        );
    },

    calculateLeverageRatio(this: MetricsRuntime): number {
        const ebitda = this.calculateEBITDA();
        return ebitda > 0 ? this.calculateTotalDebt() / ebitda : 0;
    },

    calculateDebtService(this: MetricsRuntime): number {
        return this.calculateTotalDebtPayments();
    },
};
