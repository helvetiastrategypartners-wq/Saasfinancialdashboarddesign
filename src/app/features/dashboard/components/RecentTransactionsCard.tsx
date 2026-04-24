import { motion } from "motion/react";
import type { Transaction } from "@shared/types";
import { GlassCard } from "../../../components/ui/GlassCard";

interface RecentTransactionsCardProps {
  recentTransactions: Transaction[];
  formatCurrency: (value: number) => string;
}

export function RecentTransactionsCard({
  recentTransactions,
  formatCurrency,
}: RecentTransactionsCardProps) {
  return (
    <GlassCard delay={0.3}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">Transactions recentes</h3>
        <span className="text-sm text-muted-foreground">{recentTransactions.length} transactions</span>
      </div>
      <div className="space-y-3">
        {recentTransactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="flex items-center justify-between p-4 rounded-xl border border-glass-border hover:bg-glass-hover transition-all"
            style={{ background: "var(--glass-bg)" }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${transaction.type === "income" ? "bg-accent-blue" : "bg-accent-red"}`} />
              <div>
                <p className="text-sm font-medium text-foreground">{transaction.label}</p>
                <p className="text-xs text-muted-foreground">{transaction.date} · {transaction.category}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${transaction.type === "income" ? "text-accent-blue" : "text-accent-red"}`}>
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{transaction.payment_status}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
