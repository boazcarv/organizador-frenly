"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, CircleStop, Pause, Play } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectIconTile } from "@/components/ui/project-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatClock, formatDurationLong } from "@/lib/format";

import { SPRING_GESTURE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useDashboard, useLogTimeEntry, useProjects } from "@/lib/queries";
import { useTrackerStore } from "@/store/tracker";

/** One digit of the clock: the outgoing value slides up 8px while its
 *  replacement drops in — an odometer without layout shift. */
function Digit({ char }: { char: string }) {
  return (
    <span className="relative inline-flex h-[1.06em] w-[0.62em] items-center justify-center overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={char}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Clock({ seconds, className }: { seconds: number; className?: string }) {
  const chars = useMemo(() => formatClock(seconds).split(""), [seconds]);

  return (
    <span
      role="timer"
      aria-label={`Tempo rastreado: ${formatDurationLong(seconds)}`}
      className={cn("inline-flex items-center tabular-nums", className)}
    >
      {chars.map((char, index) => (
        <span key={index} className="inline-flex items-center">
          {char === ":" ? (
            <span className="inline-flex w-[0.34em] justify-center opacity-45">:</span>
          ) : (
            <Digit char={char} />
          )}
        </span>
      ))}
    </span>
  );
}

function TrackerControls({ compact = false }: { compact?: boolean }) {
  const running = useTrackerStore((state) => state.running);
  const toggle = useTrackerStore((state) => state.toggle);
  const stop = useTrackerStore((state) => state.stop);
  const projectId = useTrackerStore((state) => state.projectId);
  const logEntry = useLogTimeEntry();
  const { data: projects = [] } = useProjects();
  const project = projects.find((item) => item.id === projectId);

  /**
   * Stopping writes a real time entry: the tracker clears immediately for a
   * snappy feel and the dashboard/analytics refetch behind it.
   */
  const handleStop = () => {
    const tracked = useTrackerStore.getState().loggableSeconds();
    if (tracked <= 0) {
      stop();
      return;
    }
    stop();
    logEntry.mutate(
      { projectId, seconds: tracked, startedAt: new Date(Date.now() - tracked * 1000).toISOString() },
      {
        onSuccess: () =>
          toast.success("Sessão registrada", {
            description: `${formatDurationLong(tracked)} em ${project?.name ?? "projeto ativo"}.`,
          }),
        onError: () =>
          toast.error("Sessão não foi salva", { description: "Tente parar novamente em instantes." }),
      },
    );
  };

  const buttonSize = compact ? "size-9" : "size-11";

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            onClick={toggle}
            whileTap={{ scale: 0.93 }}
            transition={SPRING_GESTURE}
            aria-label={running ? "Pausar cronômetro" : "Iniciar cronômetro"}
            aria-pressed={running}
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-white text-[var(--deep)] shadow-[0_10px_24px_-12px_rgba(0,0,0,.6)] transition-transform duration-200 hover:scale-[1.04]",
              buttonSize,
            )}
          >
            {running ? (
              <Pause className={compact ? "size-3.5" : "size-4"} aria-hidden />
            ) : (
              <Play className={cn(compact ? "size-3.5" : "size-4", "translate-x-[1px]")} aria-hidden />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent className="text-[12px]">{running ? "Pausar" : "Iniciar"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            onClick={handleStop}
            whileTap={{ scale: 0.93 }}
            transition={SPRING_GESTURE}
            aria-label="Parar cronômetro"
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-[var(--danger)] text-white transition-transform duration-200 hover:scale-[1.04]",
              buttonSize,
            )}
          >
            <CircleStop className={compact ? "size-3.5" : "size-4"} aria-hidden />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent className="text-[12px]">Parar e registrar</TooltipContent>
      </Tooltip>
    </div>
  );
}

