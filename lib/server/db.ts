import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildSeed, type Database } from "./seed";

/**
 * Tiny JSON document store.
 *
 * Chosen over SQLite so the app has zero native dependencies: the database is a
 * single file under /data, written atomically (tmp file + rename) and cached in
 * memory for the process. Reads are cheap and writes are serialised through a
 * queue — plenty for a single-node product.
 */
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "frenly.json");
const TMP_PATH = path.join(DATA_DIR, "frenly.tmp.json");

let cache: Database | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function readFromDisk(): Promise<Database | null> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as Database;
  } catch {
    return null;
  }
}

async function persist(db: Database): Promise<void> {
  const payload = JSON.stringify(db, null, 2);
  await mkdir(DATA_DIR, { recursive: true });
  writeQueue = writeQueue.then(async () => {
    await writeFile(TMP_PATH, payload, "utf8");
    await rename(TMP_PATH, DB_PATH);
  });
  await writeQueue;
}

/** Loads the database, seeding it from the authored dataset on first run. */
export async function loadDatabase(): Promise<Database> {
  if (cache) return cache;

  const existing = await readFromDisk();
  if (existing) {
    cache = existing;
    return cache;
  }

  const seeded = buildSeed();
  await persist(seeded);
  cache = seeded;
  return cache;
}

/** Runs a mutation against the cached document and persists the result. */
export async function updateDatabase<T>(mutate: (db: Database) => T | Promise<T>): Promise<T> {
  const db = await loadDatabase();
  const result = await mutate(db);
  await persist(db);
  return result;
}

/** Replaces the stored document with a fresh seed (used by tests). */
export async function resetDatabase(): Promise<Database> {
  const seeded = buildSeed();
  await persist(seeded);
  cache = seeded;
  return cache;
}
