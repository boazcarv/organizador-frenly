import { chromium } from "playwright";
import { sessionCookie } from "./session.mjs";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ storageState: { cookies: [sessionCookie()], origins: [] }, viewport: { width: 1440, height: 900 }, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
const page = await ctx.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") problems.push("console: " + m.text().slice(0, 160)); });

const api = async (path, init) => {
  const res = await page.request[init?.method === "POST" ? "post" : init?.method === "DELETE" ? "delete" : "get"](`${BASE}${path}`, init);
  return { status: res.status(), body: await res.json().catch(() => null) };
};

// ── 1. the API is the source of truth -------------------------------------
const before = await api("/api/projects");
console.log("projects before:", before.status, before.body.length);

await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);


// ── 2. create a project through the UI ------------------------------------
await page.getByRole("button", { name: /Novo projeto/ }).first().click();
await page.waitForTimeout(600);
await page.getByLabel("Nome do projeto").fill("Portal do Cerrado");
await page.getByRole("button", { name: "Criar projeto" }).click();
await page.waitForTimeout(1800);
await page.screenshot({ path: "/home/user/qa/p-01-created.png" });

const afterCreate = await api("/api/projects");
console.log("projects after create:", afterCreate.status, afterCreate.body.length, afterCreate.body[0]?.name);

// ── 3. it survives a full reload -----------------------------------------
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1600);
const visibleAfterReload = await page.getByText("Portal do Cerrado").first().isVisible();
console.log("visible after reload:", visibleAfterReload);
await page.screenshot({ path: "/home/user/qa/p-02-after-reload.png" });

// ── 4. toast notifications persist too ------------------------------------
const notif0 = await api("/api/notifications");
await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Aparência" }).first().waitFor();
await page.getByRole("button", { name: /^Notificações\s*O que chega/ }).click();
await page.waitForTimeout(900);
const toggle = page.getByRole("switch").first();
await toggle.click();
await page.waitForTimeout(900);
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1400);
await page.getByRole("button", { name: /^Notificações\s*O que chega/ }).click();
await page.waitForTimeout(900);
const notif1 = await api("/api/notifications");
console.log("notifications persisted:", JSON.stringify(notif1.body.map((n) => `${n.id}:${n.enabled}`)));
const checkboxAfterReload = await page.getByRole("switch").first().getAttribute("aria-checked");
const notif0First = notif0.body[0].enabled;
console.log("first switch before:", notif0First, "after reload:", checkboxAfterReload);

// ── 5. a task created in the board is stored ------------------------------
await page.goto(`${BASE}/tasks`, { waitUntil: "networkidle" });
await page.waitForTimeout(1400);
const tasksBefore = await api("/api/tasks");
await page.getByRole("button", { name: /Adicionar/ }).first().click();
await page.waitForTimeout(700);
await page.getByLabel("Título").fill("Revisar contraste do novo tema");
await page.getByRole("button", { name: "Criar tarefa" }).click();
await page.waitForTimeout(2000);
const tasksAfter = await api("/api/tasks");
console.log("tasks:", tasksBefore.body.length, "->", tasksAfter.body.length, tasksAfter.body[0]?.title);
await page.screenshot({ path: "/home/user/qa/p-03-task.png" });

// ── 6. tracker stop writes a time entry -----------------------------------
const entriesBefore = await api("/api/time-entries");
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1400);
await page.getByRole("button", { name: "Iniciar cronômetro" }).click();
await page.waitForTimeout(2600);
await page.getByRole("button", { name: "Parar cronômetro" }).click();
await page.waitForTimeout(1600);
const entriesAfter = await api("/api/time-entries");
console.log("time entries:", entriesBefore.body.length, "->", entriesAfter.body.length, "seconds:", entriesAfter.body[0]?.seconds);
await page.screenshot({ path: "/home/user/qa/p-04-tracker.png" });

// ── 7. delete the project (cascade) ---------------------------------------
const removed = await api(`/api/projects/${afterCreate.body[0].id}`, { method: "DELETE" });
const finalList = await api("/api/projects");
console.log("delete:", removed.status, removed.body?.removedTasks, "projects left:", finalList.body.length);

// ── 8. validation is enforced server-side ---------------------------------
const invalid = await api("/api/projects", {
  method: "POST",
  headers: { "content-type": "application/json" },
  data: { name: "ab" },
});
console.log("invalid project rejected:", invalid.status, invalid.body?.error);

await browser.close();
console.log(problems.length ? "PROBLEMS:\n" + [...new Set(problems)].join("\n") : "no console/page errors");
