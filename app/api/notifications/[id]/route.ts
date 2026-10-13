import { badRequest, ok, readJson, serverError } from "@/lib/server/http";
import { setNotification } from "@/lib/server/repository";


export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await readJson<{ enabled: boolean }>(request);
    if (typeof body.enabled !== "boolean") return badRequest("Informe o estado da notificação");
    return ok(await setNotification(id, body.enabled));
  } catch (error) {
    return serverError(error);
  }
}
