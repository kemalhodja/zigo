import { expect, test } from "@playwright/test";

import { expectedMigrationTarget } from "./migration-target";

test.describe("smoke", () => {
  test("health API responds", async ({ request }) => {
    const response = await request.get("/api/setup/health");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { data?: { migrationTarget?: number } };
    expect(body.data?.migrationTarget).toBe(expectedMigrationTarget());
  });

  test("home feed renders", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("#main-content, main, body").first()).toBeVisible();
  });

  test("auth page loads", async ({ page }) => {
    const response = await page.goto("/auth");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
});
