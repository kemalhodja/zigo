import { expect, test } from "@playwright/test";

test.describe("registration account kinds", () => {
  test("sign-up shows five account types with org pricing hints", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /kay[ıi]t ol|sign up/i }).click();

    await expect(page.getByRole("button", { name: /Öğrenci Match-Feed/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Veli Çocuk/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Öğretmen Doğrulama/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Eğitim kurumu/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Eğitim platformu/i })).toBeVisible();
    await expect(page.getByText(/5\.000/)).toBeVisible();
    await expect(page.getByText(/4\.000/)).toBeVisible();
  });

  test("institution selection highlights kurumsal plan copy", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /kay[ıi]t ol|sign up/i }).click();
    await page.getByRole("button", { name: /Eğitim kurumu/i }).click();
    await expect(page.getByText(/5\.000/)).toBeVisible();
  });

  test("platform selection highlights platform plan copy", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /kay[ıi]t ol|sign up/i }).click();
    await page.getByRole("button", { name: /Eğitim platformu/i }).click();
    await expect(page.getByText(/4\.000/)).toBeVisible();
  });
});
