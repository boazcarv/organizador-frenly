import { ok, serverError } from "@/lib/server/http";
import { listMembers } from "@/lib/server/repository";


export async function GET() {
  try {
    return ok(await listMembers());
  } catch (error) {
    return serverError(error);
  }
}
