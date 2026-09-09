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

async function shot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.waitForTimeout(700);
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", file);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

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

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await shot(page, "03-dashboard");

  await page.goto(`${BASE}/routines`, { waitUntil: "networkidle" });
  await shot(page, "04-routines");

  await page.goto(`${BASE}/routines/new`, { waitUntil: "networkidle" });
  await shot(page, "05-routine-builder");

  const pickerBtn = page.getByRole("button", {
    name: /Choose from photo library/i,
  });
  if (await pickerBtn.first().isVisible().catch(() => false)) {
    await pickerBtn.first().click();
    await page.waitForTimeout(500);
    await shot(page, "06-exercise-photo-picker");
  }

  // Try to create + activate a demo routine so workout screens look real.
  const nameInput = page.locator('input[placeholder*="Push" i], input[name="name"], input[placeholder*="name" i]').first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill("Docs Demo Routine");
  }

  // Ensure at least one exercise name if empty
  const exerciseName = page.locator('input[placeholder*="Bench" i], input[placeholder*="Exercise" i]').first();
  if (await exerciseName.isVisible().catch(() => false)) {
    const val = await exerciseName.inputValue().catch(() => "");
    if (!val) await exerciseName.fill("Bench Press");
  }

  const makeActive = page.getByLabel(/active/i).first();
  if (await makeActive.isVisible().catch(() => false)) {
    const checked = await makeActive.isChecked().catch(() => false);
    if (!checked) await makeActive.check().catch(() => {});
  }

  const saveBtn = page.getByRole("button", { name: /save|create|publish/i }).first();
  if (await saveBtn.isVisible().catch(() => false)) {
    await saveBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
  }

  await page.goto(`${BASE}/routines`, { waitUntil: "networkidle" });
  await shot(page, "04-routines");

  await page.goto(`${BASE}/workouts`, { waitUntil: "networkidle" });
  await shot(page, "07-workouts");

  await page.goto(`${BASE}/workouts/start`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "08-workout-session");

  await page.goto(`${BASE}/progress`, { waitUntil: "networkidle" });
  await shot(page, "09-progress");

  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await shot(page, "10-settings");

  // Mobile pass of key screens
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await shot(page, "11-dashboard-mobile");
  await page.goto(`${BASE}/routines/new`, { waitUntil: "networkidle" });
  await shot(page, "12-routine-builder-mobile");

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
