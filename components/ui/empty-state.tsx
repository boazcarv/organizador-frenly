import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-line px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-ink-faint">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-ink">{title}</p>
        <p className="mx-auto max-w-[34ch] text-xs leading-relaxed text-ink-soft">{description}</p>
      </div>
      {action}
    </div>
  );
}
