import { cookies } from "next/headers";
import { SESSION_COOKIE, createSessionToken, isSecureRequest, sessionCookieOptions } from "@/lib/server/session";
import { badRequest, forbidden, ok, readJson, serverError } from "@/lib/server/http";
import { countUsers, createUser, validateEmail, validatePassword } from "@/lib/server/users";

/**
 * Public: tells the login screen whether this workspace still needs its first
 * account. It exposes nothing but that single boolean.
 */
export async function GET() {
  try {
    return ok({ needsSetup: (await countUsers()) === 0 });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * First run: creates the owner account.
 *
 * Deliberately refuses to do anything once an account exists — otherwise this
 * would be a public "make me an admin" endpoint.
 */
export async function POST(request: Request) {
  try {
    if ((await countUsers()) > 0) {
      return forbidden("Este workspace já tem uma conta. Faça login para continuar.");
    }

    const body = await readJson<{ name: string; email: string; password: string }>(request);

    const name = String(body.name ?? "").trim();
    if (name.length < 2) return badRequest("Informe seu nome");

    const emailProblem = validateEmail(body.email);
    if (emailProblem) return badRequest(emailProblem);

    const passwordProblem = validatePassword(body.password);
    if (passwordProblem) return badRequest(passwordProblem);

    const account = await createUser({
      name,
      email: String(body.email),
      password: String(body.password),
      role: "Fundador",
      isOwner: true,
    });

    const store = await cookies();
    store.set(
      SESSION_COOKIE,
      await createSessionToken(account.id),
      sessionCookieOptions(isSecureRequest(request.headers)),
    );

    return ok({ user: account }, 201);
  } catch (error) {
    return serverError(error);
  }
}
