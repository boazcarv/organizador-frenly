"use client";

import { formatRelative } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

/**
 * Renders a human relative date ("em 2 horas"). Mounted-only on purpose:
 * relative time depends on the *current* clock, which must not take part in
 * the server render.
 */
export function RelativeTime({
  value,
  className,
  fallback = "—",
}: {
  value: string;
  className?: string;
  fallback?: string;
}) {
  const hydrated = useHydrated();

  return (
    <span className={cn("tabular-nums", className)}>{hydrated ? formatRelative(value) : fallback}</span>
  );
}
