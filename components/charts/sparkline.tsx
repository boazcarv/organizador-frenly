"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo } from "react";
import { EASE_OUT_QUINT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Normalises a series into a smooth line + area path inside a 0..100 box. */
function buildPaths(data: number[], height: number) {
  if (data.length < 2) return { line: "", area: "" };
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const stepX = 100 / (data.length - 1);
  // keep the stroke inside the box (vector-effect + padding)
  const pad = height * 0.1;
  const points = data.map((value, index) => ({
    x: index * stepX,
    y: pad + (1 - (value - min) / span) * (height - pad * 2),
  }));

  let line = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midX = (previous.x + current.x) / 2;
    line += ` C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`;
  }
  const area = `${line} L 100 ${height} L 0 ${height} Z`;
  return { line, area };
}

interface SparklineProps {
  data: number[];
  height?: number;
  className?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  showArea?: boolean;
  animate?: boolean;
  delay?: number;
}

/**
 * Miniature area chart. The line draws itself with pathLength 0 → 1 (900ms)
 * while the gradient fades in behind it.
 */
export function Sparkline({
  data,
  height = 40,
  className,
  stroke = "var(--accent-soft)",
  fill = "var(--accent-soft)",
  strokeWidth = 2,
  showArea = true,
  animate = true,
  delay = 0,
}: SparklineProps) {
  const gradientId = `spark-${useId().replace(/:/g, "")}`;
  const reduce = useReducedMotion();
  const { line, area } = useMemo(() => buildPaths(data, height), [data, height]);

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={cn("block h-full w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.34" />
          <stop offset="70%" stopColor={fill} stopOpacity="0.04" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>

      {showArea ? (
        <motion.path
          d={area}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: delay + 0.2, ease: EASE_OUT_QUINT }}
        />
      ) : null}

      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={animate && !reduce ? { pathLength: 0, opacity: 0.4 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay, ease: EASE_OUT_QUINT }}
      />
    </svg>
  );
}
