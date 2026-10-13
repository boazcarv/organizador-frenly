import { getSessionUser } from "@/lib/server/auth";
import { ok, serverError, unauthorized } from "@/lib/server/http";
import { getDashboard } from "@/lib/server/insights";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok(await getDashboard());
  } catch (error) {
    return serverError(error);
  }
}
