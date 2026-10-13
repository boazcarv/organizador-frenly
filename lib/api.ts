"use client";

import type {
  CurrentUser,
  NotificationSetting,
  ProductivityPeriod,
  Reminder,
} from "./types";
import type {
  CalEvent,
  DonutSlice,
  Member,
  Metric,
  Project,
  Task,
  ThroughputPoint,
  TimeEntry,
  WorkloadPeriod,
} from "./types";

/**
 * ---------------------------------------------------------------------------
 *  Data access layer (client side).
 *
 *  Every call goes to the REST routes under /app/api, which read and write the
 *  server-side store. The signatures below are the contract: pointing them at
 *  Supabase/Prisma later means changing this file and the routes, nothing else.
 * ---------------------------------------------------------------------------
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { "content-type": "application/json", ...init?.headers } : init?.headers,
  });

  if (!response.ok) {
    let message = `Falha na requisição (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) message = payload.error;
    } catch {
      /* keep the generic message */
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export interface DashboardSummary {
  stats: {
    total: number;
    active: number;
    waiting: number;
    pending: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  };
  productivity: ProductivityPeriod[];
  reminders: Reminder[];
  projects: Project[];
  members: Member[];
  todayEvents: CalEvent[];
  weekHours: number;
  todaySeconds: number;
}

export interface AnalyticsPayload {
  metrics: Metric[];
  throughput: ThroughputPoint[];
  donut: DonutSlice[];
  workload: WorkloadPeriod;
}

export interface CreateProjectPayload {
  name: string;
  type: string;
  owner: string;
  status: Project["status"];
  dueAt: string;
  progress?: number;
  color?: Project["color"];
  icon?: Project["icon"];
}

export const api = {
  /* ------------------------------- projects ------------------------------ */
  listProjects: () => request<Project[]>("/api/projects"),
  getProject: (id: string) => request<Project>(`/api/projects/${id}`),
  createProject: (payload: CreateProjectPayload) =>
    request<Project>("/api/projects", { method: "POST", body: JSON.stringify(payload) }),
  updateProject: (id: string, patch: Partial<Project>) =>
    request<Project>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteProject: (id: string) =>
    request<{ id: string; removedTasks: number }>(`/api/projects/${id}`, { method: "DELETE" }),

  /* -------------------------------- tasks -------------------------------- */
  listTasks: () => request<Task[]>("/api/tasks"),
  createTask: (payload: Pick<Task, "title" | "projectId" | "status" | "priority" | "assignee" | "dueAt">) =>
    request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id: string, patch: Partial<Task>) =>
    request<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  moveTask: (id: string, status: Task["status"], progress?: number) =>
    request<Task>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(typeof progress === "number" ? { status, progress } : { status }),
    }),

  /* ------------------------------- members ------------------------------- */
  listMembers: () => request<Member[]>("/api/members"),
  getMember: (id: string) => request<Member>(`/api/members/${id}`),

  /* -------------------------------- events ------------------------------- */
  listEvents: () => request<CalEvent[]>("/api/events"),
  listAgenda: () => request<CalEvent[]>("/api/events?scope=agenda"),
  listUpcoming: () => request<CalEvent[]>("/api/events?scope=upcoming"),

  /* --------------------------------- time -------------------------------- */
  listTimeEntries: () => request<TimeEntry[]>("/api/time-entries"),
  createTimeEntry: (payload: { projectId: string; seconds: number; startedAt?: string }) =>
    request<TimeEntry>("/api/time-entries", { method: "POST", body: JSON.stringify(payload) }),

  /* ------------------------------- dashboard ----------------------------- */
  getDashboard: () => request<DashboardSummary>("/api/dashboard"),

  /* ------------------------------- analytics ----------------------------- */
  getAnalytics: () => request<AnalyticsPayload>("/api/analytics"),

  /* -------------------------------- settings ----------------------------- */
  listNotifications: () => request<NotificationSetting[]>("/api/notifications"),
  saveNotification: (id: string, enabled: boolean) =>
    request<NotificationSetting[]>(`/api/notifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  getProfile: () => request<CurrentUser>("/api/profile"),
  saveProfile: (patch: Partial<CurrentUser>) =>
    request<CurrentUser>("/api/profile", { method: "PATCH", body: JSON.stringify(patch) }),
};

export type Api = typeof api;
