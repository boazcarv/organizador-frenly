import { getSessionUser } from "@/lib/server/auth";
import { notFound, ok, readJson, serverError, unauthorized } from "@/lib/server/http";
import { deleteTask, updateTask } from "@/lib/server/repository";
import type { Task } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await readJson<Task>(request);
    const updated = await updateTask(id, body);
    return updated ? ok(updated) : notFound("Tarefa não encontrada");
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const removed = await deleteTask(id);
    return removed ? ok({ id, removed: true }) : notFound("Tarefa não encontrada");
  } catch (error) {
    return serverError(error);
  }
}
