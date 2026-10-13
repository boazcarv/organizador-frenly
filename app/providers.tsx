"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTrackerStore } from "@/store/tracker";
import { useUiStore } from "@/store/ui";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

/** Rehydrates persisted stores and keeps the accent token in sync. */
function StoreHydrator() {
  const accent = useUiStore((state) => state.accent);
  const setHydrated = useUiStore((state) => state.setHydrated);

  useEffect(() => {
    // Rehydration is best-effort: a blocked storage must not stop the shell.
    try {
      void useUiStore.persist.rehydrate();
      void useTrackerStore.persist.rehydrate();
    } catch {
      /* in-memory defaults are already in place */
    }
    setHydrated();
  }, [setHydrated]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  return null;
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border !border-line !bg-surface !text-ink !shadow-[var(--shadow-pop)] !font-sans",
          description: "!text-ink-soft",
          actionButton: "!rounded-full !bg-[var(--accent)] !text-white",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <TooltipProvider delayDuration={200} skipDelayDuration={300}>
            <StoreHydrator />
            {children}
            <ThemedToaster />
          </TooltipProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
