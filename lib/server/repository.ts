import "server-only";

import { endOfDay, startOfDay, subDays } from "date-fns";
import type {
  CalEvent,
  CurrentUser,
  Member,
  NotificationSetting,
  ProductivityPeriod,
  Project,
  ProjectStatus,
  Reminder,
  Task,
  TaskPriority,
  TaskStatus,
  TimeEntry,
} from "@/lib/types";
import { loadDatabase, updateDatabase } from "./db";

/* -------------------------------------------------------------------------- */
/*  helpers                                                                    */
/* -------------------------------------------------------------------------- */

function startOfToday(): Date {
  return startOfDay(new Date());
}

export function isToday(value: string | Date): boolean {
  const date = typeof value === "string" ? new Date(value) : value;
  return date >= startOfToday() && date <= endOfDay(new Date());
}

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}${sequence.toString(36)}`;
}

/* -------------------------------------------------------------------------- */
/*  projects                                                                   */
/* -------------------------------------------------------------------------- */

export interface CreateProjectInput {
  name: string;
  type: string;
  owner: string;
  status: ProjectStatus;
  dueAt: string;
  progress?: number;
  color?: Project["color"];
  icon?: Project["icon"];
}

export async function listProjects(): Promise<Project[]> {
  const db = await loadDatabase();
  return structuredClone(db.projects);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await loadDatabase();
  const project = db.projects.find((item) => item.id === id);
  return project ? structuredClone(project) : undefined;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return updateDatabase((db) => {
    const project: Project = {
      id: nextId("prj"),
      name: input.name,
      type: input.type,
      owner: input.owner,
      status: input.status,
      progress: input.progress ?? 0,
      color: input.color ?? "sage",
      icon: input.icon ?? "sparkles",
      members: 1,
      tasksDone: 0,
      tasksTotal: 0,
      dueAt: input.dueAt,
    };
    db.projects.unshift(project);
    return structuredClone(project);
  });
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project | undefined> {
  return updateDatabase((db) => {
    const index = db.projects.findIndex((project) => project.id === id);
    if (index === -1) return undefined;
    db.projects[index] = { ...db.projects[index], ...patch, id };
    return structuredClone(db.projects[index]);
  });
}

/** Removes a project and everything hanging off it (tasks, time entries). */
export async function deleteProject(id: string): Promise<{ id: string; removedTasks: number }> {
  return updateDatabase((db) => {
    const before = db.tasks.length;
    db.projects = db.projects.filter((project) => project.id !== id);
    db.tasks = db.tasks.filter((task) => task.projectId !== id);
    db.timeEntries = db.timeEntries.filter((entry) => entry.projectId !== id);
    return { id, removedTasks: before - db.tasks.length };
  });
}

/* -------------------------------------------------------------------------- */
/*  tasks                                                                      */
/* -------------------------------------------------------------------------- */

export interface CreateTaskInput {
  title: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueAt: string;
}

export async function listTasks(): Promise<Task[]> {
  const db = await loadDatabase();
  return structuredClone(db.tasks);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return updateDatabase((db) => {
    const task: Task = {
      id: nextId("tsk"),
      title: input.title,
      projectId: input.projectId,
      status: input.status,
      priority: input.priority,
      assignee: input.assignee,
      dueAt: input.dueAt,
      progress: input.status === "done" ? 100 : 0,
      attachments: 0,
      comments: 0,
    };
    db.tasks.unshift(task);

    const project = db.projects.find((item) => item.id === input.projectId);
    if (project) {
      project.tasksTotal += 1;
      project.members = Math.max(project.members, 1);
    }
    return structuredClone(task);
  });
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | undefined> {
  return updateDatabase((db) => {
    const index = db.tasks.findIndex((task) => task.id === id);
    if (index === -1) return undefined;
    const before = db.tasks[index];
    const after: Task = { ...before, ...patch, id };
    if (patch.status === "done") after.progress = 100;
    db.tasks[index] = after;

    if (before.status !== after.status) {
      const project = db.projects.find((item) => item.id === after.projectId);
      if (project) {
        const delta = (after.status === "done" ? 1 : 0) - (before.status === "done" ? 1 : 0);
        project.tasksDone += delta;
        const total = db.tasks.filter((task) => task.projectId === after.projectId).length;
        const done = db.tasks.filter((task) => task.projectId === after.projectId && task.status === "done").length;
        project.tasksTotal = total;
        project.progress = total === 0 ? 0 : Math.round((done / total) * 100);
      }
    }
    return structuredClone(after);
  });
}

/* -------------------------------------------------------------------------- */
/*  members / events                                                           */
/* -------------------------------------------------------------------------- */

export async function listMembers(): Promise<Member[]> {
  const db = await loadDatabase();
  return structuredClone(db.members);
}

export async function getMember(id: string): Promise<Member | undefined> {
  const db = await loadDatabase();
  const member = db.members.find((item) => item.id === id);
  return member ? structuredClone(member) : undefined;
}

export async function listEvents(): Promise<CalEvent[]> {
  const db = await loadDatabase();
  return structuredClone(db.events);
}

export async function listAgenda(): Promise<CalEvent[]> {
  const db = await loadDatabase();
  return structuredClone(
    db.events
      .filter((event) => isToday(event.start))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
  );
}

export async function listUpcoming(): Promise<CalEvent[]> {
  const db = await loadDatabase();
  return structuredClone(
    db.events
      .filter((event) => new Date(event.start).getTime() >= startOfToday().getTime())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 6),
  );
}

/* -------------------------------------------------------------------------- */
/*  time entries                                                               */
/* -------------------------------------------------------------------------- */

export interface CreateTimeEntryInput {
  projectId: string;
  seconds: number;
  startedAt?: string;
}

export async function listTimeEntries(): Promise<TimeEntry[]> {
  const db = await loadDatabase();
  return structuredClone(db.timeEntries);
}

export async function createTimeEntry(input: CreateTimeEntryInput): Promise<TimeEntry> {
  return updateDatabase((db) => {
    if (!db.projects.some((project) => project.id === input.projectId)) {
      throw new Error("Projeto inexistente");
    }
    const entry: TimeEntry = {
      id: nextId("te"),
      projectId: input.projectId,
      seconds: Math.max(0, Math.round(input.seconds)),
      startedAt: input.startedAt ?? new Date().toISOString(),
    };
    db.timeEntries.unshift(entry);
    return structuredClone(entry);
  });
}

function secondsBetween(entries: TimeEntry[], from: Date, to: Date): number {
  return entries
    .filter((entry) => {
      const at = new Date(entry.startedAt);
      return at >= from && at <= to;
    })
    .reduce((total, entry) => total + entry.seconds, 0);
}

/* -------------------------------------------------------------------------- */
/*  notifications / profile                                                    */
/* -------------------------------------------------------------------------- */

export async function listNotifications(): Promise<NotificationSetting[]> {
  const db = await loadDatabase();
  return structuredClone(db.notifications);
}

export async function setNotification(id: string, enabled: boolean): Promise<NotificationSetting[]> {
  return updateDatabase((db) => {
    db.notifications = db.notifications.map((item) => (item.id === id ? { ...item, enabled } : item));
    return structuredClone(db.notifications);
  });
}

export async function getProfile(): Promise<CurrentUser> {
  const db = await loadDatabase();
  return structuredClone(db.profile);
}

export async function saveProfile(patch: Partial<CurrentUser>): Promise<CurrentUser> {
  return updateDatabase((db) => {
    db.profile = { ...db.profile, ...patch, id: db.profile.id };
    return structuredClone(db.profile);
  });
}

/* -------------------------------------------------------------------------- */
/*  aggregates (dashboard + analytics)                                         */
/* -------------------------------------------------------------------------- */

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

export async function getDashboard(): Promise<DashboardSummary> {
  const db = await loadDatabase();
  const now = new Date();
  const statusCount = (status: ProjectStatus) => db.projects.filter((project) => project.status === status).length;

  const reminders: Reminder[] = db.events
    .filter((event) => new Date(event.start).getTime() >= now.getTime() - 30 * 60_000)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3)
    .map((event) => ({
      id: `rem-${event.id}`,
      title: event.title,
      project: db.projects.find((project) => project.name === event.title.split(" — ")[0])?.name ?? "Workspace",
      start: event.start,
      end: event.end,
      color: event.color,
      attendees: event.attendees,
    }));

  return {
    stats: {
      total: db.projects.length,
      active: statusCount("active"),
      waiting: statusCount("waiting"),
      pending: statusCount("pending"),
      completed: db.tasks.filter((task) => task.status === "done").length,
      inProgress: statusCount("active") + statusCount("waiting"),
      completionRate:
        db.projects.length === 0
          ? 0
          : Math.round(db.projects.reduce((total, project) => total + project.progress, 0) / db.projects.length),
    },
    productivity: structuredClone(db.productivity),
    reminders,
    projects: structuredClone(db.projects),
    members: structuredClone(db.members),
    todayEvents: structuredClone(
      db.events
        .filter((event) => isToday(event.start))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    ),
    weekHours: Math.round(secondsBetween(db.timeEntries, subDays(startOfToday(), 6), endOfDay(now)) / 3600),
    todaySeconds: secondsBetween(db.timeEntries, startOfToday(), endOfDay(now)),
  };
}

export interface AnalyticsPayload {
  metrics: Awaited<ReturnType<typeof loadDatabase>>["analytics"]["metrics"];
  throughput: Awaited<ReturnType<typeof loadDatabase>>["analytics"]["throughput"];
  donut: Awaited<ReturnType<typeof loadDatabase>>["analytics"]["donut"];
  workload: Awaited<ReturnType<typeof loadDatabase>>["analytics"]["workload"];
}

export async function getAnalytics(): Promise<AnalyticsPayload> {
  const db = await loadDatabase();
  const totalHours = Math.round(db.timeEntries.reduce((total, entry) => total + entry.seconds, 0) / 3600);
  const doneTasks = db.tasks.filter((task) => task.status === "done").length;

  // The headline numbers are derived from the live data, not baked into the mock.
  const metrics = db.analytics.metrics.map((metric) => {
    if (metric.key === "hours") return { ...metric, value: totalHours };
    if (metric.key === "tasks") return { ...metric, value: db.tasks.length * 11 + doneTasks };
    return metric;
  });

  return {
    metrics: structuredClone(metrics),
    throughput: structuredClone(db.analytics.throughput),
    donut: structuredClone(db.analytics.donut),
    workload: structuredClone(db.analytics.workload),
  };
}
