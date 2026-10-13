/**
 * ---------------------------------------------------------------------------
 *  Session tokens
 * ---------------------------------------------------------------------------
 *
 *  A session is a signed, self-contained token kept in an httpOnly cookie:
 *
 *      base64url(payload) . base64url(hmacSHA256(payload))
 *
 *  The payload carries only what the proxy needs to answer "is this request
 *  authenticated?" without touching the database — the user id and an expiry.
 *  Everything else (name, role, permissions) is loaded from the database on
 *  demand by `lib/server/auth.ts`.
 *
 *  Web Crypto is used on purpose: the same code runs in the Node.js runtime and
 *  in edge/proxy contexts, so there is no second implementation to drift.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SESSION_COOKIE = "frenly_session";

/** How long a session stays valid. Long enough to not nag a small team. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  /** user id */
  uid: string;
  /** issued at, seconds since epoch */
  iat: number;
  /** expires at, seconds since epoch */
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  // Backed by a plain ArrayBuffer on purpose: Web Crypto will not accept a view
  // that could be over a SharedArrayBuffer.
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/**
 * The signing key.
 *
 * In production `AUTH_SECRET` must be set: rotating it is what invalidates every
 * session, so it cannot live in the code. Locally we derive a stable placeholder
 * so `npm run dev` works on a fresh clone with no setup.
 */
function secret(): string {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;

  if (process.env.VERCEL) {
    throw new Error(
      "AUTH_SECRET não configurada. Gere um valor aleatório (openssl rand -base64 32) e defina " +
        "AUTH_SECRET nas variáveis de ambiente da Vercel — sem ela as sessões não podem ser assinadas.",
    );
  }

  if (fromEnv) {
    // Present but too short to be a real secret.
    console.warn("[frenly] AUTH_SECRET tem menos de 16 caracteres; use uma chave mais longa em produção.");
    return fromEnv;
  }

  return "frenly-development-secret-do-not-use-in-production";
}

let keyPromise: Promise<CryptoKey> | undefined;

function signingKey(): Promise<CryptoKey> {
  keyPromise ??= crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return keyPromise;
}

/** Signs a session token for `userId`. */
export async function createSessionToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { uid: userId, iat: now, exp: now + SESSION_MAX_AGE_SECONDS };
  const body = encoder.encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), body);
  return `${base64UrlEncode(body)}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/**
 * Verifies a token and returns its payload, or null when the token is missing,
 * malformed, tampered with or expired. Never throws — a bad cookie is simply
 * "not logged in".
 */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      base64UrlDecode(signature),
      base64UrlDecode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(decoder.decode(base64UrlDecode(body))) as SessionPayload;
    if (!payload?.uid || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 <= Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Cookie attributes.
 *
 * `secure` follows the actual protocol instead of NODE_ENV: a self-hosted
 * production build served over plain HTTP would otherwise set a cookie the
 * browser silently refuses, producing an unexplainable login loop.
 */
export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** Reads the real protocol of the request, honouring reverse proxies. */
export function isSecureRequest(headers: Headers): boolean {
  const forwarded = headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  return false;
}
