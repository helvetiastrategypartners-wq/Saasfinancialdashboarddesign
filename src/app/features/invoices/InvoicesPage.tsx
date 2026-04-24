import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle, Loader2, Plus, Sparkles, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { Field, Overlay, inputCls, useToast } from "../../components/Modal";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { SearchInput } from "../../components/ui/SearchInput";
import { InvoicesTable } from "./components";
import {
  AI_STEPS,
  buildInvoicePayload,
  EMPTY_INVOICE_FORM,
  INVOICE_CATEGORIES,
  toInvoiceForm,
  useInvoicesData,
  type InvoiceFormState,
  type InvoiceRow,
} from "./hooks";
import type { Transaction } from "@shared/types";

type ModalMode = "add" | "edit" | "delete" | "ai" | null;

export function Invoices() {
  const { show, ToastEl } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [form, setForm] = useState<InvoiceFormState>(EMPTY_INVOICE_FORM);
  const [aiStep, setAiStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const {
    format,
    filteredInvoices,
    paidAmount,
    unpaidAmount,
    refundList,
    refundAmount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useInvoicesData(searchTerm, statusFilter);

  function updateForm<K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY_INVOICE_FORM);
    setSelectedInvoice(null);
    setModal("add");
  }

  function openEdit(invoice: InvoiceRow) {
    setForm(toInvoiceForm(invoice));
    setSelectedInvoice(invoice);
    setModal("edit");
  }

  async function handleMarkPaid(invoice: InvoiceRow) {
    await updateTransaction(invoice.id, { payment_status: "completed" });
    show("Facture marquee comme payee");
  }

  async function handleSave() {
    if (!form.label.trim() || !form.amount) return;
    setSaving(true);
    const payload = buildInvoicePayload(form);

    if (modal === "add") {
      await addTransaction(payload);
      show("Facture ajoutee");
    } else if (modal === "edit" && selectedInvoice) {
      await updateTransaction(selectedInvoice.id, {
        label: payload.label,
        category: payload.category,
        amount: payload.amount,
        date: payload.date,
        payment_status: payload.payment_status,
      });
      show("Facture mise a jour");
    }

    setSaving(false);
    setModal(null);
  }

  async function handleDelete() {
    if (!selectedInvoice) return;
    setSaving(true);
    await deleteTransaction(selectedInvoice.id);
    setSaving(false);
    setModal(null);
    show("Facture supprimee");
  }

  function startAI() {
    setAiStep(0);
    setModal("ai");
    [500, 1200, 2000, 2800].forEach((delay, index) => {
      setTimeout(() => setAiStep(index + 1), delay);
    });
  }

  return (
    <div className="p-8 space-y-6">
      {ToastEl}
      <PageHeader
        title="Factures"
        subtitle="Gerez vos factures fournisseurs et le suivi des paiements"
        action={
          <>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startAI} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors shadow-lg">
              <Zap className="w-5 h-5" /> AI Extraction
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openAdd} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-background hover:bg-white/90 transition-colors shadow-lg">
              <Plus className="w-5 h-5" /> Ajouter une facture
            </motion.button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <GlassCard delay={0}>
          <p className="text-sm text-muted-foreground mb-2">Factures payees</p>
          <p className="text-3xl font-semibold text-accent-blue">{format(paidAmount)}</p>
        </GlassCard>
        <GlassCard delay={0.1}>
          <p className="text-sm text-muted-foreground mb-2">Factures en attente</p>
          <p className="text-3xl font-semibold text-yellow-500">{format(unpaidAmount)}</p>
        </GlassCard>
        <GlassCard delay={0.2} className="border-purple-500/30">
          <p className="text-sm text-muted-foreground mb-2">Remboursements</p>
          <p className="text-3xl font-semibold text-purple-400">-{format(refundAmount)}</p>
        </GlassCard>
      </div>

      {refundList.length > 0 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
          <div>
            <p className="text-purple-400 font-semibold">Remboursements enregistres</p>
            <p className="text-sm text-purple-400/80 mt-1">
              {refundList.length} remboursement(s) - {format(refundAmount)} credites
            </p>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher par fournisseur, numero ou categorie..." className="flex-1" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-6 py-3 rounded-xl bg-secondary/50 border border-glass-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-xl">
          <option value="Tous">Tous les statuts</option>
          <option value="Emise">Emise</option>
          <option value="Payee">Payee</option>
          <option value="Remboursement">Remboursement</option>
        </select>
      </div>

      <InvoicesTable
        invoices={filteredInvoices}
        format={format}
        onMarkPaid={handleMarkPaid}
        onEdit={openEdit}
        onDelete={(invoice) => {
          setSelectedInvoice(invoice);
          setModal("delete");
        }}
      />

      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <Overlay onClose={() => setModal(null)} title={modal === "add" ? "Nouvelle facture" : "Modifier la facture"}>
            <div className="space-y-4">
              <Field label="Fournisseur">
                <input type="text" value={form.label} onChange={(event) => updateForm("label", event.target.value)} placeholder="Ex: AWS, Loyer, Prestataire..." className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Categorie">
                  <select value={form.category} onChange={(event) => updateForm("category", event.target.value)} className={inputCls}>
                    {INVOICE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Statut">
                  <select value={form.payment_status} onChange={(event) => updateForm("payment_status", event.target.value as Transaction["payment_status"])} className={inputCls}>
                    <option value="pending">Emise</option>
                    <option value="completed">Payee</option>
                    <option value="cancelled">Remboursement</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Montant (CHF)">
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => updateForm("amount", event.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Date">
                  <input type="date" value={form.date} onChange={(event) => updateForm("date", event.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Description (optionnel)">
                <input type="text" value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Note interne..." className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving || !form.label.trim() || !form.amount} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === "add" ? "Ajouter" : "Enregistrer"}
              </motion.button>
            </div>
          </Overlay>
        )}

        {modal === "delete" && selectedInvoice && (
          <Overlay onClose={() => setModal(null)} small>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-accent-red" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Supprimer la facture ?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-medium text-foreground">{selectedInvoice.supplier}</span> - {format(selectedInvoice.amount)} du {selectedInvoice.dueDate} sera definitivement supprimee.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDelete} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Supprimer
              </motion.button>
            </div>
          </Overlay>
        )}

        {modal === "ai" && (
          <Overlay onClose={aiStep >= 4 ? () => setModal(null) : undefined} small>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent-red" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">AI Extraction</h2>
            </div>
            <div className="space-y-3 mb-6">
              {AI_STEPS.map((label, index) => (
                <div key={label} className="flex items-center gap-3">
                  {aiStep > index ? (
                    <CheckCircle className="w-5 h-5 text-accent-blue shrink-0" />
                  ) : aiStep === index ? (
                    <Loader2 className="w-5 h-5 text-accent-red animate-spin shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-glass-border shrink-0" />
                  )}
                  <span className={`text-sm ${aiStep > index ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                </div>
              ))}
            </div>
            {aiStep >= 4 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-sm text-muted-foreground mb-4">
                  Extraction terminee. Verifiez et completez les champs avant d'enregistrer.
                </p>
                <button
                  onClick={() => {
                    setModal(null);
                    setTimeout(() => {
                      setForm({
                        label: "Fournisseur extrait",
                        category: "Operations",
                        amount: "1250",
                        date: new Date().toISOString().slice(0, 10),
                        payment_status: "pending",
                        description: "Via AI Extraction",
                      });
                      setSelectedInvoice(null);
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
