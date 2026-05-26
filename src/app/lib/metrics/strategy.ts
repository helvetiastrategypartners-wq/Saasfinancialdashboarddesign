import type { MetricsRuntime } from "./context";
import { sumAmounts } from "./helpers";
export const strategyMetricsMethods = {
    simulateScenario(this: MetricsRuntime, params: Record<string, number>): Record<string, number> {
        const current = this.calculateAll();
        const revenueChange = params.revenueChange ?? 0;
        const expenseChange = params.expenseChange ?? 0;
        const hiringCost = params.hiringCost ?? 0;
        const newRevenue = current.monthlyRevenue * (1 + revenueChange / 100);
        const newBurnRate = current.burnRate * (1 + expenseChange / 100) + hiringCost;
        const newExpenses = newBurnRate;
        return {
            projectedRevenue: Math.round(newRevenue),
            projectedExpenses: Math.round(newExpenses),
            projectedNetCashflow: Math.round(newRevenue - newExpenses),
            projectedRunway: newBurnRate > 0 ? Math.round((current.cash / newBurnRate) * 10) / 10 : 999,
            projectedBurnRate: Math.round(newBurnRate)
        };
    },
    calculateUnitMargin(this: MetricsRuntime, price: number, variableCost: number): number {
        return price - variableCost;
    },
    calculateBreakEvenPoint(this: MetricsRuntime, fixedCosts: number, price: number, variableCost: number): number {
        const unitMargin = this.calculateUnitMargin(price, variableCost);
        return unitMargin > 0 ? fixedCosts / unitMargin : Infinity;
    },
    calculateBreakEvenThreshold(this: MetricsRuntime, fixedCosts: number, unitMargin: number): number {
        return unitMargin > 0 ? fixedCosts / unitMargin : Infinity;
    },
    calculateBreakEvenRevenue(this: MetricsRuntime, fixedCosts: number, price: number, variableCost: number): number {
        return this.calculateBreakEvenThreshold(fixedCosts, this.calculateUnitMargin(price, variableCost)) * price;
    },
    calculateRevenueGrowth(this: MetricsRuntime): number {
        const revM1 = sumAmounts(this.filterTx(this.monthStart(1), this.monthStart(0), "income"));
        const revM2 = sumAmounts(this.filterTx(this.monthStart(2), this.monthStart(1), "income"));
        return revM2 > 0 ? ((revM1 - revM2) / revM2) * 100 : 0;
    },
    calculateAverageGrowth(this: MetricsRuntime, months: number): number {
        const revenues: number[] = [];
        for (let i = months - 1; i >= 0; i--) {
            revenues.push(sumAmounts(this.filterTx(this.monthStart(i + 1), this.monthStart(i), "income")));
        }
        const rates: number[] = [];
        for (let i = 1; i < revenues.length; i++) {
            if (revenues[i - 1] === 0)
                continue;
            rates.push(((revenues[i] - revenues[i - 1]) / revenues[i - 1]) * 100);
        }
        return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    },
    calculateGoalCompletion(this: MetricsRuntime, targetRevenue: number): number {
        return targetRevenue > 0 ? (this.getLastMonthData().revenue / targetRevenue) * 100 : 0;
    },
    calculateGoalGap(this: MetricsRuntime, targetRevenue: number): number {
        return this.getLastMonthData().revenue - targetRevenue;
    },
    calculateKPICompletionRate(this: MetricsRuntime): number {
        if (this.goals.length === 0)
            return 0;
        return (this.goals.filter((g) => g.current_value >= g.target_value).length / this.goals.length) * 100;
    },
    getKPITracking(this: MetricsRuntime): Record<string, {
        target: number;
        actual: number;
        completion: number;
    }> {
        const result: Record<string, {
            target: number;
            actual: number;
            completion: number;
        }> = {};
        for (const g of this.goals) {
            result[g.metric_name] = {
                target: g.target_value,
                actual: g.current_value,
                completion: g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0
            };
        }
        return result;
    }
};
