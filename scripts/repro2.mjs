import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 980, height: 880 }, locale: "pt-BR", colorScheme: "dark" });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("  pageerror:", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("  console.error:", m.text().slice(0, 180)); });

const probe = async (label) => {
  const info = await page.evaluate(() => {
    const mains = Array.from(document.querySelectorAll("main"));
    const scroller = document.querySelector("div.overflow-y-auto");
    return {
      mains: mains.length,
      opacities: mains.map((m) => getComputedStyle(m).opacity),
      heights: mains.map((m) => Math.round(m.getBoundingClientRect().height)),
      text: (mains[0]?.innerText ?? "").trim().slice(0, 50),
      scrollTop: scroller?.scrollTop,
      scrollHeight: scroller?.scrollHeight,
      clientHeight: scroller?.clientHeight,
    };
  });
  console.log(label, JSON.stringify(info));
};

await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await probe("initial:");

// navigate through the mobile drawer, like a real user at this width
for (const route of ["Team", "Calendar", "Analytics", "Tasks", "Settings"]) {
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: new RegExp(`^${route}`) }).first().click();
  await page.waitForTimeout(1500);
  await probe(`after ${route}:`);
}

// rapid-fire navigation (clicking during the transition)
await page.getByRole("button", { name: "Abrir menu" }).click();
await page.waitForTimeout(400);
await page.getByRole("link", { name: /^Dashboard/ }).first().click();
await page.waitForTimeout(60);
await page.getByRole("button", { name: "Abrir menu" }).click();
await page.getByRole("link", { name: /^Tasks/ }).first().click();
await page.waitForTimeout(60);
await page.getByRole("button", { name: "Abrir menu" }).click();
await page.getByRole("link", { name: /^Analytics/ }).first().click();
await page.waitForTimeout(2200);
await probe("after rapid nav:");

await page.screenshot({ path: "/home/user/qa/repro2-final.png" });
await browser.close();
