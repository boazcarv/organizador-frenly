import { getSessionUser } from "@/lib/server/auth";
import { badRequest, ok, readJson, serverError, unauthorized } from "@/lib/server/http";
import { createTimeEntry, listTimeEntries, type CreateTimeEntryInput } from "@/lib/server/repository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok(await listTimeEntries());
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await readJson<CreateTimeEntryInput>(request);
    if (!body.projectId) return badRequest("Informe o projeto");
    if (typeof body.seconds !== "number" || body.seconds <= 0) {
      return badRequest("A sessão precisa de pelo menos 1 segundo");
    }

    // The session's owner is taken from the cookie, never from the payload —
    // otherwise anyone could log hours in someone else's name.
    const entry = await createTimeEntry(
      {
        projectId: String(body.projectId),
        seconds: body.seconds,
        startedAt: body.startedAt,
      },
      user.id,
    );
    return ok(entry, 201);
  } catch (error) {
    return serverError(error);
  }
}
