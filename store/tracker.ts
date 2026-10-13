"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { TRACKER_SEED_SECONDS } from "@/lib/tracker-seed";
import { safeStorage } from "@/lib/storage";

export interface TrackerSession {
  id: string;
  projectId: string;
  seconds: number;
  startedAt: string;
}

interface TrackerState {
  running: boolean;
  seconds: number;
  /** seconds accumulated before the current run */
  baseSeconds: number;
  /**
   * Clock value when the user last pressed play. Stopping logs only the
   * difference (`seconds - sessionBase`), so the cosmetic seed value never gets
   * written to the server as if it were tracked time.
   */
  sessionBase: number | null;
  /** epoch ms of the current run */
  startedAtMs: number | null;
  projectId: string;
  sessions: TrackerSession[];
  start: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  reset: () => void;
  setProject: (projectId: string) => void;
  /** internal: wall-clock reconciliation */
  sync: () => void;
  /** seconds that can honestly be logged right now (this run only) */
  loggableSeconds: () => number;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

function ensureTicking() {
  if (intervalId !== null) return;
  intervalId = setInterval(() => {
    const state = useTrackerStore.getState();
    if (!state.running) {
      stopTicking();
      return;
    }
    state.sync();
  }, 1000);
}

function stopTicking() {
  if (intervalId === null) return;
  clearInterval(intervalId);
  intervalId = null;
}

function elapsed(
  state: Pick<TrackerState, "baseSeconds" | "startedAtMs" | "running" | "seconds">,
): number {
  if (!state.running || state.startedAtMs === null) return state.seconds;
  return state.baseSeconds + Math.floor((Date.now() - state.startedAtMs) / 1000);
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      running: false,
      seconds: TRACKER_SEED_SECONDS,
      baseSeconds: TRACKER_SEED_SECONDS,
      sessionBase: null,
      startedAtMs: null,
      projectId: "prj-aurora",
      sessions: [],

      start: () => {
        if (get().running) return;
        const current = get().seconds;
        set({ running: true, startedAtMs: Date.now(), baseSeconds: current, sessionBase: current });
        ensureTicking();
      },

      pause: () => {
        const current = elapsed(get());
        stopTicking();
        set({ running: false, seconds: current, baseSeconds: current, startedAtMs: null });
      },

      toggle: () => (get().running ? get().pause() : get().start()),

      stop: () => {
        const state = get();
        const current = elapsed(state);
        // Only what was tracked in this run is loggable.
        const tracked = state.sessionBase === null ? 0 : Math.max(0, current - state.sessionBase);
        stopTicking();
        set(() => ({
          running: false,
          seconds: 0,
          baseSeconds: 0,
          sessionBase: null,
          startedAtMs: null,
          sessions: tracked > 0
            ? [
                {
                  id: `session-${Date.now().toString(36)}`,
                  projectId: state.projectId,
                  seconds: tracked,
                  startedAt: new Date(Date.now() - tracked * 1000).toISOString(),
                },
                ...state.sessions,
              ].slice(0, 12)
            : state.sessions,
        }));
      },

      reset: () => {
        stopTicking();
        set({ running: false, seconds: 0, baseSeconds: 0, sessionBase: null, startedAtMs: null });
      },

      setProject: (projectId) => set({ projectId }),

      loggableSeconds: () => {
        const state = get();
        if (state.sessionBase === null) return 0;
        return Math.max(0, elapsed(state) - state.sessionBase);
      },

      sync: () => {
        const current = elapsed(get());
        if (current !== get().seconds) set({ seconds: current });
      },
    }),
    {
      name: "frenly:tracker",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (state) => ({
        seconds: state.seconds,
        projectId: state.projectId,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<TrackerState>;
        const seconds = typeof saved.seconds === "number" ? saved.seconds : current.seconds;
        return {
          ...current,
          seconds,
          baseSeconds: seconds,
          projectId: saved.projectId ?? current.projectId,
          sessionBase: null,
        };
      },
    },
  ),
);

/** Live read of the clock (component-safe). */
export function useTrackerSeconds(): number {
  return useTrackerStore((state) => state.seconds);
}
