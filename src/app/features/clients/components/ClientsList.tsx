import { motion, AnimatePresence } from "motion/react";
import { Edit, Trash2 } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { EASE } from "../../../lib/animation";
import { CLIENT_STATUS_CLASS, CLIENT_STATUS_LABEL } from "../hooks/useClientsData";
import type { Customer } from "@shared/types";

interface ClientsListProps {
  clients: Customer[];
  format: (value: number) => string;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function ClientsList({ clients, format, onEdit, onDelete }: ClientsListProps) {
  if (clients.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground">
        Aucun client trouve.
      </motion.div>
    );
  }

  return (
    <motion.div layout className="grid grid-cols-1 gap-4">
      <AnimatePresence mode="popLayout" initial={false}>
        {clients.map((client, index) => (
          <GlassCard
            key={client.id}
            layout
            delay={Math.min(0.1 + index * 0.04, 0.5)}
            exit={{
              opacity: 0,
              x: 20,
              scale: 0.98,
              transition: { duration: 0.2, ease: EASE },
            }}
            hover
            className="hover:border-accent-red/20 transition-[border-color] duration-200"
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
                    <p className="text-sm text-foreground">{client.acquisition_channel ?? "-"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Depuis{" "}
                      {new Date(client.acquisition_date).toLocaleDateString("fr-CH", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">MRR</p>
                    <p className="text-lg font-semibold text-foreground">{format(client.monthly_revenue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Marge {client.gross_margin_percent.toFixed(2)}% ·{" "}
                      {format((client.monthly_revenue * client.gross_margin_percent) / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Revenu total</p>
                    <p className="text-lg font-semibold text-foreground">{format(client.total_revenue)}</p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium mt-1 ${CLIENT_STATUS_CLASS[client.status]}`}>
                      {CLIENT_STATUS_LABEL[client.status]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <motion.button
                  whileHover={{ scale: 1.1, transition: { duration: 0.12 } }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onEdit(client)}
                  title="Modifier"
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-150"
                >
                  <Edit className="w-5 h-5 text-muted-foreground hover:text-accent-blue transition-colors duration-150" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, transition: { duration: 0.12 } }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(client)}
                  title="Supprimer"
                  className="p-2 rounded-lg hover:bg-accent-red/10 transition-colors duration-150"
                >
                  <Trash2 className="w-5 h-5 text-accent-red" />
                </motion.button>
              </div>
            </div>
          </GlassCard>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
