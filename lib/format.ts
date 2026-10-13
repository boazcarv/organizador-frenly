import { format, formatDistanceToNowStrict, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PastelKey, ProjectIcon } from "./types";

export const locale = ptBR;

export function parse(value: string | Date): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** "12 out" */
export function formatShortDate(value: string | Date): string {
  return format(parse(value), "dd MMM", { locale: ptBR }).replace(".", "");
}

/** "seg, 12 de outubro" */
export function formatLongDate(value: string | Date): string {
  return format(parse(value), "EEE, d 'de' MMMM", { locale: ptBR }).replace(".", "");
}

/** "Outubro 2026" — capitalised month, used by the calendar header. */
export function formatMonthYear(value: string | Date): string {
  const raw = format(parse(value), "MMMM yyyy", { locale: ptBR });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** "14:30" */
export function formatTime(value: string | Date): string {
  return format(parse(value), "HH:mm", { locale: ptBR });
}

/** "12 out · 14:30" */
export function formatDateTime(value: string | Date): string {
  return `${formatShortDate(value)} · ${formatTime(value)}`;
}

/** "há 2 dias" */
export function formatRelative(value: string | Date): string {
  const target = parse(value);
  const days = Math.round(
    (startOfDay(target).getTime() - startOfDay(new Date()).getTime()) / 86_400_000,
  );
  if (days === 0) {
    return `hoje, ${formatTime(target)}`;
  }
  if (days === 1) return "amanhã";
  if (days === -1) return "ontem";
  return formatDistanceToNowStrict(target, { addSuffix: true, locale: ptBR });
}

/** "1h 24min" */
export function formatDurationLong(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/** "01:24:08" — tracker clock / duration cells */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/** 3532 → "3.532h" (pt-BR thousands separator) */
export function formatHours(hours: number): string {
  return `${new Intl.NumberFormat("pt-BR").format(Math.round(hours))}h`;
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${formatNumber(value, digits)}%`;
}

export function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${formatNumber(Math.abs(delta) * 100, 0)}%`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function firstName(name: string): string {
  return name.split(" ")[0];
}

export function isToday(value: string | Date): boolean {
  return isSameDay(parse(value), new Date());
}

export function isSameDayAs(a: string | Date, b: string | Date): boolean {
  return isSameDay(parse(a), parse(b));
}

export const pastelClasses: Record<PastelKey, string> = {
  peach: "bg-pastel-peach text-[#7A4526]",
  blue: "bg-pastel-blue text-[#234B78]",
  sage: "bg-pastel-sage text-[#20563A]",
  sand: "bg-pastel-sand text-[#6B5423]",
  lilac: "bg-pastel-lilac text-[#4B3378]",
};

export const pastelHex: Record<PastelKey, string> = {
  peach: "#F6D9C8",
  blue: "#CFE3F5",
  sage: "#D8EADF",
  sand: "#EFE3CB",
  lilac: "#E0D6F5",
};

export const projectIcons: Record<ProjectIcon, string> = {
  layers: "Layers",
  megaphone: "Megaphone",
  palette: "Palette",
  smartphone: "Smartphone",
  globe: "Globe",
  database: "Database",
  sparkles: "Sparkles",
  compass: "Compass",
};

export function truncate(value: string, max = 32): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
