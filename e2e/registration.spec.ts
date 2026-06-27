import { expect, test } from "@playwright/test";

import { dismissAppIntro } from "./helpers";

test.describe("registration account kinds", () => {
  test.beforeEach(async ({ page }) => {
    await dismissAppIntro(page);
  });

  test("sign-up shows five account types", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();

    await expect(page.getByTestId("registration-account-student")).toBeVisible();
    await expect(page.getByTestId("registration-account-parent")).toBeVisible();
    await expect(page.getByTestId("registration-account-teacher")).toBeVisible();
    await expect(page.getByTestId("registration-account-institution")).toBeVisible();
    await expect(page.getByTestId("registration-account-platform")).toBeVisible();
  });

  test("institution selection highlights kurumsal account copy", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();
    await page.getByTestId("registration-account-institution").click();
    await expect(page.getByText(/Kurs, okul ve kurumsal/i)).toBeVisible();
  });

  test("platform selection highlights platform account copy", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();
    await page.getByTestId("registration-account-platform").click();
    await expect(page.getByText(/Dijital platform/i)).toBeVisible();
  });
});
