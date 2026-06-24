import { expect, test } from "@playwright/test";

import { demoLogin, isDemoAuthAvailable } from "./helpers";

const STUDENT_SURFACES = ["/learn", "/duels", "/focus", "/store", "/student", "/collections"] as const;

test.describe("manual QA — automatable surfaces", () => {
  test.beforeEach(async ({ request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }
  });

  for (const route of STUDENT_SURFACES) {
    test(`student can open ${route}`, async ({ page }) => {
      await demoLogin(page, "student");
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("#main-content, main, body").first()).toBeVisible();
    });
  }

  test("teacher can open create composer", async ({ page }) => {
    await demoLogin(page, "teacher");
    const response = await page.goto("/create");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("duels page loads safe duel UI", async ({ page }) => {
    await demoLogin(page, "student");
    await page.goto("/duels");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/duel|düello|quiz/i).first()).toBeVisible();
  });

  test("student direct messaging route is not exposed", async ({ page }) => {
    await demoLogin(page, "student");
    const response = await page.goto("/messages");
    expect(response?.status()).toBeGreaterThanOrEqual(404);
  });

  test("PWA manifest is served", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest.name ?? manifest.short_name).toBeTruthy();
    expect(Array.isArray(manifest.icons) ? manifest.icons.length : 0).toBeGreaterThan(0);
  });
});

test.describe("manual QA — legal footer (authenticated)", () => {
  test.beforeEach(async ({ page, request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
      return;
    }
    await demoLogin(page, "student");
  });

  for (const route of ["/legal/privacy", "/legal/terms", "/legal/kvkk"] as const) {
    test(`footer path ${route} reachable`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.ok()).toBeTruthy();
    });
  }
});
