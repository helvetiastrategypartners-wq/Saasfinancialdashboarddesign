import { useMemo } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useMetrics }    from "../contexts/MetricsContext";
import { useCurrency }   from "../contexts/CurrencyContext";
import { GlassCard }     from "../components/ui/GlassCard";
import { PageHeader }    from "../components/ui/PageHeader";
import { StatCard }      from "../components/ui/StatCard";
import { CHART_TOOLTIP } from "../lib/chartConfig";

const LEVERAGE_MAX  = 8;
const CONC_COLORS   = ["#3b82f6", "#dc2626", "#f97316", "#60a5fa", "#ef4444", "#6b7280"];

// ── SVG arc helpers ───────────────────────────────────────────────────────────

function polarXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcD(cx: number, cy: number, r: number, fromDeg: number, toDeg: number) {
  const s    = polarXY(cx, cy, r, fromDeg);
  const e    = polarXY(cx, cy, r, toDeg);
  const large = fromDeg - toDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Reports() {
  const { metrics, calculator } = useMetrics();
  const { format } = useCurrency();

  const revenueGrowth    = calculator.calculateRevenueGrowth();
  const expenseVariation = calculator.calculateExpenseVariation();
  const retentionRate    = calculator.calculateRetentionRate();
  const autoInsights     = calculator.getAutomaticInsights();
  const leverageRatio    = calculator.calculateLeverageRatio();
  const dso              = calculator.calculateDSO();
  const dio              = calculator.calculateDIO();
  const dpo              = calculator.calculateDPO();
  const ccc              = calculator.calculateCashConversionCycle();

  const revTrendLabel = `${revenueGrowth    >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% vs mois dernier`;
  const expTrendLabel = `${expenseVariation >= 0 ? "+" : ""}${expenseVariation.toFixed(1)}% vs mois dernier`;
  const cfPositive    = metrics.netCashflow >= 0;

  const insightCards = autoInsights.map((text, i) => {
    const isCritical = text.includes("critique") || text.includes("Critique");
    const isWarning  = text.includes("élevé") || text.includes("court") || text.includes("dépasse");
    const isPositive = text.includes("sain") || text.includes("rentable") || text.includes("positif");
    return {
      id:      i,
      text,
      icon:    isPositive ? CheckCircle : isWarning || isCritical ? AlertTriangle : Info,
      color:   isPositive ? "text-accent-blue"  : isCritical ? "text-accent-red"      : "text-muted-foreground",
      bgColor: isPositive ? "bg-accent-blue/10" : isCritical ? "bg-accent-red-muted"  : "bg-muted",
      border:  isPositive ? "border-accent-blue/30" : isCritical ? "border-accent-red/40" : "border-border",
    };
  });

  const lastMonthLabel = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleDateString("fr-CH", { month: "long", year: "numeric" });

  const concentrationData = useMemo(() => {
    const raw    = calculator.calculateRevenueConcentration();
    const sorted = Object.entries(raw).sort((a, b) => b[1] - a[1]);
    const top5   = sorted.slice(0, 5).map(([name, value], i) => ({
      name, value: Math.round(value * 10) / 10, fill: CONC_COLORS[i],
    }));
    const rest = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
    if (rest > 0.1) top5.push({ name: "Autres", value: Math.round(rest * 10) / 10, fill: CONC_COLORS[5] });
    return top5;
  }, [calculator]);

  const cohortData = useMemo(() => calculator.getCohortRevenueAnalysis(), [calculator]);
  const maxAvg     = useMemo(
    () => Math.max(...cohortData.flatMap(c => c.months.map(m => m.avgPerCustomer)), 1),
    [cohortData],
  );
  const maxCols = useMemo(() => Math.max(...cohortData.map(c => c.months.length), 1), [cohortData]);

  return (
    <div className="p-8 space-y-8">
      <PageHeader title="Rapports & Insights" subtitle={`Résumé automatique de la santé de votre entreprise — ${lastMonthLabel}`} />

      {/* Résumé financier */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Résumé Financier du mois</h2>
        <div className="grid grid-cols-3 gap-6">
          <SummaryCard label="Revenu mensuel"      value={format(metrics.monthlyRevenue)}  trend={revTrendLabel} trendPositive={revenueGrowth >= 0} />
          <SummaryCard label="Dépenses mensuelles" value={format(metrics.monthlyExpenses)} trend={expTrendLabel} trendPositive={expenseVariation <= 0} />
          <SummaryCard label="Cashflow net"        value={format(metrics.netCashflow)}     trend={cfPositive ? "Positif ce mois-ci" : "Négatif ce mois-ci"} trendPositive={cfPositive} />
        </div>
      </section>

      {/* Santé financière */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Santé financière</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="Marge brute"     value={format(metrics.grossMargin)}         description={`${metrics.grossMarginPercent.toFixed(2)}% des revenus`} />
          <StatCard label="Burn rate"       value={format(metrics.burnRate)}            description="Moy. 3 derniers mois" />
          <StatCard label="Runway"          value={`${metrics.runway.toFixed(1)} mois`} description={metrics.cashRisk?.message} alert={metrics.runway < 6} />
          <StatCard label="Cash disponible" value={format(metrics.cash)}               description="Solde bancaire estimé" />
        </div>
      </section>

      {/* Résumé Marketing */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Résumé Marketing du mois</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="CAC"               value={format(metrics.cac)}                               description="Coût d'acquisition client" />
          <StatCard label="Clients acquis"    value={`${metrics.newCustomersMonth}`}                    description="Nouveaux ce mois" />
          <StatCard label="Taux de conversion" value={`${(metrics.conversionRate ?? 0).toFixed(1)}%`}  description="Leads → clients" />
          <StatCard label="ROI Marketing"     value={`${(metrics.marketingROI ?? 0).toFixed(1)}%`}     description="(Revenus − Dépenses) / Dépenses" highlight />
        </div>
      </section>

      {/* Économie Unitaire */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Économie Unitaire</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="ARPU"           value={format(metrics.arpu)}                             description="Revenu / client actif" />
          <StatCard label="LTV"            value={format(metrics.ltv)}                              description="Valeur à vie client" />
          <StatCard label="LTV / CAC"      value={`${metrics.ltvCacRatio.toFixed(1)}x`}            description="Seuil sain ≥ 3x" highlight={metrics.ltvCacRatio >= 3} />
          <StatCard label="Payback Period" value={`${metrics.paybackPeriod.toFixed(1)} mois`}      description="Récupération CAC" />
        </div>
      </section>

      {/* Rétention & Churn */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Rétention clients</h2>
        <div className="grid grid-cols-4 gap-6">
          <StatCard label="Churn rate"     value={`${metrics.churnRate.toFixed(1)}%`} description="Clients perdus / clients début" alert={metrics.churnRate > 5} />
          <StatCard label="Rétention"      value={`${retentionRate.toFixed(1)}%`}     description="100% − churn rate" highlight={retentionRate >= 95} />
          <StatCard label="MRR"            value={format(metrics.mrr)}               description="Revenu mensuel récurrent" />
          <StatCard label="Clients actifs" value={`${metrics.activeCustomers}`}       description="Abonnements actifs" />
        </div>
      </section>

      {/* Structure Financière — Leverage Ratio gauge */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Structure Financière</h2>
        <div className="grid grid-cols-2 gap-6">
          <GlassCard>
            <p className="text-sm font-medium text-muted-foreground mb-4">Leverage Ratio (Dette nette / EBITDA)</p>
            <LeverageGauge value={leverageRatio} />
          </GlassCard>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="DSO" value={`${dso.toFixed(0)} j`} description="Délai de recouvrement" alert={dso > 45} />
            <StatCard label="DIO" value={`${dio.toFixed(0)} j`} description="Jours de stock" />
            <StatCard label="DPO" value={`${dpo.toFixed(0)} j`} description="Délai paiement fournisseurs" />
            <StatCard label="CCC" value={`${ccc.toFixed(0)} j`} description="Cash Conversion Cycle" alert={ccc > 60} />
          </div>
        </div>
      </section>

      {/* Concentration des Revenus */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Concentration des Revenus</h2>
        <div className="grid grid-cols-2 gap-6">
          <GlassCard>
            <p className="text-sm font-medium text-muted-foreground mb-2">Répartition par client (mois dernier)</p>
            {concentrationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={concentrationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    outerRadius={85} innerRadius={42}
                    paddingAngle={3}
                  >
                    {concentrationData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [`${v.toFixed(1)}%`, "Part du revenu"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">Aucune donnée de revenu ce mois.</p>
            )}
          </GlassCard>
          <GlassCard>
            <p className="text-sm font-medium text-muted-foreground mb-4">Top clients par contribution</p>
            <div className="space-y-4">
              {concentrationData.map((entry) => (
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
                <p className="text-muted-foreground text-sm">Aucune donnée disponible.</p>
              )}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Analyse de Cohortes Revenus */}
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
                    {Array.from({ length: maxCols }, (_, i) => (
                      <th key={i} className="text-center text-muted-foreground font-medium py-2 px-1 min-w-[48px]">
                        M+{i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohortData.map((row) => (
                    <tr key={row.cohort} className="border-t border-border/30">
                      <td className="py-1.5 pr-4 font-medium text-foreground whitespace-nowrap">{row.label}</td>
                      <td className="py-1.5 pr-3 text-center text-muted-foreground">{row.size}</td>
                      {Array.from({ length: maxCols }, (_, i) => {
                        const m = row.months[i];
                        if (!m) return <td key={i} className="py-1.5 px-1" />;
                        const intensity = m.avgPerCustomer / maxAvg;
                        const bg  = `rgba(59,130,246,${Math.max(0.07, intensity * 0.72).toFixed(2)})`;
                        const col = intensity > 0.45 ? "var(--accent-blue)" : "var(--muted-foreground)";
                        return (
                          <td key={i} className="py-1.5 px-1">
                            <div
                              className="rounded text-center text-xs font-medium py-1 tabular-nums"
                              title={`${m.label} — ${m.avgPerCustomer} CHF / client`}
                              style={{ background: bg, color: col }}
                            >
                              {m.avgPerCustomer > 0 ? m.avgPerCustomer : "–"}
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

      {/* Variation des dépenses */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Variation des dépenses</h2>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: expenseVariation > 0 ? "var(--accent-red-muted)" : "var(--accent-blue-muted)" }}>
              {expenseVariation > 0
                ? <TrendingUp   className="w-6 h-6 text-accent-red" />
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
        </GlassCard>
      </section>
    </div>
  );
}

// ─── Local presentational components ─────────────────────────────────────────

function SummaryCard({ label, value, trend, trendPositive }: {
  label: string; value: string; trend: string; trendPositive: boolean;
}) {
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

function LeverageGauge({ value }: { value: number }) {
  const cx = 100, cy = 100, r = 70, rn = 55;
  const clamped    = Math.min(LEVERAGE_MAX, Math.max(0, value));
  const toAngle    = (v: number) => 180 - (v / LEVERAGE_MAX) * 180;
  const needleAngle = toAngle(clamped);
  const { x: nx, y: ny } = polarXY(cx, cy, rn, needleAngle);
  const zoneColor  = value < 2 ? "var(--accent-blue)" : value < 4 ? "#f97316" : "var(--accent-red)";
  const zoneLabel  = value < 2 ? "Sain" : value < 4 ? "Modéré" : "Risqué";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 130" className="w-56 h-36">
        {/* Background track */}
        <path d={arcD(cx, cy, r, 180, 0)} fill="none" stroke="var(--border)" strokeWidth={16} strokeLinecap="round" />
        {/* Coloured zones */}
        <path d={arcD(cx, cy, r, 180, toAngle(2))}              fill="none" stroke="var(--accent-blue)" strokeWidth={14} strokeOpacity={0.8} strokeLinecap="round" />
        <path d={arcD(cx, cy, r, toAngle(2), toAngle(4))}       fill="none" stroke="#f97316"             strokeWidth={14} strokeOpacity={0.8} strokeLinecap="round" />
        <path d={arcD(cx, cy, r, toAngle(4), toAngle(LEVERAGE_MAX))} fill="none" stroke="var(--accent-red)" strokeWidth={14} strokeOpacity={0.8} strokeLinecap="round" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={zoneColor} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill={zoneColor} />
        {/* Labels */}
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize={20} fontWeight="700" fill="var(--foreground)">{value.toFixed(2)}x</text>
        <text x={cx} y={cy + 36} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">{zoneLabel}</text>
      </svg>
      <div className="flex gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-blue" />Sain (&lt;2x)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f97316]" />Modéré (2–4x)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-red" />Risqué (&gt;4x)
        </span>
      </div>
    </div>
  );
}
