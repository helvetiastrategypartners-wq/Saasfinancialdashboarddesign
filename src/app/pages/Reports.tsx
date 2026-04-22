import { motion } from "motion/react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useMetrics } from "../contexts/MetricsContext";
import { useCurrency } from '../contexts/CurrencyContext';

export function Reports() {
  const { metrics, calculator } = useMetrics();
  const { format } = useCurrency();

  const revenueGrowth      = calculator.calculateRevenueGrowth();
  const expenseVariation   = calculator.calculateExpenseVariation();
  const retentionRate      = calculator.calculateRetentionRate();
  const autoInsights       = calculator.getAutomaticInsights();

  // Trend labels
  const revTrendLabel  = `${revenueGrowth  >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% vs mois dernier`;
  const expTrendLabel  = `${expenseVariation >= 0 ? "+" : ""}${expenseVariation.toFixed(1)}% vs mois dernier`;
  const cfPositive     = metrics.netCashflow >= 0;

  // Map auto-insight strings to UI objects
  const insightCards = autoInsights.map((text, i) => {
    const isCritical = text.includes("critique") || text.includes("Critique");
    const isWarning  = text.includes("élevé") || text.includes("court") || text.includes("dépasse");
    const isPositive = text.includes("sain") || text.includes("rentable") || text.includes("positif");
    return {
      id: i,
      text,
      icon: isPositive ? CheckCircle : isWarning || isCritical ? AlertTriangle : Info,
      color:   isPositive ? "text-accent-blue" : isCritical ? "text-accent-red" : "text-muted-foreground",
      bgColor: isPositive ? "bg-accent-blue/10" : isCritical ? "bg-accent-red-muted" : "bg-muted",
      border:  isPositive ? "border-accent-blue/30" : isCritical ? "border-accent-red/40" : "border-border",
    };
  });

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">Rapports & Insights</h1>
        <p className="text-muted-foreground text-lg">
          Résumé automatique de la santé de votre entreprise —{" "}
          {new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
            .toLocaleDateString("fr-CH", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Résumé Financier */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Résumé Financier du mois</h2>
        <div className="grid grid-cols-3 gap-6">
          <SummaryCard
            label="Revenu mensuel"
            value={format(metrics.monthlyRevenue)}
            trend={revTrendLabel}
            trendPositive={revenueGrowth >= 0}
          />
          <SummaryCard
            label="Dépenses mensuelles"
            value={format(metrics.monthlyExpenses)}
            trend={expTrendLabel}
            trendPositive={expenseVariation <= 0}
          />
          <SummaryCard
            label="Cashflow net"
            value={format(metrics.netCashflow)}
            trend={cfPositive ? "Positif ce mois-ci" : "Négatif ce mois-ci"}
            trendPositive={cfPositive}
          />
        </div>
      </section>

      {/* Résumé Financier étendu */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Santé financière</h2>
        <div className="grid grid-cols-4 gap-6">
          <MetricCard label="Marge brute"         value={format(metrics.grossMargin)}               description={`${metrics.grossMarginPercent.toFixed(2)}% des revenus`} />
          <MetricCard label="Burn rate"            value={format(metrics.burnRate)}                  description="Moy. 3 derniers mois" />
          <MetricCard label="Runway"               value={`${metrics.runway.toFixed(1)} mois`}                   description={metrics.cashRisk?.message} alert={metrics.runway < 6} />
          <MetricCard label="Cash disponible"      value={format(metrics.cash)}                      description="Solde bancaire estimé" />
        </div>
      </section>

      {/* Résumé Marketing */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Résumé Marketing du mois</h2>
        <div className="grid grid-cols-4 gap-6">
          <MetricCard label="CAC"               value={format(metrics.cac)}                     description="Coût d'acquisition client" />
          <MetricCard label="Clients acquis"    value={`${metrics.newCustomersMonth}`}                       description="Nouveaux ce mois" />
          <MetricCard label="Taux de conversion" value={`${(metrics.conversionRate ?? 0).toFixed(1)}%`}      description="Leads → clients" />
          <MetricCard label="ROI Marketing"     value={`${(metrics.marketingROI ?? 0).toFixed(1)}%`}        description="(Revenus − Dépenses) / Dépenses" highlight />
        </div>
      </section>

      {/* Économie Unitaire */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Économie Unitaire</h2>
        <div className="grid grid-cols-4 gap-6">
          <MetricCard label="ARPU"            value={format(metrics.arpu)}               description="Revenu / client actif" />
          <MetricCard label="LTV"             value={format(metrics.ltv)}                description="Valeur à vie client" />
          <MetricCard label="LTV / CAC"       value={`${metrics.ltvCacRatio.toFixed(1)}x`}           description="Seuil sain ≥ 3x" highlight={metrics.ltvCacRatio >= 3} />
          <MetricCard label="Payback Period"  value={`${metrics.paybackPeriod.toFixed(1)} mois`}     description="Récupération CAC" />
        </div>
      </section>

      {/* Rétention & Churn */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Rétention clients</h2>
        <div className="grid grid-cols-4 gap-6">
          <MetricCard label="Churn rate"         value={`${metrics.churnRate.toFixed(1)}%`}         description="Clients perdus / clients début" alert={metrics.churnRate > 5} />
          <MetricCard label="Rétention"          value={`${retentionRate.toFixed(1)}%`}             description="100% − churn rate" highlight={retentionRate >= 95} />
          <MetricCard label="MRR"                value={format(metrics.mrr)}            description="Revenu mensuel récurrent" />
          <MetricCard label="Clients actifs"     value={`${metrics.activeCustomers}`}               description="Abonnements actifs" />
        </div>
      </section>

      {/* Insights automatiques */}
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
                <div className={`w-12 h-12 rounded-xl ${insight.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <insight.icon className={`w-6 h-6 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-base font-medium ${insight.color}`}>{insight.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {insightCards.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border text-center"
              style={{ background: "var(--glass-bg)" }}
            >
              <p className="text-muted-foreground">Aucun insight disponible pour ce mois.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Variation des dépenses */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Variation des dépenses</h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
          style={{ background: "var(--glass-bg)" }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: expenseVariation > 0 ? "var(--accent-red-muted)" : "var(--accent-blue-muted)" }}>
              {expenseVariation > 0
                ? <TrendingUp className="w-6 h-6 text-accent-red" />
                : <TrendingDown className="w-6 h-6 text-accent-blue" />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variation dépenses (M-1 vs M-2)</p>
              <p className={`text-2xl font-semibold ${expenseVariation > 0 ? "text-accent-red" : "text-accent-blue"}`}>
                {expenseVariation >= 0 ? "+" : ""}{expenseVariation.toFixed(1)}%
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Mars vs Février 2026</p>
              <p className="text-sm text-foreground">
                {format(metrics.monthlyExpenses)} vs {format(metrics.monthlyExpenses / (1 + expenseVariation / 100))}
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, trend, trendPositive }: { label: string; value: string; trend: string; trendPositive: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-2xl p-6 backdrop-blur-xl border ${trendPositive ? "border-accent-blue" : "border-accent-red"}`}
      style={{ background: "var(--glass-bg)" }}
    >
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className={`text-3xl font-semibold mb-2 ${trendPositive ? "text-accent-blue" : "text-accent-red"}`}>{value}</p>
      <div className={`flex items-center gap-1 text-sm ${trendPositive ? "text-accent-blue" : "text-accent-red"}`}>
        {trendPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {trend}
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, description, highlight = false, alert = false }: {
  label: string; value: string; description?: string; highlight?: boolean; alert?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-2xl p-6 backdrop-blur-xl border transition-all ${
        alert ? "border-accent-red/40" : highlight ? "border-accent-blue/30" : "border-glass-border hover:border-accent-red/20"
      }`}
      style={{ background: "var(--glass-bg)" }}
    >
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${alert ? "text-accent-red" : highlight ? "text-accent-blue" : "text-foreground"}`}>{value}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </motion.div>
  );
}
