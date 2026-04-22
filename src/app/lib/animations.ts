import { useReducedMotion } from "motion/react";

// ── Easing ────────────────────────────────────────────────────────────────────
/** Expo ease-out — perçu ~30% plus rapide que le "easeOut" standard */
export const EASE = [0.16, 1, 0.3, 1] as const;

// ── Springs ───────────────────────────────────────────────────────────────────
/** Pour modales, drawers, overlays */
export const SPRING = { type: "spring", stiffness: 380, damping: 28 } as const;
/** Pour micro-interactions (boutons, badges, tooltips) */
export const SPRING_FAST = { type: "spring", stiffness: 600, damping: 35 } as const;

// ── Variants ──────────────────────────────────────────────────────────────────

export const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0  },
} as const;

/** Élément de liste — supporte layout animations */
export const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0  },
  exit:   { opacity: 0, x: 12, scale: 0.98 },
} as const;

/** Backdrop de modale */
export const backdropVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.18 } },
  exit:   { opacity: 0, transition: { duration: 0.15 } },
} as const;

/** Panel de modale — spring pour un rendu naturel */
export const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: { ...SPRING, delay: 0.04 } },
  exit:   { opacity: 0, scale: 0.96, y: 8,  transition: { duration: 0.14, ease: "easeIn" } },
} as const;

/** Toast notification */
export const toastVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.94 },
  show:   { opacity: 1, y: 0,  scale: 1,   transition: SPRING },
  exit:   { opacity: 0, y: 20, scale: 0.94, transition: { duration: 0.14 } },
} as const;

/** Transition de page */
export const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.28, ease: EASE } },
  exit:   { opacity: 0, y: -6, transition: { duration: 0.14, ease: "easeIn" } },
} as const;

// ── Stagger helper ────────────────────────────────────────────────────────────
/** Crée un variant container qui stagger ses enfants */
export const stagger = (staggerChildren = 0.05, delayChildren = 0.08) => ({
  hidden: {},
  show:   { transition: { staggerChildren, delayChildren } },
});

// ── useMotion hook ────────────────────────────────────────────────────────────
/**
 * Retourne des variants réduits si l'utilisateur a activé
 * "prefers-reduced-motion". Remplace directement les variants bruts.
 */
export function useMotion() {
  const reduced = useReducedMotion();
  const instant = { hidden: {}, show: {}, exit: {} } as const;

  return {
    reduced,
    ease:             EASE,
    spring:           SPRING,
    springFast:       SPRING_FAST,
    cardVariants:     reduced ? instant : cardVariants,
    itemVariants:     reduced ? instant : itemVariants,
    backdropVariants: reduced ? instant : backdropVariants,
    panelVariants:    reduced ? instant : panelVariants,
    toastVariants:    reduced ? instant : toastVariants,
    pageVariants:     reduced ? instant : pageVariants,
  };
}