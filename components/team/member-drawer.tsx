"use client";

import { motion } from "motion/react";
import {
  CheckCircle2,
  FileText,
  GitCommitVertical,
  MessageSquare,
  Star,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { StatusChip } from "@/components/ui/chip";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { SPRING_SOFT } from "@/lib/motion";
import { useMember } from "@/lib/queries";
import type { ActivityKind } from "@/lib/types";
import { useUiStore } from "@/store/ui";

const activityIcons: Record<ActivityKind, typeof GitCommitVertical> = {
  commit: GitCommitVertical,
  review: CheckCircle2,
  comment: MessageSquare,
  file: FileText,
  call: Video,
};

/** Right-hand member drawer with a spring entrance and a blurred backdrop. */
export function MemberDrawer() {
  const memberId = useUiStore((state) => state.memberDrawerId);
  const closeMember = useUiStore((state) => state.closeMember);
  const { data: member, isPending } = useMember(memberId);

  return (
    <Sheet open={Boolean(memberId)} onOpenChange={(open) => (open ? undefined : closeMember())}>
      <SheetContent
        side="right"
        className="w-full max-w-[440px] gap-0 border-l border-line bg-surface p-0 overscroll-contain sm:max-w-[440px]"
      >
        {isPending || !member ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-3.5 w-28 rounded-full" />
            <div className="grid grid-cols-3 gap-2 pt-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-[14px]" />
              ))}
            </div>
            <Skeleton className="h-40 rounded-[16px]" />
          </div>
        ) : (
          <motion.div
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={SPRING_SOFT}
            className="flex h-full min-h-0 flex-col"
          >
            <SheetHeader className="gap-0 border-b border-line px-6 pt-6 pb-5">
              <div className="flex items-start gap-4">
                <InitialsAvatar
                  name={member.name}
                  color={member.color}
                  size="2xl"
                  status={member.online ? "online" : "offline"}
                />
                <div className="min-w-0 flex-1 pt-1">
                  <SheetTitle className="truncate text-[19px] font-semibold tracking-[-0.02em] text-ink">
                    {member.name}
                  </SheetTitle>
                  <SheetDescription className="mt-0.5 text-[12.5px] text-ink-soft">
                    {member.role} · {member.company}
                  </SheetDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusChip status={member.status} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[10.5px] font-medium text-ink-soft">
                      <Star className="size-3 text-warn" aria-hidden />
                      {member.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[11.5px] text-ink-faint">
                Última atividade {formatRelative(member.lastActive)}
              </p>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              <div className="grid grid-cols-3 gap-2">
                <Metric label="Tarefas" value={member.tasks} />
                <Metric label="Horas" value={member.hours} format="hours" />
                <Metric label="Eficiência" value={member.efficiency} format="percent" />
              </div>

              <section className="mt-6">
                <h3 className="text-[13px] font-semibold text-ink">Atividade recente</h3>
                <ol className="mt-3 space-y-0">
                  {member.activities.map((activity, index) => {
                    const Icon = activityIcons[activity.kind];
                    return (
                      <motion.li
                        key={activity.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: 0.05 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        className="relative flex gap-3 pb-4 last:pb-0"
                      >
                        {index < member.activities.length - 1 ? (
                          <span
                            aria-hidden
                            className="absolute top-7 left-[13px] h-[calc(100%-16px)] w-px bg-line"
                          />
                        ) : null}
                        <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft">
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 pt-1">
                          <span className="block text-[12.5px] leading-snug text-ink">{activity.label}</span>
                          <span className="mt-0.5 block text-[11px] text-ink-faint">
                            {formatRelative(activity.at)}
                          </span>
                        </span>
                      </motion.li>
                    );
                  })}
                </ol>
              </section>

              <section className="mt-6">
                <h3 className="text-[13px] font-semibold text-ink">Especialidades</h3>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-ink-soft"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <footer className="flex items-center gap-2 border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => toast(`Mensagem para ${member.name.split(" ")[0]}`)}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-line text-[13px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
              >
                <MessageSquare className="size-4" aria-hidden />
                Message
              </button>
              <button
                type="button"
                onClick={() =>
                  toast("Tarefa atribuída", { description: `Nova tarefa para ${member.name}.` })
                }
                className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-strong)]"
              >
                Atribuir tarefa
              </button>
            </footer>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Metric({
  label,
  value,
  format = "number",
}: {
  label: string;
  value: number;
  format?: "number" | "hours" | "percent";
}) {
  return (
    <div className="rounded-[14px] border border-line bg-surface-muted px-3 py-3 text-center">
      <p className="label-section">{label}</p>
      <p className="mt-1.5 text-[17px] font-semibold tabular-nums text-ink">
        <AnimatedNumber value={value} format={format} />
      </p>
    </div>
  );
}
