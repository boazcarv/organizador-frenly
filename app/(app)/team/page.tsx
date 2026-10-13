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
import { teamFilters as seedFilters } from "@/lib/constants";
import { useMembers } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

export default function TeamPage() {
  const { data: members, isPending } = useMembers();
  const [filter, setFilter] = useState("all");
  const openMember = useUiStore((state) => state.openMember);

  const filtered = useMemo(() => {
    if (!members) return [];
    switch (filter) {
      case "online":
        return members.filter((member) => member.online);
      case "recent":
        return members.filter((member) => member.recent);
      case "top":
        return members.filter((member) => member.rating >= 4.7);
      case "now":
        return members.filter((member) => member.online && (member.status === "active" || member.status === "busy"));
      default:
        return members;
    }
  }, [members, filter]);

  const counts = useMemo(
    () => ({
      all: members?.length ?? 0,
      online: members?.filter((member) => member.online).length ?? 0,
      recent: members?.filter((member) => member.recent).length ?? 0,
      top: members?.filter((member) => member.rating >= 4.7).length ?? 0,
      now:
        members?.filter((member) => member.online && (member.status === "active" || member.status === "busy")).length ??
        0,
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
            : `${counts.all} pessoas no workspace · ${counts.online} online agora`
        }
      >
        <button
          type="button"
          onClick={() =>
            toast("Convidar pessoa", { description: "Cole o e-mail do time para enviar o acesso." })
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
