import { getSessionUser } from "@/lib/server/auth";
import { ok, serverError, unauthorized } from "@/lib/server/http";
import { listMembers } from "@/lib/server/repository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok(await listMembers());
  } catch (error) {
    return serverError(error);
  }
}
