"use client";

import { motion } from "motion/react";
import { Check, Moon, RotateCcw, Sun, MonitorSmartphone } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Segmented } from "@/components/ui/segmented";
import { accents } from "@/lib/accents";
import type { AccentKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

type ThemeMode = "light" | "dark" | "system";

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Accent + theme picker. Switching accent re-tints the whole UI through the
 * `data-accent` attribute with a 600ms colour sweep; the theme toggle rides on
 * the View Transitions API (circular reveal).
 */
export function AppearancePicker() {
  const accent = useUiStore((state) => state.accent);
  const setStoredAccent = useUiStore((state) => state.setAccent);
  const { theme, setTheme } = useTheme();
  const mode: ThemeMode = theme === "light" || theme === "dark" || theme === "system" ? theme : "system";

  const applyAccent = (key: AccentKey) => {
    const commit = () => {
      const root = document.documentElement;
      root.dataset.accent = key;
      root.classList.add("theme-transition");
      window.setTimeout(() => root.classList.remove("theme-transition"), 620);
      setStoredAccent(key);
    };

    const doc = document as Document & { startViewTransition?: (callback: () => void) => { finished: Promise<void> } };
    if (typeof doc.startViewTransition === "function" && !prefersReducedMotion()) {
      doc.startViewTransition(commit);
      return;
    }
    commit();
  };

  const changeMode = (next: ThemeMode) => {
    setTheme(next);
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-[13.5px] font-semibold text-ink">Cor de destaque</h3>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          A cor percorre botões, gráficos, pills e o cronômetro. A troca é instantânea.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {accents.map((option) => {
            const active = option.key === accent;
            return (
              <motion.button
                key={option.key}
                type="button"
                onClick={() => applyAccent(option.key)}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                aria-pressed={active}
                aria-label={`Usar destaque ${option.label}`}
                className={cn(
                  "group/swatch relative flex flex-col gap-2.5 rounded-[16px] border p-3 text-left transition-colors duration-200",
                  active ? "border-[var(--accent)] bg-accent-tint" : "border-line bg-surface hover:bg-surface-muted",
                )}
              >
                <span
                  aria-hidden
                  className="block h-12 w-full rounded-[12px]"
                  style={{
                    background: `linear-gradient(135deg, ${option.swatch[0]}, ${option.swatch[1]})`,
                  }}
                />
                <span className="flex items-center justify-between">
                  <span className="text-[12.5px] font-medium text-ink">{option.label}</span>
                  {active ? (
                    <span className="flex size-4 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                      <Check className="size-3" aria-hidden />
                    </span>
                  ) : null}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line-soft pt-6">
        <h3 className="text-[13.5px] font-semibold text-ink">Tema</h3>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          O modo escuro revela a interface com um círculo que nasce do botão de tema.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Segmented aria-label="Tema da interface" options={themeOptions} value={mode} onChange={changeMode} />
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-faint">
            {mode === "dark" ? (
              <Moon className="size-3.5" aria-hidden />
            ) : mode === "light" ? (
              <Sun className="size-3.5" aria-hidden />
            ) : (
              <MonitorSmartphone className="size-3.5" aria-hidden />
            )}
            Segue {mode === "system" ? "o sistema operacional" : "manualmente definido"}
          </span>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-5">
        <button
          type="button"
          onClick={() =>
            toast.success("Aparência salva", { description: `Destaque ${accent} aplicado ao workspace.` })
          }
          className="inline-flex h-9 items-center rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-strong)]"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => {
            applyAccent("green");
            changeMode("light");
            toast("Aparência redefinida", { description: "Verde padrão e tema claro." });
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
        >
          <RotateCcw className="size-4" aria-hidden />
          Redefinir
        </button>
      </div>
    </div>
  );
}
