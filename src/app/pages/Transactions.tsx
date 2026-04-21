import { motion, AnimatePresence } from "motion/react";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useMetrics } from "../contexts/MetricsContext";
import { Overlay, Field, DeleteConfirm, inputCls, useToast } from "../components/Modal";
import { formatCurrencyShort } from "../utils/currency";
import type { Transaction } from "@shared/types";

const TX_CATEGORIES = ["Subscriptions", "Consulting", "Revenue", "Marketing", "Salaries", "Direct Costs", "Operations", "Financing"];

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
  const { show, ToastEl } = useToast();

  const [searchTerm,  setSearchTerm]  = useState("");
  const [filterType,  setFilterType]  = useState("Tous les types");
  const [filterCat,   setFilterCat]   = useState("Toutes catégories");
  const [modal,       setModal]       = useState<ModalMode>(null);
  const [selected,    setSelected]    = useState<Transaction | null>(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);

  const filtered = useMemo(() =>
    [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter(t => {
        const matchSearch = searchTerm === "" ||
          t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = filterType === "Tous les types" ||
          (filterType === "Revenu"  && t.type === "income") ||
          (filterType === "Dépense" && t.type === "expense");
        const matchCat = filterCat === "Toutes catégories" || t.category === filterCat;
        return matchSearch && matchType && matchCat;
      }),
  [transactions, searchTerm, filterType, filterCat]);

  const filteredRevenue  = filtered.filter(t => t.type === "income"  && t.payment_status === "completed").reduce((s, t) => s + t.amount, 0);
  const filteredExpenses = filtered.filter(t => t.type === "expense" && t.payment_status === "completed").reduce((s, t) => s + t.amount, 0);
  const difference = filteredRevenue - filteredExpenses;

  const f = (k: keyof typeof form, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  function openAdd() {
    setForm(EMPTY_FORM);
    setSelected(null);
    setModal("add");
  }

  function openEdit(tx: Transaction) {
    setForm({
      type:           tx.type,
      label:          tx.label,
      category:       tx.category,
      amount:         String(tx.amount),
      date:           tx.date,
      payment_status: tx.payment_status,
      recurring:      tx.recurring,
    });
    setSelected(tx);
    setModal("edit");
  }

  function openDelete(tx: Transaction) {
    setSelected(tx);
    setModal("delete");
  }

  async function handleSave() {
    if (!form.label.trim() || !form.amount) return;
    setSaving(true);
    if (modal === "add") {
      await addTransaction({
        type:           form.type,
        label:          form.label.trim(),
        category:       form.category,
        amount:         parseFloat(form.amount),
        date:           form.date,
        payment_status: form.payment_status,
        currency:       "CHF",
        recurring:      form.recurring,
      });
      show("Transaction ajoutée");
    } else if (modal === "edit" && selected) {
      await updateTransaction(selected.id, {
        type:           form.type,
        label:          form.label.trim(),
        category:       form.category,
        amount:         parseFloat(form.amount),
        date:           form.date,
        payment_status: form.payment_status,
        recurring:      form.recurring,
      });
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

  return (
    <div className="p-8 space-y-6">
      {ToastEl}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-lg">Gérez toutes vos transactions (revenus et dépenses)</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={openAdd}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Ajouter une transaction
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border" style={{ background: "var(--glass-bg)" }}>
          <p className="text-sm text-muted-foreground mb-2">Revenus filtrés</p>
          <p className="text-3xl font-semibold text-accent-blue">{formatCurrencyShort(filteredRevenue)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border" style={{ background: "var(--glass-bg)" }}>
          <p className="text-sm text-muted-foreground mb-2">Dépenses filtrées</p>
          <p className="text-3xl font-semibold text-accent-red">{formatCurrencyShort(filteredExpenses)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border" style={{ background: "var(--glass-bg)" }}>
          <p className="text-sm text-muted-foreground mb-2">Différence</p>
          <p className={`text-3xl font-semibold ${difference >= 0 ? "text-accent-blue" : "text-accent-red"}`}>
            {difference >= 0 ? "+" : "-"}{formatCurrencyShort(Math.abs(difference))}
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par label ou catégorie…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary/50 border border-glass-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all backdrop-blur-xl"
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-6 py-3 rounded-xl bg-secondary/50 border border-glass-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all backdrop-blur-xl">
          <option>Tous les types</option>
          <option>Revenu</option>
          <option>Dépense</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-6 py-3 rounded-xl bg-secondary/50 border border-glass-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all backdrop-blur-xl">
          <option>Toutes catégories</option>
          {TX_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl backdrop-blur-xl border border-glass-border overflow-hidden" style={{ background: "var(--glass-bg)" }}>
        <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left   p-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="text-left   p-4 text-sm font-semibold text-muted-foreground">Label</th>
                <th className="text-left   p-4 text-sm font-semibold text-muted-foreground">Catégorie</th>
                <th className="text-left   p-4 text-sm font-semibold text-muted-foreground">Type</th>
                <th className="text-right  p-4 text-sm font-semibold text-muted-foreground">Montant</th>
                <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Statut</th>
                <th className="text-right  p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, index) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(0.4 + index * 0.03, 1.2) }}
                  className="border-b border-glass-border/50 hover:bg-glass-hover transition-colors"
                >
                  <td className="p-4 text-sm text-foreground">{tx.date}</td>
                  <td className="p-4 text-sm text-foreground max-w-[260px] truncate">{tx.label}</td>
                  <td className="p-4 text-sm text-foreground">{tx.category}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${tx.type === "income" ? "bg-accent-blue/20 text-accent-blue" : "bg-accent-red/20 text-accent-red"}`}>
                      {tx.type === "income" ? "Revenu" : "Dépense"}
                    </span>
                  </td>
                  <td className={`p-4 text-sm text-right font-semibold ${tx.type === "income" ? "text-accent-blue" : "text-accent-red"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrencyShort(tx.amount)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      tx.payment_status === "completed" ? "bg-accent-blue/20 text-accent-blue"
                    : tx.payment_status === "pending"   ? "bg-muted text-muted-foreground"
                    :                                     "bg-accent-red/20 text-accent-red"
                    }`}>
                      {tx.payment_status === "completed" ? "Complétée" : tx.payment_status === "pending" ? "En attente" : "Annulée"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(tx)} title="Modifier" className="p-2 rounded-lg hover:bg-glass-hover transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openDelete(tx)} title="Supprimer" className="p-2 rounded-lg hover:bg-accent-red/20 transition-colors">
                        <Trash2 className="w-4 h-4 text-accent-red" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">Aucune transaction ne correspond aux critères de recherche.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <Overlay onClose={() => setModal(null)} title={modal === "add" ? "Nouvelle transaction" : "Modifier la transaction"}>
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
                    <option value="completed">Complétée</option>
                    <option value="pending">En attente</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </Field>
              </div>
              <Field label="Label">
                <input type="text" value={form.label} onChange={e => f("label", e.target.value)} placeholder="Ex: Vente SaaS, Loyer bureau…" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Catégorie">
                  <select value={form.category} onChange={e => f("category", e.target.value)} className={inputCls}>
                    {TX_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Date">
                  <input type="date" value={form.date} onChange={e => f("date", e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Montant (CHF)">
                <input type="number" min="0" step="0.01" value={form.amount} onChange={e => f("amount", e.target.value)} placeholder="0.00" className={inputCls} />
              </Field>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.recurring} onChange={e => f("recurring", e.target.checked)} className="w-4 h-4 rounded accent-accent-red" />
                <span className="text-sm text-muted-foreground">Transaction récurrente</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">Annuler</button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving || !form.label.trim() || !form.amount}
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
            label="Supprimer la transaction ?"
            detail={`"${selected.label}" — ${formatCurrencyShort(selected.amount)} du ${selected.date} sera définitivement supprimée.`}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
