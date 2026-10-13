import { getSessionUser } from "@/lib/server/auth";
import { badRequest, notFound, ok, readJson, serverError, unauthorized } from "@/lib/server/http";
import { deleteProject, getProject, updateProject } from "@/lib/server/repository";
import type { Project } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const project = await getProject(id);
    return project ? ok(project) : notFound("Projeto não encontrado");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await readJson<Project>(request);
    if (body.progress !== undefined && (body.progress < 0 || body.progress > 100)) {
      return badRequest("O progresso precisa estar entre 0 e 100");
    }
    const updated = await updateProject(id, body);
    return updated ? ok(updated) : notFound("Projeto não encontrado");
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const project = await getProject(id);
    if (!project) return notFound("Projeto não encontrado");
    return ok(await deleteProject(id));
  } catch (error) {
    return serverError(error);
  }
}
