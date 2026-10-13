"use client";

import { startOfDay } from "date-fns";

/**
 * Client-safe constants. Everything that is *data* now comes from the API —
 * these are only labels and static option lists.
 */

/**
 * Team filters.
 *
 * Presence ("quem está online agora") is deliberately absent: the app does not
 * track it, so a filter for it would only ever return an empty list. These cut
 * the roster by things the workspace actually records.
 */
export const teamFilters: { id: string; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "withTasks", label: "Com tarefas" },
  { id: "available", label: "Disponíveis" },
  { id: "thisWeek", label: "Ativos esta semana" },
];

export const timezones = [
  { value: "America/Sao_Paulo", label: "(GMT-3) São Paulo — Fortaleza" },
  { value: "America/Manaus", label: "(GMT-4) Manaus" },
  { value: "America/New_York", label: "(GMT-5) Nova York" },
  { value: "Europe/Lisbon", label: "(GMT+0) Lisboa" },
  { value: "Europe/Berlin", label: "(GMT+1) Berlim" },
  { value: "America/Los_Angeles", label: "(GMT-8) Los Angeles" },
];

export const projectTypes = ["Design", "Marketing", "Mobile", "Web", "Data", "Produto", "Pesquisa"] as const;

export const projectStatusOptions = [
  { value: "active", label: "Ativo" },
  { value: "waiting", label: "Em espera" },
  { value: "pending", label: "Pendente" },
  { value: "completed", label: "Concluído" },
] as const;

/**
 * Reference "today" for client-side date filters. Evaluated once per session so
 * renders stay pure (no `Date.now()` during render).
 */
export const APP_TODAY = startOfDay(new Date());
