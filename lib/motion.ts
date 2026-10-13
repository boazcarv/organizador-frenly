import type { Transition, Variants } from "motion/react";

/** Mutable tuples so they satisfy Motion's `Easing` type. */
export const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Gesture-only springs — never used for entrance choreography. */
export const SPRING_GESTURE: Transition = { type: "spring", stiffness: 320, damping: 30 };
export const SPRING_SOFT: Transition = { type: "spring", stiffness: 300, damping: 32 };
export const SPRING_POP: Transition = { type: "spring", stiffness: 340, damping: 26 };

export const DUR = {
  fast: 0.18,
  base: 0.3,
  slow: 0.42,
} as const;

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT_QUINT } },
};

export const fadeItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE_OUT_QUINT } },
};

export const scaleInItem: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.97, transition: { duration: DUR.fast } },
};

export const sheetPanel: Variants = {
  hidden: { x: "100%" },
  show: { x: 0, transition: SPRING_SOFT },
  exit: { x: "100%", transition: { duration: 0.24, ease: EASE_OUT_QUINT } },
};

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

/** Kanban column highlight while a card is dragged above it. */
export const columnDropVariants: Variants = {
  idle: { scale: 1, backgroundColor: "transparent" },
  over: { scale: 1.01, transition: SPRING_GESTURE },
};

/** Scroll reveal (once). */
export const revealViewport = { once: true, amount: 0.3 } as const;

/** Motion transition for a tapped chip / toggle. */
export const tapScale = { scale: 0.96 } as const;
export const hoverScale = { y: -2 } as const;
