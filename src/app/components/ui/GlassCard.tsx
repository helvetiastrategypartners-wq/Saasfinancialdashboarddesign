import { motion, type HTMLMotionProps } from "motion/react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "style"> {
  delay?: number;
  hover?: boolean;
  noPadding?: boolean;
}

export function GlassCard({
  children,
  className = "",
  delay = 0,
  hover = false,
  noPadding = false,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      {...(hover && { whileHover: { scale: 1.01, y: -2 } })}
      className={`rounded-2xl backdrop-blur-xl border border-glass-border ${noPadding ? "" : "p-6"} ${className}`}
      style={{ background: "var(--glass-bg)" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}