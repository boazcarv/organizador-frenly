"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Route entrance: fade + 8px up, 300ms.
 *
 * Deliberately CSS-driven (not Motion) and deliberately without an exit
 * animation. The page viewport is the one element on screen that must never be
 * able to end up invisible: a JS exit/enter handshake can be interrupted by a
 * fast click, a backgrounded tab or a dropped animation frame, and the failure
 * mode is a blank page. A keyframe animation starts on the first paint and
 * always resolves, and `prefers-reduced-motion` collapses it to ~0ms in CSS.
 * Everything else in the app still animates with Motion.
 */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();

  return (
    <main key={pathname} className={cn("min-h-full", "page-enter", className)}>
      {children}
    </main>
  );
}
