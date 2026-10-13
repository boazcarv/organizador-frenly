import { ok, serverError } from "@/lib/server/http";
import { listAgenda, listEvents, listUpcoming } from "@/lib/server/repository";


export async function GET(request: Request) {
  try {
    const scope = new URL(request.url).searchParams.get("scope");
    if (scope === "agenda") return ok(await listAgenda());
    if (scope === "upcoming") return ok(await listUpcoming());
    return ok(await listEvents());
  } catch (error) {
    return serverError(error);
  }
}
