import type { AnalyticsPeriod } from "@/lib/types";
import { getSessionUser } from "@/lib/server/auth";
import { ok, serverError, unauthorized } from "@/lib/server/http";
import { getAnalytics } from "@/lib/server/insights";

const periods: AnalyticsPeriod[] = ["today", "week", "month"];

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    // Period is resolved on the server so "this week" means the same thing to
    // the chart, the cards and the CSV export.
    const requested = new URL(request.url).searchParams.get("period") as AnalyticsPeriod | null;
    const period = requested && periods.includes(requested) ? requested : "month";

    return ok(await getAnalytics(period));
  } catch (error) {
    return serverError(error);
  }
}
