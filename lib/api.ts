"use client";

import type {
  Account,
  AnalyticsPayload,
  AnalyticsPeriod,
  CalEvent,
  CurrentUser,
  DashboardSummary,
  Member,
  NotificationSetting,
  Project,
  Task,
  TimeEntry,
} from "./types";

/**
 * ---------------------------------------------------------------------------
 *  Data access layer (client side).
 *
 *  Every call goes to the REST routes under /app/api, which authenticate the
 *  request, read and write Postgres, and answer with the domain types. The
 *  signatures below are the contract: pointing them at a different backend
 *  later means changing this file and the routes, nothing else.
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
    // Same-origin cookies carry the session; a redirect to the login screen
    // arriving as HTML is what turns "not logged in" into a clear API error.
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

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export interface CreateProjectPayload {
  name: string;
  type: string;
  owner?: string;
  owners?: string[];
  status: Project["status"];
  dueAt: string;
  progress?: number;
  color?: Project["color"];
  icon?: Project["icon"];
}

export interface Credentials {
  email: string;
  password: string;
}

export interface SetupPayload {
  name: string;
  email: string;
  password: string;
}

export interface NewAccountPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export const api = {
  /* --------------------------------- auth -------------------------------- */
  setupState: () => request<{ needsSetup: boolean }>("/api/auth/setup"),
  setup: (payload: SetupPayload) =>
    request<{ user: Account }>("/api/auth/setup", { method: "POST", ...json(payload) }),
  login: (payload: Credentials) =>
    request<{ user: Account }>("/api/auth/login", { method: "POST", ...json(payload) }),
  logout: () => request<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST" }),

  /* ------------------------------- accounts ------------------------------ */
  listAccounts: () => request<Account[]>("/api/account"),
  createAccount: (payload: NewAccountPayload) =>
    request<{ user: Account }>("/api/account", { method: "POST", ...json(payload) }),
  updateAccount: (id: string, patch: { name?: string; role?: string; password?: string; currentPassword?: string }) =>
    request<Account>(`/api/account/${id}`, { method: "PATCH", ...json(patch) }),
  deleteAccount: (id: string) =>
    request<{ id: string; removed: boolean }>(`/api/account/${id}`, { method: "DELETE" }),

  /* ------------------------------- projects ------------------------------ */
  listProjects: () => request<Project[]>("/api/projects"),
  getProject: (id: string) => request<Project>(`/api/projects/${id}`),
  createProject: (payload: CreateProjectPayload) =>
    request<Project>("/api/projects", { method: "POST", ...json(payload) }),
  updateProject: (id: string, patch: Partial<Project>) =>
    request<Project>(`/api/projects/${id}`, { method: "PATCH", ...json(patch) }),
  deleteProject: (id: string) =>
    request<{ id: string; removedTasks: number }>(`/api/projects/${id}`, { method: "DELETE" }),

  /* -------------------------------- tasks -------------------------------- */
  listTasks: () => request<Task[]>("/api/tasks"),
  createTask: (payload: Pick<Task, "title" | "projectId" | "status" | "priority" | "assignee" | "dueAt">) =>
    request<Task>("/api/tasks", { method: "POST", ...json(payload) }),
  updateTask: (id: string, patch: Partial<Task>) =>
    request<Task>(`/api/tasks/${id}`, { method: "PATCH", ...json(patch) }),
  moveTask: (id: string, status: Task["status"], progress?: number) =>
    request<Task>(`/api/tasks/${id}`, {
      method: "PATCH",
      ...json(typeof progress === "number" ? { status, progress } : { status }),
    }),
  deleteTask: (id: string) =>
    request<{ id: string; removed: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),

  /* ------------------------------- members ------------------------------- */
  listMembers: () => request<Member[]>("/api/members"),
  getMember: (id: string) => request<Member>(`/api/members/${id}`),

  /* -------------------------------- events ------------------------------- */
  listEvents: () => request<CalEvent[]>("/api/events"),
  deleteEvent: (id: string) => request<{ deleted: boolean }>(`/api/events/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createEvent: (payload: { title: string; start: string; end: string; priority?: CalEvent["priority"]; color?: CalEvent["color"]; tags?: string[]; attendees?: string[] }) =>
    request<CalEvent>("/api/events", { method: "POST", ...json(payload) }),
  listAgenda: () => request<CalEvent[]>("/api/events?scope=agenda"),
  listUpcoming: () => request<CalEvent[]>("/api/events?scope=upcoming"),

  /* --------------------------------- time -------------------------------- */
  listTimeEntries: () => request<TimeEntry[]>("/api/time-entries"),
  createTimeEntry: (payload: { projectId: string; seconds: number; startedAt?: string }) =>
    request<TimeEntry>("/api/time-entries", { method: "POST", ...json(payload) }),

  /* ------------------------------- dashboard ----------------------------- */
  getDashboard: () => request<DashboardSummary>("/api/dashboard"),

  /* ------------------------------- analytics ----------------------------- */
  getAnalytics: (period: AnalyticsPeriod) =>
    request<AnalyticsPayload>(`/api/analytics?period=${period}`),

  /* -------------------------------- settings ----------------------------- */
  listNotifications: () => request<NotificationSetting[]>("/api/notifications"),
  saveNotification: (id: string, enabled: boolean) =>
    request<NotificationSetting[]>(`/api/notifications/${id}`, { method: "PATCH", ...json({ enabled }) }),
  getProfile: () => request<CurrentUser>("/api/profile"),
  saveProfile: (patch: Partial<CurrentUser>) =>
    request<CurrentUser>("/api/profile", { method: "PATCH", ...json(patch) }),
};

export type Api = typeof api;
