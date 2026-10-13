import type { Variants } from "motion/react";
import { EASE_OUT_QUINT } from "./motion";

export interface StaggerOptions {
  /** delay between siblings, 40–70ms */
  stagger?: number;
  delayChildren?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
}

export function staggerContainer({
  stagger = 0.06,
  delayChildren = 0,
}: StaggerOptions = {}): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

export function staggerItem({ duration = 0.32, distance = 8 }: StaggerOptions = {}): Variants {
  return {
    hidden: { opacity: 0, y: distance },
    show: { opacity: 1, y: 0, transition: { duration, ease: EASE_OUT_QUINT } },
  };
}

export { staggerItem as fadeUpItem, staggerContainer as fadeUpContainer };
