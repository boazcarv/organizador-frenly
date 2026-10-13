"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "motion/react";
import { Archive, CircleDashed, MoreHorizontal, Plus, SortAsc } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskCard } from "@/components/tasks/task-card";
import type { Project, Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  projects: Map<string, Project>;
  memberColors: Map<string, "peach" | "blue" | "sage" | "sand" | "lilac">;
  onOpenTask: (task: Task) => void;
  onAdd: (status: TaskStatus) => void;
  onSort: (status: TaskStatus) => void;
  onClearFilters: () => void;
  highlight: "backlog" | "progress" | "review" | "done";
}

/** Kanban column: drop target, sortable list, real counter and a ⋯ menu. */
export function Column({
  id,
  title,
  tasks,
  projects,
  memberColors,
  onOpenTask,
  onAdd,
  onSort,
  onClearFilters,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column", status: id } });
  const ids = tasks.map((task) => task.id);

  return (
    <section
      ref={setNodeRef}
      aria-label={`Coluna ${title}`}
      className={cn(
        "flex w-[280px] shrink-0 snap-start flex-col rounded-[18px] border bg-surface-muted/70 p-3 transition-colors duration-200 md:w-auto",
        isOver
          ? "border-[color-mix(in_oklab,var(--accent)_45%,var(--line))] bg-accent-tint/50"
          : "border-line",
      )}
    >
      <header className="flex items-center gap-2 px-1 pb-3">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink-soft ring-1 ring-line">
          {tasks.length}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onAdd(id)}
            aria-label={`Adicionar tarefa em ${title}`}
            className="inline-flex size-7 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-surface hover:text-ink"
          >
            <Plus className="size-3.5" aria-hidden />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Ações da coluna ${title}`}
                className="inline-flex size-7 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-surface hover:text-ink"
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[196px] rounded-[16px] border-line bg-surface p-1.5">
              <DropdownMenuItem
                onSelect={() => onAdd(id)}
                className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px]"
              >
                <Plus className="size-4 text-ink-faint" aria-hidden />
                Adicionar tarefa
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onSort(id)}
                className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px]"
              >
                <SortAsc className="size-4 text-ink-faint" aria-hidden />
                Ordenar por prazo
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onClearFilters}
                className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px]"
              >
                <CircleDashed className="size-4 text-ink-faint" aria-hidden />
                Limpar filtros
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  toast("Arquivamento desativado na demonstração", { description: `A coluna ${title} mantém ${tasks.length} cartões.` })
                }
                className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px]"
              >
                <Archive className="size-4 text-ink-faint" aria-hidden />
                Arquivar concluídas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[120px] max-h-[calc(100dvh-330px)] flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain pr-0.5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              project={projects.get(task.projectId)}
              memberColor={memberColors.get(task.assignee)}
              onOpen={onOpenTask}
            />
          ))}

          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 items-center justify-center rounded-[14px] border border-dashed border-line px-4 py-8 text-center text-[11.5px] text-ink-faint"
            >
              Arraste uma tarefa para cá
            </motion.div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
