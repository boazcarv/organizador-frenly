import { chromium } from "playwright";
const [route = "dashboard", name = route, width = "1440", height = "900", scroll = "0"] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(width), height: Number(height) }, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
const page = await ctx.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(e.message));
page.on("console", (m) => { if (m.type() === "error") problems.push(m.text().slice(0, 200)); });
await page.goto(`http://localhost:3000/${route}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
if (Number(scroll) > 0) {
  await page.evaluate((y) => {
    const target = Array.from(document.querySelectorAll("div.overflow-y-auto")).find((n) => n.scrollHeight > n.clientHeight + 100);
    if (target) target.scrollTop = y;
  }, Number(scroll));
  await page.waitForTimeout(1200);
}
await page.screenshot({ path: `/home/user/qa/s-${name}.png` });
await browser.close();
console.log(problems.length ? "ERRORS: " + problems.join(" | ") : "ok");
