"use client";

import { Activity, CircleDashed, LayoutGrid, PauseCircle, Upload } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Collaborators } from "@/components/dashboard/collaborators";
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog";
import { ProgressRingCard } from "@/components/dashboard/progress-ring-card";
import { ProjectsBar } from "@/components/dashboard/projects-bar";
import { ProjectsList } from "@/components/dashboard/projects-list";
import { RemindersCard } from "@/components/dashboard/reminders-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimeTrackerCard } from "@/components/dashboard/time-tracker";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLongDate } from "@/lib/format";
import { useDashboard, useProfile } from "@/lib/queries";
import type { Project } from "@/lib/types";
import { useUiStore } from "@/store/ui";

function greetingFor(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-full" />
          <Skeleton className="h-3.5 w-80 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-34 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[168px] rounded-[20px]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Skeleton className="h-[392px] rounded-[20px]" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[420px] rounded-[20px]" />
            <Skeleton className="h-[420px] rounded-[20px]" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[402px] rounded-[20px]" />
          <Skeleton className="h-[318px] rounded-[20px]" />
          <Skeleton className="h-[268px] rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isPending } = useDashboard();
  const { data: profile } = useProfile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const openMember = useUiStore((state) => state.openMember);
  const hour = new Date().getHours();

  if (isPending || !data) return <DashboardSkeleton />;

  const { stats, projects, members, reminders, productivity } = data;
  const firstName = profile?.name.trim().split(" ")[0];

  const byStatus = (status: string) => projects.filter((project) => project.status === status);

  const openNewProject = () => {
    setEditingProject(null);
    setProjectDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setProjectDialogOpen(open);
    if (!open) setEditingProject(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={firstName ? `Bom trabalho, ${firstName}` : "Bom trabalho"}
        subtitle={`${greetingFor(hour)}! Aqui está o pulso do time em ${formatLongDate(new Date())}.`}
      >
        <Button
          variant="outline"
          onClick={() => toast("Importar dados", { description: "Aceita CSV, Notion e Jira — em breve." })}
          className="h-9 rounded-full border-line px-4 text-[13px] font-medium"
        >
          <Upload className="size-4" aria-hidden />
          Importar
        </Button>
        <Button
          onClick={openNewProject}
          className="h-9 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--accent-strong)]"
        >
          <span aria-hidden className="text-[15px] leading-none">
            +
          </span>
          Novo projeto
        </Button>
      </PageHeader>

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" stagger={0.07}>
        <StaggerItem>
          <StatCard
            label="Projetos totais"
            value={stats.total}
            caption={`${stats.completed} concluídos neste ano`}
            icon={LayoutGrid}
            featured
            projects={projects}
            onOpen={() => router.push("/tasks")}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Projetos ativos"
            value={stats.active}
            caption="em andamento agora"
            icon={Activity}
            projects={byStatus("active")}
            onOpen={() => router.push("/tasks")}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Projetos em espera"
            value={stats.waiting}
            caption="aguardando aprovação"
            icon={PauseCircle}
            projects={byStatus("waiting")}
            onOpen={() => router.push("/tasks")}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Projetos pendentes"
            value={stats.pending}
            caption="para começar"
            icon={CircleDashed}
            projects={byStatus("pending")}
            onOpen={() => router.push("/tasks")}
          />
        </StaggerItem>
      </Stagger>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <Stagger cascadeKey="bar" stagger={0.05}>
            <StaggerItem>
              <ProjectsBar
                periods={productivity}
                onOpenPeriod={(period) =>
                  toast(`Relatório de ${period.label}`, {
                    description: "O relatório detalhado abre na área de Analytics.",
                    action: { label: "Ver Analytics", onClick: () => router.push("/analytics") },
                  })
                }
              />
            </StaggerItem>
          </Stagger>

          <div className="grid gap-4 lg:grid-cols-2">
            <Stagger stagger={0.05}>
              <StaggerItem>
                <ProjectsList
                  projects={projects}
                  onNew={openNewProject}
                  onEdit={handleEditProject}
                  onRefresh={() => void queryClient.invalidateQueries({ queryKey: ["dashboard"] })}
                />
              </StaggerItem>
            </Stagger>
            <Stagger stagger={0.05}>
              <StaggerItem>
                <Collaborators members={members} onOpenMember={openMember} />
              </StaggerItem>
            </Stagger>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <Stagger stagger={0.05}>
            <StaggerItem>
              <RemindersCard reminders={reminders} />
            </StaggerItem>
          </Stagger>
          <Stagger stagger={0.05}>
            <StaggerItem>
              <ProgressRingCard
                value={stats.completionRate}
                caption="Progresso médio dos projetos"
                legend={[
                  { label: "Ativos", value: stats.active, color: "var(--accent)" },
                  { label: "Em espera", value: stats.waiting, color: "var(--accent-soft)" },
                  { label: "Pendentes", value: stats.pending, color: "var(--line)" },
                ]}
              />
            </StaggerItem>
          </Stagger>
          <Stagger stagger={0.05}>
            <StaggerItem>
              <TimeTrackerCard />
            </StaggerItem>
          </Stagger>
        </div>
      </div>

      <NewProjectDialog
        open={projectDialogOpen}
        onOpenChange={handleOpenChange}
        project={editingProject}
      />
    </div>
  );
}