function ProjectPicker({ compact = false }: { compact?: boolean }) {
  const projectId = useTrackerStore((state) => state.projectId);
  const setProject = useTrackerStore((state) => state.setProject);
  const { data: projects = [] } = useProjects();
  const project = projects.find((item) => item.id === projectId) ?? projects[0];

  if (!project) {
    return (
      <span className="inline-flex h-8 items-center rounded-full border border-white/12 bg-white/5 px-3 text-[12px] text-white/60">
        Nenhum projeto
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group/pick inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-white/5 py-1 pr-2.5 pl-1.5 text-left transition-colors duration-200 hover:bg-white/10",
            compact && "border-transparent bg-transparent hover:bg-white/10",
          )}
          aria-label={`Projeto ativo: ${project.name}. Trocar projeto`}
        >
          <ProjectIconTile icon={project.icon} color={project.color} size="sm" className="size-6 rounded-[8px]" />
          <span className="min-w-0 truncate text-[12.5px] font-medium text-white">{project.name}</span>
          <ChevronDown className="size-3.5 shrink-0 text-white/50" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[248px] rounded-[16px] border-line bg-surface p-1.5">
        <DropdownMenuLabel className="px-2 py-1.5 label-section">Projeto ativo</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-line" />
        {projects.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onSelect={() => {
              setProject(item.id);
              toast(`Rastreando ${item.name}`, { description: "O cronômetro segue rodando." });
            }}
            className="gap-2.5 rounded-[10px] px-2 py-1.5 text-[13px]"
          >
            <ProjectIconTile icon={item.icon} color={item.color} size="sm" className="size-6 rounded-[8px]" />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Deep-coloured tracker card: live clock, pulsing halo while running and the
 * white play/pause + red stop pair. State lives in Zustand, so it survives
 * every route change.
 */
export function TimeTrackerCard() {
  const seconds = useTrackerStore((state) => state.seconds);
  const running = useTrackerStore((state) => state.running);
  const reduce = useReducedMotion();
  const { data } = useDashboard();

  // Server-side total for today + whatever the clock is counting right now.
  const loggedSeconds = data?.todaySeconds ?? 0;
  const todaySeconds = loggedSeconds + (running ? seconds : 0);

  return (
    <section className="relative isolate h-full overflow-hidden rounded-[20px] border border-white/6 bg-deep rings-deep p-5 text-white shadow-[var(--shadow-card)]">
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-section text-white/45">Time Tracker</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-white/55">
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                running ? "bg-[var(--accent-soft)]" : "bg-white/30",
              )}
            />
            {running ? "Rodando agora" : "Pausado"}
          </p>
        </div>

        {reduce ? null : (
          <motion.span
            aria-hidden
            className="size-2 rounded-full bg-[var(--accent-soft)]"
            animate={running ? { opacity: [1, 0.25, 1], scale: [1, 0.8, 1] } : { opacity: 0.4, scale: 1 }}
            transition={{ duration: 1, repeat: running ? Infinity : 0, ease: "easeInOut" }}
          />
        )}
      </div>

      <div className="relative mt-4">
        <ProjectPicker />
      </div>

      <div className="relative mt-6 flex items-center justify-between gap-4">
        <div className="relative">
          {running && !reduce ? (
            <motion.span
              aria-hidden
              className="absolute -inset-3 rounded-[20px] border border-[var(--accent-soft)]/25"
              animate={{ scale: [1, 1.02, 1], opacity: [0.55, 0.2, 0.55] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : null}
          <Clock seconds={seconds} className="text-[38px] leading-none font-semibold tracking-[-0.03em] text-white" />
        </div>

        <TrackerControls />
      </div>

      <div className="relative mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-3.5">
        <span className="text-[11.5px] text-white/50">
          Hoje · <span className="tabular-nums">{formatDurationLong(todaySeconds)}</span> registrados
        </span>
        <span className="text-[11.5px] text-white/35">Meta diária 6h</span>
      </div>
    </section>
  );
}

/** < 768px: the tracker becomes a fixed bar pinned to the bottom edge. */
export function TrackerMobileBar() {
  const seconds = useTrackerStore((state) => state.seconds);
  const running = useTrackerStore((state) => state.running);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 md:hidden">
      <div className="pointer-events-auto flex w-full max-w-[520px] items-center gap-3 rounded-[18px] border border-white/8 bg-deep/95 px-3 py-2.5 shadow-[var(--shadow-pop)] backdrop-blur-md">
        <span
          aria-hidden
          className={cn("size-2 shrink-0 rounded-full", running ? "bg-[var(--accent-soft)]" : "bg-white/25")}
        />
        <div className="min-w-0 flex-1">
          <p className="label-section text-white/45">Time Tracker</p>
          <div className="mt-0.5">
            <ProjectPicker compact />
          </div>
        </div>
        <Clock
          seconds={seconds}
          className="shrink-0 text-[16px] leading-none font-semibold text-white"
        />
        <TrackerControls compact />
      </div>
    </div>
  );
}
