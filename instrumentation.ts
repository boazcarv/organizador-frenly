/**
 * Runs once per server process, before the first request is handled.
 *
 * Why this exists: every "hoje", "esta semana" and "este mês" in the product is
 * computed with the process timezone. A hosted platform usually runs in UTC, so
 * without this a dashboard opened at 22h in Fortaleza would already be showing
 * tomorrow. Setting TZ in the environment (see .env.example) is the primary fix;
 * this is the safety net for the case where only the app was deployed.
 */
export async function register() {
  if (process.env.TZ) return;

  process.env.TZ = process.env.APP_TIMEZONE ?? "America/Sao_Paulo";
  console.info(`[frenly] TZ não definido — assumindo ${process.env.TZ}.`);
}
