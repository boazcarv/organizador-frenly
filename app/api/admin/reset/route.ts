import { getSessionUser } from "@/lib/server/auth";
import { forbidden, ok, serverError, unauthorized } from "@/lib/server/http";
import { resetWorkspace } from "@/lib/server/repository";

/**
 * Empties the workspace (projects, tasks, events, tracked time) while keeping
 * every account. Owner only: it used to be an open POST, which meant anyone who
 * found the URL could wipe the data.
 */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!user.isOwner) return forbidden("Apenas o dono do workspace pode zerar os dados");

    await resetWorkspace();
    return ok({ reset: true });
  } catch (error) {
    return serverError(error);
  }
}
