import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? "/home/user/qa";
const routes = ["dashboard", "team", "calendar", "analytics", "tasks", "settings"];
const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "390", width: 390, height: 844 },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const problems = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      problems.push(`[${viewport.name}] console.${message.type()}: ${message.text().slice(0, 300)}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`[${viewport.name}] pageerror: ${error.message}`));

  for (const route of routes) {
    await page.goto(`${BASE}/${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}/${route}-${viewport.name}.png`, fullPage: false });
  }
  await context.close();
}

await browser.close();

if (problems.length) {
  console.log("PROBLEMS:\n" + [...new Set(problems)].join("\n"));
} else {
  console.log("No console errors or page errors.");
}
