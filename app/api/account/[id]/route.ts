import { getSessionUser } from "@/lib/server/auth";
import { badRequest, forbidden, notFound, ok, readJson, serverError, unauthorized } from "@/lib/server/http";
import { deleteUser, getUserById, setPassword, updateUser, validatePassword } from "@/lib/server/users";

type Params = { params: Promise<{ id: string }> };

/**
 * Editing an account: yourself always, other people only if you own the
 * workspace. Changing your own password requires the current one.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const isSelf = user.id === id;
    if (!isSelf && !user.isOwner) return forbidden("Você só pode editar a sua própria conta");

    const target = await getUserById(id);
    if (!target) return notFound("Conta não encontrada");

    const body = await readJson<{
      name?: string;
      role?: string;
      password?: string;
      currentPassword?: string;
    }>(request);

    if (body.password !== undefined) {
      const problem = validatePassword(body.password);
      if (problem) return badRequest(problem);

      if (isSelf) {
        // Proves the person at the keyboard is the account holder.
        const { authenticate } = await import("@/lib/server/users");
        const check = await authenticate(target.email, String(body.currentPassword ?? ""));
        if (!check) return badRequest("Senha atual incorreta");
      }

      await setPassword(id, String(body.password));
    }

    const patch: { name?: string; role?: string } = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) return badRequest("Informe um nome válido");
      patch.name = name;
    }
    if (body.role !== undefined) patch.role = String(body.role).trim();

    const updated = Object.keys(patch).length > 0 ? await updateUser(id, patch) : target;
    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!user.isOwner) return forbidden("Apenas o dono do workspace pode remover contas");

    const { id } = await params;
    if (id === user.id) return badRequest("Você não pode remover a sua própria conta");

    const removed = await deleteUser(id);
    return removed ? ok({ id, removed: true }) : notFound("Conta não encontrada");
  } catch (error) {
    return serverError(error);
  }
}
