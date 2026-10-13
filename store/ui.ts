"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AccentKey } from "@/lib/types";
import { safeStorage } from "@/lib/storage";

interface UiState {
  /** mobile drawer (vaul) */
  sidebarOpen: boolean;
  /** desktop collapsed rail (< 1280px auto-collapses) */
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  memberDrawerId: string | null;
  accent: AccentKey;
  hydrated: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setCommandOpen: (open: boolean) => void;
  openMember: (id: string) => void;
  closeMember: () => void;
  setAccent: (accent: AccentKey) => void;
  setHydrated: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      commandOpen: false,
      memberDrawerId: null,
      accent: "green",
      hydrated: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      openMember: (memberDrawerId) => set({ memberDrawerId }),
      closeMember: () => set({ memberDrawerId: null }),
      setAccent: (accent) => set({ accent }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "frenly:ui",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, accent: state.accent }),
    },
  ),
);
