import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

// exact conditions of the user's screenshot: 980x880, dark, cold load
const ctx = await browser.newContext({ viewport: { width: 980, height: 880 }, locale: "pt-BR", colorScheme: "dark" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 180)); });
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
await page.screenshot({ path: "/home/user/qa/fixed-980.png" });

// and the same page after a few client-side navigations at that width
await page.getByRole("button", { name: "Abrir menu" }).click();
await page.waitForTimeout(500);
await page.getByRole("link", { name: /^Analytics/ }).first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: "/home/user/qa/fixed-980-analytics.png" });

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console/page errors at 980px dark");
await browser.close();
