import { motion, AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMetrics } from "../contexts/MetricsContext";
import { formatCurrencyShort } from "../../utils/currency";
import { Overlay, Field, DeleteConfirm, inputCls, useToast } from "../components/Modal";
import type { MarketingMetrics } from "@shared/types";

type ModalMode = "add" | "edit" | "delete" | null;

const now = new Date();
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
};

export function Marketing() {
  const { metrics, calculator, marketingMetrics, addMarketingMetric, updateMarketingMetric, deleteMarketingMetric } = useMetrics();
  const { show, ToastEl } = useToast();
  const [modal,    setModal]   = useState<ModalMode>(null);
  const [selected, setSelected] = useState<MarketingMetrics | null>(null);
  const [form,     setForm]    = useState(EMPTY_FORM);
  const [saving,   setSaving]  = useState(false);

  const lastMonthKey = useMemo(() => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }, []);

  const monthlyMetrics = marketingMetrics.filter(m => m.period_start?.startsWith(lastMonthKey));

  const revenueByChannel = calculator.getRevenueByChannel();
  const cacByChannel     = calculator.getCACByChannel();

  const spendVsRevenue = monthlyMetrics.map(m => ({
    canal:   m.channel_id ?? "Autre",
    spend:   m.spend,
    revenue: m.revenue_generated,
  }));

  const roiData = monthlyMetrics.map(m => ({
    canal: m.channel_id ?? "Autre",
    roi:   m.spend > 0 ? Math.round(((m.revenue_generated - m.spend) / m.spend) * 100) : 0,
  }));

  const totalSpend   = monthlyMetrics.reduce((s, m) => s + m.spend, 0);
  const totalRevenue = monthlyMetrics.reduce((s, m) => s + m.revenue_generated, 0);
  const totalClients = monthlyMetrics.reduce((s, m) => s + m.customers_acquired, 0);
  const totalLeads   = monthlyMetrics.reduce((s, m) => s + (m.leads ?? 0), 0);
  const avgRoas      = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const monthLabel = new Date(lastMonthKey).toLocaleDateString("fr-CH", { month: "long", year: "numeric" });

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  function openAdd() {
    setForm(EMPTY_FORM);
    setSelected(null);
    setModal("add");
  }

  function openEdit(m: MarketingMetrics) {
    setForm({
      channel_id:         m.channel_id ?? "",
      period_start:       m.period_start,
      period_end:         m.period_end,
      spend:              String(m.spend),
      revenue_generated:  String(m.revenue_generated),
      customers_acquired: String(m.customers_acquired),
      leads:              String(m.leads ?? ""),
    });
    setSelected(m);
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      channel_id:         form.channel_id || undefined,
      period_start:       form.period_start,
      period_end:         form.period_end,
      spend:              parseFloat(form.spend) || 0,
      revenue_generated:  parseFloat(form.revenue_generated) || 0,
      customers_acquired: parseInt(form.customers_acquired) || 0,
      leads:              form.leads ? parseInt(form.leads) : undefined,
    };
    if (modal === "add") {
      await addMarketingMetric(payload);
      show("Métriques ajoutées");
    } else if (modal === "edit" && selected) {
      await updateMarketingMetric(selected.id, payload);
      show("Métriques mises à jour");
    }
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

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">Marketing & Growth</h1>
          <p className="text-muted-foreground text-lg">Suivi des dépenses marketing, ROI et acquisition client — {monthLabel}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={openAdd}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Ajouter des métriques
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <KPICard label="CAC"           value={formatCurrencyShort(metrics.cac)}               description="Coût d'acquisition client" />
        <KPICard label="LTV"           value={formatCurrencyShort(metrics.ltv)}               description="Valeur à vie client" />
        <KPICard label="LTV / CAC"     value={`${metrics.ltvCacRatio.toFixed(1)}x`}           description="Seuil sain ≥ 3x" highlight={metrics.ltvCacRatio >= 3} />
        <KPICard label="Payback period" value={`${metrics.paybackPeriod.toFixed(1)} mois`}   description="Récupération CAC" />
      </div>

      <div className="grid grid-cols-4 gap-6">
        <KPICard label="ROI Marketing"      value={`${(metrics.marketingROI ?? 0).toFixed(1)}%`}  description="(Revenus − Dépenses) / Dépenses" highlight={(metrics.marketingROI ?? 0) > 100} />
        <KPICard label="Taux de conversion" value={`${(metrics.conversionRate ?? 0).toFixed(1)}%`} description="Leads → clients" />
        <KPICard label="Dépense marketing"  value={formatCurrencyShort(totalSpend)}              description={monthLabel} />
        <KPICard label="Clients acquis"     value={`${totalClients}`}                             description={monthLabel} trend={`+${totalClients}`} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <KPICard label="Revenu généré" value={formatCurrencyShort(totalRevenue)}            description="Canaux marketing" />
        <KPICard label="Total leads"   value={`${totalLeads}`}                              description={monthLabel} />
        <KPICard label="ROAS moyen"    value={`${avgRoas.toFixed(2)}x`}                     description="Revenu / Dépense" highlight={avgRoas > 2} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border" style={{ background: "var(--glass-bg)" }}>
          <h3 className="text-xl font-semibold text-foreground mb-6">Dépense vs Revenu par canal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendVsRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="canal" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px" }} formatter={(v: number) => [formatCurrencyShort(v)]} />
              <Bar dataKey="spend"   name="Dépense" fill="var(--accent-red)"  radius={[8,8,0,0]} />
              <Bar dataKey="revenue" name="Revenu"  fill="var(--accent-blue)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-red" /><span className="text-sm text-muted-foreground">Dépense</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-blue" /><span className="text-sm text-muted-foreground">Revenu</span></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border" style={{ background: "var(--glass-bg)" }}>
          <h3 className="text-xl font-semibold text-foreground mb-6">ROI % par canal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} unit="%" />
              <YAxis dataKey="canal" type="category" stroke="var(--muted-foreground)" fontSize={12} width={90} />
              <Tooltip contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px" }} formatter={(v: number) => [`${v}%`, "ROI"]} />
              <Bar dataKey="roi" name="ROI" radius={[0,8,8,0]}>
                {roiData.map((_e, idx) => <Cell key={`roi-${idx}`} fill="var(--accent-blue)" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Revenue par canal */}
      {Object.keys(revenueByChannel).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border" style={{ background: "var(--glass-bg)" }}>
          <h3 className="text-xl font-semibold text-foreground mb-4">Revenue par canal (transactions)</h3>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(revenueByChannel).map(([canal, rev]) => (
              <div key={canal} className="rounded-xl p-4 border border-glass-border/50" style={{ background: "var(--glass-bg)" }}>
                <p className="text-xs text-muted-foreground mb-1">{canal}</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrencyShort(rev as number)}</p>
                <p className="text-xs text-muted-foreground mt-1">CAC : {formatCurrencyShort((cacByChannel as Record<string, number>)[canal] ?? 0)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Détail des campagnes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl backdrop-blur-xl border border-glass-border overflow-hidden" style={{ background: "var(--glass-bg)" }}>
        <div className="p-6 border-b border-glass-border">
          <h3 className="text-xl font-semibold text-foreground">Détail des campagnes — {monthLabel}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left  p-4 text-sm font-semibold text-muted-foreground">Canal</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Dépense</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Leads</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Clients</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">CAC</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Revenu généré</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">ROAS</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {monthlyMetrics.map((m, index) => {
                const cac  = m.customers_acquired > 0 ? m.spend / m.customers_acquired : 0;
                const roas = m.spend > 0 ? m.revenue_generated / m.spend : 0;
                return (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="border-b border-glass-border/50 hover:bg-glass-hover transition-colors"
                  >
                    <td className="p-4 text-sm font-semibold text-foreground">{m.channel_id ?? "—"}</td>
                    <td className="p-4 text-sm text-right text-foreground">{formatCurrencyShort(m.spend)}</td>
                    <td className="p-4 text-sm text-right text-foreground">{m.leads ?? 0}</td>
                    <td className="p-4 text-sm text-right text-accent-blue font-semibold">{m.customers_acquired}</td>
                    <td className="p-4 text-sm text-right text-foreground">{formatCurrencyShort(cac)}</td>
                    <td className="p-4 text-sm text-right text-foreground">{formatCurrencyShort(m.revenue_generated)}</td>
                    <td className="p-4 text-sm text-right text-foreground">{roas.toFixed(2)}x</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(m)} title="Modifier" className="p-2 rounded-lg hover:bg-glass-hover transition-colors">
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setSelected(m); setModal("delete"); }} title="Supprimer" className="p-2 rounded-lg hover:bg-accent-red/20 transition-colors">
                          <Trash2 className="w-4 h-4 text-accent-red" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {monthlyMetrics.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">Aucune métrique pour ce mois.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <Overlay onClose={() => setModal(null)} title={modal === "add" ? "Nouvelles métriques" : "Modifier les métriques"}>
            <div className="space-y-4">
              <Field label="Canal (ID)">
                <input type="text" value={form.channel_id} onChange={e => f("channel_id", e.target.value)} placeholder="Ex: LinkedIn, Google Ads, SEO…" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Début de période">
                  <input type="date" value={form.period_start} onChange={e => f("period_start", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Fin de période">
                  <input type="date" value={form.period_end} onChange={e => f("period_end", e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Dépense (CHF)">
                  <input type="number" min="0" step="0.01" value={form.spend} onChange={e => f("spend", e.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Revenu généré (CHF)">
                  <input type="number" min="0" step="0.01" value={form.revenue_generated} onChange={e => f("revenue_generated", e.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Leads">
                  <input type="number" min="0" step="1" value={form.leads} onChange={e => f("leads", e.target.value)} placeholder="0" className={inputCls} />
                </Field>
                <Field label="Clients acquis">
                  <input type="number" min="0" step="1" value={form.customers_acquired} onChange={e => f("customers_acquired", e.target.value)} placeholder="0" className={inputCls} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">Annuler</button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50"
              >
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

function KPICard({ label, value, description, trend, highlight = false }: {
  label: string; value: string; description?: string; trend?: string; highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`rounded-2xl p-6 backdrop-blur-xl border transition-all ${highlight ? "border-accent-blue/30" : "border-glass-border"}`}
      style={{ background: "var(--glass-bg)" }}
    >
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className={`text-2xl font-semibold ${highlight ? "text-accent-blue" : "text-foreground"}`}>{value}</p>
        {trend && <span className="text-sm text-accent-blue">{trend}</span>}
      </div>
      {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
    </motion.div>
  );
}
