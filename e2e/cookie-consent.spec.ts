import { expect, test } from "@playwright/test";

test.describe("cookie consent banner", () => {
  test("shows consent banner on first visit and hides upon accepting", async ({ page }) => {
    await page.goto("/");
    const acceptBtn = page.getByRole("button", { name: /kabul et|accept/i });
    await expect(acceptBtn).toBeVisible();

    await acceptBtn.click();
    await expect(acceptBtn).not.toBeVisible();

    // Reload page to verify local storage persistence
    await page.reload();
    await expect(page.getByRole("button", { name: /kabul et|accept/i })).not.toBeVisible();
  });
});
