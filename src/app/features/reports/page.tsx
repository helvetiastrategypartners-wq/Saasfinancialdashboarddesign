import { useMemo } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useMetrics } from "../../contexts/MetricsContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { SummaryCard } from "./components/SummaryCard";
import { LeverageGauge } from "./components/LeverageGauge";
import { CHART_TOOLTIP } from "../../lib/chartConfig";
import { useReportsData } from "./hooks/useReportsData";

export function Reports() {
  const { metrics, calculator } = useMetrics();
  const { format } = useCurrency();

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
          <SummaryCard label="Cashflow net" value={format(metrics.netCashflow)} trend={cashflowPositive ? "Positif ce mois-ci" : "Negatif ce mois-ci"} trendPositive={cashflowPositive} />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Sante financiere</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="Marge brute" value={format(metrics.grossMargin)} description={`${metrics.grossMarginPercent.toFixed(2)}% des revenus`} />
          <StatCard label="Burn rate" value={format(metrics.burnRate)} description="Moy. 3 derniers mois" />
          <StatCard label="Runway" value={`${metrics.runway.toFixed(1)} mois`} description={metrics.cashRisk?.message} alert={metrics.runway < 6} />
          <StatCard label="Cash disponible" value={format(metrics.cash)} description="Solde bancaire estime" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Resume Marketing du mois</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="CAC" value={format(metrics.cac)} description="Cout d'acquisition client" />
          <StatCard label="Clients acquis" value={`${metrics.newCustomersMonth}`} description="Nouveaux ce mois" />
          <StatCard label="Taux de conversion" value={`${(metrics.conversionRate ?? 0).toFixed(1)}%`} description="Leads vers clients" />
          <StatCard label="ROI Marketing" value={`${(metrics.marketingROI ?? 0).toFixed(1)}%`} description="(Revenus - Depenses) / Depenses" highlight />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Economie Unitaire</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="ARPU" value={format(metrics.arpu)} description="Revenu / client actif" />
          <StatCard label="LTV" value={format(metrics.ltv)} description="Valeur a vie client" />
          <StatCard label="LTV / CAC" value={`${metrics.ltvCacRatio.toFixed(1)}x`} description="Seuil sain >= 3x" highlight={metrics.ltvCacRatio >= 3} />
          <StatCard label="Payback Period" value={`${metrics.paybackPeriod.toFixed(1)} mois`} description="Recuperation CAC" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Retention clients</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="Churn rate" value={`${metrics.churnRate.toFixed(1)}%`} description="Clients perdus / clients debut" alert={metrics.churnRate > 5} />
          <StatCard label="Retention" value={`${retentionRate.toFixed(1)}%`} description="100% - churn rate" highlight={retentionRate >= 95} />
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
            <StatCard label="DSO" value={`${dso.toFixed(0)} j`} description="Delai de recouvrement" alert={dso > 45} />
            <StatCard label="DIO" value={`${dio.toFixed(0)} j`} description="Jours de stock" />
            <StatCard label="DPO" value={`${dpo.toFixed(0)} j`} description="Delai paiement fournisseurs" />
            <StatCard label="CCC" value={`${ccc.toFixed(0)} j`} description="Cash Conversion Cycle" alert={ccc > 60} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Concentration des Revenus</h2>
        <div className="grid grid-cols-2 gap-6">
          <GlassCard>
            <p className="text-sm font-medium text-muted-foreground mb-2">Repartition par client (mois dernier)</p>
            {concentrationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={concentrationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={42}
                    paddingAngle={3}
                  >
                    {concentrationData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => [`${value.toFixed(1)}%`, "Part du revenu"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">Aucune donnee de revenu ce mois.</p>
            )}
          </GlassCard>

          <GlassCard>
            <p className="text-sm font-medium text-muted-foreground mb-4">Top clients par contribution</p>
            <div className="space-y-4">
              {concentrationData.map(entry => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: entry.fill }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-foreground truncate">{entry.name}</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground ml-2">{entry.value.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${entry.value}%`, background: entry.fill }} />
                    </div>
                  </div>
                </div>
              ))}
              {concentrationData.length === 0 && (
                <p className="text-muted-foreground text-sm">Aucune donnee disponible.</p>
              )}
            </div>
          </GlassCard>
        </div>
      </section>

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

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Insights Automatiques</h2>
        <div className="space-y-4">
          {insightCards.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`rounded-2xl p-6 backdrop-blur-xl border ${insight.border}`}
              style={{ background: "var(--glass-bg)" }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${insight.bgColor} flex items-center justify-center shrink-0`}>
                  <insight.icon className={`w-6 h-6 ${insight.color}`} />
                </div>
                <p className={`text-base font-medium ${insight.color} self-center`}>{insight.text}</p>
              </div>
            </motion.div>
          ))}
          {insightCards.length === 0 && (
            <GlassCard className="text-center">
              <p className="text-muted-foreground">Aucun insight disponible pour ce mois.</p>
            </GlassCard>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Variation des depenses</h2>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: expenseVariation > 0 ? "var(--accent-red-muted)" : "var(--accent-blue-muted)" }}>
              {expenseVariation > 0
                ? <TrendingUp className="w-6 h-6 text-accent-red" />
                : <TrendingDown className="w-6 h-6 text-accent-blue" />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variation depenses (M-1 vs M-2)</p>
              <p className={`text-2xl font-semibold ${expenseVariation > 0 ? "text-accent-red" : "text-accent-blue"}`}>
                {expenseVariation >= 0 ? "+" : ""}{expenseVariation.toFixed(1)}%
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Mars vs Fevrier 2026</p>
              <p className="text-sm text-foreground">
                {format(metrics.monthlyExpenses)} vs {format(previousMonthExpenses)}
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
