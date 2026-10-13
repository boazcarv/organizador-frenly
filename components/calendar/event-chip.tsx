"use client";

import { motion } from "motion/react";
import { pastelClasses, formatTime } from "@/lib/format";
import type { CalEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Calendar event pill. High-priority items carry a danger rail on the left
 * edge; everything else is a quiet pastel chip.
 */
export function EventChip({
  event,
  onClick,
  index = 0,
}: {
  event: CalEvent;
  onClick?: (event: CalEvent) => void;
  index?: number;
}) {
  const high = event.priority === "high";

  return (
    <motion.button
      type="button"
      onClick={() => onClick?.(event)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      title={`${event.title} · ${formatTime(event.start)} · ${event.owner}`}
      className={cn(
        "group/event flex w-full items-start gap-1 overflow-hidden rounded-[8px] px-1.5 py-1 text-left transition-transform duration-200 hover:-translate-y-px",
        pastelClasses[event.color],
        high && "border-l-2 border-l-[var(--danger)] pl-1",
      )}
    >
      <span className="line-clamp-2 min-w-0 flex-1 text-[10.5px] leading-[1.25] font-medium">
        <span className="tabular-nums opacity-70">{formatTime(event.start)}</span> {event.title}
      </span>
    </motion.button>
  );
}
