import { motion } from "motion/react";

interface SummaryItem {
  label: string;
  value: string;
}

interface SummaryGridProps {
  items: SummaryItem[];
  netCashflow: number;
}

export function SummaryGrid({ items, netCashflow }: SummaryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map(item => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 backdrop-blur-xl border border-glass-border text-center"
          style={{ background: "var(--glass-bg)" }}
        >
          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
          <p className={`text-xl font-semibold ${item.label.startsWith("Cashflow") && netCashflow < 0 ? "text-accent-red" : "text-foreground"}`}>
            {item.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
