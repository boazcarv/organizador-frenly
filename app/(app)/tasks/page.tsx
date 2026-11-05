"use client";

import { ListChecks, Plus, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog";
import { Board } from "@/components/tasks/board";
import { TaskDetail } from "@/components/tasks/task-detail";
import { Pressable } from "@/components/motion/pressable";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_TODAY } from "@/lib/constants";
import { useMembers, useProfile, useProjects, useTasks, useUpdateProject } from "@/lib/queries";
import type { Project, Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/store/board";

const scopes: { id: string; label: string; helper: string }[] = [
  { id: "all", label: "Todas", helper: "Tudo o que está no quadro" },
  { id: "personal", label: "Pessoais", helper: "Atribuídas a você" },
  { id: "team", label: "Equipe", helper: "Projetos internos da Frenly" },
  { id: "client", label: "Cliente", helper: "Projetos com parceiros e clientes" },
  { id: "week", label: "Semana", helper: "Prazo nos próximos 7 dias" },
];

function ProjectProgressCard({ project, onEdit }: { project: Project; onEdit: () => void }) {
  const updateProject = useUpdateProject();
  const [draftState, setDraftState] = useState({ id: project.id, base: project.progress, value: project.progress });
  const lastSubmitted = useRef<number | null>(null);
  const progress = draftState.id === project.id && draftState.base === project.progress
    ? draftState.value
    : project.progress;

  const changeProgress = (value: number) => {
    lastSubmitted.current = null;
    setDraftState({ id: project.id, base: project.progress, value });
  };

  const saveProgress = (value: number) => {
    if (value === project.progress || value === lastSubmitted.current || updateProject.isPending) return;
    lastSubmitted.current = value;
    updateProject.mutate(
      { id: project.id, patch: { progress: value } },
      {
        onSuccess: () => toast.success("Progresso do projeto atualizado", { description: `${project.name}: ${value}%` }),
        onError: (error) => {
          lastSubmitted.current = null;
          setDraftState({ id: project.id, base: project.progress, value: project.progress });
          toast.error("Não foi possível salvar o progresso do projeto", {
            description: error instanceof Error ? error.message : "Tente novamente.",
          });
        },
      },
    );
  };

  return (
    <div className="rounded-xl border border-line bg-surface-muted/60 p-3 transition-colors hover:bg-surface-muted">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onEdit} className="min-w-0 truncate text-left text-sm font-semibold text-ink hover:text-accent">
          {project.name}
        </button>
        <span className="shrink-0 text-xs tabular-nums text-ink-soft">{progress}%</span>
      </div>
      <div className="group/project-progress relative mt-1.5 flex h-7 w-full items-center" title="Arraste para ajustar o progresso do projeto">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-surface">
          <span className="block h-full rounded-full bg-[var(--accent)] transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={progress}
          aria-label={`Progresso do projeto ${project.name}`}
          aria-valuetext={`${progress}% concluído`}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => changeProgress(Number(event.currentTarget.value))}
          onPointerUp={(event) => {
            event.stopPropagation();
            saveProgress(Number(event.currentTarget.value));
          }}
          onKeyUp={(event) => {
            event.stopPropagation();
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
              saveProgress(Number(event.currentTarget.value));
            }
          }}
          onBlur={() => saveProgress(progress)}
          className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent outline-none [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface-muted [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface-muted [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:shadow-sm"
        />
      </div>
      <span className="mt-0.5 block truncate text-xs text-ink-faint">{project.type} · {project.status === "active" ? "Ativo" : project.status}</span>
    </div>
  );
}

export default function TasksPage() {
  const { data: tasks, isPending: tasksPending } = useTasks();
  const { data: projects } = useProjects();
  const { data: members } = useMembers();
  const hydrate = useBoardStore((state) => state.hydrate);

  const [scope, setScope] = useState("all");
  const [visibility, setVisibility] = useState("team");
  const [addStatus, setAddStatus] = useState<TaskStatus | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<import("@/lib/types").Project | null>(null);

  useEffect(() => {
    if (tasks) hydrate(tasks);
  }, [tasks, hydrate]);

  const { data: profile } = useProfile();

  /**
   * "Equipe" vs "Cliente": projects owned by someone inside Frenly Studio are
   * internal; the rest belong to partner agencies and clients.
   */
  const internalProjects = useMemo(() => {
    if (!members || !projects) return new Set<string>();
    const internal = new Set(
      members.filter((member) => member.company === "Frenly Studio").map((member) => member.name),
    );
    return new Set(
      projects
        .filter((project) => {
          const owners = project.owners?.length ? project.owners : project.owner ? [project.owner] : [];
          return owners.some((owner) => internal.has(owner));
        })
        .map((project) => project.id),
    );
  }, [members, projects]);

  const filter = useCallback(
    (task: Task) => {
      const today = APP_TODAY;
      const due = new Date(task.dueAt);
      const inAWeek = due.getTime() - today.getTime() <= 7 * 86_400_000 && due.getTime() >= today.getTime() - 86_400_000;

      const byScope =
        scope === "all"
          ? true
          : scope === "personal"
            ? task.assignee === profile?.name
            : scope === "team"
              ? internalProjects.has(task.projectId)
              : scope === "client"
                ? !internalProjects.has(task.projectId)
                : inAWeek;

      const byVisibility =
        visibility === "team" ? true : visibility === "mine" ? task.assignee === profile?.name : task.priority === "high";

      return byScope && byVisibility;
    },
    [scope, visibility, internalProjects, profile?.name],
  );

  const detailTask = tasks?.find((task) => task.id === detailId) ?? null;

  return (
    <div className="space-y-5">
      <PageHeader title="Tasks" subtitle="Quadro do time: arraste para mover, use Tab + espaço pelo teclado.">
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger
            aria-label="Filtro de visibilidade"
            className="h-9 w-[168px] rounded-full border-line bg-surface text-[13px]"
          >
            <SlidersHorizontal className="size-3.5 text-ink-faint" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-[14px] border-line">
            <SelectItem value="team" className="text-[13px]">
              Time completo
            </SelectItem>
            <SelectItem value="mine" className="text-[13px]">
              Somente eu
            </SelectItem>
            <SelectItem value="critical" className="text-[13px]">
              Prioritárias
            </SelectItem>
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => setAddStatus("backlog")}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-strong)]"
        >
          <Plus className="size-4" aria-hidden />
          Adicionar
        </button>
      </PageHeader>

      {projects?.length ? (
        <section aria-label="Projetos do workspace" className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h2 className="text-sm font-semibold text-ink">Projetos do workspace</h2><p className="text-xs text-ink-faint">Acompanhe e atualize o progresso direto daqui.</p></div>
            <span className="text-xs text-ink-soft">{projects.length} projeto(s)</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectProgressCard key={project.id} project={project} onEdit={() => setEditingProject(project)} />
            ))}
          </div>
        </section>
      ) : null}
      <NewProjectDialog open={Boolean(editingProject)} project={editingProject} onOpenChange={(open) => { if (!open) setEditingProject(null); }} />

      <div className="flex flex-wrap items-center gap-2">
        {scopes.map((item) => (
          <Pressable
            key={item.id}
            onClick={() => setScope(item.id)}
            aria-pressed={scope === item.id}
            title={item.helper}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3.5 text-[12.5px] font-medium transition-colors duration-200",
              scope === item.id
                ? "border-transparent bg-accent-tint text-accent"
                : "border-line bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink",
            )}
          >
            {item.label}
          </Pressable>
        ))}

        <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] text-ink-faint">
          <ListChecks className="size-3.5" aria-hidden />
          {tasks?.length ?? 0} tarefas no total
        </span>
      </div>

      {tasksPending || !tasks || !projects || !members ? (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:px-0 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="w-[280px] shrink-0 space-y-2.5 rounded-[18px] border border-line bg-surface-muted/70 p-3 md:w-auto">
              <Skeleton className="h-5 w-28 rounded-full" />
              {Array.from({ length: 3 }).map((__, cardIndex) => (
                <Skeleton key={cardIndex} className="h-[132px] rounded-[16px]" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <Board
          projects={projects}
          members={members}
          filter={filter}
          onOpenTask={(task) => setDetailId(task.id)}
          onAddTask={(status) => setAddStatus(status)}
        />
      )}

      {projects && members ? (
        <AddTaskDialog
          open={addStatus !== null}
          status={addStatus ?? "backlog"}
          onOpenChange={(open) => setAddStatus(open ? (addStatus ?? "backlog") : null)}
          projects={projects}
          members={members}
        />
      ) : null}

      <TaskDetail
        task={detailTask}
        project={detailTask ? projects?.find((project) => project.id === detailTask.projectId) : undefined}
        member={detailTask ? members?.find((member) => member.name === detailTask.assignee) : undefined}
        onOpenChange={(open) => (open ? undefined : setDetailId(null))}
      />
    </div>
  );
}
