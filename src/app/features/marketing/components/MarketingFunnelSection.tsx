import { motion } from "motion/react";
import { GlassCard } from "../../../components/ui/GlassCard";

interface FunnelStage {
  label: string;
  value: number;
  pct: number;
  color: string;
}

interface MarketingFunnelSectionProps {
  funnelStages: FunnelStage[];
  monthLabel: string;
  totalClients: number;
  totalLeads: number;
  totalMql: number;
  totalSql: number;
}

export function MarketingFunnelSection({
  funnelStages,
  monthLabel,
  totalClients,
  totalLeads,
  totalMql,
  totalSql,
}: MarketingFunnelSectionProps) {
  return (
    <GlassCard delay={0.25}>
      <h3 className="text-xl font-semibold text-foreground mb-2">Entonnoir de conversion</h3>
      <p className="text-sm text-muted-foreground mb-6">{monthLabel} - parcours leads vers MQL puis SQL puis clients</p>
      <div className="space-y-4">
        {funnelStages.map((stage, index) => {
          const conversionRate =
            index > 0 && funnelStages[index - 1].value > 0
              ? (stage.value / funnelStages[index - 1].value) * 100
              : null;

          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                  <span className="text-sm font-medium text-foreground">{stage.label}</span>
                  {conversionRate !== null && <span className="text-xs text-muted-foreground">{conversionRate.toFixed(1)}% du precedent</span>}
                </div>
                <span className="text-sm font-semibold tabular-nums" style={{ color: stage.color }}>
                  {stage.value.toLocaleString("fr-CH")}
                </span>
              </div>
              <div className="h-8 rounded-lg overflow-hidden" style={{ background: "var(--secondary)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.7, delay: 0.1 + index * 0.1, ease: "easeOut" }} className="h-full rounded-lg" style={{ background: stage.color, opacity: 0.8 }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Leads vers Clients", value: totalLeads > 0 ? `${((totalClients / totalLeads) * 100).toFixed(1)}%` : "-" },
          { label: "Leads vers MQL", value: totalLeads > 0 ? `${((totalMql / totalLeads) * 100).toFixed(1)}%` : "-" },
          { label: "SQL vers Clients", value: totalSql > 0 ? `${((totalClients / totalSql) * 100).toFixed(1)}%` : "-" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-3 border border-glass-border text-center" style={{ background: "var(--glass-bg)" }}>
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-base font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
