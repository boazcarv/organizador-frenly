"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EASE_OUT_QUINT } from "@/lib/motion";
import type { ProductivityPeriod } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX = 12;
const GRID = [3, 6, 9, 12];

/**
 * Weekly productivity: wide rounded bars. Bars inside the active window are
 * solid accent, the rest carry a grey hatched fill; a thin ghost bar behind
 * each column shows the previous period.
 */
export function ProjectsBar({
  periods,
  onOpenPeriod,
}: {
  periods: ProductivityPeriod[];
  onOpenPeriod?: (period: ProductivityPeriod) => void;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduce = useReducedMotion();
  const period = periods[index];

  useEffect(() => {
    if (!playing) return;
    if (reduce) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % periods.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [playing, periods.length, reduce]);

  const go = (step: number) => {
    setPlaying(false);
    setIndex((current) => (current + step + periods.length) % periods.length);
  };

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Produtividade do projeto"
        hint="Entregas concluídas por semana · comparação com o período anterior"
        action={
          <>
            <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-0.5">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Período anterior"
                className="inline-flex size-7 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <motion.span
                key={period.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: EASE_OUT_QUINT }}
                className="min-w-[104px] text-center text-[12px] font-medium text-ink"
              >
                {period.label}
              </motion.span>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Próximo período"
                className="inline-flex size-7 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  onClick={() => setPlaying((current) => !current)}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  aria-label={playing ? "Pausar reprodução dos períodos" : "Reproduzir períodos"}
                  aria-pressed={playing}
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-full border transition-colors duration-200",
                    playing
                      ? "border-transparent bg-[var(--accent)] text-white"
                      : "border-line bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink",
                  )}
                >
                  {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent className="text-[12px]">
                {playing ? "Pausar" : "Reproduzir os últimos períodos"}
              </TooltipContent>
            </Tooltip>
          </>
        }
      />

      <div className="relative mt-6 flex min-h-[228px] flex-1 gap-3">
        {/* y-axis */}
        <div className="relative w-6 shrink-0" aria-hidden>
          {GRID.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 text-[10.5px] tabular-nums text-ink-faint"
              style={{ bottom: `${(tick / MAX) * 100}%` }}
            >
              {tick}
            </span>
          ))}
          <span
            className="absolute right-0 -translate-y-1/2 text-[10.5px] tabular-nums text-ink-faint"
            style={{ bottom: 0 }}
          >
            0
          </span>
        </div>

        <div className="relative flex-1">
          {/* gridlines */}
          <div className="absolute inset-0" aria-hidden>
            {GRID.map((tick) => (
              <span
                key={tick}
                className="absolute inset-x-0 border-t border-dashed border-line-soft"
                style={{ bottom: `${(tick / MAX) * 100}%` }}
              />
            ))}
            <span className="absolute inset-x-0 bottom-0 border-t border-line" />
          </div>

          <div className="relative flex h-full items-end gap-1.5 sm:gap-2.5">
            {period.bars.map((bar, barIndex) => (
              <div key={bar.id} className="group/bar relative flex h-full flex-1 items-end justify-center">
                {/* previous period ghost */}
                <span
                  aria-hidden
                  className="absolute bottom-0 w-full max-w-[26px] rounded-full bg-[color-mix(in_oklab,var(--ink)_6%,transparent)]"
                  style={{ height: `${(bar.previous / MAX) * 100}%` }}
                />

                <motion.span
                  key={`${period.id}-${bar.id}`}
                  className={cn(
                    "relative w-full max-w-[26px] origin-bottom rounded-full",
                    bar.isCurrent ? "bg-[var(--accent)]" : "hatch border border-line",
                  )}
                  style={{ height: `${(bar.current / MAX) * 100}%` }}
                  initial={reduce ? false : { scaleY: 0, opacity: 0.4 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.68, delay: barIndex * 0.04, ease: EASE_OUT_QUINT }}
                />

                {/* tooltip */}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 w-[132px] -translate-x-1/2 scale-95 rounded-[14px] border border-white/10 bg-deep px-3 py-2 opacity-0 shadow-[var(--shadow-pop)] transition-all duration-200 group-hover/bar:scale-100 group-hover/bar:opacity-100"
                >
                  <p className="text-[10.5px] uppercase tracking-[0.08em] text-white/45">
                    Semana {bar.label.replace("S", "")}
                  </p>
                  <p className="mt-1 text-[19px] leading-none font-semibold tabular-nums text-white">
                    {bar.current}
                    <span className="ml-1 text-[11px] font-normal text-white/55">entregas</span>
                  </p>
                  <p className="mt-1 text-[11px] text-white/55">
                    anterior {bar.previous} · {bar.current >= bar.previous ? "+" : ""}
                    {bar.current - bar.previous}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-soft pt-3.5">
        <div className="flex flex-1 items-center gap-1.5 sm:gap-2.5" aria-hidden>
          <span className="w-6 shrink-0" />
          {period.bars.map((bar) => (
            <span
              key={bar.id}
              className="flex-1 text-center text-[10.5px] font-medium text-ink-faint"
            >
              {bar.label.replace("S", "")}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onOpenPeriod?.(period)}
          className="hidden shrink-0 text-[12px] font-medium text-[var(--accent)] transition-opacity duration-200 hover:opacity-80 sm:block"
        >
          Ver relatório
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11.5px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[var(--accent)]" aria-hidden />
          Entregas da semana atual
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="hatch size-2.5 rounded-full border border-line" aria-hidden />
          Semanas anteriores
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[color-mix(in_oklab,var(--ink)_8%,transparent)]" aria-hidden />
          Período anterior
        </span>
      </div>
    </Panel>
  );
}
