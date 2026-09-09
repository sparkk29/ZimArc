/**
 * Capture product screenshots for README/docs.
 * Usage:
 *   SCREENSHOT_EMAIL=... SCREENSHOT_PASSWORD=... npm run screenshots
 *
 * Credentials are read from env only and never written to the repo.
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SCREENSHOT_BASE_URL || "http://localhost:3000";
const EMAIL = process.env.SCREENSHOT_EMAIL;
const PASSWORD = process.env.SCREENSHOT_PASSWORD;
const OUT_DIR = path.resolve("docs/screenshots");

async function shot(page, name, { fullPage = true } = {}) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: file, fullPage });
  console.log("saved", file);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForLoadState("networkidle");
}

async function ensureDemoRoutine(page) {
  await page.goto(`${BASE}/routines/new`, { waitUntil: "networkidle" });

  // Routine name is the first text input in the form
  const nameInput = page.locator("form input.wa-input").first();
  await nameInput.fill("Winter Arc Demo");

  const makeActive = page.getByLabel(/active routine/i);
  if (await makeActive.count()) {
    if (!(await makeActive.isChecked())) await makeActive.check();
  }

  // Defaults already include Push/Pull/Legs — just save
  await page.getByRole("button", { name: /Save routine/i }).click();
  await page.waitForURL("**/routines", { timeout: 20000 });
  await page.waitForLoadState("networkidle");
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Public auth screens
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await shot(page, "01-login");

  await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
  await shot(page, "02-signup");

  if (!EMAIL || !PASSWORD) {
    console.warn(
      "SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD not set — skipping authenticated screens.",
    );
    await browser.close();
    return;
  }

  await login(page);
  await shot(page, "03-dashboard");

  // Seed data for meaningful authenticated shots
  await ensureDemoRoutine(page);

  // Make sure the list reflects the newly active routine
  await page.goto(`${BASE}/routines`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const setActiveBtn = page.getByRole("button", { name: /Set active/i }).first();
  if (await setActiveBtn.isVisible().catch(() => false)) {
    await setActiveBtn.click();
    await page.waitForTimeout(800);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);
  }
  await shot(page, "04-routines");

  await page.goto(`${BASE}/routines/new`, { waitUntil: "networkidle" });
  await shot(page, "05-routine-builder");

  const pickerBtn = page.getByRole("button", {
    name: /Choose from photo library/i,
  });
  if (await pickerBtn.first().isVisible().catch(() => false)) {
    await pickerBtn.first().click();
    await page.waitForTimeout(600);
    await shot(page, "06-exercise-photo-picker");
  }

  // Capture live session before completing it
  await page.goto(`${BASE}/workouts/start`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "08-workout-session");

  // Fill + save so history/progress aren't empty
  const repsInputs = page.locator("form input.wa-input");
  const n = await repsInputs.count();
  for (let i = 0; i < n; i++) {
    const input = repsInputs.nth(i);
    const label = await input.evaluate((el) => {
      const lab = el.closest("label");
      return (lab?.innerText || el.getAttribute("placeholder") || "").toLowerCase();
    });
    if (label.includes("rep")) await input.fill("10");
    else if (label.includes("weight")) await input.fill("60");
  }
  const finish = page.getByRole("button", { name: /Save workout/i }).first();
  if (await finish.isVisible().catch(() => false)) {
    await finish.click();
    await page.waitForTimeout(2000);
  }

  await page.goto(`${BASE}/workouts`, { waitUntil: "networkidle" });
  await shot(page, "07-workouts");

  await page.goto(`${BASE}/progress`, { waitUntil: "networkidle" });
  await shot(page, "09-progress");

  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await shot(page, "10-settings");

  // Mobile pass
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await shot(page, "11-dashboard-mobile", { fullPage: false });
  await page.goto(`${BASE}/routines/new`, { waitUntil: "networkidle" });
  await shot(page, "12-routine-builder-mobile", { fullPage: false });

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
