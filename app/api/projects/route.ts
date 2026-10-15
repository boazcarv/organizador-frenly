import { getSessionUser } from "@/lib/server/auth";
import { badRequest, ok, readJson, serverError, unauthorized } from "@/lib/server/http";
import { createProject, listProjects, type CreateProjectInput } from "@/lib/server/repository";

const statuses = ["active", "waiting", "pending", "completed"];

function validate(input: Partial<CreateProjectInput>): string | null {
  if (!input.name || input.name.trim().length < 3) return "O nome do projeto precisa de 3 caracteres ou mais";
  if (!input.type) return "Informe o tipo do projeto";
  const hasOwners = (Array.isArray(input.owners) && input.owners.length > 0) || Boolean(input.owner);
  if (!hasOwners) return "Escolha pelo menos um responsável";
  if (!input.dueAt || Number.isNaN(new Date(input.dueAt).getTime())) return "Data limite inválida";
  if (!input.status || !statuses.includes(input.status)) return "Status inválido";
  return null;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok(await listProjects());
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await readJson<CreateProjectInput>(request);
    const problem = validate(body);
    if (problem) return badRequest(problem);

    const rawOwners = Array.isArray(body.owners) && body.owners.length > 0
      ? body.owners.map(String)
      : body.owner
        ? [String(body.owner)]
        : [];
    const normalizedOwners = Array.from(new Set(rawOwners.map((item) => item.trim()).filter(Boolean)));

    const project = await createProject({
      name: String(body.name).trim(),
      type: String(body.type),
      owner: normalizedOwners[0] ?? (body.owner ? String(body.owner) : ""),
      owners: normalizedOwners,
      status: body.status as CreateProjectInput["status"],
      dueAt: new Date(String(body.dueAt)).toISOString(),
      progress: typeof body.progress === "number" ? Math.min(100, Math.max(0, body.progress)) : 0,
      color: body.color,
      icon: body.icon,
    });
    return ok(project, 201);
  } catch (error) {
    return serverError(error);
  }
}
