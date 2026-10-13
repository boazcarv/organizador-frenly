"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-[420px] rounded-[20px] border border-line bg-surface p-6 text-center shadow-[var(--shadow-card)]">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-[16px] font-semibold text-ink">Algo saiu do trilho</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
          Não conseguimos carregar esta parte do Frenly. Tente de novo — seus dados estão salvos.
        </p>
        <p className="mt-3 font-mono text-[11px] break-words text-ink-faint">
          {error.message || "Erro inesperado"}
        </p>
        <Button
          onClick={reset}
          className="mt-5 h-9 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--accent-strong)]"
        >
          <RefreshCw className="size-4" aria-hidden />
          Recarregar
        </Button>
      </div>
    </div>
  );
}
