import { chromium } from "playwright";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const routes = ["dashboard", "team", "calendar", "analytics", "tasks", "settings"];
const browser = await chromium.launch();
const problems = [];

// 1024px: sidebar rail stays, content compresses
const ctx1024 = await browser.newContext({ viewport: { width: 1024, height: 800 }, locale: "pt-BR" });
const p1024 = await ctx1024.newPage();
for (const route of routes) {
  await p1024.goto(`${BASE}/${route}`, { waitUntil: "networkidle" });
  await p1024.waitForTimeout(1100);
  const o = await p1024.evaluate(() => ({ doc: document.documentElement.scrollWidth, win: window.innerWidth }));
  if (o.doc > o.win + 1) problems.push(`overflow @1024 /${route}: ${JSON.stringify(o)}`);
  if (route === "dashboard" || route === "tasks") {
    await p1024.screenshot({ path: `/home/user/qa/w1024-${route}.png` });
  }
}
await ctx1024.close();

// dark mode, every route
const ctxDark = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", colorScheme: "dark" });
const pDark = await ctxDark.newPage();
pDark.on("pageerror", (e) => problems.push(`dark pageerror: ${e.message}`));
for (const route of routes) {
  await pDark.goto(`${BASE}/${route}`, { waitUntil: "networkidle" });
  await pDark.waitForTimeout(1300);
  await pDark.screenshot({ path: `/home/user/qa/dark-${route}.png` });
}
await ctxDark.close();

// keyboard pass: tab through the dashboard and check focus is visible
const ctxKeys = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
const pKeys = await ctxKeys.newPage();
await pKeys.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await pKeys.waitForTimeout(1000);
const focusTrail = [];
for (let i = 0; i < 12; i += 1) {
  await pKeys.keyboard.press("Tab");
  const info = await pKeys.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const style = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40),
      outline: `${style.outlineWidth} ${style.outlineStyle}`,
    };
  });
  if (info) focusTrail.push(info);
}
console.log("focus trail:", JSON.stringify(focusTrail.slice(0, 6), null, 1));
await pKeys.screenshot({ path: "/home/user/qa/18-focus.png" });
await ctxKeys.close();

await browser.close();
console.log(problems.length ? "PROBLEMS:\n" + [...new Set(problems)].join("\n") : "1024 + dark + keyboard: clean.");
