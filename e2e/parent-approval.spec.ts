import { expect, test } from "@playwright/test";

import { demoLogin, dismissAppIntro } from "./helpers";

test.describe("parent approval surfaces", () => {
  test.beforeEach(async ({ page }) => {
    await dismissAppIntro(page);
  });

  test("parent dashboard exposes approval queues", async ({ page }) => {
    await demoLogin(page, "parent");
    await page.goto("/parent");
    await expect(page.locator("body")).toContainText(/Veli|Parent|Çocuğum/i);
  });

  test("parent can open groups hub and create a group", async ({ page }) => {
    await demoLogin(page, "parent");

    const createGroup = page.waitForResponse(
      (response) => response.url().includes("/api/groups") && response.request().method() === "POST",
      { timeout: 30_000 },
    );

    await page.goto("/groups");
    await page.getByPlaceholder(/Grup adı|Group name/i).fill(`QA Parent ${Date.now()}`);
    await page.getByRole("button", { name: /Grup oluştur|Create group/i }).click();

    const response = await createGroup;
    expect(response.ok()).toBeTruthy();
  });
});
