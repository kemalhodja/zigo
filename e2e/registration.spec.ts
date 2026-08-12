import { expect, test } from "@playwright/test";

import { dismissAppIntro } from "./helpers";

test.describe("registration account kinds", () => {
  test.beforeEach(async ({ page }) => {
    await dismissAppIntro(page);
  });

  test("sign-up shows two primary account groups", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();

    await expect(page.getByTestId("registration-primary-student")).toBeVisible();
    await expect(page.getByTestId("registration-primary-teacher")).toBeVisible();
    
    // Parent and institution should not be visible in V1
    await expect(page.getByTestId("registration-primary-parent")).toHaveCount(0);
    await expect(page.getByTestId("registration-primary-institution")).toHaveCount(0);
  });

  test("student selection highlights student account copy", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();
    await page.getByTestId("registration-primary-student").click();
    await expect(page.getByText(/YKS, LGS ve sınav hazırlığı/i)).toBeVisible();
  });

  test("teacher selection highlights teacher account copy", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();
    await page.getByTestId("registration-primary-teacher").click();
    await expect(page.getByText(/Bireysel öğretmen/i)).toBeVisible();
  });
});
