"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api, type ApiError } from "./api";
import type {
  Account,
  AnalyticsPeriod,
  NotificationSetting,
  Project,
  Task,
  TaskStatus,
} from "./types";
import { useHydrated } from "./use-hydrated";

export const queryKeys = {
  projects: ["projects"] as const,
  tasks: ["tasks"] as const,
  members: ["members"] as const,
  member: (id: string) => ["members", id] as const,
  events: ["events"] as const,
  agenda: ["events", "agenda"] as const,
  upcoming: ["events", "upcoming"] as const,
  dashboard: ["dashboard"] as const,
  analytics: ["analytics"] as const,
  notifications: ["notifications"] as const,
  profile: ["profile"] as const,
  accounts: ["accounts"] as const,
  analyticsFor: (period: AnalyticsPeriod) => ["analytics", period] as const,
};

/**
 * Every screen that reads from the API renders a skeleton while its cache is
 * empty. A server render always starts empty, but the browser may already hold
 * data (cache hit from an earlier visit, or a request that finished before
 * hydration) — that difference is exactly what throws "hydration failed".
 * Reporting `pending` until the client has hydrated keeps the first client
 * render byte-identical to the HTML, and the data lands a frame later.
 */
function useApiQuery<TData>(
  options: UseQueryOptions<TData, ApiError, TData, readonly unknown[]>,
): UseQueryResult<TData, ApiError> {
  const hydrated = useHydrated();
  const result = useQuery(options);

  if (hydrated) return result;

  return {
    ...result,
    data: undefined,
    error: null,
    status: "pending",
    isPending: true,
    isError: false,
    isSuccess: false,
  } as unknown as UseQueryResult<TData, ApiError>;
}

export function useProjects() {
  return useApiQuery({ queryKey: queryKeys.projects, queryFn: api.listProjects });
}

export function useTasks() {
  return useApiQuery({ queryKey: queryKeys.tasks, queryFn: api.listTasks });
}

export function useMembers() {
  return useApiQuery({ queryKey: queryKeys.members, queryFn: api.listMembers });
}

export function useMember(id: string | null) {
  return useApiQuery({
    queryKey: queryKeys.member(id ?? "none"),
    queryFn: () => api.getMember(id as string),
    enabled: Boolean(id),
  });
}

export function useEvents() {
  return useApiQuery({ queryKey: queryKeys.events, queryFn: api.listEvents });
}

export function useAgenda() {
  return useApiQuery({ queryKey: queryKeys.agenda, queryFn: api.listAgenda });
}

export function useUpcoming() {
  return useApiQuery({ queryKey: queryKeys.upcoming, queryFn: api.listUpcoming });
}

export function useDashboard() {
  return useApiQuery({ queryKey: queryKeys.dashboard, queryFn: api.getDashboard });
}

export function useAnalytics(period: AnalyticsPeriod) {
  return useApiQuery({
    queryKey: queryKeys.analyticsFor(period),
    queryFn: () => api.getAnalytics(period),
  });
}

export function useAccounts() {
  return useApiQuery({ queryKey: queryKeys.accounts, queryFn: api.listAccounts });
}

export function useNotifications() {
  return useApiQuery({ queryKey: queryKeys.notifications, queryFn: api.listNotifications });
}

export function useProfile() {
  return useApiQuery({ queryKey: queryKeys.profile, queryFn: api.getProfile });
}

/* ------------------------------- mutations -------------------------------- */

/** Creates a project and refreshes every aggregate that depends on it. */
export function useCreateProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createProject,
    onSuccess: (project) => {
      client.setQueryData<Project[]>(queryKeys.projects, (current) =>
        current ? [project, ...current] : [project],
      );
      void client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Deletes a project and everything attached to it. */
export function useDeleteProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProject,
    onSuccess: ({ id }) => {
      client.setQueryData<Project[]>(queryKeys.projects, (current) =>
        current?.filter((project) => project.id !== id),
      );
      void client.invalidateQueries({ queryKey: queryKeys.tasks });
      void client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Logs a finished tracker session. */
export function useLogTimeEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createTimeEntry,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.dashboard });
      void client.invalidateQueries({ queryKey: queryKeys.analytics });
      void client.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useMoveTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, progress }: { id: string; status: TaskStatus; progress?: number }) =>
      api.moveTask(id, status, progress),
    onSuccess: (task) => {
      if (task) client.setQueryData<Task[]>(queryKeys.tasks, (current) =>
        current?.map((item) => (item.id === task.id ? task : item)),
      );
    },
  });
}

/** Adds an event to the calendar and refreshes everything that lists events. */
export function useCreateEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createEvent,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.events });
      void client.invalidateQueries({ queryKey: queryKeys.agenda });
      void client.invalidateQueries({ queryKey: queryKeys.upcoming });
      void client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useCreateTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createTask,
    onSuccess: (task) =>
      client.setQueryData<Task[]>(queryKeys.tasks, (current) => (current ? [task, ...current] : [task])),
  });
}

export function useToggleNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.saveNotification(id, enabled),
    onSuccess: (list) => client.setQueryData<NotificationSetting[]>(queryKeys.notifications, list),
  });
}

export function useSaveProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.saveProfile,
    onSuccess: (profile) => client.setQueryData(queryKeys.profile, profile),
  });
}

/* -------------------------------- accounts -------------------------------- */

/** Creates a login for someone else. Owner only, enforced on the server too. */
export function useCreateAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createAccount,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.accounts });
      void client.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useUpdateAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updateAccount>[1] }) =>
      api.updateAccount(id, patch),
    onSuccess: (account: Account) => {
      void client.invalidateQueries({ queryKey: queryKeys.accounts });
      void client.invalidateQueries({ queryKey: queryKeys.members });
      void client.invalidateQueries({ queryKey: queryKeys.profile });
      // Editing yourself changes the name shown in the shell.
      if (account) client.setQueryData(queryKeys.profile, account);
    },
  });
}

export function useDeleteAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.accounts });
      void client.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

/* ---------------------------------- auth ---------------------------------- */

export function useSetupState() {
  return useQuery({
    queryKey: ["setup-state"],
    queryFn: api.setupState,
    staleTime: 0,
    retry: false,
  });
}

/**
 * Signs out and clears the cache.
 *
 * `clear()` matters: without it the next person to log in on this browser would
 * see the previous session's data for a frame before the refetch.
 */
export function useLogout() {
  const client = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      client.clear();
      router.replace("/login");
    },
  });
}
