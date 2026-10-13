import { ok, readJson, serverError } from "@/lib/server/http";
import { getProfile, saveProfile } from "@/lib/server/repository";
import type { CurrentUser } from "@/lib/types";


export async function GET() {
  try {
    return ok(await getProfile());
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await readJson<CurrentUser>(request);
    return ok(await saveProfile(body));
  } catch (error) {
    return serverError(error);
  }
}
