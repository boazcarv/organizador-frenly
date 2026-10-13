"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";

interface RevealOrigin {
  x: number;
  y: number;
}

/**
 * Light/dark switch with a circular reveal that grows from the theme button.
 * Falls back to an instant (but still animated) swap when the View Transitions
 * API is unavailable or the user prefers reduced motion.
 */
export function useThemeReveal() {
  const { resolvedTheme, setTheme } = useTheme();

  return useCallback(
    (origin?: RevealOrigin) => {
      const next = resolvedTheme === "dark" ? "light" : "dark";
      const x = origin?.x ?? window.innerWidth - 48;
      const y = origin?.y ?? 48;
      const root = document.documentElement;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const commit = () => {
        root.style.setProperty("--vt-x", `${Math.round(x)}px`);
        root.style.setProperty("--vt-y", `${Math.round(y)}px`);
        root.dataset.vt = next === "dark" ? "to-dark" : "to-light";
        setTheme(next);
      };

      if (typeof document.startViewTransition === "function" && !reduce) {
        const transition = document.startViewTransition(commit);
        transition.finished
          .catch(() => undefined)
          .finally(() => {
            delete root.dataset.vt;
          });
        return;
      }

      commit();
      window.setTimeout(() => {
        delete root.dataset.vt;
      }, 600);
    },
    [resolvedTheme, setTheme],
  );
}
