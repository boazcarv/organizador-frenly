import { cookies } from "next/headers";
import { SESSION_COOKIE, createSessionToken, isSecureRequest, sessionCookieOptions } from "@/lib/server/session";
import { badRequest, ok, readJson, serverError, unauthorized } from "@/lib/server/http";
import { authenticate } from "@/lib/server/users";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ email: string; password: string }>(request);
    if (!body.email || !body.password) return badRequest("Informe e-mail e senha");

    // scrypt hashing makes each attempt deliberately expensive, which is the
    // brute-force brake here; the message stays generic either way so it never
    // reveals whether an e-mail exists.
    const account = await authenticate(String(body.email), String(body.password));
    if (!account) return unauthorized("E-mail ou senha incorretos");

    const store = await cookies();
    store.set(
      SESSION_COOKIE,
      await createSessionToken(account.id),
      sessionCookieOptions(isSecureRequest(request.headers)),
    );

    return ok({ user: account });
  } catch (error) {
    return serverError(error);
  }
}
