import { motion, AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { useMetrics } from "../contexts/MetricsContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { Overlay, Field, DeleteConfirm, inputCls, useToast } from "../components/Modal";
import { GlassCard }    from "../components/ui/GlassCard";
import { PageHeader }   from "../components/ui/PageHeader";
import { StatCard }     from "../components/ui/StatCard";
import { CHART_TOOLTIP } from "../lib/chartConfig";
import type { MarketingMetrics } from "@shared/types";

type ModalMode = "add" | "edit" | "delete" | null;

const now        = new Date();
const MONTH_START = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
const MONTH_END   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

const EMPTY_FORM = {
  channel_id:         "",
  period_start:       MONTH_START,
  period_end:         MONTH_END,
  spend:              "",
  revenue_generated:  "",
  customers_acquired: "",
  leads:              "",
  mql:                "",
  sql:                "",
};

export function Marketing() {
  const { metrics, calculator, marketingMetrics, addMarketingMetric, updateMarketingMetric, deleteMarketingMetric } = useMetrics();
  const { format } = useCurrency();
  const { show, ToastEl } = useToast();

  const [modal,    setModal]    = useState<ModalMode>(null);
  const [selected, setSelected] = useState<MarketingMetrics | null>(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);

  const lastMonthKey = useMemo(() => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }, []);

  const monthlyMetrics   = marketingMetrics.filter(m => m.period_start?.startsWith(lastMonthKey));
  const revenueByChannel = calculator.getRevenueByChannel();
  const cacByChannel     = calculator.getCACByChannel();

  const spendVsRevenue = monthlyMetrics.map(m => ({ canal: m.channel_id ?? "Autre", spend: m.spend, revenue: m.revenue_generated }));
  const roiData        = monthlyMetrics.map(m => ({ canal: m.channel_id ?? "Autre", roi: m.spend > 0 ? Math.round(((m.revenue_generated - m.spend) / m.spend) * 100) : 0 }));

  const totalSpend   = monthlyMetrics.reduce((s, m) => s + m.spend, 0);
  const totalRevenue = monthlyMetrics.reduce((s, m) => s + m.revenue_generated, 0);
  const totalClients = monthlyMetrics.reduce((s, m) => s + m.customers_acquired, 0);
  const totalLeads   = monthlyMetrics.reduce((s, m) => s + (m.leads ?? 0), 0);
  const totalMql     = monthlyMetrics.reduce((s, m) => s + (m.mql ?? 0), 0);
  const totalSql     = monthlyMetrics.reduce((s, m) => s + (m.sql ?? 0), 0);
  const avgRoas      = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const ltvCacData = useMemo(() => {
    const rows: Array<{ canal: string; ltv: number; cac: number }> = [
      { canal: "Global", ltv: metrics.ltv, cac: metrics.cac },
    ];
    for (const [canal, cac] of Object.entries(cacByChannel)) {
      rows.push({ canal, ltv: Math.round(Number(cac) * metrics.ltvCacRatio), cac: Number(cac) });
    }
    return rows;
  }, [metrics, cacByChannel]);

  const funnelStages = useMemo(() => {
    const max = Math.max(totalLeads, 1);
    return [
      { label: "Leads",   value: totalLeads,   color: "#3b82f6", pct: 100 },
      { label: "MQL",     value: totalMql,     color: "#8b5cf6", pct: (totalMql / max) * 100 },
      { label: "SQL",     value: totalSql,     color: "#f97316", pct: (totalSql  / max) * 100 },
      { label: "Clients", value: totalClients, color: "#10b981", pct: (totalClients / max) * 100 },
    ];
  }, [totalLeads, totalMql, totalSql, totalClients]);

  const monthLabel = new Date(lastMonthKey).toLocaleDateString("fr-CH", { month: "long", year: "numeric" });

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  function openAdd() { setForm(EMPTY_FORM); setSelected(null); setModal("add"); }

  function openEdit(m: MarketingMetrics) {
    setForm({ channel_id: m.channel_id ?? "", period_start: m.period_start, period_end: m.period_end, spend: String(m.spend), revenue_generated: String(m.revenue_generated), customers_acquired: String(m.customers_acquired), leads: String(m.leads ?? ""), mql: String(m.mql ?? ""), sql: String(m.sql ?? "") });
    setSelected(m);
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    const payload = { channel_id: form.channel_id || undefined, period_start: form.period_start, period_end: form.period_end, spend: parseFloat(form.spend) || 0, revenue_generated: parseFloat(form.revenue_generated) || 0, customers_acquired: parseInt(form.customers_acquired) || 0, leads: form.leads ? parseInt(form.leads) : undefined, mql: form.mql ? parseInt(form.mql) : undefined, sql: form.sql ? parseInt(form.sql) : undefined };
    if (modal === "add") { await addMarketingMetric(payload); show("Métriques ajoutées"); }
    else if (modal === "edit" && selected) { await updateMarketingMetric(selected.id, payload); show("Métriques mises à jour"); }
    setSaving(false);
    setModal(null);
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    await deleteMarketingMetric(selected.id);
    setSaving(false);
    setModal(null);
    show("Métriques supprimées");
  }

  return (
    <div className="p-8 space-y-8">
      {ToastEl}

      <PageHeader
        title="Marketing & Growth"
        subtitle={`Suivi des dépenses marketing, ROI et acquisition client — ${monthLabel}`}
        action={
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors shadow-lg">
            <Plus className="w-5 h-5" /> Ajouter des métriques
          </motion.button>
        }
      />

      {/* KPI rows */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="CAC"            value={format(metrics.cac)}                          description="Coût d'acquisition client" />
        <StatCard label="LTV"            value={format(metrics.ltv)}                          description="Valeur à vie client" />
        <StatCard label="LTV / CAC"      value={`${metrics.ltvCacRatio.toFixed(1)}x`}         description="Seuil sain ≥ 3x" highlight={metrics.ltvCacRatio >= 3} />
        <StatCard label="Payback period" value={`${metrics.paybackPeriod.toFixed(1)} mois`}   description="Récupération CAC" />
      </div>
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="ROI Marketing"      value={`${(metrics.marketingROI ?? 0).toFixed(1)}%`}  description="(Revenus − Dépenses) / Dépenses" highlight={(metrics.marketingROI ?? 0) > 100} />
        <StatCard label="Taux de conversion" value={`${(metrics.conversionRate ?? 0).toFixed(1)}%`} description="Leads → clients" />
        <StatCard label="Dépense marketing"  value={format(totalSpend)}                              description={monthLabel} />
        <StatCard label="Clients acquis"     value={`+${totalClients}`}                              description={monthLabel} highlight />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Revenu généré" value={format(totalRevenue)} description="Canaux marketing" />
        <StatCard label="Total leads"   value={`${totalLeads}`}      description={monthLabel} />
        <StatCard label="ROAS moyen"    value={`${avgRoas.toFixed(2)}x`} description="Revenu / Dépense" highlight={avgRoas > 2} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-xl font-semibold text-foreground mb-6">Dépense vs Revenu par canal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendVsRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="canal" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [format(v)]} />
              <Bar dataKey="spend"   name="Dépense" fill="var(--accent-red)"  radius={[8,8,0,0]} />
              <Bar dataKey="revenue" name="Revenu"  fill="var(--accent-blue)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-red" /><span className="text-sm text-muted-foreground">Dépense</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-blue" /><span className="text-sm text-muted-foreground">Revenu</span></div>
          </div>
        </GlassCard>

        <GlassCard delay={0.1}>
          <h3 className="text-xl font-semibold text-foreground mb-6">ROI % par canal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} unit="%" />
              <YAxis dataKey="canal" type="category" stroke="var(--muted-foreground)" fontSize={12} width={90} />
              <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [`${v}%`, "ROI"]} />
              <Bar dataKey="roi" name="ROI" radius={[0,8,8,0]}>
                {roiData.map((_e, idx) => <Cell key={`roi-${idx}`} fill="var(--accent-blue)" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Growth Finance — LTV vs CAC */}
      <GlassCard delay={0.2}>
        <h3 className="text-xl font-semibold text-foreground mb-2">LTV vs CAC par canal</h3>
        <p className="text-sm text-muted-foreground mb-6">Seuil sain : LTV ≥ 3× CAC</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ltvCacData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="canal" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [format(v)]} />
            <Legend />
            <Bar dataKey="ltv" name="LTV" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="cac" name="CAC" fill="var(--accent-red)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className={`font-semibold ${metrics.ltvCacRatio >= 3 ? "text-blue-400" : metrics.ltvCacRatio >= 1.5 ? "text-red-400" : "text-red-400"}`}>
            Ratio global : {metrics.ltvCacRatio.toFixed(1)}
          </span>
          <span>— {metrics.ltvCacRatio >= 3 ? "Sain ✓" : metrics.ltvCacRatio >= 1.5 ? "À surveiller" : "Critique"}</span>
        </div>
      </GlassCard>

      {/* Unit Economic Engine — Lead Funnel */}
      <GlassCard delay={0.25}>
        <h3 className="text-xl font-semibold text-foreground mb-2">Entonnoir de conversion</h3>
        <p className="text-sm text-muted-foreground mb-6">{monthLabel} — leads → MQL → SQL → clients</p>
        <div className="space-y-4">
          {funnelStages.map((stage, i) => {
            const convRate = i > 0 && funnelStages[i - 1].value > 0
              ? (stage.value / funnelStages[i - 1].value) * 100
              : null;
            return (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                    <span className="text-sm font-medium text-foreground">{stage.label}</span>
                    {convRate !== null && (
                      <span className="text-xs text-muted-foreground">← {convRate.toFixed(1)}% du précédent</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: stage.color }}>
                    {stage.value.toLocaleString("fr-CH")}
                  </span>
                </div>
                <div className="h-8 rounded-lg overflow-hidden" style={{ background: "var(--secondary)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.pct}%` }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.1, ease: "easeOut" }}
                    className="h-full rounded-lg"
                    style={{ background: stage.color, opacity: 0.8 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Leads → Clients", value: totalLeads > 0 ? ((totalClients / totalLeads) * 100).toFixed(1) + "%" : "—" },
            { label: "Leads → MQL",     value: totalLeads > 0 ? ((totalMql / totalLeads) * 100).toFixed(1) + "%" : "—" },
            { label: "SQL → Clients",   value: totalSql   > 0 ? ((totalClients / totalSql) * 100).toFixed(1) + "%" : "—" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-3 border border-glass-border text-center" style={{ background: "var(--glass-bg)" }}>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-base font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Revenue by channel */}
      {Object.keys(revenueByChannel).length > 0 && (
        <GlassCard delay={0.15}>
          <h3 className="text-xl font-semibold text-foreground mb-4">Revenue par canal (transactions)</h3>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(revenueByChannel).map(([canal, rev]) => (
              <div key={canal} className="rounded-xl p-4 border border-glass-border/50" style={{ background: "var(--glass-bg)" }}>
                <p className="text-xs text-muted-foreground mb-1">{canal}</p>
                <p className="text-lg font-semibold text-foreground">{format(rev as number)}</p>
                <p className="text-xs text-muted-foreground mt-1">CAC : {format((cacByChannel as Record<string, number>)[canal] ?? 0)}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Campaigns table */}
      <GlassCard delay={0.3} noPadding>
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-xl font-semibold text-foreground">Détail des campagnes — {monthLabel}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                {["Canal","Dépense","Leads","Clients","CAC","Revenu généré","ROAS","Actions"].map((h, i) => (
                  <th key={h} className={`p-4 text-sm font-semibold text-muted-foreground ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyMetrics.map((m, index) => {
                const cac  = m.customers_acquired > 0 ? m.spend / m.customers_acquired : 0;
                const roas = m.spend > 0 ? m.revenue_generated / m.spend : 0;
                return (
                  <motion.tr key={m.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + index * 0.05 }} className="border-b border-glass-border/50 hover:bg-glass-hover transition-colors">
                    <td className="p-4 text-sm font-semibold text-foreground">{m.channel_id ?? "—"}</td>
                    <td className="p-4 text-sm text-right text-foreground">{format(m.spend)}</td>
                    <td className="p-4 text-sm text-right text-foreground">{m.leads ?? 0}</td>
                    <td className="p-4 text-sm text-right text-accent-blue font-semibold">{m.customers_acquired}</td>
                    <td className="p-4 text-sm text-right text-foreground">{format(cac)}</td>
                    <td className="p-4 text-sm text-right text-foreground">{format(m.revenue_generated)}</td>
                    <td className="p-4 text-sm text-right text-foreground">{roas.toFixed(2)}x</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-glass-hover transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setSelected(m); setModal("delete"); }} className="p-2 rounded-lg hover:bg-accent-red/20 transition-colors"><Trash2 className="w-4 h-4 text-accent-red" /></motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {monthlyMetrics.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">Aucune métrique pour ce mois.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modals */}
      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <Overlay onClose={() => setModal(null)} title={modal === "add" ? "Nouvelles métriques" : "Modifier les métriques"}>
            <div className="space-y-4">
              <Field label="Canal (ID)">
                <input type="text" value={form.channel_id} onChange={e => f("channel_id", e.target.value)} placeholder="Ex: LinkedIn, Google Ads, SEO…" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Début de période"><input type="date" value={form.period_start} onChange={e => f("period_start", e.target.value)} className={inputCls} /></Field>
                <Field label="Fin de période"><input type="date" value={form.period_end} onChange={e => f("period_end", e.target.value)} className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Dépense (CHF)"><input type="number" min="0" step="0.01" value={form.spend} onChange={e => f("spend", e.target.value)} placeholder="0.00" className={inputCls} /></Field>
                <Field label="Revenu généré (CHF)"><input type="number" min="0" step="0.01" value={form.revenue_generated} onChange={e => f("revenue_generated", e.target.value)} placeholder="0.00" className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Leads"><input type="number" min="0" value={form.leads} onChange={e => f("leads", e.target.value)} placeholder="0" className={inputCls} /></Field>
                <Field label="Clients acquis"><input type="number" min="0" value={form.customers_acquired} onChange={e => f("customers_acquired", e.target.value)} placeholder="0" className={inputCls} /></Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">Annuler</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === "add" ? "Ajouter" : "Enregistrer"}
              </motion.button>
            </div>
          </Overlay>
        )}
        {modal === "delete" && selected && (
          <DeleteConfirm
            label="Supprimer les métriques ?"
            detail={`Canal "${selected.channel_id ?? "Autre"}" — période ${selected.period_start} sera définitivement supprimé.`}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}