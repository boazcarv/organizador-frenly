"use client";

import { addMonths, startOfMonth, subMonths } from "date-fns";
import { motion } from "motion/react";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Agenda, UpcomingList } from "@/components/calendar/agenda";
import { NewEventDialog } from "@/components/calendar/new-event-dialog";
import { MonthGrid, monthDays } from "@/components/calendar/month-grid";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLongDate, formatMonthYear, formatTime } from "@/lib/format";
import { EASE_OUT_QUINT } from "@/lib/motion";
import { useAgenda, useEvents, useUpcoming } from "@/lib/queries";

export default function CalendarPage() {
  const { data: events, isPending } = useEvents();
  const { data: agenda } = useAgenda();
  const { data: upcoming } = useUpcoming();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const days = useMemo(() => monthDays(month), [month]);

  const goToday = () => setMonth(startOfMonth(new Date()));

  const jump = (step: number) => setMonth((current) => (step > 0 ? addMonths(current, 1) : subMonths(current, 1)));

  return (
    <div className="space-y-5">
      <PageHeader title="Calendar" subtitle={`${formatLongDate(new Date())} · fuso America/Sao_Paulo`}>
        <button
          type="button"
          onClick={goToday}
          className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-4 text-[13px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
        >
          Hoje
        </button>
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-0.5">
          <button
            type="button"
            onClick={() => jump(-1)}
            aria-label="Mês anterior"
            className="inline-flex size-8 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <motion.span
            key={month.toISOString()}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT_QUINT }}
            className="min-w-[124px] text-center text-[13px] font-semibold text-ink"
          >
            {formatMonthYear(month)}
          </motion.span>
          <button
            type="button"
            onClick={() => jump(1)}
            aria-label="Próximo mês"
            className="inline-flex size-8 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setEventDialogOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-strong)]"
        >
          <CalendarPlus className="size-4" aria-hidden />
          Evento
        </button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {isPending || !events ? (
            <Skeleton className="h-[620px] rounded-[20px]" />
          ) : (
            <Panel padded={false} hoverable={false} className="p-3">
              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="min-w-[560px]">
                  <MonthGrid
                    days={days}
                    reference={month}
                    events={events}
                    onSelectEvent={(event) =>
                      toast(event.title, {
                        description: `${formatLongDate(event.start)} · ${formatTime(event.start)} – ${formatTime(event.end)} · ${event.owner}`,
                      })
                    }
                  />
                </div>
              </div>
            </Panel>
          )}

          <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-1 rounded-full bg-[var(--danger)]" aria-hidden />
              Alta prioridade
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-pastel-sage" aria-hidden />
              Ritual interno
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-pastel-peach" aria-hidden />
              Design & lançamentos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-pastel-blue" aria-hidden />
              Tecnologia & pesquisa
            </span>
          </div>
        </div>

        <div className="min-w-0 space-y-4 xl:self-start">
          {agenda ? <Agenda events={agenda} /> : <Skeleton className="h-[320px] rounded-[20px]" />}
          {upcoming ? <UpcomingList events={upcoming} /> : <Skeleton className="h-[300px] rounded-[20px]" />}
        </div>
      </div>

      <NewEventDialog open={eventDialogOpen} onOpenChange={setEventDialogOpen} />
    </div>
  );
}
