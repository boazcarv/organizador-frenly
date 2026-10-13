import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

// how the in-app preview embeds the app: sandboxed iframe, no same-origin
const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, locale: "pt-BR", colorScheme: "dark" });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("  iframe console.error:", m.text().slice(0, 260)); });
await page.setContent(`<body style="margin:0;background:#04170f"><iframe id="f" src="${BASE}/dashboard" sandbox="allow-scripts" style="border:0;width:100vw;height:100vh"></iframe></body>`);
await page.waitForTimeout(4000);

for (const f of page.frames()) {
  if (!f.url().includes("localhost")) continue;
  const info = await f.evaluate(() => {
    const main = document.querySelector("main");
    return {
      url: location.pathname,
      mainFound: Boolean(main),
      opacity: main ? getComputedStyle(main).opacity : null,
      height: main ? Math.round(main.getBoundingClientRect().height) : null,
      text: (main?.innerText ?? "").trim().slice(0, 70),
      localStorage: (() => { try { window.localStorage.getItem("x"); return "ok"; } catch (e) { return "throws " + e.name; } })(),
    };
  });
  console.log("frame:", JSON.stringify(info));
}
await page.screenshot({ path: "/home/user/qa/repro3-iframe.png" });
await browser.close();
