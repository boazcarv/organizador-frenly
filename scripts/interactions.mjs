import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? "/home/user/qa";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
});
const page = await context.newPage();
const problems = [];
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console.error: ${m.text().slice(0, 200)}`);
});
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

const shot = async (name) => page.screenshot({ path: `${OUT}/i-${name}.png` });

// 1. command palette
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.keyboard.press("Control+k");
await page.waitForTimeout(500);
await shot("01-command");
await page.keyboard.type("checkout");
await page.waitForTimeout(400);
await shot("02-command-search");
await page.keyboard.press("Escape");

// 2. accent re-tint (settings → ocean)
await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: /Aparência/ }).first().click();
await page.waitForTimeout(700);
await shot("03-appearance");
await page.getByRole("button", { name: "Usar destaque Azul" }).click();
await page.waitForTimeout(900);
await shot("04-accent-ocean");
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await shot("05-dashboard-ocean");

// back to green
await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.getByRole("button", { name: /Aparência/ }).first().click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Usar destaque Verde" }).click();
await page.waitForTimeout(700);

// 3. dark mode circular reveal
await page.getByRole("button", { name: "Ativar modo escuro" }).first().click();
await page.waitForTimeout(300);
await shot("06-dark-mid");
await page.waitForTimeout(900);
await shot("07-dark-settings");
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1400);
await shot("08-dark-dashboard");
await page.goto(`${BASE}/tasks`, { waitUntil: "networkidle" });
await page.waitForTimeout(1400);
await shot("09-dark-tasks");

// 4. kanban drag (backlog → em progresso) in dark
const card = page.locator("article[aria-roledescription='Tarefa arrastável']").first();
const target = page.locator("section[aria-label='Coluna Em progresso']");
const from = await card.boundingBox();
const to = await target.boundingBox();
await page.mouse.move(from.x + from.width / 2, from.y + 30);
await page.mouse.down();
await page.mouse.move(from.x + from.width / 2 + 40, from.y + 60, { steps: 8 });
await page.mouse.move(to.x + to.width / 2, to.y + 220, { steps: 18 });
await page.waitForTimeout(350);
await shot("10-drag-overlay");
await page.mouse.up();
await page.waitForTimeout(900);
await shot("11-after-drop");

// 5. team filter FLIP + member drawer (still dark)
await page.goto(`${BASE}/team`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Online agora/ }).click();
await page.waitForTimeout(800);
await shot("12-team-filtered");
await page.getByRole("button", { name: "Perfil" }).first().click();
await page.waitForTimeout(900);
await shot("13-member-drawer");
await page.keyboard.press("Escape");

// 6. back to light for the tracker test
await page.getByRole("button", { name: "Ativar modo claro" }).first().click();
await page.waitForTimeout(800);
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.getByRole("button", { name: "Iniciar cronômetro" }).click();
await page.waitForTimeout(2600);
await shot("14-tracker-running");
await page.getByRole("button", { name: "Pausar cronômetro" }).click();
await page.waitForTimeout(400);
await page.goto(`${BASE}/analytics`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const clockText = await page.locator('[role="timer"]').first().getAttribute("aria-label");
console.log("tracker after route change:", clockText);
await shot("15-analytics-light");

// 7. period switch on analytics
await page.getByRole("tab", { name: "Semana" }).click();
await page.waitForTimeout(1600);
await shot("16-analytics-week");

// 8. reduced motion pass
const rmContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
  locale: "pt-BR",
});
const rmPage = await rmContext.newPage();
await rmPage.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await rmPage.waitForTimeout(1200);
await rmPage.screenshot({ path: `${OUT}/17-reduced-motion.png` });

// 9. horizontal overflow check at 1280 and 390
for (const width of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: "pt-BR" });
  const p = await ctx.newPage();
  for (const route of ["dashboard", "team", "calendar", "analytics", "tasks", "settings"]) {
    await p.goto(`${BASE}/${route}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(900);
    const overflow = await p.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      win: window.innerWidth,
      body: document.body.scrollWidth,
    }));
    if (overflow.doc > overflow.win + 1 || overflow.body > overflow.win + 1) {
      problems.push(`overflow @${width} /${route}: ${JSON.stringify(overflow)}`);
    }
  }
  await ctx.close();
}

await rmContext.close();
await browser.close();
console.log(problems.length ? "PROBLEMS:\n" + [...new Set(problems)].join("\n") : "No errors, no horizontal overflow.");
