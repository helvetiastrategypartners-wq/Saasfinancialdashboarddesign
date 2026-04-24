import { motion } from "motion/react";
import { Pencil, Trash2 } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import type { MarketingMetrics } from "@shared/types";

interface MarketingCampaignTableProps {
  monthlyMetrics: MarketingMetrics[];
  monthLabel: string;
  format: (value: number) => string;
  onEdit: (metric: MarketingMetrics) => void;
  onDelete: (metric: MarketingMetrics) => void;
}

export function MarketingCampaignTable({
  monthlyMetrics,
  monthLabel,
  format,
  onEdit,
  onDelete,
}: MarketingCampaignTableProps) {
  return (
    <GlassCard delay={0.3} noPadding>
      <div className="p-6 border-b border-glass-border">
        <h3 className="text-xl font-semibold text-foreground">Detail des campagnes - {monthLabel}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-glass-border">
              {["Canal", "Depense", "Leads", "Clients", "CAC", "Revenu genere", "ROAS", "Actions"].map((header, index) => (
                <th key={header} className={`p-4 text-sm font-semibold text-muted-foreground ${index === 0 ? "text-left" : "text-right"}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlyMetrics.map((metric, index) => {
              const cac = metric.customers_acquired > 0 ? metric.spend / metric.customers_acquired : 0;
              const roas = metric.spend > 0 ? metric.revenue_generated / metric.spend : 0;

              return (
                <motion.tr
                  key={metric.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(0.2 + index * 0.05, 0.5) }}
                  className="border-b border-glass-border/50 hover:bg-glass-hover transition-colors"
                >
                  <td className="p-4 text-sm font-semibold text-foreground">{metric.channel_id ?? "-"}</td>
                  <td className="p-4 text-sm text-right text-foreground">{format(metric.spend)}</td>
                  <td className="p-4 text-sm text-right text-foreground">{metric.leads ?? 0}</td>
                  <td className="p-4 text-sm text-right text-accent-blue font-semibold">{metric.customers_acquired}</td>
                  <td className="p-4 text-sm text-right text-foreground">{format(cac)}</td>
                  <td className="p-4 text-sm text-right text-foreground">{format(metric.revenue_generated)}</td>
                  <td className="p-4 text-sm text-right text-foreground">{roas.toFixed(2)}x</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onEdit(metric)} className="p-2 rounded-lg hover:bg-glass-hover transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onDelete(metric)} className="p-2 rounded-lg hover:bg-accent-red/20 transition-colors">
                        <Trash2 className="w-4 h-4 text-accent-red" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            {monthlyMetrics.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">
                  Aucune metrique pour ce mois.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
