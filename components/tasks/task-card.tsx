"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { CalendarClock, MessageSquare, Paperclip } from "lucide-react";
import { PriorityChip } from "@/components/ui/chip";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { pastelClasses, formatShortDate, isToday } from "@/lib/format";
import type { Project, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  const style = overlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        transition,
      };

  return (
    <motion.article
      ref={overlay ? undefined : setNodeRef}
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
          ? "w-[272px] rotate-[1.5deg] scale-[1.02] cursor-grabbing border-[color-mix(in_oklab,var(--accent)_35%,var(--line))] shadow-[var(--shadow-lift)]"
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

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
        <motion.span
          className="block h-full rounded-full bg-[var(--accent)]"
          initial={overlay ? false : { width: 0 }}
          animate={{ width: `${task.progress}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <InitialsAvatar name={task.assignee} color={memberColor} size="xs" />
          <span className="truncate text-[11px] text-ink-soft">{task.assignee.split(" ")[0]}</span>
        </span>
        <span className="text-[10.5px] tabular-nums text-ink-faint">{task.progress}%</span>
      </div>
    </motion.article>
  );
}
