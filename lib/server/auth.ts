import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import { getSql } from "./sql";
import type { UserRow } from "./users";

/**
 * ---------------------------------------------------------------------------
 *  Authentication
 * ---------------------------------------------------------------------------
 */

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

/**
 * Hashes a password with scrypt and a per-user random salt.
 *
 * Format: `scrypt:<salt-hex>:<hash-hex>` — self-describing, so the parameters
 * can change later without invalidating accounts created today.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `${HASH_PREFIX}:${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Constant-time password check. Returns false for unknown/legacy formats. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [prefix, saltHex, hashHex] = stored.split(":");
  if (prefix !== HASH_PREFIX || !saltHex || !hashHex) return false;

  try {
    const expected = Buffer.from(hashHex, "hex");
    const derived = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Minimum accepted password length, enforced on both create and change. */
export const MIN_PASSWORD_LENGTH = 8;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isOwner: boolean;
}

/**
 * Resolves the signed-in user from the session cookie, or null.
 *
 * Wrapped in React's `cache` so a page that checks the session in a layout, a
 * page and a server action pays for the query once per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const payload = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const sql = await getSql();
  const rows = await sql.query<UserRow>(
    "select id, email, name, role, is_owner from users where id = $1",
    [payload.uid],
  );

  const row = rows[0];
  if (!row) return null;

  return { id: row.id, email: row.email, name: row.name, role: row.role, isOwner: row.is_owner };
});
