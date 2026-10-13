"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Measures an element with a ResizeObserver. Charts use this instead of a
 * percentage-based wrapper so they are only mounted once real pixel dimensions
 * exist — no zero-size first paint, no layout shift.
 */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setSize((previous) =>
        Math.abs(previous.width - rect.width) < 0.5 && Math.abs(previous.height - rect.height) < 0.5
          ? previous
          : { width: Math.round(rect.width), height: Math.round(rect.height) },
      );
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width: size.width, height: size.height };
}
