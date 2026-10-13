"use client";

import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useCreateEvent } from "@/lib/queries";
import { cn } from "@/lib/utils";

const fieldClass = "h-10 rounded-[12px] border-line bg-surface text-[13px]";

/** Local `datetime-local` value for a date: "2026-10-13T14:30". */
function localInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Creates a calendar event.
 *
 * The calendar used to be readable but not writable — every event came from the
 * seed data, so a real workspace would have shown an empty month forever.
 */
export function NewEventDialog({
  open,
  onOpenChange,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}) {
  const createEvent = useCreateEvent();
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(() => localInputValue(nextHour(defaultDate)));
  const [end, setEnd] = useState(() => localInputValue(nextHourPlusOne(defaultDate)));
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setStart(localInputValue(nextHour(defaultDate)));
    setEnd(localInputValue(nextHourPlusOne(defaultDate)));
    setError(null);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    createEvent.mutate(
      {
        title,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      },
      {
        onSuccess: (created) => {
          toast.success("Evento criado", { description: created.title });
          reset();
          onOpenChange(false);
        },
        onError: (problem) =>
          setError(problem instanceof ApiError ? problem.message : "Não foi possível criar o evento"),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[440px] gap-0 rounded-[20px] border-line bg-surface p-5">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-[16px] font-semibold tracking-tight text-ink">Novo evento</DialogTitle>
          <DialogDescription className="text-[12.5px] text-ink-soft">
            Compromissos aparecem na agenda do dia e no painel inicial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="event-title" className="text-[12.5px] font-medium text-ink">
              Título
            </Label>
            <Input
              id="event-title"
              required
              minLength={3}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Revisão semanal com a CEO"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-start" className="text-[12.5px] font-medium text-ink">
              Início
            </Label>
            <Input
              id="event-start"
              type="datetime-local"
              required
              value={start}
              onChange={(event) => {
                setStart(event.target.value);
                // Keep the end after the start: a form that can be submitted
                // into a server error is a form that wastes a round-trip.
                if (event.target.value >= end) {
                  const bumped = new Date(new Date(event.target.value).getTime() + 60 * 60 * 1000);
                  setEnd(localInputValue(bumped));
                }
              }}
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-end" className="text-[12.5px] font-medium text-ink">
              Fim
            </Label>
            <Input
              id="event-end"
              type="datetime-local"
              required
              min={start}
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className={cn(fieldClass, end <= start && "border-danger")}
            />
            {end <= start ? (
              <p className="text-[11.5px] text-danger" role="alert">
                O fim precisa ser depois do início.
              </p>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="rounded-[12px] bg-danger-soft px-3 py-2 text-[12.5px] font-medium text-danger">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-full border-line px-4 text-[13px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createEvent.isPending || end <= start}
              className="h-9 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--accent-strong)]"
            >
              {createEvent.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {createEvent.isPending ? "Criando…" : "Criar evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Next full hour — a sensible default that is never in the past. */
function nextHour(date?: Date): Date {
  const base = new Date(date ?? Date.now());
  if (!date) {
    base.setMinutes(0, 0, 0);
    base.setHours(base.getHours() + 1);
    return base;
  }
  base.setHours(9, 0, 0, 0);
  return base;
}

function nextHourPlusOne(date?: Date): Date {
  return new Date(nextHour(date).getTime() + 60 * 60 * 1000);
}
