import { expect, test } from "@playwright/test";

import { dismissAppIntro } from "./helpers";

test.describe("registration account kinds", () => {
  test.beforeEach(async ({ page }) => {
    await dismissAppIntro(page);
  });

  test("sign-up shows four primary account groups", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();

    await expect(page.getByTestId("registration-primary-student")).toBeVisible();
    await expect(page.getByTestId("registration-primary-parent")).toBeVisible();
    await expect(page.getByTestId("registration-primary-teacher")).toBeVisible();
    await expect(page.getByTestId("registration-primary-education")).toBeVisible();

    await expect(page.getByTestId("registration-account-kurs")).toHaveCount(0);
  });

  test("education reveals kurs okul platform publisher", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();
    await page.getByTestId("registration-primary-education").click();

    await expect(page.getByTestId("registration-account-kurs")).toBeVisible();
    await expect(page.getByTestId("registration-account-okul")).toBeVisible();
    await expect(page.getByTestId("registration-account-platform")).toBeVisible();
    await expect(page.getByTestId("registration-account-publisher")).toBeVisible();
    await expect(page.getByTestId("registration-account-institution")).toHaveCount(0);
  });

  test("kurs selection highlights kurs account copy", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();
    await page.getByTestId("registration-primary-education").click();
    await page.getByTestId("registration-account-kurs").click();
    await expect(page.getByText(/Kurs merkezi veya özel ders|course center|private lesson/i)).toBeVisible();
  });

  test("okul selection highlights okul account copy", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();
    await page.getByTestId("registration-primary-education").click();
    await page.getByTestId("registration-account-okul").click();
    await expect(page.getByText(/Okul ve kampüs|school and campus/i)).toBeVisible();
  });

  test("platform selection highlights platform account copy", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();
    await page.getByTestId("registration-primary-education").click();
    await page.getByTestId("registration-account-platform").click();
    await expect(page.getByText(/Dijital eğitim platformu|digital education platform|content network/i)).toBeVisible();
  });

  test("publisher selection highlights yayınevi account copy", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("auth-mode-sign-up").click();
    await page.getByTestId("registration-primary-education").click();
    await page.getByTestId("registration-account-publisher").click();
    await expect(page.getByText(/Eğitim yayınları|education publishing|publisher/i)).toBeVisible();
  });
});
