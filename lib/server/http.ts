import "server-only";

/** Shared JSON helpers so every route answers with the same contract. */
export function ok<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function notFound(message = "Recurso não encontrado"): Response {
  return Response.json({ error: message }, { status: 404 });
}

export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Faça login para continuar"): Response {
  return Response.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Sua conta não tem acesso a este recurso"): Response {
  return Response.json({ error: message }, { status: 403 });
}

export function conflict(message: string): Response {
  return Response.json({ error: message }, { status: 409 });
}

export function serverError(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  return Response.json({ error: message }, { status: 500 });
}

/** Narrow, dependency-free body reader for the write endpoints. */
export async function readJson<T extends object>(request: Request): Promise<Partial<T>> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object") return {};
    return body as Partial<T>;
  } catch {
    return {};
  }
}
