import "server-only";

import { mkdir } from "node:fs/promises";
import { bootstrapSchema } from "./schema";

/**
 * ---------------------------------------------------------------------------
 *  SQL transport
 * ---------------------------------------------------------------------------
 *
 *  One thin interface, two drivers:
 *
 *  - `pg`      → any real PostgreSQL (Neon, Supabase, Railway, RDS…).
 *                Used whenever DATABASE_URL is set. This is what runs on Vercel.
 *  - `PGlite`  → the same PostgreSQL compiled to WASM, running in-process.
 *                Used for local development and previews so the project still
 *                starts with zero configuration (`npm run dev` and go).
 *
 *  Both speak the same SQL, so there is no second code path to keep honest:
 *  the queries in repository.ts are the ones that run in production.
 *
 *  Drivers are imported lazily so a deployment on `pg` never ships the WASM
 *  engine, and vice versa.
 */

export interface Sql {
  /** Runs a parameterised query and returns the rows. */
  query<T = Record<string, unknown>>(text: string, params?: readonly unknown[]): Promise<T[]>;
  /** Runs one or more statements without parameters (DDL / migrations). */
  exec(text: string): Promise<void>;
  /** Runs `fn` inside a transaction, committing on success. */
  transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
}

/** True when the process is a build/prerender step rather than a live request. */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function driverName(): "pg" | "pglite" {
  if (process.env.DATABASE_URL) return "pg";
  return "pglite";
}

/* -------------------------------------------------------------------------- */
/*  pg driver                                                                  */
/* -------------------------------------------------------------------------- */

async function createPgSql(): Promise<Sql> {
  const { Pool } = await import("pg");
  const connectionString = process.env.DATABASE_URL as string;

  // Serverless platforms scale by instance: a large pool per instance would
  // exhaust the database's connection limit. One connection per instance, and
  // the platform's pooler (Neon/Supabase give you one) does the real pooling.
  const serverless = Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  const needsSsl = !/localhost|127\.0\.0\.1/.test(connectionString) && !/sslmode=/.test(connectionString);

  const pool = new Pool({
    connectionString,
    max: serverless ? 1 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    ...(needsSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  });

  // A pool-level error listener keeps an idle-client failure from crashing the
  // whole server process (pg emits these on the pool, not on the query).
  pool.on("error", (error) => {
    console.error("[frenly] erro no pool do Postgres:", error.message);
  });

  const sql: Sql = {
    async query<T>(text: string, params: readonly unknown[] = []) {
      const result = await pool.query(text, params as unknown[]);
      return result.rows as T[];
    },
    async exec(text: string) {
      await pool.query(text);
    },
    async transaction<T>(fn: (tx: Sql) => Promise<T>) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const tx: Sql = {
          async query<R>(text: string, params: readonly unknown[] = []) {
            const result = await client.query(text, params as unknown[]);
            return result.rows as R[];
          },
          exec: (text: string) => client.query(text).then(() => undefined),
          transaction: (inner) => inner(tx),
        };
        const value = await fn(tx);
        await client.query("commit");
        return value;
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
  };

  return sql;
}

/* -------------------------------------------------------------------------- */
/*  PGlite driver (local development / preview)                                */
/* -------------------------------------------------------------------------- */

async function createPgliteSql(): Promise<Sql> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = process.env.PGLITE_DATA_DIR ?? `${process.cwd()}/data/pglite`;

  let instance: InstanceType<typeof PGlite>;

  if (process.env.PGLITE_MEMORY === "1") {
    instance = new PGlite();
  } else {
    try {
      // PGlite creates the database inside the directory but not the directory
      // itself, so on a fresh clone it has to exist first.
      await mkdir(dataDir, { recursive: true });
      instance = new PGlite(dataDir);
      await instance.waitReady;
    } catch (error) {
      // The on-disk engine takes an exclusive lock on its directory, so a second
      // process (another `next dev`, a stray worker) would fail to boot and take
      // the whole app down. Falling back to memory keeps the app usable — the
      // data just won't survive a restart, which is the right trade locally.
      console.warn(
        `[frenly] PGlite não pôde abrir ${dataDir} — seguindo em memória (os dados não persistem).`,
        error instanceof Error ? error.message : error,
      );
      instance = new PGlite();
    }
  }

  await instance.waitReady;

  // PGlite runs every statement on one in-process connection, so the driver
  // itself is what a transaction is scoped to.
  const driver: Sql = {
    async query<T>(text: string, params: readonly unknown[] = []) {
      const result = await instance.query<T>(text, params as unknown[]);
      return result.rows;
    },
    async exec(text: string) {
      await instance.exec(text);
    },
    async transaction<T>(fn: (tx: Sql) => Promise<T>) {
      await instance.exec("begin");
      try {
        const value = await fn(driver);
        await instance.exec("commit");
        return value;
      } catch (error) {
        await instance.exec("rollback").catch(() => undefined);
        throw error;
      }
    },
  };

  return driver;
}

/* -------------------------------------------------------------------------- */
/*  singleton                                                                  */
/* -------------------------------------------------------------------------- */

declare global {
  var __frenlySql: Promise<Sql> | undefined;
}

async function create(): Promise<Sql> {
  if (driverName() === "pg") return createPgSql();

  // On Vercel (or any read-only filesystem) an unconfigured DATABASE_URL is a
  // deployment mistake, not a demo mode: fail loudly, with the fix in the text.
  if (process.env.VERCEL && !isBuildPhase()) {
    throw new Error(
      "DATABASE_URL não configurada. Crie um Postgres (Neon, Supabase, etc.) e defina a variável " +
        "DATABASE_URL no projeto da Vercel — sem ela o workspace não tem onde gravar.",
    );
  }

  return createPgliteSql();
}

async function connect(): Promise<Sql> {
  const sql = await create();
  // Idempotent DDL, once per process.
  await bootstrapSchema(sql);
  return sql;
}

/**
 * Returns the shared connection. Cached on globalThis so Next's dev server can
 * re-evaluate modules on change without opening a new pool every time.
 */
export function getSql(): Promise<Sql> {
  globalThis.__frenlySql ??= connect().catch((error: unknown) => {
    // Don't cache a broken connection: the next request should retry.
    globalThis.__frenlySql = undefined;
    throw error;
  });
  return globalThis.__frenlySql;
}
