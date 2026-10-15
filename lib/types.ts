/**
 * Domain models. These mirror 1:1 the shape the future backend layer
 * (Supabase / Prisma) is expected to return, so lib/api.ts can be swapped
 * without touching a single component.
 */

export type AccentKey = "green" | "ocean" | "plum" | "rose" | "amber";

/** Desaturated data palette used by avatars, projects and calendar events. */
export type PastelKey = "peach" | "blue" | "sage" | "sand" | "lilac";

export type ProjectStatus = "active" | "waiting" | "pending" | "completed";

export interface Project {
  id: string;
  name: string;
  type: string;
  owner: string;
  owners: string[];
  status: ProjectStatus;
  progress: number;
  color: PastelKey;
  icon: ProjectIcon;
  members: number;
  tasksDone: number;
  tasksTotal: number;
  dueAt: string;
}

export type ProjectIcon =
  | "layers"
  | "megaphone"
  | "palette"
  | "smartphone"
  | "globe"
  | "database"
  | "sparkles"
  | "compass";

export type TaskStatus = "backlog" | "progress" | "review" | "done";
export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueAt: string;
  progress: number;
  attachments: number;
  comments: number;
}

export type MemberStatus = "active" | "busy" | "waiting" | "pending";

export interface Member {
  id: string;
  name: string;
  role: string;
  company: string;
  status: MemberStatus;
  online: boolean;
  projects: number;
  tasks: number;
  weeklyProgress: number;
  color: PastelKey;
  hours: number;
  efficiency: number;
  rating: number;
  lastActive: string;
  /** activity within the last 24h — resolved on the server, where a clock exists */
  recent: boolean;
  skills: string[];
  activities: Activity[];
}

export type ActivityKind = "commit" | "review" | "comment" | "file" | "call";

export interface Activity {
  id: string;
  kind: ActivityKind;
  label: string;
  at: string;
}

export interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  owner: string;
  priority: "high" | "normal";
  color: PastelKey;
  tags: string[];
  attendees: string[];
}

export interface TimeEntry {
  id: string;
  projectId: string;
  /** Who tracked the session — null for entries recorded before accounts existed. */
  userId: string | null;
  seconds: number;
  startedAt: string;
}

export interface Metric {
  key: string;
  label: string;
  value: number;
  delta: number;
  spark: number[];
  format: "number" | "hours" | "percent";
}

export interface ThroughputPoint {
  label: string;
  date: string;
  current: number;
  previous: number;
  average: number;
}

export interface DonutSlice {
  key: string;
  label: string;
  hours: number;
  color: string;
}

export interface WorkloadRow {
  id: string;
  name: string;
  color: PastelKey;
  values: number[];
  total: number;
}

export interface WorkloadPeriod {
  labels: string[];
  rows: WorkloadRow[];
}

export interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: string;
  email: string;
  company: string;
  plan: string;
  timezone: string;
  bio: string;
  color: PastelKey;
}

/** Account as the API exposes it: never carries the password hash. */
export interface Account {
  id: string;
  email: string;
  name: string;
  role: string;
  company: string;
  plan: string;
  timezone: string;
  bio: string;
  color: PastelKey;
  isOwner: boolean;
  createdAt: string;
}

/** The window the analytics screen is currently looking at. */
export type AnalyticsPeriod = "today" | "week" | "month";

/**
 * Payloads shared by the API routes and the client.
 *
 * They live here, next to the domain models, so a change to the shape of a
 * response is a type error on both sides of the wire instead of a runtime
 * surprise in the browser.
 */

export interface DashboardStats {
  total: number;
  active: number;
  waiting: number;
  pending: number;
  completed: number;
  inProgress: number;
  completionRate: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
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

export interface Reminder {
  id: string;
  title: string;
  project: string;
  start: string;
  end: string;
  color: PastelKey;
  attendees: string[];
}

export interface ProductivityPeriod {
  id: string;
  label: string;
  bars: ProjectProductivity[];
}

export interface ProjectProductivity {
  id: string;
  label: string;
  current: number;
  previous: number;
  isCurrent: boolean;
}
