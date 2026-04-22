import { motion, AnimatePresence } from "motion/react";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMetrics } from "../contexts/MetricsContext";
import { Overlay, Field, DeleteConfirm, inputCls, useToast } from "../components/Modal";
import { useCurrency } from '../contexts/CurrencyContext';
import type { Customer } from "@shared/types";

const STATUS_LABEL: Record<string, string> = {
  active:  "Actif",
  churned: "Churné",
  paused:  "En pause",
};

type ModalMode = "add" | "edit" | "delete" | null;

const EMPTY_FORM = {
  name:                "",
  segment:             "",
  acquisition_channel: "",
  acquisition_date:    new Date().toISOString().slice(0, 10),
  status:              "active" as Customer["status"],
  monthly_revenue:     "",
  total_revenue:       "",
  gross_margin_percent:"",
  direct_costs:        "",
};

export function Clients() {
  const { customers, metrics, addCustomer, updateCustomer, deleteCustomer } = useMetrics();
  const { format } = useCurrency();
  const { show, ToastEl } = useToast();
  const [searchTerm,    setSearchTerm]   = useState("");
  const [statusFilter,  setStatusFilter] = useState("Tous");
  const [modal,         setModal]        = useState<ModalMode>(null);
  const [selected,      setSelected]     = useState<Customer | null>(null);
  const [form,          setForm]         = useState(EMPTY_FORM);
  const [saving,        setSaving]       = useState(false);

  const filtered = customers.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.acquisition_channel ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.segment ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "Tous" || STATUS_LABEL[c.status] === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = customers.reduce((s, c) => s + c.total_revenue, 0);
  const avgRevenue   = customers.length > 0 ? totalRevenue / customers.length : 0;

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  function openAdd() {
    setForm(EMPTY_FORM);
    setSelected(null);
    setModal("add");
  }

  function openEdit(c: Customer) {
    setForm({
      name:                c.name,
      segment:             c.segment ?? "",
      acquisition_channel: c.acquisition_channel ?? "",
      acquisition_date:    c.acquisition_date,
      status:              c.status,
      monthly_revenue:     String(c.monthly_revenue),
      total_revenue:       String(c.total_revenue),
      gross_margin_percent:String(c.gross_margin_percent),
      direct_costs:        String(c.direct_costs),
    });
    setSelected(c);
    setModal("edit");
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name:                form.name.trim(),
      segment:             form.segment || undefined,
      acquisition_channel: form.acquisition_channel || undefined,
      acquisition_date:    form.acquisition_date,
      status:              form.status as Customer["status"],
      monthly_revenue:     parseFloat(form.monthly_revenue) || 0,
      total_revenue:       parseFloat(form.total_revenue)   || 0,
      gross_margin_percent:parseFloat(form.gross_margin_percent) || 0,
      direct_costs:        parseFloat(form.direct_costs)    || 0,
    };
    if (modal === "add") {
      await addCustomer(payload);
      show("Client ajouté");
    } else if (modal === "edit" && selected) {
      await updateCustomer(selected.id, payload);
      show("Client mis à jour");
    }
    setSaving(false);
    setModal(null);
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    await deleteCustomer(selected.id);
    setSaving(false);
    setModal(null);
    show("Client supprimé");
  }

  return (
    <div className="p-8 space-y-6">
      {ToastEl}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-lg">Gérez votre portefeuille client et relations</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openAdd}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Ajouter un client
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: "Total Clients",   value: customers.length.toString(), delay: 0 },
          { label: "Clients Actifs",  value: metrics.activeCustomers.toString(), delay: 0.1, highlight: true },
          { label: "Revenu Total",    value: format(totalRevenue), delay: 0.2 },
          { label: "Revenu Moyen",    value: format(avgRevenue), delay: 0.3 },
        ].map(({ label, value, delay, highlight }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, y: -2 }}
            transition={{ delay, duration: 0.3, ease: "easeOut" }}
            className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border hover:border-accent-blue/20 transition-all duration-300"
            style={{ background: "var(--glass-bg)" }}
          >
            <p className="text-sm text-muted-foreground mb-2">{label}</p>
            <p className={`text-3xl font-semibold ${highlight ? "text-accent-blue" : "text-foreground"}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom, canal ou segment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-glass-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent-blue/40 transition-all backdrop-blur-xl"
            style={{ background: "var(--glass-bg)" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-6 py-3 rounded-xl border border-glass-border text-foreground focus:outline-none focus:border-accent-blue/40 transition-all backdrop-blur-xl"
          style={{ background: "var(--glass-bg)" }}
        >
          <option value="Tous">Tous les statuts</option>
          <option value="Actif">Actif</option>
          <option value="Churné">Churné</option>
          <option value="En pause">En pause</option>
        </select>
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((client, index) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.04 }}
            whileHover={{ scale: 1.005, y: -2 }}
            className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border hover:border-accent-red/20 transition-all"
            style={{ background: "var(--glass-bg)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 flex-1">
                <div className="w-14 h-14 rounded-xl bg-accent-red flex items-center justify-center text-white text-xl font-semibold shadow-lg shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Client</p>
                    <p className="font-semibold text-foreground">{client.name}</p>
                    {client.segment && <p className="text-sm text-muted-foreground">{client.segment}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Canal d'acquisition</p>
                    <p className="text-sm text-foreground">{client.acquisition_channel ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Depuis {new Date(client.acquisition_date).toLocaleDateString("fr-CH", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">MRR</p>
                    <p className="text-lg font-semibold text-foreground">{format(client.monthly_revenue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Marge {client.gross_margin_percent.toFixed(2)}% · {format(client.monthly_revenue * client.gross_margin_percent / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Revenu total</p>
                    <p className="text-lg font-semibold text-foreground">{format(client.total_revenue)}</p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium mt-1 ${
                      client.status === "active"  ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/30"
                    : client.status === "churned" ? "bg-accent-red/10 text-accent-red border border-accent-red/30"
                    :                               "bg-muted-foreground/20 text-muted-foreground border border-muted-foreground/30"
                    }`}>
                      {STATUS_LABEL[client.status]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(client)} title="Modifier" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <Edit className="w-5 h-5 text-muted-foreground hover:text-accent-blue transition-colors" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setSelected(client); setModal("delete"); }} title="Supprimer" className="p-2 rounded-lg hover:bg-accent-red/10 transition-colors">
                  <Trash2 className="w-5 h-5 text-accent-red" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Aucun client trouvé.</div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <Overlay onClose={() => setModal(null)} title={modal === "add" ? "Nouveau client" : "Modifier le client"}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom">
                  <input type="text" value={form.name} onChange={e => f("name", e.target.value)} placeholder="Nom ou raison sociale" className={inputCls} />
                </Field>
                <Field label="Segment">
                  <input type="text" value={form.segment} onChange={e => f("segment", e.target.value)} placeholder="Ex: PME, Enterprise…" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Canal d'acquisition">
                  <input type="text" value={form.acquisition_channel} onChange={e => f("acquisition_channel", e.target.value)} placeholder="Ex: LinkedIn, Inbound…" className={inputCls} />
                </Field>
                <Field label="Date d'acquisition">
                  <input type="date" value={form.acquisition_date} onChange={e => f("acquisition_date", e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Statut">
                <select value={form.status} onChange={e => f("status", e.target.value)} className={inputCls}>
                  <option value="active">Actif</option>
                  <option value="churned">Churné</option>
                  <option value="paused">En pause</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="MRR (CHF)">
                  <input type="number" min="0" step="0.01" value={form.monthly_revenue} onChange={e => f("monthly_revenue", e.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Revenu total (CHF)">
                  <input type="number" min="0" step="0.01" value={form.total_revenue} onChange={e => f("total_revenue", e.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Marge brute (%)">
                  <input type="number" min="0" max="100" step="0.1" value={form.gross_margin_percent} onChange={e => f("gross_margin_percent", e.target.value)} placeholder="0.0" className={inputCls} />
                </Field>
                <Field label="Coûts directs (CHF)">
                  <input type="number" min="0" step="0.01" value={form.direct_costs} onChange={e => f("direct_costs", e.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">Annuler</button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
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
            label="Supprimer le client ?"
            detail={`"${selected.name}" sera définitivement supprimé de votre portefeuille.`}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
