"use client";

import { motion } from "motion/react";
import { CalendarDays, ChevronRight, Clock, Video } from "lucide-react";
import { toast } from "sonner";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { RelativeTime } from "@/components/ui/relative-time";
import { formatDurationLong, formatLongDate, formatTime, pastelHex } from "@/lib/format";
import type { Reminder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useProjects } from "@/lib/queries";
import { useTrackerStore } from "@/store/tracker";

/** Next commitment, its reserved block and a shortcut to start the meeting. */
export function RemindersCard({ reminders }: { reminders: Reminder[] }) {
  const startTracker = useTrackerStore((state) => state.start);
  const setProject = useTrackerStore((state) => state.setProject);
  const { data: projects = [] } = useProjects();
  const [next, ...following] = reminders;

  if (!next) {
    return (
      <Panel className="flex h-full flex-col">
        <PanelHeader title="Lembretes" hint="Nada agendado" />
        <p className="mt-6 rounded-[14px] border border-dashed border-line px-4 py-8 text-center text-[12.5px] text-ink-soft">
          Sua agenda está livre. Aproveite para adiantar o backlog.
        </p>
      </Panel>
    );
  }

  const durationMinutes =
    (new Date(next.end).getTime() - new Date(next.start).getTime()) / 60_000;

  const handleStart = () => {
    if (next.kind === "Prova" || next.kind === "Compromisso") {
      toast(next.kind, { description: `${next.title}${next.location ? ` · ${next.location}` : ""}` });
      return;
    }
    const project = projects.find((item) => item.name === next.project);
    if (project) setProject(project.id);
    startTracker();
    toast("Reunião iniciada", {
      description: `${next.title} · cronômetro rodando em ${project?.name ?? next.project}.`,
      action: { label: "Ver tracker", onClick: () => undefined },
    });
  };

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Lembretes"
        hint="Próximo compromisso do time"
        action={
          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-[12px] font-medium text-ink-soft transition-colors duration-200 hover:text-ink"
          >
            Agenda
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        }
      />

      <div className="mt-4 rounded-[16px] border border-line bg-surface-muted p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 size-9 shrink-0 rounded-[12px]"
            style={{ backgroundColor: pastelHex[next.color] }}
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] leading-snug font-semibold text-ink">{next.title}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink-soft">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5 text-ink-faint" aria-hidden />
                {formatLongDate(next.start)}
              </span>
              <span aria-hidden className="text-ink-faint">
                ·
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="size-3.5 text-ink-faint" aria-hidden />
                {formatTime(next.start)} – {formatTime(next.end)}
              </span>
            </p>
            <p className="mt-1 truncate text-[11.5px] text-ink-faint">{[next.kind, next.location, next.project].filter(Boolean).join(" · ")}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span className="flex -space-x-2">
              {next.attendees.slice(0, 3).map((attendee) => (
                <InitialsAvatar
                  key={attendee}
                  name={attendee}
                  color="sand"
                  size="sm"
                  ring
                  className="[&>span:first-child]:ring-2 [&>span:first-child]:ring-surface-muted"
                />
              ))}
            </span>
            <span className="text-[11.5px] text-ink-soft">
              {next.attendees.length} participante{next.attendees.length > 1 ? "s" : ""}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3 rounded-[14px] border border-line px-3.5 py-3">
        <div className="min-w-0">
          <p className="label-section">Bloco reservado</p>
          <p className="mt-1 text-[13px] font-semibold tabular-nums text-ink">
            {formatDurationLong(durationMinutes * 60)}
          </p>
        </div>
        <RelativeTime
          value={next.start}
          className="rounded-full bg-accent-tint px-2.5 py-1 text-[11.5px] font-medium text-accent"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <motion.button
          type="button"
          onClick={handleStart}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-strong)]"
        >
          <Video className="size-4" aria-hidden />
          {next.kind === "Prova" ? "Ver compromisso" : next.kind === "Compromisso" ? "Ver compromisso" : "Iniciar reunião"}
        </motion.button>
        <button
          type="button"
          onClick={() => toast("Sala de espera", { description: "Convite copiado para a área de transferência." })}
          className="inline-flex h-9 items-center justify-center rounded-full border border-line px-3 text-[12.5px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
        >
          Depois
        </button>
      </div>

      {following.length > 0 ? (
        <ul className="mt-4 space-y-1 border-t border-line-soft pt-3">
          {following.slice(0, 2).map((reminder) => (
            <li key={reminder.id}>
              <div className="group/rem flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors duration-200 hover:bg-surface-muted">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: pastelHex[reminder.color] }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink">{reminder.title}</span>
                  <span className="block truncate text-[11px] text-ink-faint">
                    {formatLongDate(reminder.start)} · {formatTime(reminder.start)}
                  </span>
                </span>
                <RelativeTime
                  value={reminder.start}
                  className={cn("shrink-0 text-[11px] text-ink-faint")}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  );
}
