import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardProps {
  label: string;
  value: string;
  trend: string;
  trendPositive: boolean;
}

export function SummaryCard({ label, value, trend, trendPositive }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-2xl p-6 backdrop-blur-xl border ${trendPositive ? "border-accent-blue" : "border-accent-red"}`}
      style={{ background: "var(--glass-bg)" }}
    >
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className={`text-3xl font-semibold mb-2 ${trendPositive ? "text-accent-blue" : "text-accent-red"}`}>{value}</p>
      <div className={`flex items-center gap-1 text-sm ${trendPositive ? "text-accent-blue" : "text-accent-red"}`}>
        {trendPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {trend}
      </div>
    </motion.div>
  );
}
