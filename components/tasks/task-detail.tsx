"use client";

import { motion } from "motion/react";
import { CalendarClock, CheckCircle2, MessageSquare, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { PriorityChip } from "@/components/ui/chip";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { pastelClasses, formatLongDate, formatShortDate } from "@/lib/format";
import { useMoveTask } from "@/lib/queries";
import type { Member, Project, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/store/board";

/** Task detail with the two moves that matter: advance or complete. */
export function TaskDetail({
  task,
  project,
  member,
  onOpenChange,
}: {
  task: Task | null;
  project?: Project;
  member?: Member;
  onOpenChange: (open: boolean) => void;
}) {
  const moveToBoard = useBoardStore((state) => state.move);
  const moveTask = useMoveTask();

  if (!task) return null;

  const advance = (status: Task["status"], label: string) => {
    const column = useBoardStore.getState().columns[status];
    moveToBoard(task.id, status, column.length);
    moveTask.mutate({ id: task.id, status, progress: status === "done" ? 100 : task.progress });
    toast.success(`Tarefa movida para ${label}`, { description: task.title });
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 rounded-[22px] border-line bg-surface p-6">
        <div className="flex flex-wrap items-center gap-2">
          {project ? (
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", pastelClasses[project.color])}>
              {project.name}
            </span>
          ) : null}
          <PriorityChip priority={task.priority} />
        </div>

        <DialogTitle className="mt-3 text-[18px] leading-snug font-semibold tracking-[-0.02em] text-ink">
          {task.title}
        </DialogTitle>
        <DialogDescription className="mt-1 text-[12.5px] text-ink-soft">
          Criada no fluxo de {project?.type ?? "produto"} · prazo {formatLongDate(task.dueAt)}
        </DialogDescription>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Detail label="Responsável" className="col-span-2 sm:col-span-1">
            <span className="flex items-center gap-2">
              <InitialsAvatar name={task.assignee} color={member?.color ?? "sage"} size="xs" />
              <span className="truncate text-[12px] font-medium text-ink">{task.assignee.split(" ")[0]}</span>
            </span>
          </Detail>
          <Detail label="Prazo">
            <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-ink">
              <CalendarClock className="size-3.5 text-ink-faint" aria-hidden />
              {formatShortDate(task.dueAt)}
            </span>
          </Detail>
          <Detail label="Anexos">
            <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-ink">
              <Paperclip className="size-3.5 text-ink-faint" aria-hidden />
              {task.attachments}
            </span>
          </Detail>
          <Detail label="Comentários">
            <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-ink">
              <MessageSquare className="size-3.5 text-ink-faint" aria-hidden />
              {task.comments}
            </span>
          </Detail>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-ink-soft">Progresso</span>
            <span className="font-semibold tabular-nums text-ink">{task.progress}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <motion.span
              className="block h-full rounded-full bg-[var(--accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {member ? (
          <p className="mt-4 rounded-[14px] bg-surface-muted px-3.5 py-3 text-[12px] leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">{member.name.split(" ")[0]}</span> está com{" "}
            {member.tasks} tarefas e {member.projects} projetos ativos. Eficiência de {member.efficiency}% nas
            últimas semanas.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {task.status !== "done" ? (
            <button
              type="button"
              onClick={() => advance("done", "Concluído")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-strong)]"
            >
              <CheckCircle2 className="size-4" aria-hidden />
              Concluir tarefa
            </button>
          ) : null}

          {task.status === "backlog" ? (
            <button
              type="button"
              onClick={() => advance("progress", "Em progresso")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
            >
              <Send className="size-4" aria-hidden />
              Começar agora
            </button>
          ) : null}

          {task.status === "progress" ? (
            <button
              type="button"
              onClick={() => advance("review", "Revisão")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
            >
              Enviar para revisão
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-auto inline-flex h-9 items-center rounded-full px-3 text-[13px] font-medium text-ink-faint transition-colors duration-200 hover:text-ink"
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[14px] border border-line bg-surface-muted px-3 py-2.5", className)}>
      <p className="label-section">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
