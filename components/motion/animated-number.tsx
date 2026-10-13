"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { formatHours, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Format = "number" | "hours" | "percent" | "decimal";

interface AnimatedNumberProps {
  value: number;
  format?: Format;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  /** starting point of the count-up (defaults to 0) */
  from?: number;
  stiffness?: number;
  damping?: number;
}

function render(value: number, format: Format, decimals: number, prefix: string, suffix: string) {
  if (format === "hours") return `${prefix}${formatHours(value)}${suffix}`;
  if (format === "percent") return `${prefix}${formatNumber(value, decimals)}%${suffix}`;
  return `${prefix}${formatNumber(value, decimals)}${suffix}`;
}

/**
 * Count-up number. Driven by a MotionValue so the digits update without a
 * React re-render, and tabular-nums keeps the layout from shifting.
 */
export function AnimatedNumber({
  value,
  format = "number",
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  from = 0,
  stiffness = 90,
  damping = 22,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  const spring = useSpring(reduce ? value : from, { stiffness, damping, mass: 0.9 });
  const text = useTransform(spring, (latest) => render(latest, format, decimals, prefix, suffix));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span aria-hidden className={cn("tnum inline-block", className)}>
      {text}
    </motion.span>
  );
}
