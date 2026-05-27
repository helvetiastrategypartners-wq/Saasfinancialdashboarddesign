import { motion } from "motion/react";
import { GlassCard } from "../../../components/ui/GlassCard";
import type { InsightCard } from "../hooks/useReportsData";

interface ReportInsightsSectionProps {
  insightCards: InsightCard[];
}

export function ReportInsightsSection({ insightCards }: ReportInsightsSectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-4">Insights Automatiques</h2>
      <div className="space-y-4">
        {insightCards.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`rounded-2xl p-6 backdrop-blur-xl border ${insight.border}`}
            style={{ background: "var(--glass-bg)" }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${insight.bgColor} flex items-center justify-center shrink-0`}>
                <insight.icon className={`w-6 h-6 ${insight.color}`} />
              </div>
              <p className={`text-base font-medium ${insight.color} self-center`}>{insight.text}</p>
            </div>
          </motion.div>
        ))}
        {insightCards.length === 0 && (
          <GlassCard className="text-center">
            <p className="text-muted-foreground">Aucun insight disponible pour ce mois.</p>
          </GlassCard>
        )}
      </div>
    </section>
  );
}
