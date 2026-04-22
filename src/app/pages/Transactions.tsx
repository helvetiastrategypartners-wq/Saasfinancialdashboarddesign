import { motion, AnimatePresence } from "motion/react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useMetrics } from "../contexts/MetricsContext";
import { Overlay, Field, DeleteConfirm, inputCls, useToast } from "../components/Modal";
import { useCurrency } from "../contexts/CurrencyContext";
import { GlassCard }   from "../components/ui/GlassCard";
import { PageHeader }  from "../components/ui/PageHeader";
import { StatCard }    from "../components/ui/StatCard";
import { SearchInput } from "../components/ui/SearchInput";
import type { Transaction } from "@shared/types";

const TX_CATEGORIES = ["Subscriptions","Consulting","Revenue","Marketing","Salaries","Direct Costs","Operations","Financing"];

type ModalMode = "add" | "edit" | "delete" | null;

const EMPTY_FORM = {
  type:           "expense" as Transaction["type"],
  label:          "",
  category:       "Operations",
  amount:         "",
  date:           new Date().toISOString().slice(0, 10),
  payment_status: "completed" as Transaction["payment_status"],
  recurring:      false,
};

export function Transactions() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useMetrics();
  const { format } = useCurrency();
  const { show, ToastEl } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Tous les types");
  const [filterCat,  setFilterCat]  = useState("Toutes catégories");
  const [modal,      setModal]      = useState<ModalMode>(null);
  const [selected,   setSelected]   = useState<Transaction | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  const filtered = useMemo(() =>
    [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter(t => {
        const q = searchTerm.toLowerCase();
        const matchSearch = !q || t.label.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
        const matchType   = filterType === "Tous les types"       || (filterType === "Revenu" && t.type === "income") || (filterType === "Dépense" && t.type === "expense");
        const matchCat    = filterCat  === "Toutes catégories"    || t.category === filterCat;
        return matchSearch && matchType && matchCat;
      }),
  [transactions, searchTerm, filterType, filterCat]);

  const filteredRevenue  = filtered.filter(t => t.type === "income"  && t.payment_status === "completed").reduce((s, t) => s + t.amount, 0);
  const filteredExpenses = filtered.filter(t => t.type === "expense" && t.payment_status === "completed").reduce((s, t) => s + t.amount, 0);
  const difference       = filteredRevenue - filteredExpenses;

  const f = (k: keyof typeof form, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  function openAdd() { setForm(EMPTY_FORM); setSelected(null); setModal("add"); }

  function openEdit(tx: Transaction) {
    setForm({ type: tx.type, label: tx.label, category: tx.category, amount: String(tx.amount), date: tx.date, payment_status: tx.payment_status, recurring: tx.recurring });
    setSelected(tx);
    setModal("edit");
  }

  async function handleSave() {
    if (!form.label.trim() || !form.amount) return;
    setSaving(true);
    const payload = { type: form.type, label: form.label.trim(), category: form.category, amount: parseFloat(form.amount), date: form.date, payment_status: form.payment_status, recurring: form.recurring, currency: "CHF" };
    if (modal === "add") {
      await addTransaction(payload);
      show("Transaction ajoutée");
    } else if (modal === "edit" && selected) {
      await updateTransaction(selected.id, payload);
      show("Transaction mise à jour");
    }
    setSaving(false);
    setModal(null);
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    await deleteTransaction(selected.id);
    setSaving(false);
    setModal(null);
    show("Transaction supprimée");
  }

  const selectCls = "px-4 py-3 rounded-xl border border-glass-border text-foreground focus:outline-none focus:border-accent-blue/40 transition-all backdrop-blur-xl";

  return (
    <div className="p-8 space-y-6">
      {ToastEl}

      <PageHeader
        title="Transactions"
        subtitle="Historique et gestion de toutes vos transactions"
        action={
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nouvelle transaction
          </motion.button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Revenus filtrés"  value={format(filteredRevenue)}  delay={0}   highlight />
        <StatCard label="Dépenses filtrées" value={format(filteredExpenses)} delay={0.1} alert={filteredExpenses > filteredRevenue} />
        <StatCard label="Différence"        value={format(difference)}       delay={0.2} highlight={difference >= 0} alert={difference < 0} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher par libellé ou catégorie..." className="flex-1 min-w-[200px]" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectCls} style={{ background: "var(--glass-bg)" }}>
          <option>Tous les types</option>
          <option>Revenu</option>
          <option>Dépense</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className={selectCls} style={{ background: "var(--glass-bg)" }}>
          <option>Toutes catégories</option>
          {TX_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <GlassCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                {["Type","Libellé","Catégorie","Date","Statut","Récurrent","Montant","Actions"].map((h, i) => (
                  <th key={h} className={`p-4 text-sm font-semibold text-muted-foreground ${i >= 6 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, index) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.02 }}
                  className="border-b border-glass-border/50 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${tx.type === "income" ? "bg-accent-blue/10 text-accent-blue" : "bg-accent-red/10 text-accent-red"}`}>
                      {tx.type === "income" ? "Revenu" : "Dépense"}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-foreground">{tx.label}</td>
                  <td className="p-4 text-sm text-muted-foreground">{tx.category}</td>
                  <td className="p-4 text-sm text-muted-foreground">{tx.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${tx.payment_status === "completed" ? "bg-accent-blue/10 text-accent-blue" : "bg-yellow-500/10 text-yellow-500"}`}>
                      {tx.payment_status === "completed" ? "Validé" : "En attente"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-center text-muted-foreground">{tx.recurring ? "✓" : "—"}</td>
                  <td className={`p-4 text-sm text-right font-semibold ${tx.type === "income" ? "text-accent-blue" : "text-accent-red"}`}>
                    {tx.type === "income" ? "+" : "-"}{format(tx.amount)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(tx)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setSelected(tx); setModal("delete"); }} className="p-2 rounded-lg hover:bg-accent-red/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-accent-red" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Aucune transaction trouvée.</div>
          )}
        </div>
      </GlassCard>

      {/* Modals */}
      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <Overlay onClose={() => setModal(null)}>
            <h2 className="text-xl font-semibold text-foreground mb-6">
              {modal === "add" ? "Nouvelle transaction" : "Modifier la transaction"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type">
                  <select value={form.type} onChange={e => f("type", e.target.value)} className={inputCls}>
                    <option value="income">Revenu</option>
                    <option value="expense">Dépense</option>
                  </select>
                </Field>
                <Field label="Statut">
                  <select value={form.payment_status} onChange={e => f("payment_status", e.target.value)} className={inputCls}>
                    <option value="completed">Validé</option>
                    <option value="pending">En attente</option>
                  </select>
                </Field>
              </div>
              <Field label="Libellé">
                <input type="text" value={form.label} onChange={e => f("label", e.target.value)} placeholder="Description de la transaction" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Catégorie">
                  <select value={form.category} onChange={e => f("category", e.target.value)} className={inputCls}>
                    {TX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Montant (CHF)">
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e => f("amount", e.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date">
                  <input type="date" value={form.date} onChange={e => f("date", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Récurrent">
                  <select value={String(form.recurring)} onChange={e => f("recurring", e.target.value === "true")} className={inputCls}>
                    <option value="false">Non</option>
                    <option value="true">Oui</option>
                  </select>
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">Annuler</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving || !form.label.trim() || !form.amount}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === "add" ? "Ajouter" : "Enregistrer"}
              </motion.button>
            </div>
          </Overlay>
        )}

        {modal === "delete" && selected && (
          <DeleteConfirm
            label="Supprimer la transaction ?"
            detail={`"${selected.label}" — ${format(selected.amount)} du ${selected.date} sera définitivement supprimée.`}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}