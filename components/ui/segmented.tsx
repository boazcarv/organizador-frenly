"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { SPRING_GESTURE } from "@/lib/motion";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  "aria-label": string;
}

/** Hoje | Semana | Mês — the active option is a sliding accent pill. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  const layoutId = useId();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200",
              size === "sm" ? "h-6 px-3 text-[12px]" : "h-7 px-3.5 text-[13px]",
              active ? "text-white" : "text-ink-soft hover:text-ink",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`segmented-${layoutId}`}
                className="absolute inset-0 rounded-full bg-[var(--accent)]"
                transition={SPRING_GESTURE}
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
