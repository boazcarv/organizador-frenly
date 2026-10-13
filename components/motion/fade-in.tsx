"use client";

import { motion, type Variants } from "motion/react";
import { EASE_OUT_QUINT, revealViewport } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  /** animate when scrolled into view instead of on mount */
  inView?: boolean;
  duration?: number;
}

export function FadeIn({ children, className, delay = 0, y = 8, inView = false, duration = 0.32 }: FadeInProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration, delay, ease: EASE_OUT_QUINT } },
  };

  if (inView) {
    return (
      <motion.div
        className={cn(className)}
        variants={variants}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div className={cn(className)} variants={variants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}
