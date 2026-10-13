import { getSessionUser } from "@/lib/server/auth";
import { badRequest, forbidden, ok, readJson, serverError, unauthorized } from "@/lib/server/http";
import { createUser, listUsers, validateEmail, validatePassword } from "@/lib/server/users";

/**
 * The workspace's accounts.
 *
 * Creating one is how the second person gets in: the owner creates the login
 * and hands over the password, so there is no public sign-up form to secure.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok(await listUsers());
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!user.isOwner) return forbidden("Apenas o dono do workspace pode criar contas");

    const body = await readJson<{ name: string; email: string; password: string; role?: string }>(request);

    const name = String(body.name ?? "").trim();
    if (name.length < 2) return badRequest("Informe o nome da pessoa");

    const emailProblem = validateEmail(body.email);
    if (emailProblem) return badRequest(emailProblem);

    const passwordProblem = validatePassword(body.password);
    if (passwordProblem) return badRequest(passwordProblem);

    const account = await createUser({
      name,
      email: String(body.email),
      password: String(body.password),
      role: body.role ? String(body.role) : undefined,
      isOwner: false,
    });

    return ok({ user: account }, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "EmailTakenError") {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return serverError(error);
  }
}
