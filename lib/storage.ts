"use client";

import type { StateStorage } from "zustand/middleware";

/**
 * Storage that degrades instead of throwing.
 *
 * `localStorage` is not always available: sandboxed iframes without
 * `allow-same-origin`, Safari private mode and hardened browser profiles all
 * throw on access. Persistence is a convenience here — a throw while the store
 * initialises would take the whole route down with it, so we fall back to an
 * in-memory map and the app keeps working for the session.
 */
const memory = new Map<string, string>();

export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      const value = window.localStorage.getItem(name);
      return value ?? memory.get(name) ?? null;
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    memory.set(name, value);
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* storage blocked — the in-memory copy keeps this session consistent */
    }
  },
  removeItem: (name) => {
    memory.delete(name);
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};
