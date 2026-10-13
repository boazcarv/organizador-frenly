"use client";

import { Pressable } from "@/components/motion/pressable";
import { cn } from "@/lib/utils";

export interface TeamFilter {
  id: string;
  label: string;
}

/** Filter chips. The active one is tinted with the accent, tap has a spring. */
export function TeamFilters({
  filters,
  value,
  counts,
  onChange,
}: {
  filters: TeamFilter[];
  value: string;
  counts: Record<string, number>;
  onChange: (value: string) => void;
}) {
  return (
    <div role="tablist" aria-label="Filtrar colaboradores" className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const active = filter.id === value;
        return (
          <Pressable
            key={filter.id}
            onClick={() => onChange(filter.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-medium transition-colors duration-200",
              active
                ? "border-transparent bg-accent-tint text-accent"
                : "border-line bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink",
            )}
          >
            {filter.label}
            <span
              className={cn(
                "tabular-nums transition-colors duration-200",
                active ? "text-accent/70" : "text-ink-faint",
              )}
            >
              {counts[filter.id] ?? 0}
            </span>
          </Pressable>
        );
      })}
    </div>
  );
}
