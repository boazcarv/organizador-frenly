"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Timer } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatHours } from "@/lib/format";
import type { WorkloadPeriod } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Colour ramp: the most recent month is the darkest. */
const ramp = [
  "color-mix(in oklab, var(--accent) 34%, var(--surface))",
  "color-mix(in oklab, var(--accent) 58%, var(--surface))",
  "color-mix(in oklab, var(--accent) 80%, var(--surface))",
  "var(--accent)",
];

export function WorkloadBars({
  data,
  onSeeAll,
}: {
  data: WorkloadPeriod;
  onSeeAll?: () => void;
}) {
  // `Math.max()` of nothing is -Infinity, which would turn every bar width into
  // NaN. A workspace with no tracked time is the normal first-run state, not an
  // edge case.
  const max = Math.max(1, ...data.rows.flatMap((row) => row.values));
  const hasTrackedTime = data.rows.some((row) => row.total > 0);

  return (
    <Panel className="flex h-full flex-col" hoverable={false}>
      <PanelHeader
        title="Carga de trabalho do time"
        hint="Horas por pessoa e mês"
        action={
          <button
            type="button"
            onClick={onSeeAll}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-line px-2.5 text-[12px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
          >
            Ver tudo
            <ArrowUpRight className="size-3.5" aria-hidden />
          </button>
        }
      />

      <div className="mt-5 space-y-3.5">
        {!hasTrackedTime ? (
          <EmptyState
            icon={Timer}
            title="Nenhuma hora registrada"
            description="Use o cronômetro no dashboard enquanto trabalha: as horas aparecem aqui por pessoa e por semana."
          />
        ) : null}

        {data.rows.map((row, rowIndex) => (
          <div key={row.id} className="group/row">
            <div className="flex items-center justify-between text-[12px]">
              <span className="truncate font-medium text-ink">{row.name}</span>
              <span className="tabular-nums text-ink-faint">{formatHours(row.total)}</span>
            </div>

            <div className="mt-1.5 flex h-3.5 w-full gap-1 overflow-hidden rounded-full">
              {row.values.map((value, valueIndex) => (
                <motion.span
                  key={`${row.id}-${valueIndex}`}
                  className={cn(
                    "block h-full rounded-full transition-transform duration-200 group-hover/row:scale-y-110",
                  )}
                  style={{
                    width: `${(value / max) * 100}%`,
                    backgroundColor: ramp[valueIndex % ramp.length],
                  }}
                  initial={{ scaleX: 0, opacity: 0.5 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: rowIndex * 0.06 + valueIndex * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  title={`${data.labels[valueIndex]} · ${value}h`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line-soft pt-3.5">
        {data.labels.map((label, index) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-soft">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ backgroundColor: ramp[index % ramp.length] }}
            />
            {label}
          </span>
        ))}
        <button
          type="button"
          onClick={() =>
            toast("Relatório de capacidade", { description: "Comparativo de 12 meses disponível no Studio." })
          }
          className="ml-auto text-[12px] font-medium text-[var(--accent)] transition-opacity duration-200 hover:opacity-80"
        >
          Por projeto
        </button>
      </div>
    </Panel>
  );
}
