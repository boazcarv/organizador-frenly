"use client";

import { motion } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Sparkline } from "@/components/charts/sparkline";
import { formatDelta } from "@/lib/format";
import type { Metric } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Analytics stat card: big count-up number, delta chip and a miniature area
 * chart whose line draws itself on mount.
 */
export function MetricCard({
  metric,
  value,
  spark,
  delay = 0,
}: {
  metric: Metric;
  value: number;
  spark: number[];
  delay?: number;
}) {
  const positive = metric.delta >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group/metric relative flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      <p className="label-section">{metric.label}</p>

      <p className="metric-num mt-3 text-ink">
        <AnimatedNumber
          value={value}
          format={metric.format === "hours" ? "hours" : metric.format === "percent" ? "percent" : "number"}
        />
      </p>

      <p
        className={cn(
          "mt-1.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium",
          positive ? "bg-accent-tint text-accent" : "bg-danger-soft text-danger",
        )}
      >
        <TrendIcon className="size-3.5" aria-hidden />
        {formatDelta(metric.delta)} vs. período anterior
      </p>

      <div className="mt-4 -mx-5 -mb-5 h-[52px]">
        <Sparkline
          data={spark}
          height={52}
          delay={delay + 0.12}
          stroke="var(--accent-soft)"
          fill="var(--accent-soft)"
        />
      </div>
    </motion.section>
  );
}
