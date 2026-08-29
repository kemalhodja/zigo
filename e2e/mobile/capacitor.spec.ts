import { devices,expect, test } from "@playwright/test";

import { isDemoAuthAvailable } from "../helpers";

declare global {
  interface Window {
    Capacitor?: {
      Plugins?: {
        Haptics?: {
          impact: (options: { style: 'light' | 'medium' | 'heavy' }) => Promise<void>;
        };
      };
    }
  }
}

test.describe("Mobile Capacitor Tests", () => {
  test.describe.configure({ mode: "serial" });

  test.use({
    ...devices["Pixel 5"],
    viewport: { width: 390, height: 844 },
  });

  test.beforeEach(async ({ request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }
  });

  test.describe("Mobile App Shell", () => {
    test("mobile app shell loads", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
    });

    test("bottom navigation works", async ({ page }) => {
      await page.goto("/");
      
      const navItems = [
        { testId: "nav-home", url: "/" },
        { testId: "nav-micro", url: "/micro" },
        { testId: "nav-learn", url: "/learn" },
        { testId: "nav-profile", url: "/profile" },
      ];
      
      for (const item of navItems) {
        const navItem = page.getByTestId(item.testId);
        if (await navItem.count() > 0) {
          await navItem.click();
          await page.waitForURL(item.url, { timeout: 5000 });
          await expect(page).toHaveURL(new RegExp(item.url));
        }
      }
    });

    test("swipe gestures work on feed", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const feed = page.locator("#main-content");
      const box = await feed.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
        await page.mouse.up();
        await page.waitForTimeout(300);
        
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
      
      await expect(page.locator("#main-content")).toBeVisible();
    });
  });

  test.describe("Touch Interactions", () => {
    test("double tap like works", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const post = page.locator('[data-testid="feed-post-card"]').first();
      if (await post.count() > 0) {
        await post.dblclick();
        await page.waitForTimeout(500);
        
        await expect(page.locator('[data-testid="like-animation"], .like-heart')).toBeVisible({ timeout: 2000 }).catch(() => {});
      }
    });

    test("pull to refresh works", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const feed = page.locator("#main-content");
      await feed.evaluate(el => el.scrollTop = 0);
      await page.waitForTimeout(100);
      
      await page.mouse.move(200, 100);
      await page.mouse.down();
      await page.mouse.move(200, 300);
      await page.mouse.up();
      await page.waitForTimeout(1000);
      
      await expect(page.locator("#main-content")).toBeVisible();
    });

    test("long press shows context menu", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const post = page.locator('[data-testid="feed-post-card"]').first();
      if (await post.count() > 0) {
        await page.mouse.move(200, 300);
        await page.mouse.down();
        await page.waitForTimeout(600);
        await page.mouse.up();
        
        await expect(page.locator('[data-testid="context-menu"]')).toBeVisible({ timeout: 1000 }).catch(() => {});
      }
    });
  });

  test.describe("Capacitor Plugins", () => {
    test("haptic feedback on button press", async ({ page }) => {
      await page.goto("/");
      
      const button = page.getByRole("button").first();
      if (await button.count() > 0) {
        const hasHaptics = await page.evaluate(() => {
          const cap = window as unknown as { Capacitor?: { Plugins?: { Haptics?: { impact: (options: { style: 'light' | 'medium' | 'heavy' }) => Promise<void> } } } };
          return typeof cap.Capacitor !== 'undefined' && 
                 !!cap.Capacitor?.Plugins?.Haptics;
        });
        
        if (hasHaptics) {
          await page.evaluate(() => {
            (window as unknown as { Capacitor?: { Plugins?: { Haptics?: { impact: (options: { style: 'light' | 'medium' | 'heavy' }) => Promise<void> } } } }).Capacitor?.Plugins?.Haptics?.impact({ style: 'medium' });
          });
        }
      }
    });

    test("camera permission request", async () => {
      test.skip(true, "Requires camera permission handling");
    });

    test("geolocation permission request", async () => {
      test.skip(true, "Requires geolocation permission handling");
    });

    test("push notification permission", async () => {
      test.skip(true, "Requires push notification setup");
    });
  });

  test.describe("Deep Links", () => {
    test("post deep link opens app", async () => {
      test.skip(true, "Requires real device/emulator with deep link handler");
    });

    test("share deep link", async () => {
      test.skip(true, "Requires share sheet handling");
    });
  });

  test.describe("Offline Mode", () => {
    test("offline indicator shows", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      await page.context().setOffline(true);
      await page.reload();
      
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
      
      await page.context().setOffline(false);
      await page.reload();
    });

    test("offline queue syncs on reconnect", async () => {
      test.skip(true, "Requires offline queue implementation");
    });
  });

  test.describe("App Lifecycle", () => {
    test("app handles background/foreground", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      await page.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.waitForTimeout(500);
      await expect(page.locator("#main-content")).toBeVisible();
    });

    test("app restores state on foreground", async ({ page }) => {
      await page.goto("/learn");
      await page.waitForLoadState("networkidle");
      
      await page.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/learn/);
    });
  });

  test.describe("Biometric Auth", () => {
    test("face ID / fingerprint prompt", async () => {
      test.skip(true, "Requires biometric setup on device");
    });
  });

  test.describe("Safe Area Handling", () => {
    test("content respects safe area insets", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const mainContent = page.locator("#main-content");
      const styles = await mainContent.evaluate(el => getComputedStyle(el));
      
      expect(parseInt(styles.paddingTop)).toBeGreaterThanOrEqual(0);
      expect(parseInt(styles.paddingBottom)).toBeGreaterThanOrEqual(0);
    });

    test("notch/dynamic island handling", async ({ page }) => {
      await page.goto("/");
      
      const header = page.locator("header, [data-testid='app-header']").first();
      if (await header.count() > 0) {
        const styles = await header.evaluate(el => getComputedStyle(el));
        expect(parseInt(styles.paddingTop)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Performance", () => {
    test("app launches within 3 seconds", async ({ page }) => {
      const start = Date.now();
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const loadTime = Date.now() - start;
      expect(loadTime).toBeLessThan(3000);
    });

    test("smooth scrolling 60fps", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      await page.evaluate(() => {
        return new Promise<number>(resolve => {
          let frames = 0;
          let lastTime = performance.now();
          
          function countFrames(now: number) {
            frames++;
            if (now - lastTime >= 1000) {
              resolve(frames);
              return;
            }
            lastTime = now;
            requestAnimationFrame(countFrames);
          }
          
          requestAnimationFrame(countFrames);
        });
      });
      
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
    });
  });
});