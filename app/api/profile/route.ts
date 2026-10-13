import { getSessionUser } from "@/lib/server/auth";
import { ok, readJson, serverError, unauthorized } from "@/lib/server/http";
import { getProfile, saveProfile } from "@/lib/server/repository";
import type { CurrentUser } from "@/lib/types";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok(await getProfile(user.id));
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await readJson<CurrentUser>(request);
    return ok(await saveProfile(user.id, body));
  } catch (error) {
    return serverError(error);
  }
}
