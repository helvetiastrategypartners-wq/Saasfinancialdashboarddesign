import { motion } from "motion/react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  highlight?: boolean;
  compValue?: string;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendUp,
  highlight,
  compValue,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border hover:border-accent-red/20 transition-all duration-300"
      style={{ background: "var(--glass-bg)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${highlight ? "bg-accent-blue/10" : "bg-accent-red-muted"}`}>
          <Icon className={`w-6 h-6 ${highlight ? "text-accent-blue" : "text-accent-red"}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
              trendUp ? "bg-accent-blue/10 text-accent-blue" : "bg-accent-red-muted text-accent-red"
            }`}
          >
            {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
      {compValue && <p className="text-xs text-muted-foreground/60 mt-1.5 tabular-nums">vs {compValue}</p>}
    </motion.div>
  );
}
