import "server-only";

import {
  addWeeks,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  AnalyticsPayload,
  AnalyticsPeriod,
  CalEvent,
  DashboardSummary,
  DonutSlice,
  Metric,
  ProductivityPeriod,
  ProjectProductivity,
  Reminder,
  ThroughputPoint,
  WorkloadRow,
} from "@/lib/types";
import { listMembers, listProjects } from "./repository";
import { getSql } from "./sql";

/**
 * ---------------------------------------------------------------------------
 *  Insights — the numbers the dashboard and the analytics screen show
 * ---------------------------------------------------------------------------
 *
 *  Nothing here is authored: every figure is derived from rows the two of you
 *  actually created. That has a consequence worth stating out loud — an empty
 *  workspace really does read as zero, and the screens are built to say so
 *  instead of showing a plausible-looking placeholder.
 *
 *  Day/week bucketing happens in TypeScript rather than SQL on purpose: the
 *  session timezone of a hosted Postgres is usually UTC, and "today" has to
 *  mean today in São Paulo.
 */

/* -------------------------------------------------------------------------- */
/*  shared helpers                                                             */
/* -------------------------------------------------------------------------- */

const DONUT_PALETTE = [
  "var(--accent)",
  "var(--accent-strong)",
  "#1E4EA2",
  "#E0A63C",
  "#9AA6A1",
];

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Sums the seconds of entries that started inside [from, to]. */
function sumSeconds(entries: { startedAt: string; seconds: number }[], from: Date, to: Date): number {
  return entries.reduce((total, entry) => {
    const at = new Date(entry.startedAt);
    return at >= from && at <= to ? total + entry.seconds : total;
  }, 0);
}

/** Percentage change between two windows; 0 when there is no base to divide by. */
function ratio(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 1;
  return Number(((current - previous) / previous).toFixed(4));
}

interface TimeRow {
  seconds: number;
  started_at: Date | string;
  project_id: string | null;
  user_id: string | null;
}

async function timeRowsSince(from: Date): Promise<TimeRow[]> {
  const sql = await getSql();
  return sql.query<TimeRow>(
    "select seconds, started_at, project_id, user_id from time_entries where started_at >= $1",
    [from],
  );
}

interface CompletionRow {
  completed_at: Date | string;
  project_id: string | null;
}

async function completionRowsSince(from: Date): Promise<CompletionRow[]> {
  const sql = await getSql();
  return sql.query<CompletionRow>(
    "select completed_at, project_id from tasks where completed_at is not null and completed_at >= $1",
    [from],
  );
}

/** Counts completions inside [from, to]. */
function countCompletions(rows: CompletionRow[], from: Date, to: Date): number {
  return rows.reduce((total, row) => {
    const at = new Date(row.completed_at);
    return at >= from && at <= to ? total + 1 : total;
  }, 0);
}

/* -------------------------------------------------------------------------- */
/*  dashboard                                                                  */
/* -------------------------------------------------------------------------- */

/** How many months of history the productivity chart can page through. */
const PRODUCTIVITY_MONTHS = 6;

