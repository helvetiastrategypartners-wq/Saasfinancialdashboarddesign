import type { MetricsRuntime } from "./context";
import { sumAmounts } from "./helpers";

export const insightMetricsMethods = {
    getCashRiskStatus(this: MetricsRuntime): {
        risk: "low" | "medium" | "high";
        message: string;
    } {
        const runway = this.calculateRunway();

        if (runway < 3) {
            return { risk: "high", message: "Critique" };
        }
        if (runway < 6) {
            return { risk: "medium", message: "Attention" };
        }

        return { risk: "low", message: "Stable" };
    },

    calculateExpenseVariation(this: MetricsRuntime): number {
        const expM1 = sumAmounts(
            this.filterTx(this.monthStart(1), this.monthStart(0), "expense"),
        );
        const expM2 = sumAmounts(
            this.filterTx(this.monthStart(2), this.monthStart(1), "expense"),
        );

        return expM2 > 0 ? ((expM1 - expM2) / expM2) * 100 : 0;
    },

    getAutomaticInsights(this: MetricsRuntime): string[] {
        const insights: string[] = [];
        const metrics = this.calculateAll();

        if (Number.isFinite(metrics.runway) && metrics.runway < 3) {
            insights.push(`Runway critique : ${metrics.runway.toFixed(1)} mois - action immediate requise.`);
        } else if (metrics.runway < 6) {
            insights.push(`Runway court : ${metrics.runway.toFixed(1)} mois - surveiller la tresorerie.`);
        }

        if (metrics.churnRate > 5) {
            insights.push(`Taux de churn eleve : ${metrics.churnRate.toFixed(1)}% - risque sur la retention clients.`);
        }

        if (metrics.cac > 0) {
            if (metrics.ltvCacRatio < 3) {
                insights.push(`Ratio LTV/CAC faible (${metrics.ltvCacRatio.toFixed(1)}x) - rentabilite client a risque.`);
            } else {
                insights.push(`Ratio LTV/CAC sain (${metrics.ltvCacRatio.toFixed(1)}x) - acquisition rentable.`);
            }
        }

        if (metrics.netCashflow < 0) {
            insights.push(`Cashflow net negatif (${metrics.netCashflow.toLocaleString("fr-CH")} CHF) - depenses a optimiser.`);
        }
        if (metrics.grossMarginPercent < 50) {
            insights.push(`Marge brute faible : ${metrics.grossMarginPercent.toFixed(1)}% - optimiser les couts directs.`);
        }
        if (metrics.burnRate > metrics.monthlyRevenue * 0.8) {
            insights.push(`Burn rate (${metrics.burnRate.toLocaleString("fr-CH")} CHF) depasse 80% des revenus.`);
        }

        return insights;
    },
};
