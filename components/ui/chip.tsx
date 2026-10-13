import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { MemberStatus, TaskPriority } from "@/lib/types";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      tone: {
        neutral: "border-line bg-surface-muted text-ink-soft",
        accent: "border-transparent bg-accent-tint text-accent",
        danger: "border-transparent bg-danger-soft text-danger",
        warn: "border-transparent bg-warn-soft text-warn",
        info: "border-transparent bg-[color-mix(in_oklab,var(--info)_14%,transparent)] text-info",
        outline: "border-line bg-surface text-ink-soft",
      },
      size: {
        sm: "h-5 px-2 text-[11px]",
        md: "h-6 px-2.5 text-xs",
        lg: "h-7 px-3 text-[13px]",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface ChipProps extends VariantProps<typeof chipVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Chip({ children, className, tone, size }: ChipProps) {
  return <span className={cn(chipVariants({ tone, size }), className)}>{children}</span>;
}

/* --------------------------- domain-tuned chips --------------------------- */

export const memberStatusMeta: Record<MemberStatus, { label: string; tone: ChipProps["tone"] }> = {
  active: { label: "Ativo", tone: "accent" },
  busy: { label: "Ocupado", tone: "warn" },
  waiting: { label: "Em espera", tone: "info" },
  pending: { label: "Pendente", tone: "neutral" },
};

export const priorityMeta: Record<TaskPriority, { label: string; tone: ChipProps["tone"] }> = {
  high: { label: "Alta", tone: "danger" },
  medium: { label: "Média", tone: "warn" },
  low: { label: "Baixa", tone: "neutral" },
};

export function StatusChip({ status, className }: { status: MemberStatus; className?: string }) {
  const meta = memberStatusMeta[status];
  return (
    <Chip tone={meta.tone} size="sm" className={className}>
      {meta.label}
    </Chip>
  );
}

export function PriorityChip({ priority, className }: { priority: TaskPriority; className?: string }) {
  const meta = priorityMeta[priority];
  return (
    <Chip tone={meta.tone} size="sm" className={cn("gap-1", className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </Chip>
  );
}
