import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/server/session";
import { ok, serverError } from "@/lib/server/http";

export async function POST() {
  try {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    return ok({ loggedOut: true });
  } catch (error) {
    return serverError(error);
  }
}
