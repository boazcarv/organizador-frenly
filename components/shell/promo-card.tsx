"use client";

import { useRef } from "react";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** A workspace note, not an upgrade or subscription advertisement. */
export function PromoCard({ collapsed }: { collapsed?: boolean }) {
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
          <div
            className="relative mx-auto flex size-9 items-center justify-center rounded-[14px] bg-deep text-accent-soft"
            aria-label="Frenly: seu workspace de trabalho"
          >
            <Sparkles className="size-4" aria-hidden />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-[12px]">
          Seu workspace Frenly
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className="group/promo relative isolate overflow-hidden rounded-[18px] bg-deep p-4 text-white/90 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-300 group-hover/promo:opacity-100"
        style={{
          background: "radial-gradient(200px circle at var(--mx, 80%) var(--my, 0%), color-mix(in oklab, var(--accent-soft) 26%, transparent), transparent 72%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -right-12 -bottom-16 size-36 rounded-full border border-white/7 transition-transform duration-500 group-hover/promo:scale-110" />
      <div aria-hidden className="pointer-events-none absolute -right-20 -bottom-24 size-52 rounded-full border border-white/5" />
      <Sparkles className="relative z-10 mb-2 size-4 text-accent-soft transition-transform duration-300 group-hover/promo:rotate-12 group-hover/promo:scale-110" aria-hidden />
      <p className="relative z-10 text-[13px] leading-[1.35] font-medium text-white">
        Trabalho, não burocracia — o Frenly resolve.
      </p>
      <p className="relative z-10 mt-1.5 text-[11.5px] leading-relaxed text-white/65">
        Tudo que sua equipe precisa para organizar projetos, tarefas e compromissos em um só lugar.
      </p>
    </div>
  );
}
