import { AnimatePresence, motion } from "motion/react";
import { Loader2, Plus } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { DeleteConfirm, Field, Overlay, inputCls, useToast } from "../../components/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { GlassCard } from "../../components/ui/GlassCard";
import { MarketingCampaignTable } from "./components";
import {
  buildMarketingPayload,
  EMPTY_MARKETING_FORM,
  toMarketingForm,
  useMarketingData,
  type MarketingFormState,
} from "./hooks";
import type { MarketingMetrics } from "@shared/types";

const MarketingChartsSection = lazy(() =>
  import("./components/MarketingChartsSection").then((module) => ({ default: module.MarketingChartsSection })),
);

type ModalMode = "add" | "edit" | "delete" | null;

function ChartSectionFallback() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl border border-glass-border animate-pulse" style={{ background: "var(--glass-bg)", minHeight: 300 }} />
        <div className="rounded-2xl border border-glass-border animate-pulse" style={{ background: "var(--glass-bg)", minHeight: 300 }} />
      </div>
      <div className="rounded-2xl border border-glass-border animate-pulse" style={{ background: "var(--glass-bg)", minHeight: 280 }} />
    </div>
  );
}

export function Marketing() {
  const { show, ToastEl } = useToast();
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedMetric, setSelectedMetric] = useState<MarketingMetrics | null>(null);
  const [form, setForm] = useState<MarketingFormState>(EMPTY_MARKETING_FORM);
  const [saving, setSaving] = useState(false);

  const {
    metrics,
    format,
    monthlyMetrics,
    revenueByChannel,
    cacByChannel,
    spendVsRevenue,
    roiData,
    totalSpend,
    totalRevenue,
    totalClients,
    totalLeads,
    totalMql,
    totalSql,
    avgRoas,
    ltvCacData,
    funnelStages,
    monthLabel,
    addMarketingMetric,
    updateMarketingMetric,
    deleteMarketingMetric,
  } = useMarketingData();

  function updateForm<K extends keyof MarketingFormState>(key: K, value: MarketingFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY_MARKETING_FORM);
    setSelectedMetric(null);
    setModal("add");
  }

  function openEdit(metric: MarketingMetrics) {
    setForm(toMarketingForm(metric));
    setSelectedMetric(metric);
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    const payload = buildMarketingPayload(form);

    if (modal === "add") {
      await addMarketingMetric(payload);
      show("Metriques ajoutees");
    } else if (modal === "edit" && selectedMetric) {
      await updateMarketingMetric(selectedMetric.id, payload);
      show("Metriques mises a jour");
    }

    setSaving(false);
    setModal(null);
  }

  async function handleDelete() {
    if (!selectedMetric) return;
    setSaving(true);
    await deleteMarketingMetric(selectedMetric.id);
    setSaving(false);
    setModal(null);
    show("Metriques supprimees");
  }

  return (
    <div className="p-8 space-y-8">
      {ToastEl}
      <PageHeader
        title="Marketing & Growth"
        subtitle={`Suivi des depenses marketing, ROI et acquisition client - ${monthLabel}`}
        action={
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openAdd} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors shadow-lg">
            <Plus className="w-5 h-5" /> Ajouter des metriques
          </motion.button>
        }
      />

      <div className="grid grid-cols-4 gap-6">
        <StatCard label="CAC" value={format(metrics.cac)} description="Cout d'acquisition client" />
        <StatCard label="LTV" value={format(metrics.ltv)} description="Valeur a vie client" />
        <StatCard label="LTV / CAC" value={`${metrics.ltvCacRatio.toFixed(1)}x`} description="Seuil sain >= 3x" highlight={metrics.ltvCacRatio >= 3} />
        <StatCard label="Payback period" value={`${metrics.paybackPeriod.toFixed(1)} mois`} description="Recuperation CAC" />
      </div>
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="ROI Marketing" value={`${(metrics.marketingROI ?? 0).toFixed(1)}%`} description="(Revenus - Depenses) / Depenses" highlight={(metrics.marketingROI ?? 0) > 100} />
        <StatCard label="Taux de conversion" value={`${(metrics.conversionRate ?? 0).toFixed(1)}%`} description="Leads -> clients" />
        <StatCard label="Depense marketing" value={format(totalSpend)} description={monthLabel} />
        <StatCard label="Clients acquis" value={`+${totalClients}`} description={monthLabel} highlight />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Revenu genere" value={format(totalRevenue)} description="Canaux marketing" />
        <StatCard label="Total leads" value={`${totalLeads}`} description={monthLabel} />
        <StatCard label="ROAS moyen" value={`${avgRoas.toFixed(2)}x`} description="Revenu / Depense" highlight={avgRoas > 2} />
      </div>

      <Suspense fallback={<ChartSectionFallback />}>
        <MarketingChartsSection
          avgRatio={metrics.ltvCacRatio}
          formatCurrency={format}
          ltvCacData={ltvCacData}
          roiData={roiData}
          spendVsRevenue={spendVsRevenue}
        />
      </Suspense>

      <GlassCard delay={0.25}>
        <h3 className="text-xl font-semibold text-foreground mb-2">Entonnoir de conversion</h3>
        <p className="text-sm text-muted-foreground mb-6">{monthLabel} - parcours leads vers MQL puis SQL puis clients</p>
        <div className="space-y-4">
          {funnelStages.map((stage, index) => {
            const conversionRate =
              index > 0 && funnelStages[index - 1].value > 0
                ? (stage.value / funnelStages[index - 1].value) * 100
                : null;

            return (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                    <span className="text-sm font-medium text-foreground">{stage.label}</span>
                    {conversionRate !== null && <span className="text-xs text-muted-foreground">{conversionRate.toFixed(1)}% du precedent</span>}
                  </div>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: stage.color }}>
                    {stage.value.toLocaleString("fr-CH")}
                  </span>
                </div>
                <div className="h-8 rounded-lg overflow-hidden" style={{ background: "var(--secondary)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.7, delay: 0.1 + index * 0.1, ease: "easeOut" }} className="h-full rounded-lg" style={{ background: stage.color, opacity: 0.8 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Leads vers Clients", value: totalLeads > 0 ? `${((totalClients / totalLeads) * 100).toFixed(1)}%` : "-" },
            { label: "Leads vers MQL", value: totalLeads > 0 ? `${((totalMql / totalLeads) * 100).toFixed(1)}%` : "-" },
            { label: "SQL vers Clients", value: totalSql > 0 ? `${((totalClients / totalSql) * 100).toFixed(1)}%` : "-" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-3 border border-glass-border text-center" style={{ background: "var(--glass-bg)" }}>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-base font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {Object.keys(revenueByChannel).length > 0 && (
        <GlassCard delay={0.15}>
          <h3 className="text-xl font-semibold text-foreground mb-4">Revenue par canal (transactions)</h3>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(revenueByChannel).map(([channel, revenue]) => (
              <div key={channel} className="rounded-xl p-4 border border-glass-border/50" style={{ background: "var(--glass-bg)" }}>
                <p className="text-xs text-muted-foreground mb-1">{channel}</p>
                <p className="text-lg font-semibold text-foreground">{format(revenue as number)}</p>
                <p className="text-xs text-muted-foreground mt-1">CAC : {format((cacByChannel as Record<string, number>)[channel] ?? 0)}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <MarketingCampaignTable
        monthlyMetrics={monthlyMetrics}
        monthLabel={monthLabel}
        format={format}
        onEdit={openEdit}
        onDelete={(metric) => {
          setSelectedMetric(metric);
          setModal("delete");
        }}
      />

      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <Overlay onClose={() => setModal(null)} title={modal === "add" ? "Nouvelles metriques" : "Modifier les metriques"}>
            <div className="space-y-4">
              <Field label="Canal (ID)">
                <input type="text" value={form.channel_id} onChange={(event) => updateForm("channel_id", event.target.value)} placeholder="Ex: LinkedIn, Google Ads, SEO..." className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Debut de periode"><input type="date" value={form.period_start} onChange={(event) => updateForm("period_start", event.target.value)} className={inputCls} /></Field>
                <Field label="Fin de periode"><input type="date" value={form.period_end} onChange={(event) => updateForm("period_end", event.target.value)} className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Depense (CHF)"><input type="number" min="0" step="0.01" value={form.spend} onChange={(event) => updateForm("spend", event.target.value)} placeholder="0.00" className={inputCls} /></Field>
                <Field label="Revenu genere (CHF)"><input type="number" min="0" step="0.01" value={form.revenue_generated} onChange={(event) => updateForm("revenue_generated", event.target.value)} placeholder="0.00" className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Leads"><input type="number" min="0" value={form.leads} onChange={(event) => updateForm("leads", event.target.value)} placeholder="0" className={inputCls} /></Field>
                <Field label="Clients acquis"><input type="number" min="0" value={form.customers_acquired} onChange={(event) => updateForm("customers_acquired", event.target.value)} placeholder="0" className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="MQL"><input type="number" min="0" value={form.mql} onChange={(event) => updateForm("mql", event.target.value)} placeholder="0" className={inputCls} /></Field>
                <Field label="SQL"><input type="number" min="0" value={form.sql} onChange={(event) => updateForm("sql", event.target.value)} placeholder="0" className={inputCls} /></Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === "add" ? "Ajouter" : "Enregistrer"}
              </motion.button>
            </div>
          </Overlay>
        )}
        {modal === "delete" && selectedMetric && (
          <DeleteConfirm
            label="Supprimer les metriques ?"
            detail={`Canal "${selectedMetric.channel_id ?? "Autre"}" - periode ${selectedMetric.period_start} sera definitivement supprime.`}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
