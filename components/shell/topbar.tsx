"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { UserChip } from "@/components/shell/user-chip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_TODAY } from "@/lib/constants";
import { formatRelative, formatTime } from "@/lib/format";
import { useAgenda, useTasks } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

interface Notice {
  id: string;
  title: string;
  meta: string;
  unread: boolean;
  href: string;
}

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

/**
 * What actually deserves attention: what is happening today, and what is due
 * soon. Derived from the same rows the dashboard reads — no invented feed, so
 * an empty workspace correctly shows an empty bell.
 */
function useNotices(): Notice[] {
  const { data: tasks = [] } = useTasks();
  const { data: todayEvents = [] } = useAgenda();

  return useMemo(() => {
    // `APP_TODAY` is resolved once per session, which keeps this computation
    // pure for the React Compiler. A task counts as overdue from the start of
    // the day after its deadline — which is what "atrasada" means anyway.
    const today = APP_TODAY.getTime();

    const events: Notice[] = todayEvents.slice(0, 3).map((event) => ({
      id: `evt-${event.id}`,
      title: event.title,
      meta: `${formatTime(event.start)} – ${formatTime(event.end)}`,
      unread: true,
      href: "/calendar",
    }));

    const due: Notice[] = tasks
      .filter((task) => task.status !== "done")
      .filter((task) => new Date(task.dueAt).getTime() <= today + THREE_DAYS)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 3)
      .map((task) => ({
        id: `tsk-${task.id}`,
        title: task.title,
        meta: `vence ${formatRelative(task.dueAt)}${task.assignee ? ` · ${task.assignee}` : ""}`,
        // Overdue counts as unread: it is the one thing worth a red dot.
        unread: new Date(task.dueAt).getTime() < today,
        href: "/tasks",
      }));

    return [...events, ...due];
  }, [tasks, todayEvents]);
}

export function Topbar() {
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const router = useRouter();
  const notices = useNotices();
  const unread = notices.filter((notice) => notice.unread).length;

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface-muted px-3 sm:gap-3 sm:px-4 lg:px-6">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors duration-200 hover:text-ink lg:hidden"
      >
        <Menu className="size-[18px]" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className={cn(
          "group/search flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 text-left sm:mx-auto sm:max-w-[420px]",
          "transition-colors duration-200 hover:bg-surface-muted",
        )}
        aria-label="Buscar (Command K)"
      >
        <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
        <span className="hidden min-w-0 flex-1 truncate text-[13px] text-ink-faint sm:block">
          Buscar projetos, tarefas, pessoas…
        </span>
        <kbd className="hidden shrink-0 items-center gap-1 rounded-full border border-line bg-surface-muted px-2 py-0.5 font-sans text-[10.5px] font-medium text-ink-faint sm:flex">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Notificações (${unread} não lidas)`}
              className="relative inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
            >
              <Bell className="size-[18px]" aria-hidden />
              {unread > 0 ? (
                <span className="absolute top-2 right-2.5 size-2 rounded-full bg-[var(--accent)] ring-2 ring-surface" />
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px] rounded-[16px] border-line bg-surface p-1.5">
            <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5 text-[12px]">
              Notificações
              <span className="text-[11px] font-normal text-ink-faint">{unread} não lidas</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-line" />
            {notices.length === 0 ? (
              <p className="px-2 py-6 text-center text-[12px] leading-relaxed text-ink-faint">
                Nada por aqui.
                <br />
                Prazos e compromissos do dia aparecem nesta lista.
              </p>
            ) : null}

            {notices.map((notice) => (
              <DropdownMenuItem
                key={notice.id}
                onSelect={() => router.push(notice.href)}
                className="flex-col items-start gap-0.5 rounded-[10px] px-2 py-2"
              >
                <span className="flex w-full items-start gap-2">
                  {notice.unread ? (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                  ) : (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-transparent" aria-hidden />
                  )}
                  <span className="text-[12.5px] leading-snug text-ink">{notice.title}</span>
                </span>
                <span className="pl-3.5 text-[11px] text-ink-faint">{notice.meta}</span>
              </DropdownMenuItem>
            ))}

            {notices.length > 0 ? (
              <>
                <DropdownMenuSeparator className="bg-line" />
                <DropdownMenuItem
                  onSelect={() => router.push("/settings")}
                  className="justify-center rounded-[10px] px-2 py-2 text-[12px] text-ink-soft"
                >
                  Ajustar notificações
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <UserChip />
      </div>
    </header>
  );
}
