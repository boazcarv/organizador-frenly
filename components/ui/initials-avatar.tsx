import { cn } from "@/lib/utils";
import { initials, pastelClasses } from "@/lib/format";
import type { PastelKey } from "@/lib/types";

const sizes = {
  xs: "size-6 text-[10px]",
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
  xl: "size-14 text-base",
  "2xl": "size-20 text-xl",
} as const;

const dotSizes = {
  xs: "size-1.5",
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3",
  xl: "size-3.5",
  "2xl": "size-5",
} as const;

export interface InitialsAvatarProps {
  name: string;
  color?: PastelKey;
  size?: keyof typeof sizes;
  ring?: boolean;
  status?: "online" | "away" | "offline" | null;
  className?: string;
}

/**
 * Avatar built entirely from CSS (initials on a desaturated pastel) —
 * zero external requests, zero layout shift.
 */
export function InitialsAvatar({
  name,
  color = "sage",
  size = "md",
  ring = false,
  status = null,
  className,
}: InitialsAvatarProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        aria-hidden
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold tracking-tight select-none",
          sizes[size],
          pastelClasses[color],
          ring && "ring-2 ring-surface",
        )}
      >
        {initials(name)}
      </span>
      {status ? (
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 rounded-full ring-2 ring-surface",
            dotSizes[size],
            status === "online" && "bg-[var(--accent-soft)]",
            status === "away" && "bg-[var(--warn)]",
            status === "offline" && "bg-[var(--ink-faint)]",
          )}
        >
          <span className="sr-only">
            {status === "online" ? "Online" : status === "away" ? "Ausente" : "Offline"}
          </span>
        </span>
      ) : null}
    </span>
  );
}
