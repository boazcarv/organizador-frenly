import { cn } from "@/lib/utils";

/**
 * Page title block: 28px semibold title, one-line subtitle, actions on the right.
 */
export function PageHeader({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-3 pb-1", className)}>
      <div className="min-w-0">
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.03em] text-ink">{title}</h1>
        <p className="mt-1 text-[13px] text-ink-soft">{subtitle}</p>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </header>
  );
}
