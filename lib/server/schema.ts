import "server-only";

import type { Sql } from "./sql";

/**
 * ---------------------------------------------------------------------------
 *  Schema
 * ---------------------------------------------------------------------------
 *
 *  Plain, idempotent DDL. It runs once per process on first query, which means
 *  a fresh database (a brand-new Neon branch, a wiped volume) comes up working
 *  without a separate migration step or a CLI to remember.
 *
 *  When the shape of the data changes, append to `MIGRATIONS` — never edit a
 *  statement that has already shipped.
 */

const TABLES = `
create table if not exists users (
  id             text primary key,
  email          text not null unique,
  name           text not null,
  role           text not null default '',
  company        text not null default '',
  plan           text not null default 'Plano Studio',
  timezone       text not null default 'America/Sao_Paulo',
  bio            text not null default '',
  color          text not null default 'sage',
  password_hash  text not null,
  is_owner       boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists projects (
  id           text primary key,
  name         text not null,
  type         text not null default '',
  owner        text not null default '',
  owners       text[] not null default '{}',
  status       text not null default 'pending',
  progress     integer not null default 0,
  color        text not null default 'sage',
  icon         text not null default 'sparkles',
  members      integer not null default 1,
  tasks_done   integer not null default 0,
  tasks_total  integer not null default 0,
  due_at       timestamptz not null,
  created_at   timestamptz not null default now()
);

create table if not exists tasks (
  id            text primary key,
  title         text not null,
  project_id    text references projects(id) on delete cascade,
  status        text not null default 'backlog',
  priority      text not null default 'medium',
  assignee      text not null default '',
  due_at        timestamptz not null,
  progress      integer not null default 0,
  attachments   integer not null default 0,
  comments      integer not null default 0,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists events (
  id          text primary key,
  title       text not null,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  owner       text not null default '',
  priority    text not null default 'normal',
  color       text not null default 'sage',
  tags        text[] not null default '{}',
  attendees   text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists time_entries (
  id          text primary key,
  project_id  text references projects(id) on delete cascade,
  user_id     text references users(id) on delete set null,
  seconds     integer not null default 0,
  started_at  timestamptz not null default now()
);

create table if not exists user_presence (
  user_id      text primary key references users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

create table if not exists notification_settings (
  user_id      text not null references users(id) on delete cascade,
  id           text not null,
  title        text not null,
  description  text not null default '',
  enabled      boolean not null default true,
  primary key (user_id, id)
);
`;

const INDEXES = `
create index if not exists tasks_project_idx        on tasks (project_id);
create index if not exists tasks_status_idx         on tasks (status);
create index if not exists tasks_completed_idx      on tasks (completed_at);
create index if not exists tasks_assignee_idx       on tasks (assignee);
create index if not exists events_start_idx         on events (start_at);
create index if not exists time_entries_started_idx on time_entries (started_at);
create index if not exists time_entries_project_idx on time_entries (project_id);
create index if not exists time_entries_user_idx    on time_entries (user_id);
`;

/** Ordered, additive migrations for databases created by an earlier version. */
const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "001_projects_owners_array",
    sql: `
      alter table projects add column if not exists owners text[] not null default '{}';
      update projects
         set owners = array[owner]
       where (owner <> '' and owner is not null)
         and (owners is null or array_length(owners, 1) is null or array_length(owners, 1) = 0);
    `,
  },
];

export async function bootstrapSchema(sql: Sql): Promise<void> {
  await sql.exec(TABLES);
  await sql.exec(INDEXES);

  if (MIGRATIONS.length === 0) return;

  await sql.exec(`
    create table if not exists schema_migrations (
      id         text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const applied = await sql.query<{ id: string }>("select id from schema_migrations");
  const done = new Set(applied.map((row) => row.id));

  for (const migration of MIGRATIONS) {
    if (done.has(migration.id)) continue;
    await sql.exec(migration.sql);
    await sql.query("insert into schema_migrations (id) values ($1)", [migration.id]);
  }
}
