"use client";

import { motion } from "motion/react";
import { ArrowUpRight, FolderPlus, MoreHorizontal, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ProjectIconTile } from "@/components/ui/project-icon";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { useDeleteProject } from "@/lib/queries";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatShortDate } from "@/lib/format";
import type { Project } from "@/lib/types";

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const router = useRouter();
  const deleteProject = useDeleteProject();

  const handleDelete = async () => {
    try {
      const result = await deleteProject.mutateAsync(project.id);
      toast.success("Projeto removido", {
        description: `${project.name} e ${result.removedTasks} tarefa(s) saíram do workspace.`,
      });
    } catch (error) {
      toast.error("Não foi possível excluir", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  };

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group/row relative flex items-center gap-2 rounded-[14px] pr-1 transition-colors duration-200 hover:bg-surface-muted"
    >
      <button
        type="button"
        onClick={() => router.push("/tasks")}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] px-2 py-2.5 text-left"
      >
        <ProjectIconTile icon={project.icon} color={project.color} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-ink">{project.name}</span>
          <span className="mt-0.5 block truncate text-[11.5px] text-ink-faint">
            {project.type} · {project.owner}
          </span>
        </span>

        <span className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-muted">
            <motion.span
              className="block h-full rounded-full bg-[var(--accent-soft)]"
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 0.8, delay: 0.15 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
          <span className="w-8 text-right text-[11.5px] tabular-nums text-ink-soft">
            {project.progress}%
          </span>
        </span>

        <ArrowUpRight
          className="size-4 shrink-0 text-ink-faint transition-all duration-200 group-hover/row:-translate-y-0.5 group-hover/row:translate-x-0.5 group-hover/row:text-ink-soft"
          aria-hidden
        />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Ações de ${project.name}`}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink-faint opacity-0 transition-all duration-200 group-hover/row:opacity-100 focus-visible:opacity-100 hover:bg-surface hover:text-ink"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[212px] rounded-[16px] border-line bg-surface p-1.5">
          <DropdownMenuItem
            onSelect={() => router.push("/tasks")}
            className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px]"
          >
            Ver tarefas do projeto
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              toast("Progresso", {
                description: `${project.name}: ${project.progress}% · ${project.tasksDone}/${project.tasksTotal} tarefas.`,
              })
            }
            className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px]"
          >
            Detalhes do progresso
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-line" />
          <DropdownMenuItem
            onSelect={handleDelete}
            className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px] text-danger data-[highlighted]:bg-danger-soft data-[highlighted]:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
            Excluir projeto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.li>
  );
}

export function ProjectsList({
  projects,
  onNew,
  onRefresh,
}: {
  projects: Project[];
  onNew: () => void;
  onRefresh?: () => void;
}) {
  return (
    <Panel className="flex h-full flex-col" padded={false}>
      <div className="p-5 pb-3">
        <PanelHeader
          title={
            <span className="flex items-center gap-2">
              Projetos
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink-soft">
                <AnimatedNumber value={projects.length} /> projetos
              </span>
            </span>
          }
          hint={`${projects.filter((project) => project.status === "active").length} ativos agora · próximo prazo ${formatShortDate(projects[0]?.dueAt ?? new Date())}`}
          action={
            <>
              {onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  aria-label="Recarregar projetos"
                  className="inline-flex size-7 items-center justify-center rounded-full border border-line text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                onClick={onNew}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-line px-2.5 text-[12px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
              >
                <Plus className="size-3.5" aria-hidden />
                Novo
              </button>
            </>
          }
        />
      </div>

      {projects.length === 0 ? (
        <div className="px-5 pb-5">
          <EmptyState
            icon={FolderPlus}
            title="Nenhum projeto ainda"
            description="Crie o primeiro projeto para começar a acompanhar progresso, horas e prazos."
            action={
              <button
                type="button"
                onClick={onNew}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 text-[12.5px] font-semibold text-white"
              >
                <Plus className="size-3.5" aria-hidden />
                Criar projeto
              </button>
            }
          />
        </div>
      ) : (
        <motion.ul layout className="flex-1 space-y-0.5 px-3 pb-3">
          {projects.map((project, index) => (
            <ProjectRow key={project.id} project={project} index={index} />
          ))}
        </motion.ul>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-line-soft px-5 py-3">
        <span className="text-[11.5px] text-ink-faint">
          Mostrando {Math.min(projects.length, 9)} de {projects.length}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => toast("Todos os projetos", { description: "A visão completa chega com o filtro avançado." })}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--accent)] transition-opacity duration-200 hover:opacity-80"
            >
              Ver todos
              <ArrowUpRight className="size-3.5" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent className="text-[12px]">Abrir a lista completa de projetos</TooltipContent>
        </Tooltip>
      </div>
    </Panel>
  );
}
