"use client";

import { motion } from "motion/react";
import { ListChecks, MessageSquare, Layers } from "lucide-react";
import { toast } from "sonner";
import { StatusChip } from "@/components/ui/chip";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Member tile. Rendered inside an animated list: `layout` lets the card glide
 * to its new position when the filters change (FLIP), while exit/enter are
 * handled by the parent's AnimatePresence.
 */
export function MemberCard({ member, onOpen }: { member: Member; onOpen: () => void }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="group/card flex h-full flex-col rounded-[20px] border border-line bg-surface p-4.5 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex items-start gap-3">
        <InitialsAvatar
          name={member.name}
          color={member.color}
          size="lg"
          status={member.online ? "online" : member.status === "busy" ? "away" : "offline"}
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-semibold text-ink">{member.name}</h3>
          <p className="truncate text-[12px] text-ink-soft">{member.role}</p>
          <p className="mt-0.5 truncate text-[11.5px] text-ink-faint">{member.company}</p>
        </div>
        <StatusChip status={member.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[12px] bg-surface-muted px-3 py-2">
          <p className="label-section">Projetos</p>
          <p className="mt-1 flex items-center gap-1.5 text-[15px] font-semibold tabular-nums text-ink">
            <Layers className="size-3.5 text-ink-faint" aria-hidden />
            {member.projects}
          </p>
        </div>
        <div className="rounded-[12px] bg-surface-muted px-3 py-2">
          <p className="label-section">Tarefas</p>
          <p className="mt-1 flex items-center gap-1.5 text-[15px] font-semibold tabular-nums text-ink">
            <ListChecks className="size-3.5 text-ink-faint" aria-hidden />
            {member.tasks}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-ink-soft">Progresso semanal</span>
          <span className="font-semibold tabular-nums text-ink">{member.weeklyProgress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <motion.span
            className="block h-full rounded-full bg-[var(--accent-soft)]"
            initial={{ width: 0 }}
            animate={{ width: `${member.weeklyProgress}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        {member.skills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="truncate rounded-full border border-line px-2 py-0.5 text-[10.5px] text-ink-faint"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line-soft pt-3.5">
        <button
          type="button"
          onClick={() =>
            toast(`Mensagem para ${member.name.split(" ")[0]}`, {
              description: "O chat do time abre em breve.",
            })
          }
          className={cn(
            "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full border border-line text-[12.5px] font-medium text-ink-soft",
            "transition-colors duration-200 hover:bg-surface-muted hover:text-ink",
          )}
        >
          <MessageSquare className="size-3.5" aria-hidden />
          Message
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] text-[12.5px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-strong)]"
        >
          Perfil
        </button>
      </div>
    </motion.article>
  );
}
