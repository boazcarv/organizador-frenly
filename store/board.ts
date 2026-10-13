"use client";

import { create } from "zustand";
import type { Task, TaskStatus } from "@/lib/types";

export const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "backlog", title: "Backlog" },
  { id: "progress", title: "Em progresso" },
  { id: "review", title: "Revisão" },
  { id: "done", title: "Concluído" },
];

type Columns = Record<TaskStatus, string[]>;

const emptyColumns: Columns = { backlog: [], progress: [], review: [], done: [] };

interface BoardState {
  initialized: boolean;
  columns: Columns;
  byId: Record<string, Task>;
  lastMovedId: string | null;
  scope: string;
  hydrate: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  move: (taskId: string, to: TaskStatus, index: number) => void;
  approve: (taskId: string) => void;
  reorder: (status: TaskStatus, ids: string[]) => void;
  setScope: (scope: string) => void;
}

export const useBoardStore = create<BoardState>()((set, get) => ({
  initialized: false,
  columns: emptyColumns,
  byId: {},
  lastMovedId: null,
  scope: "all",

  /**
   * Mirrors the server list into the board while preserving the order the user
   * arranged by hand: known ids keep their position, new ones land at the end of
   * their column, deleted ones disappear and server-side moves win.
   */
  hydrate: (tasks) => {
    const state = get();
    const byId = Object.fromEntries(tasks.map((task) => [task.id, task]));

    if (!state.initialized) {
      const columns: Columns = { backlog: [], progress: [], review: [], done: [] };
      for (const task of tasks) columns[task.status].push(task.id);
      set({ initialized: true, columns, byId });
      return;
    }

    const columns: Columns = {
      backlog: state.columns.backlog.filter((id) => byId[id]),
      progress: state.columns.progress.filter((id) => byId[id]),
      review: state.columns.review.filter((id) => byId[id]),
      done: state.columns.done.filter((id) => byId[id]),
    };

    for (const task of tasks) {
      const currentColumn = COLUMNS.find((column) => columns[column.id].includes(task.id));
      if (!currentColumn) {
        columns[task.status] = [...columns[task.status], task.id];
      } else if (currentColumn.id !== task.status) {
        columns[currentColumn.id] = columns[currentColumn.id].filter((id) => id !== task.id);
        columns[task.status] = [task.id, ...columns[task.status]];
      }
    }

    set({ columns, byId });
  },

  addTask: (task) =>
    set((state) => ({
      initialized: true,
      byId: { ...state.byId, [task.id]: task },
      columns: { ...state.columns, [task.status]: [task.id, ...state.columns[task.status]] },
    })),

  move: (taskId, to, index) =>
    set((state) => {
      const task = state.byId[taskId];
      if (!task) return state;
      const from = task.status;
      const columns: Columns = {
        backlog: state.columns.backlog.filter((id) => id !== taskId),
        progress: state.columns.progress.filter((id) => id !== taskId),
        review: state.columns.review.filter((id) => id !== taskId),
        done: state.columns.done.filter((id) => id !== taskId),
      };
      const target = [...columns[to]];
      const safeIndex = Math.max(0, Math.min(index, target.length));
      target.splice(safeIndex, 0, taskId);
      columns[to] = target;
      const progress = to === "done" ? 100 : task.progress;
      return {
        columns,
        byId: {
          ...state.byId,
          [taskId]: { ...task, status: to, progress, ...(from !== to ? {} : {}) },
        },
        lastMovedId: taskId,
      };
    }),

  approve: (taskId) =>
    set((state) => {
      const task = state.byId[taskId];
      if (!task) return state;
      return { byId: { ...state.byId, [taskId]: { ...task, progress: Math.max(task.progress, 90) } } };
    }),

  reorder: (status, ids) => set((state) => ({ columns: { ...state.columns, [status]: ids } })),

  setScope: (scope) => set({ scope }),
}));
