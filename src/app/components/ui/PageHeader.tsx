import { motion } from "motion/react";
import { EASE } from "../../lib/animation";

interface PageHeaderProps {
  title:     string;
  subtitle:  string;
  action?:   React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      {/* Titre glisse depuis le haut */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground text-lg">{subtitle}</p>
      </motion.div>

      {/* Action entre depuis la droite, légèrement décalée */}
      {action && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: EASE, delay: 0.08 }}
          className="flex items-center gap-3 flex-wrap"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}