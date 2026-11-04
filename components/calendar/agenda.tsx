"use client";

import { motion } from "motion/react";
import { CalendarCheck2, CalendarX2, Clock } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { RelativeTime } from "@/components/ui/relative-time";
import { formatShortDate, formatTime, pastelHex } from "@/lib/format";
import { useCompleteEvent, useProfile } from "@/lib/queries";
import type { CalEvent } from "@/lib/types";

/** Today's agenda — the list you actually act on. */
export function Agenda({ events }: { events: CalEvent[] }) {
  const completeEvent = useCompleteEvent();
  const { data: profile } = useProfile();

  const markComplete = (event: CalEvent) => {
    completeEvent.mutate(event.id, {
      onSuccess: () => toast.success("Lembrete concluído", { description: event.title }),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o lembrete."),
    });
  };

  return (
    <Panel className="flex flex-col" padded={false}>
      <div className="p-5 pb-3">
        <PanelHeader
          title="Agenda de hoje"
          hint={
            events.length > 0
              ? `${Math.min(events.length, 3)} de ${events.length} compromissos`
              : "Dia livre"
          }
          action={<RelativeTime value={new Date().toISOString()} className="text-[11.5px] text-ink-faint" fallback="hoje" />}
        />
      </div>

      <div className="space-y-2.5 px-5 pb-5">
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="Nada agendado para hoje"
            description="Aproveite para adiantar o backlog ou bloquear tempo de foco no tracker."
          />
        ) : (
          events.slice(0, 3).map((event, index) => (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[16px] border border-line bg-surface-muted p-3.5"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: pastelHex[event.color] }}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13.5px] font-semibold text-ink">{event.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-[11.5px] tabular-nums text-ink-soft">
                    <Clock className="size-3.5 text-ink-faint" aria-hidden />
                    {formatTime(event.start)} – {formatTime(event.end)}
                  </p>
                </div>
                {profile?.name === event.owner ? (
                  <button
                    type="button"
                    disabled={completeEvent.isPending}
                    onClick={() => markComplete(event)}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-[var(--accent)] px-3 text-[11.5px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-strong)] disabled:opacity-60"
                  >
                    <CalendarCheck2 className="size-3.5" aria-hidden />
                    Marcar como feita
                  </button>
                ) : null}
              </div>

              <div className="mt-2.5 flex items-center gap-2 pl-5.5">
                <span className="flex -space-x-1.5">
                  {event.attendees.slice(0, 3).map((attendee) => (
                    <InitialsAvatar
                      key={attendee}
                      name={attendee}
                      color="lilac"
                      size="xs"
                      className="[&>span:first-child]:ring-2 [&>span:first-child]:ring-surface-muted"
                    />
                  ))}
                </span>
                <span className="text-[11px] text-ink-faint">
                  {event.attendees.length} participantes · {event.owner.split(" ")[0]}
                </span>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </Panel>
  );
}

/** Next five commitments across the month. */
export function UpcomingList({ events }: { events: CalEvent[] }) {
  return (
    <Panel className="flex flex-col" padded={false}>
      <div className="p-5 pb-3">
        <PanelHeader title="Próximos" hint="Os cinco compromissos seguintes" />
      </div>
      <ul className="space-y-0.5 px-3 pb-4">
        {events.slice(0, 5).map((event) => (
          <li key={event.id}>
            <div className="flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors duration-200 hover:bg-surface-muted">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: pastelHex[event.color] }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-ink">{event.title}</span>
                <span className="block text-[11px] text-ink-faint">
                  {formatShortDate(event.start)} · {formatTime(event.start)}
                </span>
              </span>
              <RelativeTime value={event.start} className="shrink-0 text-[11px] text-ink-faint" />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
