"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Upgrade promo. The spotlight follows the cursor through CSS variables
 * written straight to the node — no state, no re-render.
 */
export function PromoCard({ collapsed, onUpgrade }: { collapsed?: boolean; onUpgrade: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    node.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            onClick={onUpgrade}
            whileTap={{ scale: 0.96 }}
            className="relative mx-auto flex size-9 items-center justify-center overflow-hidden rounded-[14px] bg-deep rings-deep text-accent-soft"
            aria-label="Fazer upgrade do plano"
          >
            <Sparkles className="size-4" aria-hidden />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-[12px]">
          Fazer upgrade
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className="group/promo relative isolate overflow-hidden rounded-[18px] bg-deep rings-deep p-4 text-white/90"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300 group-hover/promo:opacity-100"
        style={{
          background:
            "radial-gradient(200px circle at var(--mx, 80%) var(--my, 0%), color-mix(in oklab, var(--accent-soft) 26%, transparent), transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -bottom-16 size-36 rounded-full border border-white/7"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -bottom-24 size-52 rounded-full border border-white/5"
      />
      <p className="relative z-10 text-[13px] leading-[1.35] font-medium text-white">
        Trabalho, não burocracia — o Frenly resolve.
      </p>
      <p className="relative z-10 mt-1.5 text-[11.5px] leading-relaxed text-white/55">
        Horas ilimitadas e relatórios avançados no plano Studio.
      </p>
      <motion.button
        type="button"
        onClick={onUpgrade}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
        className={cn(
          "relative z-10 mt-3 inline-flex h-8 w-full items-center justify-center rounded-full bg-[var(--accent)] text-[12.5px] font-semibold text-white",
          "transition-colors duration-200 hover:bg-[var(--accent-strong)]",
        )}
      >
        Fazer upgrade
      </motion.button>
    </div>
  );
}
