import "server-only";

import {
  addDays,
  addHours,
  addMinutes,
  endOfDay,
  setHours,
  setMinutes,
  startOfDay,
  subDays,
} from "date-fns";
import type {
  Activity,
  CalEvent,
  DonutSlice,
  Member,
  Metric,
  PastelKey,
  Project,
  ProjectProductivity,
  Task,
  ThroughputPoint,
  TimeEntry,
  WorkloadPeriod,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Anchor: everything is relative to "hoje"                                   */
/* -------------------------------------------------------------------------- */

export const TODAY = startOfDay(new Date());

/** ISO string for (today + dayOffset) at a given hour/minute. */
function at(dayOffset: number, hour = 9, minute = 0): string {
  return setMinutes(setHours(addDays(TODAY, dayOffset), hour), minute).toISOString();
}

/** Deterministic pseudo-random so server and client agree (no hydration drift). */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/*  Projects                                                                   */
/* -------------------------------------------------------------------------- */

export const projects: Project[] = [
  {
    id: "prj-aurora",
    name: "Aurora Design System",
    type: "Design",
    owner: "Marina Castro",
    status: "active",
    progress: 72,
    color: "sage",
    icon: "palette",
    members: 5,
    tasksDone: 38,
    tasksTotal: 52,
    dueAt: at(9),
  },
  {
    id: "prj-verao",
    name: "Campanha Verão 26",
    type: "Marketing",
    owner: "Larissa Monteiro",
    status: "active",
    progress: 45,
    color: "peach",
    icon: "megaphone",
    members: 4,
    tasksDone: 18,
    tasksTotal: 41,
    dueAt: at(21),
  },
  {
    id: "prj-mobile",
    name: "App Frenly Mobile",
    type: "Mobile",
    owner: "Rafael Lima",
    status: "active",
    progress: 38,
    color: "blue",
    icon: "smartphone",
    members: 6,
    tasksDone: 24,
    tasksTotal: 63,
    dueAt: at(34),
  },
  {
    id: "prj-portal",
    name: "Portal do Cliente",
    type: "Web",
    owner: "Beatriz Nogueira",
    status: "waiting",
    progress: 61,
    color: "lilac",
    icon: "globe",
    members: 4,
    tasksDone: 31,
    tasksTotal: 51,
    dueAt: at(12),
  },
  {
    id: "prj-metricas",
    name: "Métricas de Produto",
    type: "Data",
    owner: "Diego Albuquerque",
    status: "pending",
    progress: 12,
    color: "sand",
    icon: "database",
    members: 3,
    tasksDone: 4,
    tasksTotal: 34,
    dueAt: at(46),
  },
  {
    id: "prj-onboarding",
    name: "Onboarding Guiado",
    type: "Produto",
    owner: "Sofia Andrade",
    status: "active",
    progress: 84,
    color: "sage",
    icon: "sparkles",
    members: 3,
    tasksDone: 42,
    tasksTotal: 50,
    dueAt: at(5),
  },
  {
    id: "prj-checkout",
    name: "Checkout 2.0",
    type: "Produto",
    owner: "Caio Menezes",
    status: "active",
    progress: 52,
    color: "blue",
    icon: "layers",
    members: 5,
    tasksDone: 29,
    tasksTotal: 56,
    dueAt: at(28),
  },
  {
    id: "prj-rebranding",
    name: "Rebranding Casa Norte",
    type: "Design",
    owner: "Thiago Barreto",
    status: "pending",
    progress: 8,
    color: "sand",
    icon: "compass",
    members: 2,
    tasksDone: 2,
    tasksTotal: 26,
    dueAt: at(58),
  },
  {
    id: "prj-pesquisa",
    name: "Pesquisa com Usuários",
    type: "Pesquisa",
    owner: "Juliana Prado",
    status: "waiting",
    progress: 24,
    color: "lilac",
    icon: "compass",
    members: 2,
    tasksDone: 7,
    tasksTotal: 29,
    dueAt: at(16),
  },
];

export const projectById = new Map(projects.map((project) => [project.id, project]));

/* -------------------------------------------------------------------------- */
/*  Members                                                                    */
/* -------------------------------------------------------------------------- */

function activity(id: string, kind: Activity["kind"], label: string, dayOffset: number, hour: number, minute: number): Activity {
  return { id, kind, label, at: at(dayOffset, hour, minute) };
}

export const members: Member[] = [
  {
    id: "mem-marina",
    name: "Marina Castro",
    role: "Product Designer",
    company: "Frenly Studio",
    status: "active",
    online: true,
    projects: 4,
    tasks: 18,
    weeklyProgress: 78,
    color: "sage",
    hours: 132,
    efficiency: 94,
    rating: 4.9,
    lastActive: at(0, 14, 12),
    recent: true,
    skills: ["Design System", "Figma", "Prototipagem"],
    activities: [
      activity("act-m1", "file", "Publicou 12 tokens novos no Aurora DS", 0, 11, 40),
      activity("act-m2", "review", "Revisou “Empty states do checkout”", 0, 9, 5),
      activity("act-m3", "comment", "Comentou em “Revisar copy de preços”", -1, 17, 22),
    ],
  },
  {
    id: "mem-rafael",
    name: "Rafael Lima",
    role: "Engenheiro Front-end",
    company: "Órbita Labs",
    status: "busy",
    online: true,
    projects: 3,
    tasks: 22,
    weeklyProgress: 91,
    color: "blue",
    hours: 146,
    efficiency: 97,
    rating: 4.8,
    lastActive: at(0, 14, 26),
    recent: true,
    skills: ["React", "Next.js", "Motion"],
    activities: [
      activity("act-r1", "commit", "Mergeou “feat: command palette”", 0, 13, 58),
      activity("act-r2", "commit", "Abriu PR “fix: tracker drift”", 0, 10, 31),
      activity("act-r3", "call", "Daily do time Mobile", -1, 9, 30),
    ],
  },
  {
    id: "mem-beatriz",
    name: "Beatriz Nogueira",
    role: "Tech Lead",
    company: "Órbita Labs",
    status: "active",
    online: true,
    projects: 2,
    tasks: 14,
    weeklyProgress: 66,
    color: "lilac",
    hours: 128,
    efficiency: 92,
    rating: 4.9,
    lastActive: at(0, 13, 47),
    recent: true,
    skills: ["Arquitetura", "Node", "Code review"],
    activities: [
      activity("act-b1", "review", "Aprovou PR #482 no Portal do Cliente", 0, 13, 47),
      activity("act-b2", "commit", "Refatorou camada de cache", -1, 16, 2),
      activity("act-b3", "comment", "Planejou sprint do Portal do Cliente", -2, 11, 15),
    ],
  },
  {
    id: "mem-caio",
    name: "Caio Menezes",
    role: "Product Manager",
    company: "Casa Norte",
    status: "waiting",
    online: false,
    projects: 3,
    tasks: 11,
    weeklyProgress: 44,
    color: "sand",
    hours: 98,
    efficiency: 88,
    rating: 4.6,
    lastActive: at(0, 11, 20),
    recent: true,
    skills: ["Discovery", "Métricas", "Roadmap"],
    activities: [
      activity("act-c1", "call", "Kickoff do Checkout 2.0", 0, 11, 20),
      activity("act-c2", "comment", "Atualizou o roadmap do trimestre", -1, 15, 5),
      activity("act-c3", "file", "Subiu o PRD do Rebranding", -3, 10, 0),
    ],
  },
  {
    id: "mem-juliana",
    name: "Juliana Prado",
    role: "UX Researcher",
    company: "Frenly Studio",
    status: "active",
    online: true,
    projects: 2,
    tasks: 9,
    weeklyProgress: 71,
    color: "peach",
    hours: 104,
    efficiency: 91,
    rating: 4.7,
    lastActive: at(0, 12, 38),
    recent: true,
    skills: ["Entrevistas", "Testes de usabilidade", "Síntese"],
    activities: [
      activity("act-j1", "file", "Relatório da rodada 3 de entrevistas", 0, 12, 38),
      activity("act-j2", "call", "Teste de usabilidade com 5 pessoas", -1, 14, 0),
      activity("act-j3", "review", "Sintetizou insights do onboarding", -2, 17, 30),
    ],
  },
  {
    id: "mem-diego",
    name: "Diego Albuquerque",
    role: "Engenheiro de Dados",
    company: "Nuvem Tech",
    status: "pending",
    online: false,
    projects: 2,
    tasks: 8,
    weeklyProgress: 35,
    color: "blue",
    hours: 86,
    efficiency: 85,
    rating: 4.4,
    lastActive: at(-1, 18, 12),
    recent: false,
    skills: ["dbt", "SQL", "Airflow"],
    activities: [
      activity("act-d1", "commit", "Modelou eventos de produto", -1, 18, 12),
      activity("act-d2", "file", "Documentou o dicionário de dados", -2, 15, 40),
    ],
  },
  {
    id: "mem-larissa",
    name: "Larissa Monteiro",
    role: "Social Media",
    company: "Loop Digital",
    status: "busy",
    online: true,
    projects: 2,
    tasks: 16,
    weeklyProgress: 83,
    color: "peach",
    hours: 118,
    efficiency: 90,
    rating: 4.7,
    lastActive: at(0, 14, 2),
    recent: true,
    skills: ["Campanhas", "Copy", "Performance"],
    activities: [
      activity("act-l1", "file", "Aprovou 9 peças da Campanha Verão", 0, 14, 2),
      activity("act-l2", "comment", "Ajustou o calendário editorial", 0, 10, 12),
      activity("act-l3", "call", "Alinhamento com influenciadores", -2, 16, 30),
    ],
  },
  {
    id: "mem-thiago",
    name: "Thiago Barreto",
    role: "Designer de Marca",
    company: "Verde Studio",
    status: "waiting",
    online: false,
    projects: 1,
    tasks: 6,
    weeklyProgress: 29,
    color: "sand",
    hours: 74,
    efficiency: 84,
    rating: 4.5,
    lastActive: at(-1, 19, 40),
    recent: false,
    skills: ["Identidade", "Tipografia", "Ilustração"],
    activities: [
      activity("act-t1", "file", "Enviou 3 rotas de logotipo", -1, 19, 40),
      activity("act-t2", "comment", "Pediu referências para o cliente", -3, 11, 10),
    ],
  },
  {
    id: "mem-sofia",
    name: "Sofia Andrade",
    role: "Customer Success",
    company: "Praia Ventures",
    status: "active",
    online: true,
    projects: 3,
    tasks: 13,
    weeklyProgress: 88,
    color: "sage",
    hours: 138,
    efficiency: 95,
    rating: 5,
    lastActive: at(0, 14, 30),
    recent: true,
    skills: ["Onboarding", "Retenção", "Playbooks"],
    activities: [
      activity("act-s1", "call", "Onboarding com a conta Serrana", 0, 14, 30),
      activity("act-s2", "file", "Atualizou o playbook de ativação", 0, 8, 55),
      activity("act-s3", "review", "Revisou NPS de setembro", -1, 16, 45),
    ],
  },
];

export const memberById = new Map(members.map((member) => [member.id, member]));
export const memberByName = new Map(members.map((member) => [member.name, member]));

/* -------------------------------------------------------------------------- */
/*  Tasks (kanban)                                                             */
/* -------------------------------------------------------------------------- */

export const tasks: Task[] = [
  // backlog
  { id: "tsk-01", title: "Padronizar tokens de cor no Figma", projectId: "prj-aurora", status: "backlog", priority: "medium", assignee: "Marina Castro", dueAt: at(4), progress: 0, attachments: 2, comments: 5 },
  { id: "tsk-02", title: "Mapear jornada de ativação do cliente", projectId: "prj-pesquisa", status: "backlog", priority: "low", assignee: "Juliana Prado", dueAt: at(6), progress: 0, attachments: 1, comments: 2 },
  { id: "tsk-03", title: "Definir esquema de eventos de produto", projectId: "prj-metricas", status: "backlog", priority: "high", assignee: "Diego Albuquerque", dueAt: at(2), progress: 0, attachments: 3, comments: 8 },
  { id: "tsk-04", title: "Briefing de influenciadores do verão", projectId: "prj-verao", status: "backlog", priority: "medium", assignee: "Larissa Monteiro", dueAt: at(7), progress: 0, attachments: 0, comments: 1 },
  { id: "tsk-05", title: "Rotas de logotipo para o rebranding", projectId: "prj-rebranding", status: "backlog", priority: "low", assignee: "Thiago Barreto", dueAt: at(11), progress: 0, attachments: 4, comments: 3 },
  { id: "tsk-06", title: "Auditar contraste do design system", projectId: "prj-aurora", status: "backlog", priority: "high", assignee: "Marina Castro", dueAt: at(3), progress: 0, attachments: 1, comments: 6 },

  // progress
  { id: "tsk-07", title: "Implementar command palette global", projectId: "prj-mobile", status: "progress", priority: "high", assignee: "Rafael Lima", dueAt: at(1), progress: 64, attachments: 2, comments: 9 },
  { id: "tsk-08", title: "Refatorar tabela de faturas do portal", projectId: "prj-portal", status: "progress", priority: "medium", assignee: "Beatriz Nogueira", dueAt: at(2), progress: 45, attachments: 1, comments: 4 },
  { id: "tsk-09", title: "Fluxo de upgrade in-app", projectId: "prj-checkout", status: "progress", priority: "high", assignee: "Caio Menezes", dueAt: at(0), progress: 72, attachments: 5, comments: 11 },
  { id: "tsk-10", title: "Roteiro do tour guiado (5 passos)", projectId: "prj-onboarding", status: "progress", priority: "medium", assignee: "Sofia Andrade", dueAt: at(3), progress: 58, attachments: 2, comments: 3 },
  { id: "tsk-11", title: "Sincronizar horas com folha de pagamento", projectId: "prj-metricas", status: "progress", priority: "low", assignee: "Diego Albuquerque", dueAt: at(9), progress: 22, attachments: 0, comments: 2 },

  // review
  { id: "tsk-12", title: "Revisar copy da landing de preços", projectId: "prj-verao", status: "review", priority: "medium", assignee: "Larissa Monteiro", dueAt: at(1), progress: 90, attachments: 3, comments: 7 },
  { id: "tsk-13", title: "Empty states do checkout", projectId: "prj-checkout", status: "review", priority: "high", assignee: "Marina Castro", dueAt: at(0), progress: 95, attachments: 6, comments: 14 },
  { id: "tsk-14", title: "Testes E2E do fluxo de login", projectId: "prj-mobile", status: "review", priority: "high", assignee: "Rafael Lima", dueAt: at(2), progress: 88, attachments: 2, comments: 5 },
  { id: "tsk-15", title: "Relatório de pesquisa — rodada 3", projectId: "prj-pesquisa", status: "review", priority: "low", assignee: "Juliana Prado", dueAt: at(5), progress: 80, attachments: 4, comments: 4 },

  // done
  { id: "tsk-16", title: "Tokens de tipografia e escala", projectId: "prj-aurora", status: "done", priority: "medium", assignee: "Marina Castro", dueAt: at(-3), progress: 100, attachments: 3, comments: 6 },
  { id: "tsk-17", title: "Migrar autenticação para JWT", projectId: "prj-portal", status: "done", priority: "high", assignee: "Beatriz Nogueira", dueAt: at(-1), progress: 100, attachments: 1, comments: 8 },
  { id: "tsk-18", title: "Checklist de ativação do cliente", projectId: "prj-onboarding", status: "done", priority: "low", assignee: "Sofia Andrade", dueAt: at(-2), progress: 100, attachments: 2, comments: 3 },
  { id: "tsk-19", title: "Painel de NPS do trimestre", projectId: "prj-metricas", status: "done", priority: "medium", assignee: "Diego Albuquerque", dueAt: at(-4), progress: 100, attachments: 5, comments: 9 },
  { id: "tsk-20", title: "Reels de lançamento — 1ª onda", projectId: "prj-verao", status: "done", priority: "medium", assignee: "Larissa Monteiro", dueAt: at(-5), progress: 100, attachments: 7, comments: 12 },
  { id: "tsk-21", title: "Componente de área com gradiente", projectId: "prj-aurora", status: "progress", priority: "medium", assignee: "Rafael Lima", dueAt: at(4), progress: 35, attachments: 1, comments: 3 },
  { id: "tsk-22", title: "Pesquisa de satisfação pós-checkout", projectId: "prj-checkout", status: "review", priority: "low", assignee: "Juliana Prado", dueAt: at(6), progress: 76, attachments: 0, comments: 2 },
];

/* -------------------------------------------------------------------------- */
/*  Calendar events                                                            */
/* -------------------------------------------------------------------------- */

export const events: CalEvent[] = [
  { id: "evt-01", title: "Daily do time Aurora", start: at(0, 9, 30), end: at(0, 9, 50), owner: "Rafael Lima", priority: "normal", color: "sage", tags: ["ritual"], attendees: ["Marina Castro", "Rafael Lima", "Beatriz Nogueira"] },
  { id: "evt-02", title: "Revisão de design — Checkout", start: at(0, 11, 0), end: at(0, 12, 0), owner: "Marina Castro", priority: "high", color: "peach", tags: ["design"], attendees: ["Marina Castro", "Caio Menezes"] },
  { id: "evt-03", title: "1:1 Sofia × Larissa", start: at(0, 15, 30), end: at(0, 16, 0), owner: "Sofia Andrade", priority: "normal", color: "blue", tags: ["1:1"], attendees: ["Sofia Andrade", "Larissa Monteiro"] },
  { id: "evt-04", title: "Kickoff Campanha Verão 26", start: at(0, 17, 0), end: at(0, 18, 0), owner: "Larissa Monteiro", priority: "normal", color: "sand", tags: ["marketing"], attendees: ["Larissa Monteiro", "Thiago Barreto", "Caio Menezes"] },
  { id: "evt-05", title: "Sprint planning — Mobile", start: at(1, 10, 0), end: at(1, 11, 30), owner: "Beatriz Nogueira", priority: "high", color: "lilac", tags: ["planejamento"], attendees: ["Rafael Lima", "Beatriz Nogueira", "Caio Menezes"] },
  { id: "evt-06", title: "Teste de usabilidade — 5 pessoas", start: at(1, 14, 0), end: at(1, 16, 0), owner: "Juliana Prado", priority: "normal", color: "blue", tags: ["pesquisa"], attendees: ["Juliana Prado", "Marina Castro"] },
  { id: "evt-07", title: "Demo semanal com stakeholders", start: at(2, 16, 0), end: at(2, 17, 0), owner: "Caio Menezes", priority: "normal", color: "sage", tags: ["demo"], attendees: ["Caio Menezes", "Sofia Andrade", "Marina Castro", "Rafael Lima"] },
  { id: "evt-08", title: "Go-live Onboarding Guiado", start: at(3, 9, 0), end: at(3, 10, 0), owner: "Sofia Andrade", priority: "high", color: "peach", tags: ["lançamento"], attendees: ["Sofia Andrade", "Rafael Lima"] },
  { id: "evt-09", title: "Workshop de métricas", start: at(5, 13, 30), end: at(5, 15, 30), owner: "Diego Albuquerque", priority: "normal", color: "sand", tags: ["dados"], attendees: ["Diego Albuquerque", "Caio Menezes", "Beatriz Nogueira"] },
  { id: "evt-10", title: "Retrospectiva do trimestre", start: at(8, 15, 0), end: at(8, 16, 30), owner: "Beatriz Nogueira", priority: "normal", color: "lilac", tags: ["ritual"], attendees: ["Beatriz Nogueira", "Marina Castro", "Rafael Lima", "Sofia Andrade"] },
  { id: "evt-11", title: "Apresentação Rebranding Casa Norte", start: at(9, 10, 0), end: at(9, 11, 0), owner: "Thiago Barreto", priority: "high", color: "sand", tags: ["cliente"], attendees: ["Thiago Barreto", "Caio Menezes"] },
  { id: "evt-12", title: "Planejamento de conteúdo — Novembro", start: at(11, 14, 0), end: at(11, 15, 0), owner: "Larissa Monteiro", priority: "normal", color: "peach", tags: ["marketing"], attendees: ["Larissa Monteiro", "Thiago Barreto"] },
  { id: "evt-13", title: "Revisão de arquitetura do Portal", start: at(12, 11, 0), end: at(12, 12, 0), owner: "Beatriz Nogueira", priority: "normal", color: "blue", tags: ["tech"], attendees: ["Beatriz Nogueira", "Rafael Lima"] },
  { id: "evt-14", title: "Onboarding conta Serrana", start: at(15, 9, 30), end: at(15, 10, 30), owner: "Sofia Andrade", priority: "high", color: "sage", tags: ["cliente"], attendees: ["Sofia Andrade", "Caio Menezes"] },
  { id: "evt-15", title: "Café de produto (time todo)", start: at(-2, 16, 30), end: at(-2, 17, 30), owner: "Marina Castro", priority: "normal", color: "sage", tags: ["cultura"], attendees: ["Marina Castro", "Rafael Lima", "Juliana Prado"] },
  { id: "evt-16", title: "Auditoria de acessibilidade", start: at(-4, 10, 0), end: at(-4, 11, 0), owner: "Rafael Lima", priority: "normal", color: "blue", tags: ["qualidade"], attendees: ["Rafael Lima", "Marina Castro"] },
  { id: "evt-17", title: "Sincronização com cliente Loop", start: at(-6, 15, 0), end: at(-6, 16, 0), owner: "Larissa Monteiro", priority: "normal", color: "sand", tags: ["cliente"], attendees: ["Larissa Monteiro", "Caio Menezes"] },
];

/* -------------------------------------------------------------------------- */
/*  Time entries (tracker + analytics)                                         */
/* -------------------------------------------------------------------------- */

const trackedProjects = ["prj-aurora", "prj-mobile", "prj-checkout", "prj-portal", "prj-onboarding", "prj-verao", "prj-metricas"];

export const timeEntries: TimeEntry[] = (() => {
  const random = mulberry32(20261012);
  const entries: TimeEntry[] = [];
  for (let dayOffset = -20; dayOffset <= 0; dayOffset += 1) {
    const sessions = 2 + Math.floor(random() * 3);
    for (let session = 0; session < sessions; session += 1) {
      const projectId = trackedProjects[Math.floor(random() * trackedProjects.length)];
      const seconds = Math.round((0.6 + random() * 3.4) * 3600);
      const hour = 8 + session * 3 + Math.floor(random() * 2);
      entries.push({
        id: `te-${dayOffset}-${session}`,
        projectId,
        seconds,
        startedAt: at(dayOffset, Math.min(hour, 20), Math.floor(random() * 60)),
      });
    }
  }
  return entries;
})();

/** Tracker's initial value: part of a session already in progress (01:24:08). */
export const TRACKER_SEED_SECONDS = 5048;

/* -------------------------------------------------------------------------- */
/*  Dashboard: stat cards, productivity, reminders, collaborators              */
/* -------------------------------------------------------------------------- */

export const dashboardStats = {
  total: projects.length,
  active: projects.filter((project) => project.status === "active").length,
  waiting: projects.filter((project) => project.status === "waiting").length,
  pending: projects.filter((project) => project.status === "pending").length,
  completed: 3,
  inProgress: projects.filter((project) => project.status === "active" || project.status === "waiting").length,
  /** average progress across every project in the workspace */
  completionRate: Math.round(
    projects.reduce((total, project) => total + project.progress, 0) / projects.length,
  ),
};

export interface Reminder {
  id: string;
  title: string;
  project: string;
  start: string;
  end: string;
  color: PastelKey;
  attendees: string[];
}

export const reminders: Reminder[] = [
  { id: "rem-01", title: "Revisão de design — Checkout", project: "Checkout 2.0", start: at(0, 11, 0), end: at(0, 12, 0), color: "peach", attendees: ["Marina Castro", "Caio Menezes"] },
  { id: "rem-02", title: "Daily do time Aurora", project: "Aurora Design System", start: at(1, 9, 30), end: at(1, 9, 50), color: "sage", attendees: ["Rafael Lima", "Beatriz Nogueira"] },
  { id: "rem-03", title: "Demo semanal com stakeholders", project: "Portal do Cliente", start: at(2, 16, 0), end: at(2, 17, 0), color: "blue", attendees: ["Caio Menezes", "Sofia Andrade"] },
];

export interface ProductivityPeriod {
  id: string;
  label: string;
  bars: ProjectProductivity[];
}

function bars(values: [string, number, number][], currentFrom: number): ProjectProductivity[] {
  return values.map(([label, current, previous], index) => ({
    id: `bar-${label}-${index}`,
    label,
    current,
    previous,
    isCurrent: index >= currentFrom,
  }));
}

export const productivityPeriods: ProductivityPeriod[] = [
  {
    id: "out",
    label: "Outubro 2026",
    bars: bars(
      [
        ["S1", 6, 4],
        ["S2", 8, 5],
        ["S3", 5, 6],
        ["S4", 9, 7],
        ["S5", 7, 5],
        ["S6", 10, 8],
        ["S7", 8, 6],
        ["S8", 11, 9],
        ["S9", 9, 7],
        ["S10", 12, 8],
        ["S11", 10, 9],
        ["S12", 11, 10],
      ],
      7,
    ),
  },
  {
    id: "set",
    label: "Setembro 2026",
    bars: bars(
      [
        ["S1", 4, 3],
        ["S2", 6, 4],
        ["S3", 7, 5],
        ["S4", 5, 5],
        ["S5", 8, 6],
        ["S6", 7, 7],
        ["S7", 9, 7],
        ["S8", 8, 6],
        ["S9", 10, 8],
        ["S10", 9, 8],
        ["S11", 11, 9],
        ["S12", 10, 9],
      ],
      6,
    ),
  },
  {
    id: "ago",
    label: "Agosto 2026",
    bars: bars(
      [
        ["S1", 3, 2],
        ["S2", 5, 4],
        ["S3", 4, 4],
        ["S4", 6, 5],
        ["S5", 5, 5],
        ["S6", 7, 6],
        ["S7", 8, 6],
        ["S8", 7, 7],
        ["S9", 9, 7],
        ["S10", 8, 8],
      ],
      5,
    ),
  },
];

/* -------------------------------------------------------------------------- */
/*  Analytics                                                                  */
/* -------------------------------------------------------------------------- */

export const analyticsMetrics: Metric[] = [
  { key: "hours", label: "Horas rastreadas", value: 3532, delta: 0.12, format: "hours", spark: [32, 40, 36, 52, 48, 61, 58, 70, 66, 78, 74, 86] },
  { key: "tasks", label: "Tarefas concluídas", value: 248, delta: 0.08, format: "number", spark: [18, 22, 19, 28, 26, 34, 30, 38, 35, 42, 44, 51] },
  { key: "meetings", label: "Reuniões", value: 96, delta: -0.04, format: "number", spark: [14, 12, 16, 13, 15, 11, 13, 12, 10, 11, 9, 8] },
  { key: "efficiency", label: "Eficiência", value: 91, delta: 0.05, format: "percent", spark: [74, 76, 78, 77, 80, 82, 81, 84, 86, 85, 88, 91] },
];

export const throughput: ThroughputPoint[] = (() => {
  const base = [4, 5, 6, 5, 7, 8, 7, 9, 8, 10, 9, 11, 10, 12];
  return base.map((value, index) => {
    const previous = Math.max(1, value - 2 + ((index % 3) - 1));
    const window = base.slice(Math.max(0, index - 6), index + 1);
    const average = window.reduce((total, item) => total + item, 0) / window.length;
    return {
      label: index % 2 === 0 ? `S${index + 1}` : "",
      date: addDays(TODAY, index - 13).toISOString(),
      current: value,
      previous,
      average: Number(average.toFixed(1)),
    };
  });
})();

export const donutSlices: DonutSlice[] = [
  { key: "dev", label: "Desenvolvimento", hours: 1284, color: "var(--accent)" },
  { key: "design", label: "Design", hours: 842, color: "var(--accent-strong)" },
  { key: "meetings", label: "Reuniões", hours: 618, color: "#1E4EA2" },
  { key: "research", label: "Pesquisa", hours: 472, color: "#E0A63C" },
  { key: "admin", label: "Administrativo", hours: 316, color: "#9AA6A1" },
];

export const workload: WorkloadPeriod = {
  labels: ["Ago", "Set", "Out", "Nov"],
  rows: [
    { id: "wl-rafael", name: "Rafael Lima", color: "blue", values: [92, 118, 146, 130], total: 486 },
    { id: "wl-marina", name: "Marina Castro", color: "sage", values: [88, 104, 132, 122], total: 446 },
    { id: "wl-beatriz", name: "Beatriz Nogueira", color: "lilac", values: [76, 96, 128, 118], total: 418 },
    { id: "wl-larissa", name: "Larissa Monteiro", color: "peach", values: [64, 88, 118, 110], total: 380 },
    { id: "wl-sofia", name: "Sofia Andrade", color: "sand", values: [58, 82, 104, 96], total: 340 },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Settings + current user                                                    */
/* -------------------------------------------------------------------------- */

export interface CurrentUser {
  id: string;
  name: string;
  role: string;
  email: string;
  company: string;
  plan: string;
  timezone: string;
  bio: string;
  color: PastelKey;
}

export const currentUser: CurrentUser = {
  id: "usr-marina",
  name: "Marina Castro",
  role: "Product Designer",
  email: "marina@frenly.studio",
  company: "Frenly Studio",
  plan: "Plano Studio",
  timezone: "America/Sao_Paulo",
  bio: "Desenho produto na Frenly Studio. Gosto de fluxos curtos, métricas honestas e times que escrevem antes de construir.",
  color: "peach",
};

export const timezones = [
  { value: "America/Sao_Paulo", label: "(GMT-3) São Paulo — Fortaleza" },
  { value: "America/Manaus", label: "(GMT-4) Manaus" },
  { value: "America/New_York", label: "(GMT-5) Nova York" },
  { value: "Europe/Lisbon", label: "(GMT+0) Lisboa" },
  { value: "Europe/Berlin", label: "(GMT+1) Berlim" },
  { value: "America/Los_Angeles", label: "(GMT-8) Los Angeles" },
];

export interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export const notificationSettings: NotificationSetting[] = [
  {
    id: "notif-digest",
    title: "Resumo diário por e-mail",
    description: "Um e-mail às 8h com prazos, menções e o que mudou desde ontem.",
    enabled: true,
  },
  {
    id: "notif-mentions",
    title: "Menções e comentários",
    description: "Avise na hora quando alguém mencionar você em uma tarefa ou documento.",
    enabled: true,
  },
  {
    id: "notif-tracker",
    title: "Lembrete do time tracker",
    description: "Se você esquecer o cronômetro rodando por mais de 4 horas, o Frenly avisa.",
    enabled: false,
  },
];

export interface TeamFilter {
  id: string;
  label: string;
}

export const teamFilters: TeamFilter[] = [
  { id: "all", label: "Todos" },
  { id: "online", label: "Online" },
  { id: "recent", label: "Recentes" },
  { id: "top", label: "Melhor avaliados" },
  { id: "now", label: "Online agora" },
];

/* -------------------------------------------------------------------------- */
/*  Derived helpers used by pages                                              */
/* -------------------------------------------------------------------------- */

export function projectHours(projectId: string): number {
  return timeEntries
    .filter((entry) => entry.projectId === projectId)
    .reduce((total, entry) => total + entry.seconds, 0) / 3600;
}

export const myTasks = tasks.filter((task) => task.assignee === "Marina Castro");

export const upcomingEvents = [...events]
  .filter((event) => new Date(event.start).getTime() >= TODAY.getTime())
  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

export const todayEvents = events
  .filter((event) => new Date(event.start) >= TODAY && new Date(event.start) <= endOfDay(TODAY))
  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

export const recentTimeEntries = [...timeEntries]
  .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  .slice(0, 8);

/** Next reminder relative to now — falls back to the first one. */
export const nextReminder =
  upcomingEvents.find((event) => new Date(event.start) >= addMinutes(new Date(), -30)) ?? events[0];

export const weekWindow = {
  from: subDays(TODAY, 6),
  to: endOfDay(TODAY),
  hours: Math.round(
    timeEntries
      .filter((entry) => new Date(entry.startedAt) >= subDays(TODAY, 6))
      .reduce((total, entry) => total + entry.seconds, 0) / 3600,
  ),
};

export const trackerFallbackStart = subHoursSafe(TRACKER_SEED_SECONDS);

function subHoursSafe(seconds: number): string {
  return addHours(new Date(), -seconds / 3600).toISOString();
}
