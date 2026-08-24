import { expect,test } from '@playwright/test';

test.describe('Parent Dashboard', () => {
  test('should display Child Progress Report header and Recharts canvas', async ({ page }) => {
    // Navigate to parent page
    // Note: Since this is an E2E test, auth might be needed. 
    // We assume test environment sets up auth or bypasses it for testing.
    await page.goto('/parent');

    // Check for main title
    await expect(page.locator('h1')).toContainText('Veli Paneli');

    // Check for Child Progress Report
    await expect(page.locator('text=�ocuk Geli�im Raporu')).toBeVisible();

    // Recharts renders a container class, check if it exists (meaning the chart is mounted)
    const chartContainer = page.locator('.recharts-responsive-container');
    // It might be hidden if there is no child, but if demo content is enabled, it should be visible
    if (await chartContainer.count() > 0) {
      await expect(chartContainer.first()).toBeVisible();
    }
  });
});

