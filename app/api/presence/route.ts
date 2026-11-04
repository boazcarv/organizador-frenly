import { getSessionUser } from "@/lib/server/auth";
import { ok, serverError, unauthorized } from "@/lib/server/http";
import { touchPresence } from "@/lib/server/repository";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    await touchPresence(user.id);
    return ok({ online: true });
  } catch (error) {
    return serverError(error);
  }
}
