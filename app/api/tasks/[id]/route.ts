import { notFound, ok, readJson, serverError } from "@/lib/server/http";
import { updateTask } from "@/lib/server/repository";
import type { Task } from "@/lib/types";


type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await readJson<Task>(request);
    const updated = await updateTask(id, body);
    return updated ? ok(updated) : notFound("Tarefa não encontrada");
  } catch (error) {
    return serverError(error);
  }
}
