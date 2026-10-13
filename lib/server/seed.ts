import "server-only";

import {
  analyticsMetrics,
  currentUser,
  donutSlices,
  events,
  members,
  notificationSettings,
  productivityPeriods,
  projects,
  tasks,
  throughput,
  timeEntries,
  workload,
} from "@/lib/mock-data";
import type {
  CalEvent,
  CurrentUser,
  DonutSlice,
  Member,
  Metric,
  NotificationSetting,
  ProductivityPeriod,
  Project,
  Task,
  ThroughputPoint,
  TimeEntry,
  WorkloadPeriod,
} from "@/lib/types";

/**
 * Shape of everything the product persists. Swapping this file store for
 * Supabase/Prisma means replacing `lib/server/db.ts` only — the shape stays.
 */
export interface Database {
  projects: Project[];
  tasks: Task[];
  members: Member[];
  events: CalEvent[];
  timeEntries: TimeEntry[];
  notifications: NotificationSetting[];
  analytics: {
    metrics: Metric[];
    throughput: ThroughputPoint[];
    donut: DonutSlice[];
    workload: WorkloadPeriod;
  };
  productivity: ProductivityPeriod[];
  profile: CurrentUser;
  seededAt: string;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** First-run content: the authored pt-BR dataset, anchored to today's date. */
export function buildSeed(): Database {
  return {
    projects: clone(projects),
    tasks: clone(tasks),
    members: clone(members),
    events: clone(events),
    timeEntries: clone(timeEntries),
    notifications: clone(notificationSettings),
    analytics: {
      metrics: clone(analyticsMetrics),
      throughput: clone(throughput),
      donut: clone(donutSlices),
      workload: clone(workload),
    },
    productivity: clone(productivityPeriods),
    profile: clone(currentUser),
    seededAt: new Date().toISOString(),
  };
}
