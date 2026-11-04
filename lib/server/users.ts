import "server-only";

import type { Account, PastelKey } from "@/lib/types";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "./auth";
import { nextId } from "./ids";
import { getSql } from "./sql";

/**
 * ---------------------------------------------------------------------------
 *  Accounts
 * ---------------------------------------------------------------------------
 *
 *  An account is both a login and a member of the workspace: in a team of two
 *  there is no meaningful difference between "the people who can sign in" and
 *  "the people on the board", and keeping them in sync by hand would be the
 *  first thing to rot.
 */

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  company: string;
  plan: string;
  timezone: string;
  bio: string;
  color: PastelKey;
  password_hash: string;
  is_owner: boolean;
  created_at: Date | string;
}

/** Row → domain. The password hash never leaves this module. */
function toAccount(row: UserRow): Account {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    company: row.company,
    plan: row.plan,
    timezone: row.timezone,
    bio: row.bio,
    color: row.color,
    isOwner: row.is_owner,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function countUsers(): Promise<number> {
  const sql = await getSql();
  const rows = await sql.query<{ count: string }>("select count(*)::text as count from users");
  return Number(rows[0]?.count ?? "0");
}

export async function listUsers(): Promise<Account[]> {
  const sql = await getSql();
  const rows = await sql.query<UserRow>(
    "select * from users order by is_owner desc, created_at asc",
  );
  return rows.map(toAccount);
}

export async function getUserById(id: string): Promise<Account | undefined> {
  const sql = await getSql();
  const rows = await sql.query<UserRow>("select * from users where id = $1", [id]);
  return rows[0] ? toAccount(rows[0]) : undefined;
}

export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  const sql = await getSql();
  const rows = await sql.query<UserRow>("select * from users where lower(email) = lower($1)", [email]);
  return rows[0];
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: string;
  company?: string;
  isOwner?: boolean;
}

export class EmailTakenError extends Error {
  constructor() {
    super("Já existe uma conta com esse e-mail.");
    this.name = "EmailTakenError";
  }
}

export async function createUser(input: CreateUserInput): Promise<Account> {
  const email = input.email.trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) throw new EmailTakenError();

  const sql = await getSql();
  const passwordHash = await hashPassword(input.password);
  const rows = await sql.query<UserRow>(
    `insert into users (id, email, name, role, company, color, password_hash, is_owner)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning *`,
    [
      nextId("usr"),
      email,
      input.name.trim(),
      input.role?.trim() || "Membro",
      input.company?.trim() || "",
      pickColor(email),
      passwordHash,
      input.isOwner ?? false,
    ],
  );

  return toAccount(rows[0]);
}

/** Deterministic pastel per account, so avatars stay stable without a column. */
const PALETTE: PastelKey[] = ["peach", "blue", "sage", "sand", "lilac"];
function pickColor(seed: string): PastelKey {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100_000;
  }
  return PALETTE[hash % PALETTE.length];
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<Account, "name" | "role" | "company" | "plan" | "timezone" | "bio">>,
): Promise<Account | undefined> {
  const current = await getUserById(id);
  if (!current) return undefined;

  // E-mail is deliberately not editable here: it is the login, and changing it
  // silently would be the easiest way to lock yourself out.
  // JSON forms often omit fields that are not editable (for example `company`
  // on the profile screen). Do not let an explicit `undefined` erase the
  // persisted value and turn into SQL NULL for a NOT NULL column.
  const definedPatch = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as typeof patch;
  const next = { ...current, ...definedPatch, id: current.id };
  const sql = await getSql();
  const rows = await sql.query<UserRow>(
    `update users
        set name = $2, role = $3, company = $4, plan = $5, timezone = $6, bio = $7
      where id = $1
      returning *`,
    [id, next.name, next.role, next.company, next.plan, next.timezone, next.bio],
  );
  return rows[0] ? toAccount(rows[0]) : undefined;
}

export async function setPassword(id: string, password: string): Promise<void> {
  const sql = await getSql();
  const hash = await hashPassword(password);
  await sql.query("update users set password_hash = $2 where id = $1", [id, hash]);
}

export async function deleteUser(id: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query<{ id: string }>("delete from users where id = $1 returning id", [id]);
  return rows.length > 0;
}

/** Checks an email/password pair. Returns the account, or null. */
export async function authenticate(email: string, password: string): Promise<Account | null> {
  const row = await getUserByEmail(email.trim());
  if (!row) {
    // Spend roughly the same time as a real check so a wrong e-mail is not
    // distinguishable from a wrong password by response latency.
    await verifyPassword(password, "scrypt:00:00");
    return null;
  }
  const valid = await verifyPassword(password, row.password_hash);
  return valid ? toAccount(row) : null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}

export function validateEmail(email: unknown): string | null {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Informe um e-mail válido.";
  }
  return null;
}
