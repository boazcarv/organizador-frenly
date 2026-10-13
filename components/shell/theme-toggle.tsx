"use client";

import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useThemeReveal } from "@/components/shell/use-theme-reveal";
import { useHydrated } from "@/lib/use-hydrated";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Icon button — sun and moon morph in place. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const reveal = useThemeReveal();
  const hydrated = useHydrated();

  const isDark = hydrated && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={(event) => reveal({ x: event.clientX + 20, y: event.clientY + 16 })}
      className={cn(
        "relative inline-flex size-9 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink",
        className,
      )}
    >
      <motion.span
        key={isDark ? "moon" : "sun"}
        initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center"
      >
        {isDark ? <Moon className="size-[18px]" aria-hidden /> : <Sun className="size-[18px]" aria-hidden />}
      </motion.span>
    </button>
  );
}

/**
 * The dark "Modo escuro" pill that lives in the sidebar footer — the same
 * affordance as the reference, anchored where it can never cover content.
 */
export function ThemePill({ collapsed = false }: { collapsed?: boolean }) {
  const { resolvedTheme } = useTheme();
  const reveal = useThemeReveal();
  const hydrated = useHydrated();

  const isDark = hydrated && resolvedTheme === "dark";
  const label = isDark ? "Modo claro" : "Modo escuro";

  const button = (
    <button
      type="button"
      onClick={(event) => reveal({ x: event.clientX, y: event.clientY - 260 })}
      aria-label={`Ativar ${label.toLowerCase()}`}
      className={cn(
        "group flex w-full items-center gap-2 rounded-full bg-deep/95 py-1.5 text-[12px] font-medium text-white/85 shadow-[var(--shadow-pop)] ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-px hover:text-white hover:ring-white/20",
        collapsed ? "justify-center px-0" : "pr-3.5 pl-2",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
        {isDark ? <Sun className="size-3.5" aria-hidden /> : <Moon className="size-3.5" aria-hidden />}
      </span>
      {!collapsed ? <span className="truncate">{label}</span> : null}
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
