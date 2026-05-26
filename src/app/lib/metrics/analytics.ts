import type { Customer } from "@shared/types";
import type { MetricsRuntime } from "./context";
import { filterTxPure } from "./helpers";
export const analyticsMetricsMethods = {
    getCohortAnalysis(this: MetricsRuntime): Record<string, number[]> {
        const cohorts: Record<string, Customer[]> = {};
        for (const c of this.customers) {
            const key = c.acquisition_date.slice(0, 7);
            if (!cohorts[key])
                cohorts[key] = [];
            cohorts[key].push(c);
        }
        const ref = this._refDate;
        const result: Record<string, number[]> = {};
        for (const [monthKey, cohortCustomers] of Object.entries(cohorts)) {
            const [year, month] = monthKey.split('-').map(Number);
            const monthsElapsed = (ref.getFullYear() - year) * 12 +
                (ref.getMonth() - (month - 1));
            const total = cohortCustomers.length;
            const retentionRates: number[] = [];
            for (let m = 0; m <= monthsElapsed; m++) {
                const checkDate = new Date(Date.UTC(year, (month - 1) + m, 1));
                let retained = 0;
                for (const c of cohortCustomers) {
                    const isActive = c.status === "active";
                    const churnedLater = c.churn_date && new Date(c.churn_date) >= checkDate;
                    if (isActive || churnedLater)
                        retained++;
                }
                retentionRates.push(Math.round((retained / total) * 100));
            }
            result[monthKey] = retentionRates;
        }
        return result;
    },
    getCohortRevenueAnalysis(this: MetricsRuntime): Array<{
        cohort: string;
        label: string;
        size: number;
        months: Array<{
            label: string;
            revenue: number;
            avgPerCustomer: number;
        }>;
    }> {
        const cohortMap = new Map<string, Customer[]>();
        for (const c of this.customers) {
            const key = c.acquisition_date.slice(0, 7);
            let arr = cohortMap.get(key);
            if (!arr) {
                arr = [];
                cohortMap.set(key, arr);
            }
            arr.push(c);
        }
        const ref = this._refDate;
        const result = [];
        for (const [cohortKey, cohortCustomers] of cohortMap) {
            const [year, month] = cohortKey.split('-').map(Number);
            const monthsElapsed = (ref.getFullYear() - year) * 12 + (ref.getMonth() - (month - 1));
            const maxM = Math.min(monthsElapsed + 1, 12);
            const customerIds = new Set(cohortCustomers.map(c => c.id));
            const months = [];
            for (let m = 0; m < maxM; m++) {
                const startKey = new Date(Date.UTC(year, (month - 1) + m, 1)).toISOString().slice(0, 7);
                const endKey = new Date(Date.UTC(year, (month - 1) + m + 1, 1)).toISOString().slice(0, 7);
                const txs = filterTxPure(this._txByMonthKey, startKey, endKey, 'income');
                const revenue = txs
                    .filter(t => t.linked_customer && customerIds.has(t.linked_customer))
                    .reduce((s, t) => s + t.amount, 0);
                months.push({
                    label: `M+${m}`,
                    revenue,
                    avgPerCustomer: Math.round(revenue / cohortCustomers.length)
                });
            }
            result.push({
                cohort: cohortKey,
                label: new Date(cohortKey + '-01').toLocaleDateString('fr-CH', { month: 'short', year: '2-digit' }),
                size: cohortCustomers.length,
                months
            });
        }
        return result.sort((a, b) => a.cohort.localeCompare(b.cohort));
    }
};
