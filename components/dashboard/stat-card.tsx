"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { ProjectIconTile } from "@/components/ui/project-icon";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
  /** the first card is filled with the accent colour */
  featured?: boolean;
  projects: Project[];
  onOpen?: () => void;
}

/**
 * Metric tile: count-up number, a circular seal in the top-right corner and a
 * footer of project-type icons. The featured variant paints the card accent.
 */
export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  featured = false,
  projects,
  onOpen,
}: StatCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn(
        "group/stat relative flex h-full min-h-[168px] w-full flex-col justify-between overflow-hidden rounded-[20px] border p-5 text-left",
        featured
          ? "border-transparent bg-[var(--accent)] text-white shadow-[0_18px_40px_-24px_color-mix(in_oklab,var(--accent)_85%,transparent)]"
          : "border-line bg-surface text-ink shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]",
      )}
      aria-label={`${label}: ${value}. ${caption}`}
    >
      {featured ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-white/10 blur-[2px]"
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("label-section", featured && "text-white/70")}>{label}</p>
          <p className={cn("metric-num mt-3", featured ? "text-white" : "text-ink")}>
            <AnimatedNumber value={value} />
          </p>
          <p className={cn("mt-1 text-[12px]", featured ? "text-white/75" : "text-ink-soft")}>{caption}</p>
        </div>

        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover/stat:scale-105",
            featured
              ? "bg-white/16 text-white"
              : "border border-line bg-surface-muted text-ink-soft",
          )}
        >
          <Icon className="size-[18px]" strokeWidth={1.9} aria-hidden />
        </span>
      </div>

      <div
        className={cn(
          "relative mt-5 flex items-center gap-2 border-t pt-3.5",
          featured ? "border-white/20" : "border-line-soft",
        )}
      >
        <span className="flex items-center gap-1.5">
          {projects.slice(0, 3).map((project) => (
            <ProjectIconTile
              key={project.id}
              icon={project.icon}
              color={project.color}
              size="sm"
              className={cn("ring-2", featured ? "ring-[var(--accent)]" : "ring-surface")}
            />
          ))}
          {projects.length === 0 ? (
            <span className={cn("text-[11.5px]", featured ? "text-white/70" : "text-ink-faint")}>
              Nenhum projeto
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 text-[11.5px] font-medium",
            featured ? "text-white/80" : "text-ink-faint",
          )}
        >
          Ver projetos
          <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/stat:translate-x-0.5 group-hover/stat:-translate-y-0.5" aria-hidden />
        </span>
      </div>
    </motion.button>
  );
}
