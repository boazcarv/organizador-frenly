"use client";

import { motion } from "motion/react";
import { staggerContainer, staggerItem, type StaggerOptions } from "@/lib/stagger";
import { cn } from "@/lib/utils";

interface StaggerProps extends StaggerOptions {
  children: React.ReactNode;
  className?: string;
  /** re-run the cascade whenever this key changes */
  cascadeKey?: string | number;
}

export function Stagger({ children, className, cascadeKey, ...options }: StaggerProps) {
  return (
    <motion.div
      key={cascadeKey}
      className={cn(className)}
      variants={staggerContainer(options)}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const Component = motion[as];
  return (
    <Component className={cn(className)} variants={staggerItem()}>
      {children}
    </Component>
  );
}

/** Scroll-triggered variant: cascades once, when the block enters the viewport. */
export function StaggerReveal({ children, className, ...options }: Omit<StaggerProps, "cascadeKey">) {
  return (
    <motion.div
      className={cn(className)}
      variants={staggerContainer(options)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
