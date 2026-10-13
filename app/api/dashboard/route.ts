import { ok, serverError } from "@/lib/server/http";
import { getDashboard } from "@/lib/server/repository";


export async function GET() {
  try {
    return ok(await getDashboard());
  } catch (error) {
    return serverError(error);
  }
}