async function buildProductivity(completions: CompletionRow[]): Promise<ProductivityPeriod[]> {
  const today = startOfDay(new Date());

  return Array.from({ length: PRODUCTIVITY_MONTHS }, (_, offset) => {
    const monthStart = startOfMonth(subMonths(today, offset));
    const monthEnd = endOfMonth(monthStart);
    const isCurrentMonth = isSameMonth(monthStart, today);

    // Bars are the calendar weeks (Mon–Sun) that overlap the month, each one
    // compared against the same week of the previous month.
    const bars: ProjectProductivity[] = [];
    let cursor = startOfWeek(monthStart, { weekStartsOn: 1 });
    let index = 1;

    while (cursor <= monthEnd) {
      const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
      const previousStart = subMonths(cursor, 1);
      const previousEnd = subMonths(weekEnd, 1);

      bars.push({
        id: `${format(monthStart, "yyyy-MM")}-s${index}`,
        label: `S${index}`,
        current: countCompletions(completions, cursor, weekEnd),
        previous: countCompletions(completions, previousStart, previousEnd),
        isCurrent: isCurrentMonth && isSameWeek(cursor, today, { weekStartsOn: 1 }),
      });

      cursor = addWeeks(cursor, 1);
      index += 1;
    }

    return {
      id: format(monthStart, "yyyy-MM"),
      label: capitalise(format(monthStart, "MMMM yyyy", { locale: ptBR })),
      bars,
    };
  });
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export async function getDashboard(): Promise<DashboardSummary> {
  const sql = await getSql();
  const now = new Date();
  const today = startOfDay(now);

  const [projects, members, eventRows, countRows, timeRows, completions] = await Promise.all([
    listProjects(),
    listMembers(),
    sql.query<{
      id: string;
      title: string;
      start_at: Date | string;
      end_at: Date | string;
      color: CalEvent["color"];
      attendees: string[] | null;
    }>("select id, title, start_at, end_at, color, attendees from events order by start_at asc"),
    sql.query<{ status: string; count: string }>(
      "select status, count(*)::text as count from projects group by status",
    ),
    timeRowsSince(subDays(today, 6)),
    sql.query<{ count: string }>(
      "select count(*)::text as count from tasks where completed_at >= $1",
      [startOfYear(now)],
    ),
  ]);

  const events: CalEvent[] = eventRows.map((row) => ({
    id: row.id,
    title: row.title,
    start: new Date(row.start_at).toISOString(),
    end: new Date(row.end_at).toISOString(),
    owner: "",
    priority: "normal",
    color: row.color,
    tags: [],
    attendees: row.attendees ?? [],
  }));

  const statusCount = (status: string) =>
    Number(countRows.find((row) => row.status === status)?.count ?? "0");

  const isToday = (value: Date | string) => {
    const at = new Date(value);
    return at >= today && at <= now;
  };

  const reminders: Reminder[] = events
    .filter((event) => new Date(event.end).getTime() >= now.getTime() - 30 * 60_000)
    .slice(0, 3)
    .map((event) => ({
      id: `rem-${event.id}`,
      title: event.title,
      project:
        projects.find((project) => event.title.includes(project.name))?.name ?? "Workspace",
      start: event.start,
      end: event.end,
      color: event.color,
      attendees: event.attendees,
    }));

  const normalisedTime = timeRows.map((row) => ({
    startedAt: new Date(row.started_at).toISOString(),
    seconds: row.seconds,
  }));

  const active = statusCount("active");
  const waiting = statusCount("waiting");

  return {
    stats: {
      total: projects.length,
      active,
      waiting,
      pending: statusCount("pending"),
      completed: Number(completions[0]?.count ?? "0"),
      inProgress: active + waiting,
      completionRate:
        projects.length === 0
          ? 0
          : Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length),
    },
    productivity: await buildProductivity(
      await completionRowsSince(subMonths(today, PRODUCTIVITY_MONTHS + 1)),
    ),
    reminders,
    projects,
    members,
    todayEvents: events.filter((event) => isToday(event.start)),
    weekHours: Math.round(sumSeconds(normalisedTime, subDays(today, 6), now) / 3600),
    todaySeconds: sumSeconds(normalisedTime, today, now),
  };
}

/* -------------------------------------------------------------------------- */
/*  analytics                                                                  */
/* -------------------------------------------------------------------------- */

interface Window {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  /** Length of the window in days, used to keep the previous one comparable. */
  days: number;
}

function windowFor(period: AnalyticsPeriod): Window {
  const now = new Date();
  const today = startOfDay(now);

  if (period === "today") {
    return { from: today, to: now, previousFrom: subDays(today, 1), previousTo: today, days: 1 };
  }
  if (period === "week") {
    return {
      from: subDays(today, 6),
      to: now,
      previousFrom: subDays(today, 13),
      previousTo: subDays(today, 6),
      days: 7,
    };
  }
  return {
    from: subDays(today, 29),
    to: now,
    previousFrom: subDays(today, 59),
    previousTo: subDays(today, 29),
    days: 30,
  };
}

/** Daily totals for the trailing `days`, oldest first. */
function dailySeries(
  rows: { at: Date; value: number }[],
  days: number,
  end: Date,
): { date: Date; value: number }[] {
  const lastDay = startOfDay(end);
  return Array.from({ length: days }, (_, index) => {
    const date = subDays(lastDay, days - 1 - index);
    const value = rows.reduce((total, row) => {
      const at = startOfDay(row.at);
      return at.getTime() === date.getTime() ? total + row.value : total;
    }, 0);
    return { date, value };
  });
}

