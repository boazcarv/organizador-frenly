import "server-only";

import type {
  Account,
  CalEvent,
  CurrentUser,
  Member,
  NotificationSetting,
  PastelKey,
  Project,
  ProjectIcon,
  ProjectStatus,
  Task,
  TaskPriority,
  TaskStatus,
  TimeEntry,
} from "@/lib/types";
import { nextId } from "./ids";
import { listUsers, updateUser } from "./users";
import { getSql, type Sql } from "./sql";

/**
 * ---------------------------------------------------------------------------
 *  Repository — entities
 * ---------------------------------------------------------------------------
 *
 *  Every read and write the product performs, expressed as SQL. Rows are mapped
 *  to the domain types in `lib/types.ts`, which is the same shape the UI has
 *  always consumed: swapping the storage engine never reaches the components.
 *
 *  Aggregates (dashboard, analytics) live in `insights.ts`.
 */

/* -------------------------------------------------------------------------- */
/*  mapping helpers                                                            */
/* -------------------------------------------------------------------------- */

/** Postgres hands back `Date` for timestamptz; the domain speaks ISO strings. */
function iso(value: Date | string | null | undefined): string {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

interface ProjectRow {
  id: string;
  name: string;
  type: string;
  owner: string;
  status: ProjectStatus;
  progress: number;
  color: PastelKey;
  icon: ProjectIcon;
  members: number;
  tasks_done: number;
  tasks_total: number;
  due_at: Date | string;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    owner: row.owner,
    status: row.status,
    progress: row.progress,
    color: row.color,
    icon: row.icon,
    members: row.members,
    tasksDone: row.tasks_done,
    tasksTotal: row.tasks_total,
    dueAt: iso(row.due_at),
  };
}

interface TaskRow {
  id: string;
  title: string;
  project_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  due_at: Date | string;
  progress: number;
  attachments: number;
  comments: number;
  completed_at: Date | string | null;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    projectId: row.project_id ?? "",
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    dueAt: iso(row.due_at),
    progress: row.progress,
    attachments: row.attachments,
    comments: row.comments,
  };
}

interface EventRow {
  id: string;
  title: string;
  start_at: Date | string;
  end_at: Date | string;
  owner: string;
  priority: "high" | "normal";
  color: PastelKey;
  tags: string[] | null;
  attendees: string[] | null;
}

function toEvent(row: EventRow): CalEvent {
  return {
    id: row.id,
    title: row.title,
    start: iso(row.start_at),
    end: iso(row.end_at),
    owner: row.owner,
    priority: row.priority,
    color: row.color,
    tags: row.tags ?? [],
    attendees: row.attendees ?? [],
  };
}

interface TimeEntryRow {
  id: string;
  project_id: string | null;
  user_id: string | null;
  seconds: number;
  started_at: Date | string;
}

function toTimeEntry(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    projectId: row.project_id ?? "",
    userId: row.user_id ?? null,
    seconds: row.seconds,
    startedAt: iso(row.started_at),
  };
}

const PASTEL_CYCLE: PastelKey[] = ["peach", "blue", "sage", "sand", "lilac"];

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
  color?: PastelKey;
  icon?: ProjectIcon;
}

