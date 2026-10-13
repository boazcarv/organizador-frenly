import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (m) => console.log(m.type(), "|", m.text().slice(0, 160), "|", JSON.stringify(m.location()).slice(0, 200)));
await page.goto("http://localhost:3000/analytics", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await browser.close();
