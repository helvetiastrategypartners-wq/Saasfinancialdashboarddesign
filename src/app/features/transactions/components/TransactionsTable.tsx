import { motion, AnimatePresence } from "motion/react";
import { Pencil, Trash2 } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { EASE } from "../../../lib/animation";
import type { Transaction } from "@shared/types";

interface TransactionsTableProps {
  transactions: Transaction[];
  format: (value: number) => string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionsTable({
  transactions,
  format,
  onEdit,
  onDelete,
}: TransactionsTableProps) {
  return (
    <GlassCard noPadding>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-glass-border">
              {["Type", "Libelle", "Categorie", "Date", "Statut", "Recurrent", "Montant", "Actions"].map((header, index) => (
                <th key={header} className={`p-4 text-sm font-semibold text-muted-foreground ${index >= 6 ? "text-right" : "text-left"}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <AnimatePresence initial={false}>
            <tbody>
              {transactions.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, transition: { duration: 0.18, ease: EASE } }}
                  transition={{ delay: Math.min(0.1 + index * 0.02, 0.5), duration: 0.22, ease: EASE }}
                  className="border-b border-glass-border/50 hover:bg-white/5 transition-[background-color] duration-150"
                >
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${transaction.type === "income" ? "bg-accent-blue/10 text-accent-blue" : "bg-accent-red/10 text-accent-red"}`}>
                      {transaction.type === "income" ? "Revenu" : "Depense"}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-foreground">{transaction.label}</td>
                  <td className="p-4 text-sm text-muted-foreground">{transaction.category}</td>
                  <td className="p-4 text-sm text-muted-foreground">{transaction.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${transaction.payment_status === "completed" ? "bg-accent-blue/10 text-accent-blue" : "bg-yellow-500/10 text-yellow-500"}`}>
                      {transaction.payment_status === "completed" ? "Valide" : "En attente"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-center text-muted-foreground">{transaction.recurring ? "Oui" : "-"}</td>
                  <td className={`p-4 text-sm text-right font-semibold ${transaction.type === "income" ? "text-accent-blue" : "text-accent-red"}`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {format(transaction.amount)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1, transition: { duration: 0.12 } }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEdit(transaction)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-150"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, transition: { duration: 0.12 } }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(transaction)}
                        className="p-2 rounded-lg hover:bg-accent-red/10 transition-colors duration-150"
                      >
                        <Trash2 className="w-4 h-4 text-accent-red" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </AnimatePresence>
        </table>
        {transactions.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground">
            Aucune transaction trouvee.
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
}