export async function listProjects(): Promise<Project[]> {
  const sql = await getSql();
  const rows = await sql.query<ProjectRow>(
    "select * from projects order by created_at desc, name asc",
  );
  return rows.map(toProject);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const sql = await getSql();
  const rows = await sql.query<ProjectRow>("select * from projects where id = $1", [id]);
  return rows[0] ? toProject(rows[0]) : undefined;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const sql = await getSql();
  const rows = await sql.query<ProjectRow>(
    `insert into projects (id, name, type, owner, status, progress, color, icon, due_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [
      nextId("prj"),
      input.name,
      input.type,
      input.owner,
      input.status,
      input.progress ?? 0,
      input.color ?? PASTEL_CYCLE[Math.floor(Math.random() * PASTEL_CYCLE.length)],
      input.icon ?? "sparkles",
      new Date(input.dueAt),
    ],
  );
  return toProject(rows[0]);
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project | undefined> {
  const current = await getProject(id);
  if (!current) return undefined;

  const next = { ...current, ...patch, id: current.id };
  const sql = await getSql();
  const rows = await sql.query<ProjectRow>(
    `update projects
        set name = $2, type = $3, owner = $4, status = $5, progress = $6,
            color = $7, icon = $8, due_at = $9
      where id = $1
      returning *`,
    [
      id,
      next.name,
      next.type,
      next.owner,
      next.status,
      Math.max(0, Math.min(100, Math.round(next.progress))),
      next.color,
      next.icon,
      new Date(next.dueAt),
    ],
  );
  return rows[0] ? toProject(rows[0]) : undefined;
}

/** Removes a project and everything hanging off it (tasks, time entries). */
export async function deleteProject(id: string): Promise<{ id: string; removedTasks: number }> {
  const sql = await getSql();
  return sql.transaction(async (tx) => {
    const tasks = await tx.query<{ count: string }>(
      "select count(*)::text as count from tasks where project_id = $1",
      [id],
    );
    // tasks and time_entries cascade from the foreign keys in schema.ts.
    await tx.query("delete from projects where id = $1", [id]);
    return { id, removedTasks: Number(tasks[0]?.count ?? "0") };
  });
}

/** Recomputes the counters a project mirrors from its tasks. */
async function recalculateProject(sql: Sql, projectId: string): Promise<void> {
  await sql.query(
    `update projects p
        set tasks_total = counts.total,
            tasks_done  = counts.done,
            members     = greatest(1, counts.assignees),
            progress    = case when counts.total = 0 then p.progress
                               else round(100.0 * counts.done / counts.total) end
       from (
         select
           (select count(*) from tasks t where t.project_id = $1) as total,
           (select count(*) from tasks t where t.project_id = $1 and t.status = 'done') as done,
           (select count(distinct t.assignee) from tasks t where t.project_id = $1 and t.assignee <> '') as assignees
       ) as counts
      where p.id = $1`,
    [projectId],
  );
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
  const sql = await getSql();
  const rows = await sql.query<TaskRow>("select * from tasks order by created_at desc");
  return rows.map(toTask);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const sql = await getSql();
  return sql.transaction(async (tx) => {
    const done = input.status === "done";
    const rows = await tx.query<TaskRow>(
      `insert into tasks (id, title, project_id, status, priority, assignee, due_at, progress, completed_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning *`,
      [
        nextId("tsk"),
        input.title,
        input.projectId,
        input.status,
        input.priority,
        input.assignee,
        new Date(input.dueAt),
        done ? 100 : 0,
        done ? new Date() : null,
      ],
    );

    await recalculateProject(tx, input.projectId);
    return toTask(rows[0]);
  });
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | undefined> {
  const sql = await getSql();
  return sql.transaction(async (tx) => {
    const current = await tx.query<TaskRow>("select * from tasks where id = $1", [id]);
    if (!current[0]) return undefined;

    const before = toTask(current[0]);
    const after: Task = { ...before, ...patch, id: before.id };

    // `completed_at` is what the analytics read: it is the moment work actually
    // finished, which is not the same as the task's due date. Reopening a task
    // clears it again, so a card dragged back to "em progresso" stops counting
    // as delivered.
    let completedAt: Date | null = current[0].completed_at ? new Date(current[0].completed_at) : null;
    if (after.status === "done") {
      completedAt ??= new Date();
      after.progress = 100;
    } else {
      completedAt = null;
    }

    const rows = await tx.query<TaskRow>(
      `update tasks
          set title = $2, status = $3, priority = $4, assignee = $5,
              due_at = $6, progress = $7, project_id = $8, completed_at = $9
        where id = $1
        returning *`,
      [
        id,
        after.title,
        after.status,
        after.priority,
        after.assignee,
        new Date(after.dueAt),
        Math.max(0, Math.min(100, Math.round(after.progress))),
        after.projectId,
        completedAt,
      ],
    );

    // Both the old and the new project (a task can be moved across projects).
    await recalculateProject(tx, before.projectId);
    if (after.projectId !== before.projectId) await recalculateProject(tx, after.projectId);

    return toTask(rows[0]);
  });
}

export async function deleteTask(id: string): Promise<boolean> {
  const sql = await getSql();
  return sql.transaction(async (tx) => {
    const rows = await tx.query<TaskRow>("delete from tasks where id = $1 returning *", [id]);
    if (!rows[0]) return false;
    await recalculateProject(tx, rows[0].project_id ?? "");
    return true;
  });
}

/* -------------------------------------------------------------------------- */
/*  members — the workspace's accounts, with their real numbers                */
/* -------------------------------------------------------------------------- */

interface MemberStats {
  user_id: string;
  projects: string;
  tasks: string;
  done: string;
  seconds: string;
  last_active: Date | string | null;
}

function toMember(user: Account, stats: MemberStats | undefined): Member {
  const tasks = Number(stats?.tasks ?? "0");
  const done = Number(stats?.done ?? "0");
  const lastActive = stats?.last_active ? iso(stats.last_active) : user.createdAt;

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    company: user.company,
    status: "active",
    // Presence is not tracked: a green dot nobody can trust is worse than none.
    online: false,
    projects: Number(stats?.projects ?? "0"),
    tasks,
    weeklyProgress: tasks === 0 ? 0 : Math.round((done / tasks) * 100),
    color: user.color,
    hours: Math.round(Number(stats?.seconds ?? "0") / 3600),
    efficiency: tasks === 0 ? 0 : Math.round((done / tasks) * 100),
    rating: 0,
    lastActive,
    recent: Date.now() - new Date(lastActive).getTime() < 24 * 60 * 60 * 1000,
    skills: [],
    activities: [],
  };
}

async function memberStats(): Promise<Map<string, MemberStats>> {
  const sql = await getSql();
  const rows = await sql.query<MemberStats>(`
    select u.id as user_id,
           (select count(*) from projects p where p.owner = u.name)::text as projects,
           (select count(*) from tasks t where t.assignee = u.name)::text as tasks,
           (select count(*) from tasks t where t.assignee = u.name and t.status = 'done')::text as done,
           (select coalesce(sum(te.seconds), 0) from time_entries te where te.user_id = u.id)::text as seconds,
           (select max(te.started_at) from time_entries te where te.user_id = u.id) as last_active
      from users u
  `);
  return new Map(rows.map((row) => [row.user_id, row]));
}

export async function listMembers(): Promise<Member[]> {
  const [users, stats] = await Promise.all([listUsers(), memberStats()]);
  return users.map((user) => toMember(user, stats.get(user.id)));
}

export async function getMember(id: string): Promise<Member | undefined> {
  const [users, stats] = await Promise.all([listUsers(), memberStats()]);
  const user = users.find((item) => item.id === id);
  return user ? toMember(user, stats.get(user.id)) : undefined;
}

/* -------------------------------------------------------------------------- */
/*  events                                                                     */
/* -------------------------------------------------------------------------- */

export interface CreateEventInput {
  title: string;
  start: string;
  end: string;
  owner?: string;
  priority?: "high" | "normal";
  color?: PastelKey;
  tags?: string[];
  attendees?: string[];
}

export async function listEvents(): Promise<CalEvent[]> {
  const sql = await getSql();
  const rows = await sql.query<EventRow>("select * from events order by start_at asc");
  return rows.map(toEvent);
}

export async function createEvent(input: CreateEventInput): Promise<CalEvent> {
  const sql = await getSql();
  const rows = await sql.query<EventRow>(
    `insert into events (id, title, start_at, end_at, owner, priority, color, tags, attendees)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [
      nextId("evt"),
      input.title,
      new Date(input.start),
      new Date(input.end),
      input.owner ?? "",
      input.priority ?? "normal",
      input.color ?? "sage",
      input.tags ?? [],
      input.attendees ?? [],
    ],
  );
  return toEvent(rows[0]);
}

export async function listAgenda(): Promise<CalEvent[]> {
  const sql = await getSql();
  const rows = await sql.query<EventRow>(
    `select * from events
      where start_at >= date_trunc('day', now()) and start_at < date_trunc('day', now()) + interval '1 day'
      order by start_at asc`,
  );
  return rows.map(toEvent);
}

export async function listUpcoming(): Promise<CalEvent[]> {
  const sql = await getSql();
  const rows = await sql.query<EventRow>(
    `select * from events
      where end_at >= now()
      order by start_at asc
      limit 6`,
  );
  return rows.map(toEvent);
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
  const sql = await getSql();
  const rows = await sql.query<TimeEntryRow>(
    "select * from time_entries order by started_at desc limit 500",
  );
  return rows.map(toTimeEntry);
}

export async function createTimeEntry(
  input: CreateTimeEntryInput,
  userId: string,
): Promise<TimeEntry> {
  const project = await getProject(input.projectId);
  if (!project) throw new Error("Projeto inexistente");

  const sql = await getSql();
  const rows = await sql.query<TimeEntryRow>(
    `insert into time_entries (id, project_id, user_id, seconds, started_at)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [
      nextId("te"),
      input.projectId,
      userId,
      Math.max(0, Math.round(input.seconds)),
      input.startedAt ? new Date(input.startedAt) : new Date(),
    ],
  );
  return toTimeEntry(rows[0]);
}

/* -------------------------------------------------------------------------- */
/*  notification preferences (per account)                                     */
/* -------------------------------------------------------------------------- */

/**
 * The catalogue. Preferences themselves are stored per user, so the two of you
 * can disagree about e-mail without stepping on each other.
 */
export const NOTIFICATION_CATALOGUE: Omit<NotificationSetting, "enabled">[] = [
  {
    id: "deadlines",
    title: "Prazos se aproximando",
    description: "Um aviso 24h antes de cada entrega marcada no calendário.",
  },
  {
    id: "mentions",
    title: "Menções e comentários",
    description: "Quando alguém te chama em uma tarefa ou responde seu comentário.",
  },
  {
    id: "digest",
    title: "Resumo diário",
    description: "Um e-mail curto toda manhã com o que está no seu radar.",
  },
  {
    id: "weekly",
    title: "Relatório semanal",
    description: "Horas, entregas e capacidade do time, toda segunda.",
  },
  {
    id: "product",
    title: "Novidades do produto",
    description: "Lançamentos e mudanças relevantes no Frenly.",
  },
];

export async function listNotifications(userId: string): Promise<NotificationSetting[]> {
  const sql = await getSql();
  const rows = await sql.query<{ id: string; title: string; description: string; enabled: boolean }>(
    "select id, title, description, enabled from notification_settings where user_id = $1",
    [userId],
  );

  const stored = new Map(rows.map((row) => [row.id, row]));

  // First visit for this account: materialise the catalogue with sane defaults,
  // and keep the copy in sync if it changes in a later release.
  return NOTIFICATION_CATALOGUE.map((item) => {
    const existing = stored.get(item.id);
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      enabled: existing?.enabled ?? item.id !== "product",
    };
  });
}

export async function setNotification(
  userId: string,
  id: string,
  enabled: boolean,
): Promise<NotificationSetting[]> {
  const item = NOTIFICATION_CATALOGUE.find((entry) => entry.id === id);
  if (!item) throw new Error("Preferência desconhecida");

  const sql = await getSql();
  await sql.query(
    `insert into notification_settings (user_id, id, title, description, enabled)
     values ($1, $2, $3, $4, $5)
     on conflict (user_id, id) do update set enabled = excluded.enabled`,
    [userId, item.id, item.title, item.description, enabled],
  );

  return listNotifications(userId);
}

/* -------------------------------------------------------------------------- */
/*  profile                                                                    */
/* -------------------------------------------------------------------------- */

export async function getProfile(userId: string): Promise<CurrentUser> {
  const user = await getMemberProfile(userId);
  if (!user) throw new Error("Conta não encontrada");
  return user;
}

async function getMemberProfile(userId: string): Promise<CurrentUser | undefined> {
  const sql = await getSql();
  const rows = await sql.query<{
    id: string;
    name: string;
    role: string;
    email: string;
    company: string;
    plan: string;
    timezone: string;
    bio: string;
    color: PastelKey;
  }>(
    "select id, name, role, email, company, plan, timezone, bio, color from users where id = $1",
    [userId],
  );
  return rows[0];
}

export async function saveProfile(
  userId: string,
  patch: Partial<CurrentUser>,
): Promise<CurrentUser> {
  const updated = await updateUser(userId, {
    name: patch.name,
    role: patch.role,
    company: patch.company,
    plan: patch.plan,
    timezone: patch.timezone,
    bio: patch.bio,
  });
  if (!updated) throw new Error("Conta não encontrada");
  return getProfile(userId);
}

/* -------------------------------------------------------------------------- */
/*  workspace lifecycle                                                        */
/* -------------------------------------------------------------------------- */

/** Wipes workspace content but keeps accounts. Used by the owner-only reset. */
export async function resetWorkspace(): Promise<void> {
  const sql = await getSql();
  await sql.transaction(async (tx) => {
    await tx.exec("delete from time_entries; delete from tasks; delete from projects; delete from events;");
  });
}
