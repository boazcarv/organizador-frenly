"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EASE_OUT_QUINT } from "@/lib/motion";

const SIZE = 176;
const STROKE = 13;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RingLegendRow {
  label: string;
  value: number;
  color: string;
}

/**
 * Completion ring. The arc fills from 0 with an 800ms ease-out, the number
 * counts up in the middle.
 */
export function ProgressRingCard({
  value,
  caption,
  legend,
}: {
  value: number;
  caption: string;
  legend: RingLegendRow[];
}) {
  const gradientId = `ring-${useId().replace(/:/g, "")}`;
  const reduce = useReducedMotion();
  const offset = CIRCUMFERENCE * (1 - Math.min(Math.max(value, 0), 100) / 100);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Progresso dos projetos" hint="Todos os projetos do workspace" />

      <div className="mt-5 flex flex-1 flex-col items-center gap-5 sm:flex-row sm:items-center xl:flex-col xl:items-center">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="-rotate-90"
            role="img"
            aria-label={`${value} por cento dos projetos concluídos`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent-soft)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--line)"
              strokeWidth={STROKE}
            />
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="metric-num text-[34px] text-ink">
              <AnimatedNumber value={value} format="percent" />
            </span>
            <span className="mt-0.5 max-w-[92px] text-center text-[11.5px] leading-tight text-ink-soft">
              {caption}
            </span>
          </div>
        </div>

        <ul className="w-full space-y-2">
          {legend.map((row) => (
            <li key={row.label} className="flex items-center gap-2.5">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">{row.label}</span>
              <span className="text-[12.5px] font-semibold tabular-nums text-ink">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
