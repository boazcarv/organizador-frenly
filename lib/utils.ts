import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Single source of truth for conditional class merging. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function range(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

/** percentage of a in b, rounded to `digits` */
export function pct(part: number, total: number, digits = 0): number {
  if (total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(digits));
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function groupBy<T, K extends string | number>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (groups, item) => {
      const group = key(item);
      (groups[group] ||= []).push(item);
      return groups;
    },
    {} as Record<K, T[]>,
  );
}

/** Focus-visible ring used by every interactive surface. */
export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
