import { resetDatabase } from "@/lib/server/db";
import { ok, serverError } from "@/lib/server/http";

/**
 * Restores the workspace to its seeded state. Handy for demos and for QA runs
 * that need a deterministic starting point — the UI never calls it.
 */
export async function POST() {
  try {
    const database = await resetDatabase();
    return ok({
      reset: true,
      projects: database.projects.length,
      tasks: database.tasks.length,
      timeEntries: database.timeEntries.length,
    });
  } catch (error) {
    return serverError(error);
  }
}
