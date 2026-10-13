import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/session";

/**
 * ---------------------------------------------------------------------------
 *  Auth gate
 * ---------------------------------------------------------------------------
 *
 *  Runs before every route. It verifies the *signature* of the session cookie
 *  only — no database, no shared module state — which keeps it cheap and safe
 *  to run on every request.
 *
 *  This is the outer door, not the whole lock: each API route still resolves the
 *  session against the database before touching data, so a valid cookie for a
 *  deleted account gets nowhere.
 *
 *  Next 16 renamed `middleware` to `proxy`; the convention changed, the job did
 *  not.
 */

/** Paths that must stay reachable without a session. */
const PUBLIC_PATHS = ["/login", "/setup"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const payload = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const authenticated = payload !== null;

  const isPublicPage = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  /* ------------------------------- API routes ------------------------------ */

  if (pathname.startsWith("/api")) {
    // The auth endpoints are how you get a session in the first place.
    if (pathname.startsWith("/api/auth/")) return NextResponse.next();
    if (authenticated) return NextResponse.next();

    return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
  }

  /* --------------------------------- Pages -------------------------------- */

  if (isPublicPage) {
    // Already signed in? The login screen has nothing to offer.
    if (!authenticated) return NextResponse.next();
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!authenticated) {
    const login = new URL("/login", request.url);
    // Come back to where you were headed after signing in.
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Everything except static assets, the image optimiser and the icon files —
   * a matcher that forgets these would block the CSS and leave a bare page.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
