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
export const insightMetricsMethods = {
// ── INTELLIGENCE LAYER ────────────────────────────────────────────────────



getCashRiskStatus(this: MetricsCalculator): { risk: "low" | "medium" | "high"; message: string } {
const runway = this.calculateRunway();
if (runway < 3) return { risk: "high",   message: "Critique" };
if (runway < 6) return { risk: "medium", message: "Attention" };
return             { risk: "low",    message: "Stable" };
},

calculateExpenseVariation(this: MetricsCalculator): number {
const expM1 = sumAmounts(this.filterTx(this.monthStart(1), this.monthStart(0), "expense"));
const expM2 = sumAmounts(this.filterTx(this.monthStart(2), this.monthStart(1), "expense"));
return expM2 > 0 ? ((expM1 - expM2) / expM2) * 100 : 0;
},

getAutomaticInsights(this: MetricsCalculator): string[] {
const insights: string[] = [];
const m = this.calculateAll();
if (Number.isFinite(m.runway) && m.runway < 3) {
    insights.push(`Runway critique : ${m.runway.toFixed(1)} mois — action immédiate requise.`);
} else if (m.runway < 6) {
    insights.push(`Runway court : ${m.runway.toFixed(1)} mois — surveiller la trésorerie.`);
}
if (m.churnRate > 5) {
    insights.push(`Taux de churn élevé : ${m.churnRate.toFixed(1)}% — risque sur la rétention clients.`);
}
if (m.cac > 0) {
    if (m.ltvCacRatio < 3) {
        insights.push(`Ratio LTV/CAC faible (${m.ltvCacRatio.toFixed(1)}x) — rentabilité client à risque.`);
    } else {
        insights.push(`Ratio LTV/CAC sain (${m.ltvCacRatio.toFixed(1)}x) — acquisition rentable.`);
    }
}
if (m.netCashflow < 0) {
    insights.push(`Cashflow net négatif (${m.netCashflow.toLocaleString("fr-CH")} CHF) — dépenses à optimiser.`);
}
if (m.grossMarginPercent < 50) {
    insights.push(`Marge brute faible : ${m.grossMarginPercent.toFixed(1)}% — optimiser les coûts directs.`);
}
if (m.burnRate > m.monthlyRevenue * 0.8) {
    insights.push(`Burn rate (${m.burnRate.toLocaleString("fr-CH")} CHF) dépasse 80% des revenus.`);
}
return insights;
},
};
