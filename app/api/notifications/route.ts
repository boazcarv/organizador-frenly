import { ok, serverError } from "@/lib/server/http";
import { listNotifications } from "@/lib/server/repository";


export async function GET() {
  try {
    return ok(await listNotifications());
  } catch (error) {
    return serverError(error);
  }
}
