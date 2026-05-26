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
export const unitEconomicsMetricsMethods = {
// ── UNIT ECONOMICS ────────────────────────────────────────────────────────

calculateCACByChannel(this: MetricsCalculator, channel?: string): number {
if (!channel) return this.calculateCAC();
const startKey = this.monthStart(1).toISOString().slice(0, 7);
const endKey = this.monthStart(0).toISOString().slice(0, 7);
const normalizedChannel = channel.toLowerCase();

let totalChannelCost = this.marketingMetrics
    .filter((metric) => {
        const periodKey = metric.period_start?.slice(0, 7);
        return metric.channel_id?.toLowerCase() === normalizedChannel &&
            periodKey !== undefined &&
            periodKey >= startKey &&
            periodKey < endKey;
    })
    .reduce((sum, metric) => sum + metric.spend, 0);

if (totalChannelCost === 0) {
    totalChannelCost = sumAmounts(
        this.filterTx(this.monthStart(1), this.monthStart(0), "expense")
            .filter((t) =>
                t.linked_channel?.toLowerCase() === normalizedChannel ||
                t.category?.toLowerCase().includes(normalizedChannel)
            )
    );
}

const newCustomers = this.customers.filter(
    (c) =>
        c.acquisition_channel === channel &&
        c.acquisition_date >= startKey &&
        c.acquisition_date < endKey
);
return newCustomers.length > 0 ? totalChannelCost / newCustomers.length : 0;
},

calculateClientMargin(this: MetricsCalculator, customerId: string): number {
const customer = this._customerById.get(customerId);
if (!customer) return 0;
const revenue = this.getCustomerRevenueLastMonth(customerId);
const cac = this.calculateCACByChannel(customer.acquisition_channel);
const margin = this.getLastMonthData().grossMarginPercent;
return revenue * (margin / 100) - cac;
},

calculateMarginByProduct(this: MetricsCalculator, productId: string): { revenue: number; cost: number; margin: number; marginPercent: number } {
const product = this._productById.get(productId);
if (!product) return { revenue: 0, cost: 0, margin: 0, marginPercent: 0 };
const revenue = sumAmounts(
    this.filterTx(this.monthStart(1), this.monthStart(0), "income")
        .filter((t) => t.linked_product === productId)
);
const unitsSold = product.units_sold ?? 0;
const cost = product.unit_cost * unitsSold;
const margin = revenue - cost;
const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;
return { revenue, cost, margin, marginPercent };
},

calculateProfitPerProduct(this: MetricsCalculator, productId: string): number {
return this.calculateMarginByProduct(productId).margin;
},

getCustomerRevenueLastMonth(this: MetricsCalculator, customerId: string): number {
const lastMonthKey = this.monthStart(1).toISOString().slice(0, 7);
const txs = this._txByMonthKey.get(lastMonthKey) ?? [];
let sum = 0;
for (const t of txs) {
    if (t.linked_customer === customerId && t.type === "income" && t.payment_status === "completed") {
        sum += t.amount;
    }
}
return sum;
},

calculateRevenueConcentration(this: MetricsCalculator): Record<string, number> {
const totalRevenue = this.getLastMonthData().revenue;
if (totalRevenue <= 0) return {};
const concentration: Record<string, number> = {};
for (const c of this.customers) {
    const realRevenue = this.getCustomerRevenueLastMonth(c.id);
    const weight = (realRevenue / totalRevenue) * 100;
    if (weight > 0) concentration[c.name] = weight;
}
return concentration;
},
};
