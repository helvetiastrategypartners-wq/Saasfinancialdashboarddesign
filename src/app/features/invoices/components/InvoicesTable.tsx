import { motion } from "motion/react";
import { CheckCircle, Pencil, Trash2 } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { INVOICE_STATUS_CLASS, type InvoiceRow } from "../hooks/useInvoicesData";

interface InvoicesTableProps {
  invoices: InvoiceRow[];
  format: (value: number) => string;
  onMarkPaid: (invoice: InvoiceRow) => void;
  onEdit: (invoice: InvoiceRow) => void;
  onDelete: (invoice: InvoiceRow) => void;
}

export function InvoicesTable({ invoices, format, onMarkPaid, onEdit, onDelete }: InvoicesTableProps) {
  return (
    <GlassCard delay={0.3} noPadding>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-glass-border">
              {["Reference", "Fournisseur", "Categorie", "Date", "Montant TTC", "Statut", "Actions"].map((header, index) => (
                <th
                  key={header}
                  className={`p-4 text-sm font-semibold text-muted-foreground ${index >= 4 ? (index === 6 ? "text-right" : index === 5 ? "text-center" : "text-right") : "text-left"}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, index) => (
              <motion.tr
                key={invoice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(0.2 + index * 0.03, 0.5) }}
                className="border-b border-glass-border/50 hover:bg-white/5 transition-colors"
              >
                <td className="p-4 text-sm font-mono font-semibold text-foreground">{invoice.number}</td>
                <td className="p-4 text-sm text-foreground">{invoice.supplier}</td>
                <td className="p-4 text-sm text-foreground">{invoice.category}</td>
                <td className="p-4 text-sm text-foreground">{invoice.dueDate}</td>
                <td className={`p-4 text-sm text-right font-semibold ${invoice.status === "Remboursement" ? "text-purple-400" : "text-foreground"}`}>
                  {invoice.status === "Remboursement" ? `-${format(invoice.amount)}` : format(invoice.amount)}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${INVOICE_STATUS_CLASS[invoice.status] ?? ""}`}>{invoice.status}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    {invoice.status !== "Payee" && (
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onMarkPaid(invoice)} className="p-2 rounded-lg hover:bg-accent-blue/20 transition-colors">
                        <CheckCircle className="w-4 h-4 text-accent-blue" />
                      </motion.button>
                    )}
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onEdit(invoice)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onDelete(invoice)} className="p-2 rounded-lg hover:bg-accent-red/20 transition-colors">
                      <Trash2 className="w-4 h-4 text-accent-red" />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Aucune facture trouvee.</div>
        )}
      </div>
    </GlassCard>
  );
}
