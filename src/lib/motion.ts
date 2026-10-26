import type { Transition } from 'motion/react';

/** Ressorts « style Apple » : rapides, amortis, sans rebond exagéré. */
export const spring = {
  /** Écrans, feuilles, bandeaux. */
  smooth: { type: 'spring', stiffness: 380, damping: 36, mass: 1 } satisfies Transition,
  /** Petits éléments : boutons, cases, chiffres. */
  snappy: { type: 'spring', stiffness: 600, damping: 32, mass: 0.6 } satisfies Transition,
  /** Petit rebond visible : case ✓ validée. */
  bouncy: { type: 'spring', stiffness: 520, damping: 18, mass: 0.7 } satisfies Transition,
};

/** Retour au toucher des boutons : léger enfoncement. */
export const pressable = { whileTap: { scale: 0.96 }, transition: spring.snappy };
