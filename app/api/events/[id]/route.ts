import { getSessionUser } from "@/lib/server/auth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/server/http";
import { deleteEvent } from "@/lib/server/repository";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await context.params;
    if (!id) return badRequest("Compromisso inválido");
    const removed = await deleteEvent(id, user.name);
    if (!removed) return notFound("Compromisso não encontrado ou você não tem permissão para cancelá-lo");
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
