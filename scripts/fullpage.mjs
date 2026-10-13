import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
});
const page = await context.newPage();
for (const route of ["dashboard", "tasks", "analytics", "team"]) {
  await page.goto(`${BASE}/${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const scrolled = await page.evaluate(() => {
    const scrollers = Array.from(document.querySelectorAll("div.overflow-y-auto"));
    const target = scrollers.find((node) => node.scrollHeight > node.clientHeight + 200);
    if (!target) return null;
    target.scrollTop = target.scrollHeight;
    return { scrollTop: target.scrollTop, scrollHeight: target.scrollHeight };
  });
  console.log(route, scrolled);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `/home/user/qa/full-${route}.png` });
}
await browser.close();
console.log("done");
