import { getSessionUser } from "@/lib/server/auth";
import { badRequest, ok, readJson, serverError, unauthorized } from "@/lib/server/http";
import { createEvent, listAgenda, listEvents, listUpcoming, type CreateEventInput } from "@/lib/server/repository";
import type { PastelKey } from "@/lib/types";

const colors: PastelKey[] = ["peach", "blue", "sage", "sand", "lilac"];

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const scope = new URL(request.url).searchParams.get("scope");
    if (scope === "agenda") return ok(await listAgenda());
    if (scope === "upcoming") return ok(await listUpcoming());
    return ok(await listEvents());
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await readJson<CreateEventInput>(request);

    const title = String(body.title ?? "").trim();
    if (title.length < 3) return badRequest("O título do evento precisa de 3 caracteres ou mais");

    const start = new Date(String(body.start));
    const end = new Date(String(body.end));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return badRequest("Informe data e horário do evento");
    }
    if (end.getTime() <= start.getTime()) return badRequest("O fim precisa ser depois do início");

    const event = await createEvent({
      title,
      start: start.toISOString(),
      end: end.toISOString(),
      // Defaults the form does not ask for: the person creating the event owns
      // it, and the colour cycles so consecutive events are distinguishable.
      owner: user.name,
      priority: body.priority === "high" ? "high" : "normal",
      color: body.color && colors.includes(body.color) ? body.color : colors[start.getDate() % colors.length],
      tags: [],
      attendees: body.attendees ?? [],
    });

    return ok(event, 201);
  } catch (error) {
    return serverError(error);
  }
}
