"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChartPie } from "lucide-react";
import { useState } from "react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatHours } from "@/lib/format";
import type { DonutSlice } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIZE = 190;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Time distribution. Slices grow from zero with an animated strokeDashoffset
 * (700ms), the hovered slice thickens and the legend keeps hours right-aligned.
 */
export function DonutBreakdown({ slices }: { slices: DonutSlice[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);
  const total = slices.reduce((sum, slice) => sum + slice.hours, 0);

  const arcs = slices.map((slice, index) => {
    const fraction = slice.hours / total;
    const startHours = slices.slice(0, index).reduce((sum, item) => sum + item.hours, 0);
    return {
      slice,
      fraction,
      dash: fraction * CIRCUMFERENCE,
      rotation: (startHours / total) * 360,
    };
  });

  // No hours in the window: an empty ring with a zero in the middle says less
  // than simply stating it.
  if (slices.length === 0) {
    return (
      <Panel className="flex h-full flex-col" hoverable={false}>
        <PanelHeader title="Distribuição de tempo" hint="Horas registradas por projeto" />
        <div className="mt-5">
          <EmptyState
            icon={ChartPie}
            title="Nada registrado neste período"
            description="As sessões do cronômetro entram aqui, agrupadas por projeto."
          />
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="flex h-full flex-col" hoverable={false}>
      <PanelHeader title="Distribuição de tempo" hint="Horas rastreadas por tipo de trabalho" />

      <div className="mt-5 flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-center xl:flex-col">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="-rotate-90"
            role="img"
            aria-label={`Total de ${formatHours(total)} distribuídas em ${slices.length} categorias`}
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--line-soft)"
              strokeWidth={STROKE * 0.6}
            />
            {arcs.map((arc, index) => {
              const isActive = active === arc.slice.key;
              const dimmed = active !== null && !isActive;
              return (
                <motion.circle
                  key={arc.slice.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={arc.slice.color}
                  strokeWidth={STROKE * 0.6}
                  strokeLinecap="butt"
                  strokeDasharray={`${arc.dash} ${CIRCUMFERENCE - arc.dash}`}
                  transform={`rotate(${arc.rotation} ${SIZE / 2} ${SIZE / 2})`}
                  initial={reduce ? { opacity: 1 } : { strokeDashoffset: arc.dash, opacity: 0 }}
                  animate={{
                    strokeDashoffset: isActive ? -arc.dash * 0.06 : 0,
                    opacity: dimmed ? 0.45 : 1,
                    strokeWidth: isActive ? STROKE * 0.72 : STROKE * 0.6,
                  }}
                  transition={{ duration: 0.7, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  onMouseEnter={() => setActive(arc.slice.key)}
                  onMouseLeave={() => setActive(null)}
                  className="cursor-default"
                />
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="metric-num text-[30px] text-ink">
              <AnimatedNumber value={total} format="hours" />
            </span>
            <span className="mt-0.5 text-[11.5px] text-ink-soft">
              {active ? slices.find((slice) => slice.key === active)?.label : "total no período"}
            </span>
          </div>
        </div>

        <ul className="w-full space-y-1">
          {slices.map((slice) => {
            const share = Math.round((slice.hours / total) * 100);
            return (
              <li
                key={slice.key}
                onMouseEnter={() => setActive(slice.key)}
                onMouseLeave={() => setActive(null)}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 transition-colors duration-200",
                  active === slice.key ? "bg-surface-muted" : "bg-transparent",
                )}
              >
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">{slice.label}</span>
                <span className="text-[11px] tabular-nums text-ink-faint">{share}%</span>
                <span className="w-[52px] text-right text-[12.5px] font-semibold tabular-nums text-ink">
                  {formatHours(slice.hours)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}
