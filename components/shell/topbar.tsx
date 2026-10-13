"use client";

import { Bell, Menu, Search } from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

const notifications = [
  { id: "n1", title: "Marina comentou em Empty states do checkout", meta: "há 12 min", unread: true },
  { id: "n2", title: "Go-live do Onboarding Guiado em 3 dias", meta: "há 1 h", unread: true },
  { id: "n3", title: "Relatório semanal do time está pronto", meta: "ontem", unread: false },
];

export function Topbar() {
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const unread = notifications.filter((notification) => notification.unread).length;

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
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onSelect={() => toast(notification.title, { description: notification.meta })}
                className="flex-col items-start gap-0.5 rounded-[10px] px-2 py-2"
              >
                <span className="flex w-full items-start gap-2">
                  {notification.unread ? (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                  ) : (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-transparent" aria-hidden />
                  )}
                  <span className="text-[12.5px] leading-snug text-ink">{notification.title}</span>
                </span>
                <span className="pl-3.5 text-[11px] text-ink-faint">{notification.meta}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <UserChip />
      </div>
    </header>
  );
}
