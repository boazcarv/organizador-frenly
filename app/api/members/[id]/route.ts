import { notFound, ok, serverError } from "@/lib/server/http";
import { getMember } from "@/lib/server/repository";


export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = await getMember(id);
    return member ? ok(member) : notFound("Pessoa não encontrada");
  } catch (error) {
    return serverError(error);
  }
}
