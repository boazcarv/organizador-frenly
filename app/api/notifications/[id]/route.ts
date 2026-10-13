import { getSessionUser } from "@/lib/server/auth";
import { badRequest, notFound, ok, readJson, serverError, unauthorized } from "@/lib/server/http";
import { setNotification } from "@/lib/server/repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await readJson<{ enabled: boolean }>(request);
    if (typeof body.enabled !== "boolean") return badRequest("Informe o estado da notificação");

    // Preferences are stored per account: the two of you can disagree.
    const settings = await setNotification(user.id, id, body.enabled);
    if (!settings.some((item) => item.id === id)) return notFound("Preferência não encontrada");
    return ok(settings);
  } catch (error) {
    if (error instanceof Error && error.message === "Preferência desconhecida") {
      return notFound("Preferência não encontrada");
    }
    return serverError(error);
  }
}
