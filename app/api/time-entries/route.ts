import { badRequest, ok, readJson, serverError } from "@/lib/server/http";
import { createTimeEntry, listTimeEntries, type CreateTimeEntryInput } from "@/lib/server/repository";


export async function GET() {
  try {
    return ok(await listTimeEntries());
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<CreateTimeEntryInput>(request);
    if (!body.projectId) return badRequest("Informe o projeto");
    if (typeof body.seconds !== "number" || body.seconds <= 0) {
      return badRequest("A sessão precisa de pelo menos 1 segundo");
    }
    const entry = await createTimeEntry({
      projectId: String(body.projectId),
      seconds: body.seconds,
      startedAt: body.startedAt,
    });
    return ok(entry, 201);
  } catch (error) {
    return serverError(error);
  }
}
