"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Chip / toggle / small control wrapper: a short spring on tap, nothing else.
 * Used for filter chips, segmented options and icon buttons where the click
 * feedback should feel physical but never delay the action.
 */
export function Pressable({
  children,
  className,
  onClick,
  disabled,
  "aria-pressed": ariaPressed,
  "aria-label": ariaLabel,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  "aria-pressed"?: boolean;
  "aria-label"?: string;
  title?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ariaPressed}
      aria-label={ariaLabel}
      title={title}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={cn("disabled:pointer-events-none disabled:opacity-50", className)}
    >
      {children}
    </motion.button>
  );
}
