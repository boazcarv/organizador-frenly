import { chromium } from "playwright";

/**
 * QA scripts sign in with a real session.
 *
 * The app is behind a login now, so a browser that arrives without a cookie is
 * redirected to /login and every assertion fails for the wrong reason.
 *
 * Get a cookie once:
 *
 *   curl -s -c - -X POST http://localhost:3000/api/auth/login \
 *     -H 'content-type: application/json' \
 *     -d '{"email":"voce@empresa.com","password":"sua-senha"}' | grep frenly_session
 *
 * then export it:
 *
 *   export FRENLY_COOKIE="cole-o-valor-depois-de-frenly_session"
 *
 * SCRATCH=0 (default) keeps your workspace. SCRATCH=1 boots against a throwaway
 * in-memory database seeded with an owner account, which is what CI wants.
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

export function sessionCookie(base = BASE) {
  const value = process.env.FRENLY_COOKIE;
  if (!value) {
    console.error(
      "\n[frenly] FRENLY_COOKIE não definida.\n" +
        "Os testes precisam de uma sessão — veja o comentário em scripts/session.mjs.\n",
    );
    process.exit(1);
  }
  const { hostname } = new URL(base);
  return { name: "frenly_session", value, domain: hostname, path: "/", httpOnly: true, sameSite: "Lax" };
}

/** A browser context that is already signed in. */
export async function signedInContext(browser, options = {}) {
  return browser.newContext({
    ...options,
    storageState: { cookies: [sessionCookie()], origins: [] },
  });
}

export { BASE };
export { chromium };
