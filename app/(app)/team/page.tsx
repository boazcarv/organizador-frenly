"use client";

import { AnimatePresence, motion } from "motion/react";
import { UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MemberCard } from "@/components/team/member-card";
import { TeamFilters } from "@/components/team/filters";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_TODAY, teamFilters as seedFilters } from "@/lib/constants";
import { useMembers } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

/** Window that counts as "esta semana" for the activity filter. */
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function TeamPage() {
  const { data: members, isPending } = useMembers();
  const [filter, setFilter] = useState("all");
  const openMember = useUiStore((state) => state.openMember);

  const filtered = useMemo(() => {
    if (!members) return [];
    switch (filter) {
      case "withTasks":
        return members.filter((member) => member.tasks > 0);
      case "available":
        return members.filter((member) => member.tasks === 0);
      case "thisWeek":
        return members.filter(
          (member) => APP_TODAY.getTime() - new Date(member.lastActive).getTime() <= SEVEN_DAYS,
        );
      default:
        return members;
    }
  }, [members, filter]);

  const counts = useMemo(
    () => ({
      all: members?.length ?? 0,
      withTasks: members?.filter((member) => member.tasks > 0).length ?? 0,
      available: members?.filter((member) => member.tasks === 0).length ?? 0,
      thisWeek:
        members?.filter(
          (member) => APP_TODAY.getTime() - new Date(member.lastActive).getTime() <= SEVEN_DAYS,
        ).length ?? 0,
    }),
    [members],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        subtitle={
          isPending
            ? "Carregando o time do workspace…"
            : `${counts.all} ${counts.all === 1 ? "pessoa" : "pessoas"} no workspace · ${counts.withTasks} com tarefas`
        }
      >
        <button
          type="button"
          onClick={() =>
            toast("Criar acesso", {
              description: "Settings → Acessos cria o login. Não há convite por e-mail configurado.",
            })
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-strong)]"
        >
          <UserPlus className="size-4" aria-hidden />
          Convidar
        </button>
      </PageHeader>

      <TeamFilters
        filters={seedFilters}
        value={filter}
        counts={counts}
        onChange={setFilter}
      />

      {isPending || !members ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[286px] rounded-[20px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Ninguém neste filtro"
          description="Ajuste os filtros para ver outras pessoas do time — ou convide alguém novo."
          className="bg-surface"
        />
      ) : (
        <motion.div
          layout
          className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4")}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((member) => (
              <MemberCard key={member.id} member={member} onOpen={() => openMember(member.id)} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
