import { AnimatePresence, motion } from "motion/react";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { DeleteConfirm, Field, Overlay, inputCls, useToast } from "../../components/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { SearchInput } from "../../components/ui/SearchInput";
import { TransactionsTable } from "./components/TransactionsTable";
import {
  buildTransactionPayload,
  EMPTY_TRANSACTION_FORM,
  toTransactionForm,
  TRANSACTION_CATEGORIES,
  useTransactionsData,
  type TransactionFormState,
} from "./hooks/useTransactionsData";
import type { Transaction } from "@shared/types";

type ModalMode = "add" | "edit" | "delete" | null;

export function Transactions() {
  const { show, ToastEl } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Tous les types");
  const [filterCategory, setFilterCategory] = useState("Toutes categories");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionFormState>(EMPTY_TRANSACTION_FORM);
  const [saving, setSaving] = useState(false);

  const {
    format,
    filteredTransactions,
    filteredRevenue,
    filteredExpenses,
    difference,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactionsData(searchTerm, filterType, filterCategory);

  function updateForm<K extends keyof TransactionFormState>(key: K, value: TransactionFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY_TRANSACTION_FORM);
    setSelectedTransaction(null);
    setModal("add");
  }

  function openEdit(transaction: Transaction) {
    setForm(toTransactionForm(transaction));
    setSelectedTransaction(transaction);
    setModal("edit");
  }

  async function handleSave() {
    if (!form.label.trim() || !form.amount) return;
    setSaving(true);
    const payload = buildTransactionPayload(form);

    if (modal === "add") {
      await addTransaction(payload);
      show("Transaction ajoutee");
    } else if (modal === "edit" && selectedTransaction) {
      await updateTransaction(selectedTransaction.id, payload);
      show("Transaction mise a jour");
    }

    setSaving(false);
    setModal(null);
  }

  async function handleDelete() {
    if (!selectedTransaction) return;
    setSaving(true);
    await deleteTransaction(selectedTransaction.id);
    setSaving(false);
    setModal(null);
    show("Transaction supprimee");
  }

  const selectClassName =
    "px-4 py-3 rounded-xl border border-glass-border text-foreground focus:outline-none focus:border-accent-blue/40 transition-[border-color] duration-150 backdrop-blur-xl";

  return (
    <div className="p-8 space-y-6">
      {ToastEl}
      <PageHeader
        title="Transactions"
        subtitle="Historique et gestion de toutes vos transactions"
        action={
          <motion.button whileHover={{ scale: 1.02, transition: { duration: 0.15 } }} whileTap={{ scale: 0.98 }} onClick={openAdd} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors duration-150 shadow-lg">
            <Plus className="w-5 h-5" />
            Nouvelle transaction
          </motion.button>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Revenus filtres" value={format(filteredRevenue)} delay={0} highlight />
        <StatCard label="Depenses filtrees" value={format(filteredExpenses)} delay={0.06} alert={filteredExpenses > filteredRevenue} />
        <StatCard label="Difference" value={format(difference)} delay={0.12} highlight={difference >= 0} alert={difference < 0} />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher par libelle ou categorie..." className="flex-1 min-w-[200px]" />
        <select value={filterType} onChange={(event) => setFilterType(event.target.value)} className={selectClassName} style={{ background: "var(--glass-bg)" }}>
          <option>Tous les types</option>
          <option>Revenu</option>
          <option>Depense</option>
        </select>
        <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className={selectClassName} style={{ background: "var(--glass-bg)" }}>
          <option>Toutes categories</option>
          {TRANSACTION_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </div>

      <TransactionsTable
        transactions={filteredTransactions}
        format={format}
        onEdit={openEdit}
        onDelete={(transaction) => {
          setSelectedTransaction(transaction);
          setModal("delete");
        }}
      />

      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <Overlay onClose={() => setModal(null)} title={modal === "add" ? "Nouvelle transaction" : "Modifier la transaction"}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type">
                  <select value={form.type} onChange={(event) => updateForm("type", event.target.value as Transaction["type"])} className={inputCls}>
                    <option value="income">Revenu</option>
                    <option value="expense">Depense</option>
                  </select>
                </Field>
                <Field label="Statut">
                  <select value={form.payment_status} onChange={(event) => updateForm("payment_status", event.target.value as Transaction["payment_status"])} className={inputCls}>
                    <option value="completed">Valide</option>
                    <option value="pending">En attente</option>
                  </select>
                </Field>
              </div>
              <Field label="Libelle">
                <input type="text" value={form.label} onChange={(event) => updateForm("label", event.target.value)} placeholder="Description de la transaction" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Categorie">
                  <select value={form.category} onChange={(event) => updateForm("category", event.target.value)} className={inputCls}>
                    {TRANSACTION_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Montant (CHF)">
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => updateForm("amount", event.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date">
                  <input type="date" value={form.date} onChange={(event) => updateForm("date", event.target.value)} className={inputCls} />
                </Field>
                <Field label="Recurrent">
                  <select value={String(form.recurring)} onChange={(event) => updateForm("recurring", event.target.value === "true")} className={inputCls}>
                    <option value="false">Non</option>
                    <option value="true">Oui</option>
                  </select>
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors duration-150">
                Annuler
              </button>
              <motion.button whileHover={{ scale: 1.02, transition: { duration: 0.15 } }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving || !form.label.trim() || !form.amount} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors duration-150 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === "add" ? "Ajouter" : "Enregistrer"}
              </motion.button>
            </div>
          </Overlay>
        )}

        {modal === "delete" && selectedTransaction && (
          <DeleteConfirm
            label="Supprimer la transaction ?"
            detail={`"${selectedTransaction.label}" - ${format(selectedTransaction.amount)} du ${selectedTransaction.date} sera definitivement supprimee.`}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
