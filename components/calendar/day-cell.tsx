"use client";

import { motion } from "motion/react";
import { isSameMonth, isToday } from "date-fns";
import { EventChip } from "@/components/calendar/event-chip";
import type { CalEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 3;

export function DayCell({
  date,
  reference,
  events,
  onSelectEvent,
  index,
}: {
  date: Date;
  reference: Date;
  events: CalEvent[];
  onSelectEvent: (event: CalEvent) => void;
  index: number;
}) {
  const inMonth = isSameMonth(date, reference);
  const today = isToday(date);
  const overflow = events.length - MAX_VISIBLE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: index * 0.006, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group/day flex min-h-[118px] flex-col gap-1.5 border-b border-r border-line-soft p-2 last:border-r-0",
        !inMonth && "bg-surface-muted/50",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-full text-[12px] font-medium tabular-nums transition-colors duration-200",
            today
              ? "bg-[var(--accent)] font-semibold text-white"
              : inMonth
                ? "text-ink"
                : "text-ink-faint",
          )}
          aria-current={today ? "date" : undefined}
        >
          {date.getDate()}
        </span>
        {events.length > 0 ? (
          <span className="text-[10px] tabular-nums text-ink-faint opacity-0 transition-opacity duration-200 group-hover/day:opacity-100">
            {events.length} {events.length === 1 ? "evento" : "eventos"}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        {events.slice(0, MAX_VISIBLE).map((event, eventIndex) => (
          <EventChip key={event.id} event={event} onClick={onSelectEvent} index={eventIndex} />
        ))}
        {overflow > 0 ? (
          <span className="pl-1 text-[10.5px] font-medium text-ink-faint">+{overflow} eventos</span>
        ) : null}
      </div>
    </motion.div>
  );
}
