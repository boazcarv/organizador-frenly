"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, MessageSquare, Paperclip } from "lucide-react";
import { PriorityChip } from "@/components/ui/chip";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { pastelClasses, formatShortDate, isToday } from "@/lib/format";
import type { Project, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMoveTask } from "@/lib/queries";

interface TaskCardProps {
  task: Task;
  project?: Project;
  onOpen?: (task: Task) => void;
  /** rendered inside the DragOverlay: lifted, rotated, no sortable wiring */
  overlay?: boolean;
  memberColor?: "peach" | "blue" | "sage" | "sand" | "lilac";
}

export function TaskCard({ task, project, onOpen, overlay = false, memberColor = "sage" }: TaskCardProps) {
  const sortable = useSortable({ id: task.id, disabled: overlay });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
  const [progressDraft, setProgressDraft] = useState({ taskId: task.id, base: task.progress, value: task.progress });
  const lastSubmittedProgress = useRef<number | null>(null);
  const moveTask = useMoveTask();
  const draftProgress = progressDraft.taskId === task.id && progressDraft.base === task.progress
    ? progressDraft.value
    : task.progress;

  const changeDraftProgress = (value: number) => {
    lastSubmittedProgress.current = null;
    setProgressDraft({ taskId: task.id, base: task.progress, value });
  };

  const commitProgress = (value: number) => {
    if (overlay || task.status === "done" || value === task.progress || value === lastSubmittedProgress.current) return;
    lastSubmittedProgress.current = value;
    moveTask.mutate(
      { id: task.id, status: task.status, progress: value },
      {
        onError: (error) => {
          lastSubmittedProgress.current = null;
          setProgressDraft({ taskId: task.id, base: task.progress, value: task.progress });
          toast.error("Não foi possível salvar o progresso", {
            description: error instanceof Error ? error.message : "Tente novamente.",
          });
        },
      },
    );
  };

  const style = overlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        transition: transition ?? "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      };

  return (
    <motion.article
      ref={overlay ? undefined : setNodeRef}
      initial={overlay ? { opacity: 0.92, scale: 0.985 } : false}
      animate={overlay ? { opacity: 1, scale: 1.02 } : undefined}
      transition={overlay ? { type: "spring", stiffness: 480, damping: 32, mass: 0.55 } : undefined}
      style={style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={() => onOpen?.(task)}
      aria-roledescription="Tarefa arrastável"
      aria-label={`${task.title}. ${project?.name ?? ""}`}
      className={cn(
        "group/task relative select-none rounded-[16px] border border-line bg-surface p-3.5 text-left shadow-[var(--shadow-card)]",
        "transition-[box-shadow,border-color,transform] duration-200",
        overlay
          ? "w-[272px] scale-[1.02] cursor-grabbing border-[color-mix(in_oklab,var(--accent)_35%,var(--line))] shadow-[var(--shadow-lift)]"
          : "cursor-grab hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex max-w-[70%] items-center gap-1.5 truncate rounded-full px-2 py-0.5 text-[10.5px] font-medium",
            project ? pastelClasses[project.color] : "bg-surface-muted text-ink-soft",
          )}
        >
          {project?.name ?? "Sem projeto"}
        </span>
        <PriorityChip priority={task.priority} />
      </div>

      <h4 className="mt-2.5 line-clamp-2 text-[13.5px] leading-snug font-semibold text-ink">
        {task.title}
      </h4>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-faint">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
            isToday(task.dueAt) ? "bg-accent-tint text-accent" : "bg-surface-muted text-ink-soft",
          )}
        >
          <CalendarClock className="size-3" aria-hidden />
          {isToday(task.dueAt) ? "hoje" : formatShortDate(task.dueAt)}
        </span>

        <span className="ml-auto flex items-center gap-2.5">
          {task.attachments > 0 ? (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Paperclip className="size-3" aria-hidden />
              {task.attachments}
            </span>
          ) : null}
          {task.comments > 0 ? (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <MessageSquare className="size-3" aria-hidden />
              {task.comments}
            </span>
          ) : null}
        </span>
      </div>

      <div className="group/progress relative mt-2 flex h-5 w-full items-center" title={overlay ? undefined : "Arraste para ajustar o progresso"}>
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-surface-muted">
          <motion.span
            className="block h-full rounded-full bg-[var(--accent)]"
            initial={overlay ? false : { width: 0 }}
            animate={{ width: `${draftProgress}%` }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
        {!overlay ? (
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={draftProgress}
            disabled={task.status === "done"}
            aria-label={`Progresso de ${task.title}`}
            aria-valuetext={`${draftProgress}% concluído`}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onChange={(event) => changeDraftProgress(Number(event.currentTarget.value))}
            onPointerUp={(event) => {
              event.stopPropagation();
              commitProgress(Number(event.currentTarget.value));
            }}
            onKeyUp={(event) => {
              event.stopPropagation();
              if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
                commitProgress(Number(event.currentTarget.value));
              }
            }}
            onBlur={() => commitProgress(draftProgress)}
            className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent outline-none disabled:cursor-default [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:shadow-sm"
          />
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <InitialsAvatar name={task.assignee} color={memberColor} size="xs" />
          <span className="truncate text-[11px] text-ink-soft">{task.assignee.split(" ")[0]}</span>
        </span>
        <span className="text-[10.5px] tabular-nums text-ink-faint">{draftProgress}%</span>
      </div>
    </motion.article>
  );
}
