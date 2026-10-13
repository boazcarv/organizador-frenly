"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Column } from "@/components/tasks/column";
import { TaskCard } from "@/components/tasks/task-card";
import { useMoveTask } from "@/lib/queries";
import type { Member, Project, Task, TaskStatus } from "@/lib/types";
import { useBoardStore, COLUMNS } from "@/store/board";

interface BoardProps {
  projects: Project[];
  members: Member[];
  filter: (task: Task) => boolean;
  onOpenTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

/**
 * Kanban board. Drag state lives in dnd-kit, order lives in Zustand: the card
 * lifts into a DragOverlay (scale 1.02, 1.5° rotation, deep shadow), the target
 * column highlights and neighbours re-accommodate with a spring.
 */
export function Board({ projects, members, filter, onOpenTask, onAddTask }: BoardProps) {
  const columns = useBoardStore((state) => state.columns);
  const byId = useBoardStore((state) => state.byId);
  const move = useBoardStore((state) => state.move);
  const reorder = useBoardStore((state) => state.reorder);
  const setScope = useBoardStore((state) => state.setScope);
  const [activeId, setActiveId] = useState<string | null>(null);
  const moveTask = useMoveTask();

  const projectMap = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const memberColors = useMemo(
    () => new Map(members.map((member) => [member.name, member.color])),
    [members],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visibleByColumn = useMemo(() => {
    const result = { backlog: [], progress: [], review: [], done: [] } as Record<TaskStatus, Task[]>;
    for (const column of COLUMNS) {
      result[column.id] = columns[column.id]
        .map((id) => byId[id])
        .filter((task): task is Task => Boolean(task))
        .filter(filter);
    }
    return result;
  }, [columns, byId, filter]);

  const activeTask = activeId ? byId[activeId] : null;

  const columnOf = (id: string): TaskStatus | undefined => {
    if (COLUMNS.some((column) => column.id === id)) return id as TaskStatus;
    return COLUMNS.find((column) => columns[column.id].includes(id))?.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const active = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    if (!over) return;

    const from = columnOf(active);
    const to = columnOf(over);
    if (!from || !to || from === to) return;

    const overIndex = columns[to].indexOf(over);
    move(active, to, overIndex === -1 ? columns[to].length : overIndex);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const active = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    const from = columnOf(active);
    setActiveId(null);
    if (!over || !from) return;

    const to = columnOf(over);
    if (!to) return;

    if (from === to) {
      const ids = columns[to];
      const oldIndex = ids.indexOf(active);
      const newIndex = ids.indexOf(over);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        move(active, to, newIndex);
      }
      return;
    }

    move(active, to, columns[to].length);
    moveTask.mutate({ id: active, status: to, progress: to === "done" ? 100 : undefined });
    const title = COLUMNS.find((column) => column.id === to)?.title ?? to;
    toast.success("Tarefa movida", { description: `${byId[active]?.title ?? "Cartão"} → ${title}` });
  };

  const handleSort = (status: TaskStatus) => {
    const sorted = [...columns[status]].sort((a, b) => {
      const taskA = byId[a];
      const taskB = byId[b];
      if (!taskA || !taskB) return 0;
      return new Date(taskA.dueAt).getTime() - new Date(taskB.dueAt).getTime();
    });
    reorder(status, sorted);
    toast(`Coluna ordenada por prazo`, {
      description: COLUMNS.find((column) => column.id === status)?.title,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Cartão ${byId[String(active.id)]?.title ?? ""} selecionado.`,
          onDragOver: ({ over }) => (over ? `Sobre ${String(over.id)}.` : "Fora de uma coluna."),
          onDragEnd: ({ over }) =>
            over ? `Cartão solto em ${columnOf(String(over.id)) ?? String(over.id)}.` : "Movimento cancelado.",
          onDragCancel: () => "Movimento cancelado.",
        },
      }}
    >
      <div
        role="region"
        aria-label="Quadro de tarefas"
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4 2xl:mx-auto 2xl:max-w-[1400px]"
      >
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={visibleByColumn[column.id]}
            projects={projectMap}
            memberColors={memberColors}
            onOpenTask={onOpenTask}
            onAdd={onAddTask}
            onSort={handleSort}
            onClearFilters={() => {
              setScope("all");
              toast("Filtros limpos", { description: "Mostrando todas as tarefas do workspace." });
            }}
            highlight={column.id}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{ duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}
        style={{ cursor: "grabbing" }}
      >
        {activeTask ? (
          <TaskCard
            overlay
            task={activeTask}
            project={projectMap.get(activeTask.projectId)}
            memberColor={memberColors.get(activeTask.assignee)}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
