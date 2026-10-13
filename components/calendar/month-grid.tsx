"use client";

import { eachDayOfInterval, endOfMonth, endOfWeek, startOfWeek } from "date-fns";
import { DayCell } from "@/components/calendar/day-cell";
import { isSameDayAs } from "@/lib/format";
import type { CalEvent } from "@/lib/types";

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

export function MonthGrid({
  days,
  reference,
  events,
  onSelectEvent,
}: {
  days: Date[];
  reference: Date;
  events: CalEvent[];
  onSelectEvent: (event: CalEvent) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-line">
      <div className="grid grid-cols-7 border-b border-line bg-surface-muted">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="px-2 py-2.5 text-center text-[11px] font-medium tracking-[0.06em] text-ink-faint uppercase"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => (
          <DayCell
            key={day.toISOString()}
            date={day}
            reference={reference}
            index={index}
            events={events
              .filter((event) => isSameDayAs(event.start, day))
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Every day that the month view renders: the whole weeks that contain the
 * reference month (Monday-first), so the grid is always 5 or 6 complete rows.
 */
export function monthDays(reference: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(reference, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(reference), { weekStartsOn: 1 }),
  });
}
