"use client";

import {
  Calendar,
  ChartLine,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  LayoutGrid,
  ListChecks,
  LogOut,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { NavItem } from "@/components/shell/nav-item";
import { PromoCard } from "@/components/shell/promo-card";
import { ThemePill } from "@/components/shell/theme-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTasks } from "@/lib/queries";
import { useUiStore } from "@/store/ui";

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Frenly — ir para o dashboard"
      className={cn(
        "group/logo flex items-center gap-2.5 rounded-[16px] border border-line bg-surface shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]",
        collapsed ? "size-10 justify-center" : "px-2.5 py-2",
      )}
    >
      <span className="flex size-6 items-center justify-center rounded-[9px] bg-accent-tint text-accent">
        <svg viewBox="0 0 24 24" fill="none" className="size-[15px]" aria-hidden>
          <path
            d="M5 18.5V10a5 5 0 0 1 5-5h9"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M5 18.5h8.5A5.5 5.5 0 0 0 19 13"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity=".5"
          />
        </svg>
      </span>
      {!collapsed ? (
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Frenly</span>
      ) : null}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="label-section px-3 pt-1 pb-1.5">{children}</p>;
}

const mainNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/team", label: "Team", icon: Users },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: ChartLine },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
];

const generalNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * Sidebar body. Rendered twice on purpose: once inside the fixed desktop rail
 * and once inside the mobile drawer, so both share the exact same source.
 */
export function SidebarContent({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  // Live badge: how many cards are waiting in Review.
  const { data: tasks } = useTasks();
  const reviewCount = tasks?.filter((task) => task.status === "review").length ?? 0;
  const upgradeNotice = () =>
    toast("Upgrade disponível", {
      description: "O plano Studio libera relatórios avançados e horas ilimitadas.",
      action: { label: "Ver planos", onClick: () => undefined },
    });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("flex items-center", collapsed ? "justify-center px-3 pt-3" : "px-3 pt-3")}>
        <Logo collapsed={collapsed} />
      </div>

      <nav aria-label="Navegação principal" className="mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
        {!collapsed ? <SectionLabel>Main</SectionLabel> : <span className="h-2" />}
        <div className="flex flex-col gap-0.5">
          {mainNav.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              badge={item.href === "/tasks" ? reviewCount : undefined}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className="mt-5">
          {!collapsed ? <SectionLabel>General</SectionLabel> : <span className="h-2" />}
          <div className="flex flex-col gap-0.5">
            {generalNav.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
            <CollapsedAwareAction
              collapsed={collapsed}
              label="Help"
              icon={HelpCircle}
              onSelect={() => {
                onNavigate?.();
                toast("Central de ajuda", {
                  description: "Guias, atalhos de teclado e contato do suporte.",
                });
              }}
            />
            <CollapsedAwareAction
              collapsed={collapsed}
              label="Logout"
              icon={LogOut}
              onSelect={() => {
                onNavigate?.();
                toast("Até já", { description: "Sessão encerrada no ambiente de demonstração." });
              }}
            />
          </div>
        </div>
      </nav>

      <div className="flex flex-col gap-2 px-3 pt-3 pb-3">
        <ThemePill collapsed={collapsed} />
        <PromoCard collapsed={collapsed} onUpgrade={upgradeNotice} />
        <div className="hidden lg:block">
          <CollapseToggleRow collapsed={collapsed} />
        </div>
      </div>
    </div>
  );
}

function CollapsedAwareAction({
  collapsed,
  label,
  icon: Icon,
  onSelect,
}: {
  collapsed?: boolean;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
}) {
  const button = (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group/nav relative flex h-9 items-center gap-2.5 rounded-full text-[13.5px] font-medium text-ink-soft transition-colors duration-200 hover:text-ink",
        collapsed ? "justify-center px-0" : "px-3",
      )}
    >
      <span className="absolute inset-0 rounded-full transition-colors duration-200 group-hover/nav:bg-[color-mix(in_oklab,var(--ink)_5%,transparent)]" />
      <Icon aria-hidden className="relative z-10 size-[18px] text-ink-faint group-hover/nav:text-ink-soft" />
      {!collapsed ? <span className="relative z-10 flex-1 text-left">{label}</span> : null}
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" className="text-[12px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function CollapseToggleRow({ collapsed }: { collapsed?: boolean }) {
  const toggle = useUiStore((state) => state.toggleSidebarCollapsed);
  const Icon = collapsed ? ChevronsRight : ChevronsLeft;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          className="mx-auto flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium text-ink-faint transition-colors duration-200 hover:bg-[color-mix(in_oklab,var(--ink)_5%,transparent)] hover:text-ink-soft"
        >
          <Icon className="size-3.5" aria-hidden />
          {!collapsed ? "Recolher" : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-[12px]">
        {collapsed ? "Expandir menu" : "Recolher menu"}
      </TooltipContent>
    </Tooltip>
  );
}

/** Desktop rail (≥1024px). Below that the same content lives in a drawer. */
export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 border-r border-line bg-surface-muted lg:flex lg:flex-col",
        collapsed ? "w-[76px]" : "w-[240px]",
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}
