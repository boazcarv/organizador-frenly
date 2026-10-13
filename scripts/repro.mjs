import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();

const report = async (page, label) => {
  const info = await page.evaluate(() => {
    const main = document.querySelector("main");
    const scroller = document.querySelector("div.overflow-y-auto");
    const content = main?.firstElementChild;
    const style = main ? getComputedStyle(main) : null;
    const rect = main?.getBoundingClientRect();
    return {
      mainFound: Boolean(main),
      mainOpacity: style?.opacity,
      mainTransform: style?.transform,
      ariaHidden: main?.getAttribute("aria-hidden"),
      mainHeight: rect?.height,
      contentOpacity: content ? getComputedStyle(content).opacity : null,
      scrollerHeight: scroller?.scrollHeight,
      scrollerClient: scroller?.clientHeight,
      visibleText: (main?.innerText ?? "").trim().slice(0, 60),
    };
  });
  console.log(label, JSON.stringify(info));
};

// A) direct load, dark, 980x880 (the size in the user's screenshot)
const ctxA = await browser.newContext({ viewport: { width: 980, height: 880 }, locale: "pt-BR", colorScheme: "dark" });
const a = await ctxA.newPage();
a.on("pageerror", (e) => console.log("  pageerror:", e.message));
a.on("console", (m) => { if (m.type() === "error") console.log("  console.error:", m.text().slice(0, 160)); });
await a.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await a.waitForTimeout(1800);
await report(a, "A direct /dashboard:");
await a.screenshot({ path: "/home/user/qa/repro-A-direct.png" });

// B) client-side navigation through every route
for (const route of ["Team", "Calendar", "Analytics", "Tasks", "Settings", "Dashboard"]) {
  await a.getByRole("link", { name: new RegExp(`^${route}`) }).first().click({ force: true });
  await a.waitForTimeout(1400);
  await report(a, `B after click ${route}:`);
}
await a.screenshot({ path: "/home/user/qa/repro-B-after-nav.png" });
await ctxA.close();

// C) inside a sandboxed iframe without same-origin (how the in-app preview embeds pages)
const ctxC = await browser.newContext({ viewport: { width: 1000, height: 900 }, locale: "pt-BR" });
const c = await ctxC.newPage();
c.on("console", (m) => { if (m.type() === "error") console.log("  iframe console.error:", m.text().slice(0, 200)); });
await c.setContent(`<body style="margin:0"><iframe id="f" src="${BASE}/dashboard" sandbox="allow-scripts" style="border:0;width:100vw;height:100vh"></iframe></body>`);
await c.waitForTimeout(2500);
const frame = c.frames().find((f) => f.url().includes("/dashboard"));
if (frame) {
  const info = await frame.evaluate(() => {
    const main = document.querySelector("main");
    return {
      mainFound: Boolean(main),
      opacity: main ? getComputedStyle(main).opacity : null,
      height: main?.getBoundingClientRect().height,
      text: (main?.innerText ?? "").trim().slice(0, 80),
      localStorage: (() => { try { window.localStorage.getItem("x"); return "ok"; } catch (e) { return `throws: ${e.name}`; } })(),
    };
  });
  console.log("C sandboxed iframe:", JSON.stringify(info));
} else {
  console.log("C: frame not found");
}
await c.screenshot({ path: "/home/user/qa/repro-C-iframe.png" });
await ctxC.close();

await browser.close();
