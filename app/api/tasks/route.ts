import { badRequest, ok, readJson, serverError } from "@/lib/server/http";
import { createTask, listTasks, type CreateTaskInput } from "@/lib/server/repository";


export async function GET() {
  try {
    return ok(await listTasks());
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<CreateTaskInput>(request);
    if (!body.title || body.title.trim().length < 3) return badRequest("Título muito curto");
    if (!body.projectId) return badRequest("Escolha um projeto");
    if (!body.assignee) return badRequest("Escolha um responsável");
    if (!body.dueAt) return badRequest("Informe a data limite");

    const task = await createTask({
      title: body.title.trim(),
      projectId: String(body.projectId),
      status: (body.status ?? "backlog") as CreateTaskInput["status"],
      priority: (body.priority ?? "medium") as CreateTaskInput["priority"],
      assignee: String(body.assignee),
      dueAt: new Date(String(body.dueAt)).toISOString(),
    });
    return ok(task, 201);
  } catch (error) {
    return serverError(error);
  }
}
