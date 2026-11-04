"use client";

import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** A workspace note, not an upgrade or subscription advertisement. */
export function PromoCard({ collapsed }: { collapsed?: boolean }) {
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
    <div className="relative overflow-hidden rounded-[18px] bg-deep p-4 text-white/90">
      <Sparkles className="mb-2 size-4 text-accent-soft" aria-hidden />
      <p className="text-[13px] leading-[1.35] font-medium text-white">
        Trabalho, não burocracia — o Frenly resolve.
      </p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/65">
        Tudo que sua equipe precisa para organizar projetos, tarefas e compromissos em um só lugar.
      </p>
    </div>
  );
}
