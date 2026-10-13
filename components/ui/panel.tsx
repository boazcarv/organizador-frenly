import { cn } from "@/lib/utils";

/**
 * The card surface used across the whole product: 20px radius, 1px line,
 * near-invisible shadow at rest that lifts 2px on hover (CSS only).
 */
export function Panel({
  children,
  className,
  hoverable = true,
  padded = true,
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padded?: boolean;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <Tag
      className={cn(
        "relative rounded-[20px] border border-line bg-surface shadow-[var(--shadow-card)]",
        padded && "p-5",
        hoverable && "card-hover",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({
  title,
  hint,
  action,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {hint ? <p className="mt-0.5 truncate text-[12px] text-ink-faint">{hint}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-1.5">{action}</div> : null}
    </header>
  );
}
