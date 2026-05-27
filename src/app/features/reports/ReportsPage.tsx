import { lazy, Suspense } from "react";
import { useMetrics } from "../../contexts/MetricsContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { EMPTY_DATA_LABEL, formatMonthsOrEmpty, formatPercentOrEmpty, formatRatioOrEmpty, hasAnyData } from "../../lib/displayValues";
import { ExpenseVariationCard, LeverageGauge, ReportInsightsSection, SummaryCard } from "./components";
import { useReportsData } from "./hooks";

const RevenueConcentrationSection = lazy(() =>
  import("./components/RevenueConcentrationSection").then((module) => ({ default: module.RevenueConcentrationSection })),
);

function ChartSectionFallback() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded-2xl border border-glass-border animate-pulse" style={{ background: "var(--glass-bg)", minHeight: 220 }} />
      <div className="rounded-2xl border border-glass-border animate-pulse" style={{ background: "var(--glass-bg)", minHeight: 220 }} />
    </div>
  );
}

export function Reports() {
  const { metrics, calculator, customers, marketingMetrics, transactions } = useMetrics();
  const { format } = useCurrency();
  const hasFinancialData = transactions.length > 0;
  const hasCustomerData = customers.length > 0;
  const hasMarketingData = marketingMetrics.length > 0;
  const hasAnyBusinessData = hasAnyData(transactions, customers, marketingMetrics);

  const {
    revenueGrowth,
    expenseVariation,
    retentionRate,
    leverageRatio,
    dso,
    dio,
    dpo,
    ccc,
    revenueTrendLabel,
    expenseTrendLabel,
    cashflowPositive,
    insightCards,
    lastMonthLabel,
    concentrationData,
    cohortData,
    maxAvg,
    maxCols,
    previousMonthExpenses,
  } = useReportsData({ metrics, calculator });

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        title="Rapports & Insights"
        subtitle={`Resume automatique de la sante de votre entreprise - ${lastMonthLabel}`}
      />

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Resume Financier du mois</h2>
        <div className="grid grid-cols-3 gap-6">
          <SummaryCard label="Revenu mensuel" value={format(metrics.monthlyRevenue)} trend={revenueTrendLabel} trendPositive={revenueGrowth >= 0} />
          <SummaryCard label="Depenses mensuelles" value={format(metrics.monthlyExpenses)} trend={expenseTrendLabel} trendPositive={expenseVariation <= 0} />
          <SummaryCard label="Cashflow net" value={format(metrics.netCashflow)} trend={hasFinancialData ? (cashflowPositive ? "Positif ce mois-ci" : "Negatif ce mois-ci") : "Donnees vides"} trendPositive={cashflowPositive} />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Sante financiere</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="Marge brute" value={format(metrics.grossMargin)} description={metrics.monthlyRevenue > 0 ? `${metrics.grossMarginPercent.toFixed(2)}% des revenus` : "Donnees vides"} />
          <StatCard label="Burn rate" value={format(metrics.burnRate)} description="Moy. 3 derniers mois" />
          <StatCard label="Runway" value={formatMonthsOrEmpty(metrics.runway, hasFinancialData)} description={hasFinancialData ? metrics.cashRisk?.message : "Donnees vides"} alert={hasFinancialData && metrics.runway < 6} />
          <StatCard label="Cash disponible" value={format(metrics.cash)} description="Solde bancaire estime" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Resume Marketing du mois</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="CAC" value={format(metrics.cac)} description="Cout d'acquisition client" />
          <StatCard label="Clients acquis" value={`${metrics.newCustomersMonth}`} description="Nouveaux ce mois" />
          <StatCard label="Taux de conversion" value={(metrics.conversionRate ?? 0) > 0 ? `${(metrics.conversionRate ?? 0).toFixed(1)}%` : EMPTY_DATA_LABEL} description="Leads vers clients" />
          <StatCard label="ROI Marketing" value={formatPercentOrEmpty(metrics.marketingROI, hasMarketingData)} description="(Revenus - Depenses) / Depenses" highlight={hasMarketingData} />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Economie Unitaire</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="ARPU" value={format(metrics.arpu)} description="Revenu / client actif" />
          <StatCard label="LTV" value={format(metrics.ltv)} description="Valeur a vie client" />
          <StatCard label="LTV / CAC" value={formatRatioOrEmpty(metrics.ltvCacRatio, hasCustomerData && hasMarketingData)} description="Seuil sain >= 3x" highlight={hasCustomerData && hasMarketingData && metrics.ltvCacRatio >= 3} />
          <StatCard label="Payback Period" value={formatMonthsOrEmpty(metrics.paybackPeriod, hasMarketingData)} description="Recuperation CAC" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Retention clients</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="Churn rate" value={hasCustomerData ? `${metrics.churnRate.toFixed(1)}%` : EMPTY_DATA_LABEL} description="Clients perdus / clients debut" alert={hasCustomerData && metrics.churnRate > 5} />
          <StatCard label="Retention" value={hasCustomerData ? `${retentionRate.toFixed(1)}%` : EMPTY_DATA_LABEL} description="100% - churn rate" highlight={hasCustomerData && retentionRate >= 95} />
          <StatCard label="MRR" value={format(metrics.mrr)} description="Revenu mensuel recurrent" />
          <StatCard label="Clients actifs" value={`${metrics.activeCustomers}`} description="Abonnements actifs" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Structure Financiere</h2>
        <div className="grid grid-cols-2 gap-6">
          <GlassCard>
            <p className="text-sm font-medium text-muted-foreground mb-4">Leverage Ratio (Dette nette / EBITDA)</p>
            <LeverageGauge value={leverageRatio} />
          </GlassCard>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="DSO" value={hasAnyBusinessData && dso > 0 ? `${dso.toFixed(0)} j` : EMPTY_DATA_LABEL} description="Delai de recouvrement" alert={dso > 45} />
            <StatCard label="DIO" value={hasAnyBusinessData && dio > 0 ? `${dio.toFixed(0)} j` : EMPTY_DATA_LABEL} description="Jours de stock" />
            <StatCard label="DPO" value={hasFinancialData && dpo > 0 ? `${dpo.toFixed(0)} j` : EMPTY_DATA_LABEL} description="Delai paiement fournisseurs" />
            <StatCard label="CCC" value={hasAnyBusinessData && ccc > 0 ? `${ccc.toFixed(0)} j` : EMPTY_DATA_LABEL} description="Cash Conversion Cycle" alert={ccc > 60} />
          </div>
        </div>
      </section>

      <Suspense fallback={<ChartSectionFallback />}>
        <RevenueConcentrationSection concentrationData={concentrationData} />
      </Suspense>

      {cohortData.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Analyse de Cohortes Revenus</h2>
          <GlassCard>
            <p className="text-sm text-muted-foreground mb-4">
              Revenu moyen par client (CHF) · chaque colonne = mois depuis l'acquisition
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-muted-foreground font-medium py-2 pr-4 w-20 whitespace-nowrap">Cohorte</th>
                    <th className="text-center text-muted-foreground font-medium py-2 pr-3 w-10">n</th>
                    {Array.from({ length: maxCols }, (_, index) => (
                      <th key={index} className="text-center text-muted-foreground font-medium py-2 px-1 min-w-[48px]">
                        M+{index}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohortData.map(row => (
                    <tr key={row.cohort} className="border-t border-border/30">
                      <td className="py-1.5 pr-4 font-medium text-foreground whitespace-nowrap">{row.label}</td>
                      <td className="py-1.5 pr-3 text-center text-muted-foreground">{row.size}</td>
                      {Array.from({ length: maxCols }, (_, index) => {
                        const month = row.months[index];
                        if (!month) {
                          return <td key={index} className="py-1.5 px-1" />;
                        }

                        const intensity = month.avgPerCustomer / maxAvg;
                        const background = `rgba(59,130,246,${Math.max(0.07, intensity * 0.72).toFixed(2)})`;
                        const color = intensity > 0.45 ? "var(--accent-blue)" : "var(--muted-foreground)";

                        return (
                          <td key={index} className="py-1.5 px-1">
                            <div
                              className="rounded text-center text-xs font-medium py-1 tabular-nums"
                              title={`${month.label} - ${month.avgPerCustomer} CHF / client`}
                              style={{ background, color }}
                            >
                              {month.avgPerCustomer > 0 ? month.avgPerCustomer : "-"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </section>
      )}

      <ReportInsightsSection insightCards={insightCards} />

      <ExpenseVariationCard
        expenseVariation={expenseVariation}
        format={format}
        monthlyExpenses={metrics.monthlyExpenses}
        previousMonthExpenses={previousMonthExpenses}
      />
    </div>
  );
}
