import type {
    Transaction, Customer, MarketingMetrics, CalculatedMetrics,
    Product, Debt, InventoryItem, Receivable, Goal,
} from "@shared/types";
import type { MetricsCalculator } from "./MetricsCalculator";
import {
    sumAmounts,
    filterTxPure,
    getMonthStart,
    computeCAC,
    computeLTV,
    computeBurnRate,
} from "./helpers";
export const financialStructureMetricsMethods = {
// ── FINANCIAL STRUCTURE ───────────────────────────────────────────────────

calculateWorkingCapital(this: MetricsCalculator): number {
const totalReceivables = this.receivables.reduce((s, r) => s + r.amount, 0);
const totalInventory   = this.inventory.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
let totalPayables = 0;
for (const t of this.transactions) {
    if (t.type === "expense" && t.payment_status === "pending" && t.category === "Direct Costs") {
        totalPayables += t.amount;
    }
}
return totalReceivables + totalInventory - totalPayables;
},

calculateDSO(this: MetricsCalculator): number {
const totalReceivables = this.receivables.reduce((s, r) => s + r.amount, 0);
const dailyRevenue = this.getLastMonthData().revenue / 30;
return dailyRevenue > 0 ? totalReceivables / dailyRevenue : 0;
},

calculateDIO(this: MetricsCalculator): number {
const totalInventoryValue = this.inventory.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
const dailyCOGS = this.getDirectCOGS() / 30;
return dailyCOGS > 0 ? totalInventoryValue / dailyCOGS : 0;
},

calculateDPO(this: MetricsCalculator): number {
let directPayables = 0;
for (const t of this.transactions) {
    if (t.type === "expense" && t.payment_status === "pending" && t.category === "Direct Costs") {
        directPayables += t.amount;
    }
}
const dailyCOGS = this.getDirectCOGS() / 30;
return dailyCOGS > 0 ? directPayables / dailyCOGS : 0;
},

calculateCashConversionCycle(this: MetricsCalculator): number {
return this.calculateDSO() + this.calculateDIO() - this.calculateDPO();
},

calculateTotalDebtPayments(this: MetricsCalculator): number {
return this.debts.reduce((s, d) => s + (d.monthly_repayment || 0), 0);
},

calculateLeverageRatio(this: MetricsCalculator): number {
const ebitda = this.calculateEBITDA();
return ebitda > 0 ? this.calculateTotalDebt() / ebitda : 0;
},

calculateDebtService(this: MetricsCalculator): number {
return this.calculateTotalDebtPayments();
},
};
