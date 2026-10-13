"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Line, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatShortDate } from "@/lib/format";
import { useMeasure } from "@/lib/use-measure";
import type { ThroughputPoint } from "@/lib/types";

interface TooltipPayloadItem {
  payload: ThroughputPoint;
}

function ThroughputTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="min-w-[188px] rounded-[16px] border border-white/10 bg-deep px-3.5 py-3 shadow-[var(--shadow-pop)]">
      <p className="text-[10.5px] tracking-[0.08em] text-white/45 uppercase">
        {formatShortDate(point.date)}
      </p>
      <p className="mt-1 text-[24px] leading-none font-semibold tabular-nums text-white">
        {point.current}
        <span className="ml-1 text-[11px] font-normal text-white/55">entregas</span>
      </p>
      <p className="mt-1.5 text-[11px] text-white/55">
        média 7d {point.average} · anterior {point.previous}
      </p>
    </div>
  );
}

/**
 * Throughput — the protagonist chart. Current period is a solid accent line
 * over a gradient area, the previous period a dashed grey line, and the cursor
 * carries a dashed vertical guide with an emphasised dot.
 */
export function AreaThroughput({ data, title = "Throughput" }: { data: ThroughputPoint[]; title?: string }) {
  const reduce = useReducedMotion();
  const { ref, width, height } = useMeasure<HTMLDivElement>();
  const gradientId = "throughput-grad";

  const ticks = useMemo(
    () => data.map((point) => formatShortDate(point.date)).filter((_, index) => index % 2 === 0),
    [data],
  );

  const total = data.reduce((sum, point) => sum + point.current, 0);
  const average = total / (data.length || 1);

  return (
    <Panel className="flex h-full flex-col" hoverable={false}>
      <PanelHeader
        title={title}
        hint={`${total} entregas no período · média de ${average.toFixed(1)} por dia`}
        action={
          <div className="hidden items-center gap-3 text-[11.5px] text-ink-soft sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[var(--accent)]" aria-hidden />
              Período atual
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full border-t border-dashed border-ink-faint"
                aria-hidden
              />
              Anterior
            </span>
          </div>
        }
      />

      <div ref={ref} className="mt-5 h-[286px] w-full min-w-0">
        {width > 0 && height > 0 ? (
          <AreaChart width={width} height={height} data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <motion.stop
                  offset="0%"
                  stopColor="var(--accent-soft)"
                  initial={{ stopOpacity: reduce ? 0.34 : 0 }}
                  animate={{ stopOpacity: 0.34 }}
                  transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.stop
                  offset="100%"
                  stopColor="var(--accent-soft)"
                  initial={{ stopOpacity: reduce ? 0.02 : 0 }}
                  animate={{ stopOpacity: 0.02 }}
                  transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => formatShortDate(value)}
              ticks={data.filter((_, index) => index % 2 === 0).map((point) => point.date)}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
              tickMargin={10}
              minTickGap={12}
            />
            <YAxis
              domain={[0, 12]}
              ticks={[0, 3, 6, 9, 12]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
              width={44}
            />
            <Tooltip
              content={<ThroughputTooltip />}
              cursor={{ stroke: "var(--ink-faint)", strokeWidth: 1, strokeDasharray: "4 4" }}
              animationDuration={140}
            />

            <Area
              type="monotone"
              dataKey="current"
              stroke="var(--accent)"
              strokeWidth={2.4}
              fill={`url(#${gradientId})`}
              isAnimationActive={!reduce}
              animationDuration={900}
              animationEasing="ease-out"
              activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 3 }}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="var(--ink-faint)"
              strokeWidth={1.8}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={!reduce}
              animationDuration={900}
            />
          </AreaChart>
        ) : (
          <div className="h-full w-full animate-pulse rounded-[14px] bg-surface-muted" aria-hidden />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-soft pt-3.5">
        <span className="text-[11.5px] text-ink-faint">
          Últimos {data.length} dias · {ticks.length} marcas no eixo
        </span>
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-ink-soft">
          Média 7d {average.toFixed(1)}
        </span>
      </div>
    </Panel>
  );
}
