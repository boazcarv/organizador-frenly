"use client";

import { ChevronsUpDown, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { useProfile } from "@/lib/queries";

const fallbackName = "Frenly";
const fallbackPlan = "Carregando…";

export function UserChip({ compact = false }: { compact?: boolean }) {
  const { data: profile } = useProfile();
  const user = {
    name: profile?.name ?? fallbackName,
    plan: profile?.plan ?? fallbackPlan,
    email: profile?.email ?? "—",
    color: profile?.color ?? ("peach" as const),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Menu da conta"
          className="flex h-10 items-center gap-2.5 rounded-full border border-line bg-surface pr-2.5 pl-1.5 transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <InitialsAvatar name={user.name} color={user.color} size="sm" status="online" />
          {!compact ? (
            <span className="hidden min-w-0 text-left leading-tight sm:block">
              <span className="block max-w-[120px] truncate text-[12.5px] font-semibold text-ink">
                {user.name}
              </span>
              <span className="block truncate text-[11px] text-ink-faint">{user.plan}</span>
            </span>
          ) : null}
          <ChevronsUpDown className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[232px] rounded-[16px] border-line bg-surface p-1.5">
        <DropdownMenuLabel className="px-2 py-1.5">
          <span className="block text-[13px] font-semibold text-ink">{user.name}</span>
          <span className="block text-[11.5px] font-normal text-ink-faint">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-line" />
        <DropdownMenuItem asChild className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px]">
          <Link href="/settings">
            <UserRound className="size-4 text-ink-faint" aria-hidden />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px]">
          <Link href="/settings">
            <Settings className="size-4 text-ink-faint" aria-hidden />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-line" />
        <DropdownMenuItem
          onSelect={() => toast("Sessão encerrada", { description: "Este é um ambiente de demonstração." })}
          className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px] text-danger data-[highlighted]:bg-danger-soft data-[highlighted]:text-danger"
        >
          <LogOut className="size-4" aria-hidden />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