export async function getAnalytics(period: AnalyticsPeriod): Promise<AnalyticsPayload> {
  const window = windowFor(period);
  const now = new Date();
  const today = startOfDay(now);

  // Everything the screen needs comes from one pass over the raw rows.
  const historyFrom = subDays(today, 90);
  const [timeRows, completions, projects, members, taskCounts] = await Promise.all([
    timeRowsSince(historyFrom),
    completionRowsSince(historyFrom),
    listProjects(),
    listMembers(),
    getSql().then((sql) =>
      sql.query<{ total: string; done: string }>(
        `select count(*)::text as total,
                count(*) filter (where status = 'done')::text as done
           from tasks`,
      ),
    ),
  ]);

  const entries = timeRows.map((row) => ({
    at: new Date(row.started_at),
    seconds: row.seconds,
    projectId: row.project_id ?? "",
    userId: row.user_id ?? null,
  }));

  const completed = completions.map((row) => ({
    at: new Date(row.completed_at),
    projectId: row.project_id ?? "",
  }));

  /* ------------------------------- metrics ------------------------------- */

  const hoursIn = (from: Date, to: Date) =>
    entries.reduce((total, entry) => (entry.at >= from && entry.at <= to ? total + entry.seconds : total), 0) /
    3600;

  const hoursNow = hoursIn(window.from, window.to);
  const hoursBefore = hoursIn(window.previousFrom, window.previousTo);

  const deliveredNow = completed.filter((item) => item.at >= window.from && item.at <= window.to).length;
  const deliveredBefore = completed.filter(
    (item) => item.at >= window.previousFrom && item.at <= window.previousTo,
  ).length;

  const activeProjects = projects.filter((project) => project.status === "active").length;
  const totalTasks = Number(taskCounts[0]?.total ?? "0");
  const doneTasks = Number(taskCounts[0]?.done ?? "0");
  const completionRate = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const hourSeries = dailySeries(
    entries.map((entry) => ({ at: entry.at, value: entry.seconds / 3600 })),
    14,
    now,
  ).map((point) => Math.round(point.value * 10) / 10);

  const deliverySeries = dailySeries(
    completed.map((item) => ({ at: item.at, value: 1 })),
    14,
    now,
  ).map((point) => point.value);

  const metrics: Metric[] = [
    {
      key: "hours",
      label: "Horas registradas",
      value: Math.round(hoursNow * 10) / 10,
      delta: ratio(hoursNow, hoursBefore),
      spark: hourSeries,
      format: "hours",
    },
    {
      key: "deliveries",
      label: "Entregas no período",
      value: deliveredNow,
      delta: ratio(deliveredNow, deliveredBefore),
      spark: deliverySeries,
      format: "number",
    },
    {
      key: "projects",
      label: "Projetos ativos",
      value: activeProjects,
      delta: 0,
      spark: dailySeries([], 14, now).map(() => activeProjects),
      format: "number",
    },
    {
      key: "completion",
      label: "Taxa de conclusão",
      value: completionRate,
      delta: 0,
      spark: dailySeries([], 14, now).map(() => completionRate),
      format: "percent",
    },
  ];

  /* ------------------------------ throughput ----------------------------- */

  // The chart always shows at least a week so a single day is still readable.
  const chartDays = period === "month" ? 30 : 7;

  const throughput: ThroughputPoint[] = Array.from({ length: chartDays }, (_, index) => {
    const date = subDays(today, chartDays - 1 - index);
    const mirror = subDays(date, chartDays);

    const current = completed.filter((item) => startOfDay(item.at).getTime() === date.getTime()).length;
    const previous = completed.filter((item) => startOfDay(item.at).getTime() === mirror.getTime()).length;

    const trailing = completed.filter((item) => {
      const at = startOfDay(item.at);
      return at <= date && differenceInCalendarDays(date, at) < 7;
    }).length;

    return {
      label: format(date, "d"),
      date: date.toISOString(),
      current,
      previous,
      average: Number((trailing / 7).toFixed(1)),
    };
  });

  /* -------------------------------- donut -------------------------------- */

  const hoursByProject = new Map<string, number>();
  for (const entry of entries) {
    if (entry.at < window.from || entry.at > window.to) continue;
    if (!entry.projectId) continue;
    hoursByProject.set(entry.projectId, (hoursByProject.get(entry.projectId) ?? 0) + entry.seconds);
  }

  const donut: DonutSlice[] = [...hoursByProject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([projectId, seconds], index) => ({
      key: projectId,
      label: projects.find((project) => project.id === projectId)?.name ?? "Sem projeto",
      hours: Math.round(seconds / 360) / 10,
      color: DONUT_PALETTE[index % DONUT_PALETTE.length],
    }));

  /* ------------------------------- workload ------------------------------ */

  // Four trailing weeks, one row per account, in hours.
  const weekStarts = Array.from({ length: 4 }, (_, index) =>
    startOfWeek(subWeeks(today, 3 - index), { weekStartsOn: 1 }),
  );

  const workloadRows: WorkloadRow[] = members.map((member) => {
    const values = weekStarts.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const seconds = entries.reduce((total, entry) => {
        if (entry.userId !== member.id) return total;
        return entry.at >= weekStart && entry.at <= weekEnd ? total + entry.seconds : total;
      }, 0);
      return Math.round(seconds / 360) / 10;
    });

    return {
      id: member.id,
      name: member.name,
      color: member.color,
      values,
      total: Math.round(values.reduce((total, value) => total + value, 0) * 10) / 10,
    };
  });

  return {
    metrics,
    throughput,
    donut,
    workload: {
      labels: weekStarts.map((date) => format(date, "dd/MM")),
      rows: workloadRows,
    },
  };
}

function subWeeks(date: Date, amount: number): Date {
  return addWeeks(date, -amount);
}
