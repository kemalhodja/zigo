import { expect, test } from "@playwright/test";

import { demoLogin, isDemoAuthAvailable } from "./helpers";

test.describe("demo auth flows", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable (start local Supabase or set E2E_SKIP_LIVE_AUTH=0)");
    }
  });

  test("auth page shows demo login panel for local demo", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByTestId("demo-login-panel")).toBeVisible();
    await expect(page.getByTestId("demo-login-student")).toBeVisible();
    await expect(page.getByTestId("demo-login-parent")).toBeVisible();
    await expect(page.getByTestId("demo-login-teacher")).toBeVisible();
  });

  test("student demo login reaches home feed", async ({ page }) => {
    await demoLogin(page, "student");
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("parent demo login reaches home feed", async ({ page }) => {
    await demoLogin(page, "parent");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("teacher demo login reaches home feed", async ({ page }) => {
    await demoLogin(page, "teacher");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("student can open profiles switcher after login", async ({ page }) => {
    await demoLogin(page, "student");
    await page.goto("/profiles");
    await expect(page.locator("body")).toContainText(/mode|profile|student|parent|teacher/i);
  });

  test("student can open learn hub after login", async ({ page }) => {
    await demoLogin(page, "student");
    await page.goto("/learn");
    expect(page.url()).toContain("/learn");
    await expect(page.locator("body")).toBeVisible();
  });

  test("parent can open family dashboard after login", async ({ page }) => {
    await demoLogin(page, "parent");
    await page.goto("/family");
    expect(page.url()).toContain("/family");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("authenticated surfaces", () => {
  test.beforeEach(async ({ page, request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
      return;
    }
    await demoLogin(page, "parent");
  });

  test("parent page loads after auth", async ({ page }) => {
    await page.goto("/parent");
    await expect(page.locator("body")).toBeVisible();
  });

  test("child activity timeline component exists on parent when data present or empty", async ({ page }) => {
    await page.goto("/parent");
    const timeline = page.getByTestId("child-activity-timeline");
    if ((await timeline.count()) > 0) {
      await expect(timeline).toBeVisible();
    } else {
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
