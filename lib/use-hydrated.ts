"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True only after the client has hydrated — the safe way to render
 * clock-dependent values (relative dates, "now") without hydration drift and
 * without setting state inside an effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
