"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SPRING_GESTURE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  collapsed?: boolean;
  onNavigate?: () => void;
}

/**
 * One sidebar destination. The active state is a shared-layout pill that
 * slides between items (`layoutId`), plus a colour shift on icon and label.
 */
export function NavItem({ href, label, icon: Icon, badge, collapsed, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/nav relative flex h-9 items-center gap-2.5 rounded-full text-[13.5px] font-medium transition-colors duration-200",
        collapsed ? "justify-center px-0" : "px-3",
        active ? "text-accent" : "text-ink-soft hover:text-ink",
      )}
    >
      {active ? (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-full bg-accent-tint"
          transition={SPRING_GESTURE}
        />
      ) : (
        <span className="absolute inset-0 rounded-full bg-transparent transition-colors duration-200 group-hover/nav:bg-[color-mix(in_oklab,var(--ink)_5%,transparent)]" />
      )}

      <Icon
        aria-hidden
        className={cn(
          "relative z-10 size-[18px] transition-colors duration-200",
          active ? "text-accent" : "text-ink-faint group-hover/nav:text-ink-soft",
        )}
      />

      {!collapsed ? (
        <>
          <span className="relative z-10 flex-1 truncate text-left">{label}</span>
          {typeof badge === "number" ? (
            <span
              className={cn(
                "relative z-10 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors duration-200",
                active ? "bg-accent text-white" : "bg-surface text-ink-faint ring-1 ring-line",
              )}
            >
              {badge}
            </span>
          ) : null}
        </>
      ) : typeof badge === "number" ? (
        <span className="absolute top-1 right-1.5 z-10 size-1.5 rounded-full bg-accent" aria-hidden />
      ) : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="text-[12px]">
        {label}
        {typeof badge === "number" ? ` · ${badge}` : ""}
      </TooltipContent>
    </Tooltip>
  );
}
