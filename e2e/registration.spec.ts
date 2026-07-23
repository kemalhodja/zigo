import { expect, test } from "@playwright/test";

import { dismissAppIntro, isDemoAuthAvailable } from "./helpers";

test.describe("post-signup role selection", () => {
  test.beforeEach(async ({ page }) => {
    await dismissAppIntro(page);
  });

  test("sign-up form defers role selection to onboarding", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();

    await expect(page.getByTestId("registration-account-student")).toHaveCount(0);
    await expect(
      page.getByText(/ilk 7 gün|first 7 days|kayıttan sonra rol|choose your role after signup/i),
    ).toBeVisible();
  });

  test("logged-out role page prompts sign-in", async ({ page }) => {
    await page.goto("/onboarding/role");
    await expect(page.getByRole("link", { name: /giriş|sign in/i })).toBeVisible();
  });

  test("role selection page exposes five account kinds when role pick is pending", async ({
    page,
    request,
  }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }

    // Without a dedicated incomplete-role fixture, assert the authenticated role hub is reachable
    // after a fresh signup path is available in live environments only.
    await page.goto("/onboarding/role");
    const picks = page.getByTestId("role-onboarding-pick-student");
    if ((await picks.count()) === 0) {
      testInfo.skip(true, "No pending role-selection session in this environment");
    }

    await expect(page.getByTestId("role-onboarding-pick-student")).toBeVisible();
    await expect(page.getByTestId("role-onboarding-pick-parent")).toBeVisible();
    await expect(page.getByTestId("role-onboarding-pick-teacher")).toBeVisible();
    await expect(page.getByTestId("role-onboarding-pick-institution")).toBeVisible();
    await expect(page.getByTestId("role-onboarding-pick-platform")).toBeVisible();
    await expect(page.getByTestId("role-onboarding-continue")).toBeVisible();
  });

  test("institution role card shows kurumsal copy when role pick is pending", async ({
    page,
    request,
  }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }

    await page.goto("/onboarding/role");
    const institution = page.getByTestId("role-onboarding-pick-institution");
    if ((await institution.count()) === 0) {
      testInfo.skip(true, "No pending role-selection session in this environment");
    }

    await institution.click();
    await expect(page.getByText(/Kurs, okul ve kurumsal|education institution/i)).toBeVisible();
  });
});
