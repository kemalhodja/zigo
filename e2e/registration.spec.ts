import { expect, test } from "@playwright/test";

import { dismissAppIntro } from "./helpers";

test.describe("post-signup role selection", () => {
  test.beforeEach(async ({ page }) => {
    await dismissAppIntro(page);
  });

  test("sign-up form defers role selection to onboarding", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();

    await expect(page.getByTestId("registration-account-student")).toHaveCount(0);
    await expect(page.getByText(/ilk 7 gün|first 7 days/i)).toBeVisible();
  });

  test("role selection page exposes five account kinds", async ({ page }) => {
    await page.goto("/onboarding/role");

    await expect(page.getByTestId("role-onboarding-pick-student")).toBeVisible();
    await expect(page.getByTestId("role-onboarding-pick-parent")).toBeVisible();
    await expect(page.getByTestId("role-onboarding-pick-teacher")).toBeVisible();
    await expect(page.getByTestId("role-onboarding-pick-institution")).toBeVisible();
    await expect(page.getByTestId("role-onboarding-pick-platform")).toBeVisible();
    await expect(page.getByTestId("role-onboarding-continue")).toBeVisible();
  });

  test("institution role card shows kurumsal copy", async ({ page }) => {
    await page.goto("/onboarding/role");
    await page.getByTestId("role-onboarding-pick-institution").click();
    await expect(page.getByText(/Kurs, okul ve kurumsal|education institution/i)).toBeVisible();
  });
});
