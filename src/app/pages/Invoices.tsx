import { motion, AnimatePresence } from "motion/react";
import { Plus, Zap, AlertCircle, Search, CheckCircle, Pencil, Trash2, X, Loader2, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { useMetrics } from "../contexts/MetricsContext";
import { useCurrency } from '../contexts/CurrencyContext';
import type { Transaction } from "@shared/types";

const STATUS_MAP: Record<string, string> = {
  completed: "Payée",
  pending:   "Émise",
  cancelled: "Annulée",
};

const CATEGORIES = ["Salaries", "Marketing", "Direct Costs", "Operations", "Financing", "Consulting", "Autre"];

type ModalMode = "add" | "edit" | "delete" | "ai" | null;

interface InvoiceRow {
  id: string;
  number: string;
  supplier: string;
  category: string;
  dueDate: string;
  amount: number;
  status: string;
  rawStatus: Transaction["payment_status"];
}

const EMPTY_FORM = {
  label:          "",
  category:       "Operations",
  amount:         "",
  date:           new Date().toISOString().slice(0, 10),
  payment_status: "pending" as Transaction["payment_status"],
  description:    "",
};

export function Invoices() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useMetrics();
  const { format } = useCurrency();
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [modal, setModal]               = useState<ModalMode>(null);
  const [selected, setSelected]         = useState<InvoiceRow | null>(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [aiStep, setAiStep]             = useState(0);
  const [saving, setSaving]             = useState(false);

  const invoices = useMemo<InvoiceRow[]>(() =>
    transactions
      .filter(t => t.type === "expense")
      .map(t => ({
        id:        t.id,
        number:    `TXN-${t.id.slice(-6).toUpperCase()}`,
        supplier:  t.label,
        category:  t.category,
        dueDate:   t.date,
        amount:    t.amount,
        status:    STATUS_MAP[t.payment_status] ?? "Émise",
        rawStatus: t.payment_status,
      }))
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
  [transactions]);

  const filtered = invoices.filter(i => {
    const matchSearch =
      i.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "Tous" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paidAmount    = invoices.filter(i => i.status === "Payée").reduce((s, i) => s + i.amount, 0);
  const unpaidAmount  = invoices.filter(i => i.status === "Émise").reduce((s, i) => s + i.amount, 0);
  const overdueList   = invoices.filter(i => i.status === "Annulée");
  const overdueAmount = overdueList.reduce((s, i) => s + i.amount, 0);

  function openAdd() {
    setForm(EMPTY_FORM);
    setSelected(null);
    setModal("add");
  }

  function openEdit(row: InvoiceRow) {
    setForm({
      label:          row.supplier,
      category:       row.category,
      amount:         String(row.amount),
      date:           row.dueDate,
      payment_status: row.rawStatus,
      description:    "",
    });
    setSelected(row);
    setModal("edit");
  }

  function openDelete(row: InvoiceRow) {
    setSelected(row);
    setModal("delete");
  }

  async function handleMarkPaid(row: InvoiceRow) {
    await updateTransaction(row.id, { payment_status: "completed" });
  }

  async function handleSave() {
    if (!form.label.trim() || !form.amount) return;
    setSaving(true);
    if (modal === "add") {
      await addTransaction({
        type:           "expense",
        label:          form.label.trim(),
        category:       form.category,
        amount:         parseFloat(form.amount),
        date:           form.date,
        payment_status: form.payment_status,
        currency:       "CHF",
        recurring:      false,
        description:    form.description || undefined,
      });
    } else if (modal === "edit" && selected) {
      await updateTransaction(selected.id, {
        label:          form.label.trim(),
        category:       form.category,
        amount:         parseFloat(form.amount),
        date:           form.date,
        payment_status: form.payment_status,
      });
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
  }

  function startAI() {
    setAiStep(0);
    setModal("ai");
    const steps = [500, 1200, 2000, 2800];
    steps.forEach((delay, i) => setTimeout(() => setAiStep(i + 1), delay));
  }

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">Factures</h1>
          <p className="text-muted-foreground text-lg">Gérez vos factures fournisseurs et suivi des paiements</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startAI}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors shadow-lg"
          >
            <Zap className="w-5 h-5" />
            AI Extraction
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-background hover:bg-white/90 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Ajouter une facture
          </motion.button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border" style={{ background: "var(--glass-bg)" }}>
          <p className="text-sm text-muted-foreground mb-2">Factures payées</p>
          <p className="text-3xl font-semibold text-accent-blue">{format(paidAmount)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border" style={{ background: "var(--glass-bg)" }}>
          <p className="text-sm text-muted-foreground mb-2">Factures en attente</p>
          <p className="text-3xl font-semibold text-yellow-500">{format(unpaidAmount)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl p-6 backdrop-blur-xl border border-accent-red/30" style={{ background: "var(--glass-bg)" }}>
          <p className="text-sm text-muted-foreground mb-2">Annulées</p>
          <p className="text-3xl font-semibold text-accent-red">{format(overdueAmount)}</p>
        </motion.div>
      </div>

      {/* Alert */}
      {overdueList.length > 0 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 p-4 rounded-xl bg-accent-red/10 border border-accent-red/30">
          <AlertCircle className="w-5 h-5 text-accent-red mt-0.5" />
          <div>
            <p className="text-accent-red font-semibold">Transactions annulées détectées</p>
            <p className="text-sm text-accent-red/80 mt-1">{overdueList.length} transaction(s) annulée(s) — {format(overdueAmount)}</p>
          </div>
        </motion.div>
      )}

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par fournisseur, numéro ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary/50 border border-glass-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-xl"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-6 py-3 rounded-xl bg-secondary/50 border border-glass-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-xl"
        >
          <option value="Tous">Tous les statuts</option>
          <option value="Émise">Émise</option>
          <option value="Payée">Payée</option>
          <option value="Annulée">Annulée</option>
        </select>
      </div>

      {/* Invoices Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl backdrop-blur-xl border border-glass-border overflow-hidden" style={{ background: "var(--glass-bg)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left  p-4 text-sm font-semibold text-muted-foreground">Référence</th>
                <th className="text-left  p-4 text-sm font-semibold text-muted-foreground">Fournisseur</th>
                <th className="text-left  p-4 text-sm font-semibold text-muted-foreground">Catégorie</th>
                <th className="text-left  p-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Montant TTC</th>
                <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Statut</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice, index) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.03 }}
                  className="border-b border-glass-border/50 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-sm font-mono font-semibold text-foreground">{invoice.number}</td>
                  <td className="p-4 text-sm text-foreground">{invoice.supplier}</td>
                  <td className="p-4 text-sm text-foreground">{invoice.category}</td>
                  <td className="p-4 text-sm text-foreground">{invoice.dueDate}</td>
                  <td className="p-4 text-sm text-right font-semibold text-foreground">{format(invoice.amount)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      invoice.status === "Payée"   ? "bg-accent-blue/20 text-accent-blue"
                    : invoice.status === "Annulée" ? "bg-accent-red/20 text-accent-red"
                    :                                "bg-yellow-500/20 text-yellow-500"
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.status !== "Payée" && (
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleMarkPaid(invoice)}
                          title="Marquer comme payée"
                          className="p-2 rounded-lg hover:bg-accent-blue/20 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 text-accent-blue" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => openEdit(invoice)}
                        title="Modifier"
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => openDelete(invoice)}
                        title="Supprimer"
                        className="p-2 rounded-lg hover:bg-accent-red/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-accent-red" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Aucune facture trouvée.</div>
          )}
        </div>
      </motion.div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {/* Add / Edit Modal */}
        {(modal === "add" || modal === "edit") && (
          <Overlay onClose={() => setModal(null)}>
            <h2 className="text-xl font-semibold text-foreground mb-6">
              {modal === "add" ? "Nouvelle facture" : "Modifier la facture"}
            </h2>

            <div className="space-y-4">
              <Field label="Fournisseur">
                <input
                  type="text"
                  value={form.label}
                  onChange={e => f("label", e.target.value)}
                  placeholder="Ex: AWS, Loyer, Prestataire…"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Catégorie">
                  <select value={form.category} onChange={e => f("category", e.target.value)} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Statut">
                  <select value={form.payment_status} onChange={e => f("payment_status", e.target.value as Transaction["payment_status"])} className={inputCls}>
                    <option value="pending">Émise</option>
                    <option value="completed">Payée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Montant (CHF)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={e => f("amount", e.target.value)}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </Field>
                <Field label="Date">
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => f("date", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Description (optionnel)">
                <input
                  type="text"
                  value={form.description}
                  onChange={e => f("description", e.target.value)}
                  placeholder="Note interne…"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">
                Annuler
              </button>
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

        {/* Delete Confirmation */}
        {modal === "delete" && selected && (
          <Overlay onClose={() => setModal(null)} small>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-accent-red" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Supprimer la facture ?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-medium text-foreground">{selected.supplier}</span> — {format(selected.amount)} du {selected.dueDate} sera définitivement supprimée.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Supprimer
              </motion.button>
            </div>
          </Overlay>
        )}

        {/* AI Extraction Modal */}
        {modal === "ai" && (
          <Overlay onClose={aiStep >= 4 ? () => setModal(null) : undefined} small>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent-red" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">AI Extraction</h2>
            </div>

            <div className="space-y-3 mb-6">
              {[
                "Analyse du document en cours…",
                "Extraction des données fournisseur…",
                "Reconnaissance des montants et dates…",
                "Pré-remplissage du formulaire…",
              ].map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  {aiStep > i
                    ? <CheckCircle className="w-5 h-5 text-accent-blue shrink-0" />
                    : aiStep === i
                    ? <Loader2 className="w-5 h-5 text-accent-red animate-spin shrink-0" />
                    : <div className="w-5 h-5 rounded-full border border-glass-border shrink-0" />
                  }
                  <span className={`text-sm ${aiStep > i ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                </div>
              ))}
            </div>

            {aiStep >= 4 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-sm text-muted-foreground mb-4">Extraction terminée. Veuillez vérifier et compléter les champs avant d'enregistrer.</p>
                <button
                  onClick={() => {
                    setModal(null);
                    setTimeout(() => {
                      setForm({ label: "Fournisseur extrait", category: "Operations", amount: "1250", date: new Date().toISOString().slice(0, 10), payment_status: "pending", description: "Via AI Extraction" });
                      setSelected(null);
                      setModal("add");
                    }, 50);
                  }}
                  className="w-full py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors font-medium"
                >
                  Ouvrir le formulaire
                </button>
              </motion.div>
            )}
          </Overlay>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-glass-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Overlay({ children, onClose, small }: { children: React.ReactNode; onClose?: () => void; small?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`relative rounded-2xl p-8 border border-glass-border shadow-2xl w-full ${small ? "max-w-md" : "max-w-lg"}`}
        style={{ background: "var(--popover)" }}
      >
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}
