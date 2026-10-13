import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, locale: "pt-BR" });
const page = await ctx.newPage();
page.on("console", (m) => console.log("  [", m.type(), "]", m.text().slice(0, 220)));
page.on("pageerror", (e) => console.log("  [pageerror]", e.message.slice(0, 300)));
await page.setContent(`<body style="margin:0"><iframe id="f" src="${BASE}/dashboard" sandbox="allow-scripts" style="border:0;width:1000px;height:900px"></iframe></body>`);
await page.waitForTimeout(3500);
const frame = page.frames().find((f) => f.url().includes("/dashboard"));
const info = await frame.evaluate(() => ({
  bodyLen: document.body.innerHTML.length,
  hasPortal: Boolean(document.querySelector("nextjs-portal")),
  rootChildren: document.getElementById("__next")?.children.length ?? null,
  bodyFirst: document.body.firstElementChild?.tagName,
  bodyText: document.body.innerText.slice(0, 120),
  shellPresent: Boolean(document.querySelector("header")),
}));
console.log("iframe doc:", JSON.stringify(info, null, 1));
await page.screenshot({ path: "/home/user/qa/repro5-iframe.png" });
await browser.close();
