import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { EASE } from "../../lib/animation";

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
  const reduced = useReducedMotion();

  return (
    <motion.div
      // `initial={false}` quand reduced = pas d'animation du tout
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      // Le delay n'affecte QUE l'entrée — pas le hover (voir whileHover ci-dessous)
      transition={
        reduced
          ? { duration: 0 }
          : { delay, duration: 0.35, ease: EASE }
      }
      // La transition hover est déclarée DANS whileHover pour être indépendante du delay
      {...(hover && !reduced && {
        whileHover: {
          scale: 1.01,
          y: -2,
          transition: { duration: 0.18, ease: EASE },
        },
      })}
      className={`rounded-2xl backdrop-blur-xl border border-glass-border ${noPadding ? "" : "p-6"} ${className}`}
      style={{ background: "var(--glass-bg)" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}