import { ok, serverError } from "@/lib/server/http";
import { getAnalytics } from "@/lib/server/repository";


export async function GET() {
  try {
    return ok(await getAnalytics());
  } catch (error) {
    return serverError(error);
  }
}
