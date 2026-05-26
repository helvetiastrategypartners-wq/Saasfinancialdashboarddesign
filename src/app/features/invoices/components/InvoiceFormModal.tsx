import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { Field, Overlay, inputCls } from "../../../components/Modal";
import { INVOICE_CATEGORIES, type InvoiceFormState } from "../hooks";
import type { Transaction } from "@shared/types";

interface InvoiceFormModalProps {
  form: InvoiceFormState;
  mode: "add" | "edit";
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  onUpdate: <K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) => void;
}

export function InvoiceFormModal({ form, mode, saving, onCancel, onSave, onUpdate }: InvoiceFormModalProps) {
  return (
    <Overlay onClose={onCancel} title={mode === "add" ? "Nouvelle facture" : "Modifier la facture"}>
      <div className="space-y-4">
        <Field label="Fournisseur">
          <input type="text" value={form.label} onChange={(event) => onUpdate("label", event.target.value)} placeholder="Ex: AWS, Loyer, Prestataire..." className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Categorie">
            <select value={form.category} onChange={(event) => onUpdate("category", event.target.value)} className={inputCls}>
              {INVOICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut">
            <select value={form.payment_status} onChange={(event) => onUpdate("payment_status", event.target.value as Transaction["payment_status"])} className={inputCls}>
              <option value="pending">Emise</option>
              <option value="completed">Payee</option>
              <option value="cancelled">Remboursement</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Montant (CHF)">
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => onUpdate("amount", event.target.value)} placeholder="0.00" className={inputCls} />
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={(event) => onUpdate("date", event.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Description (optionnel)">
          <input type="text" value={form.description} onChange={(event) => onUpdate("description", event.target.value)} placeholder="Note interne..." className={inputCls} />
        </Field>
      </div>
      <div className="flex justify-end gap-3 mt-8">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-glass-border text-foreground hover:bg-white/5 transition-colors">
          Annuler
        </button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSave} disabled={saving || !form.label.trim() || !form.amount} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "add" ? "Ajouter" : "Enregistrer"}
        </motion.button>
      </div>
    </Overlay>
  );
}
