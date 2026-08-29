import { expect, test } from "@playwright/test";

import { demoLogin, isDemoAuthAvailable } from "../helpers";

test.describe("Feed & Content Critical Paths", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }, testInfo) => {
    if (!(await isDemoAuthAvailable(request))) {
      testInfo.skip(true, "Live Supabase demo auth unavailable");
    }
  });

  test.describe("Home Feed Hero Post", () => {
    test("hero post displays larger (4:3) with caption overlay", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const heroPost = page.locator('[data-testid="hero-post"]').first();
      if (await heroPost.count() > 0) {
        // Check 4:3 aspect ratio (approx)
        const box = await heroPost.boundingBox();
        if (box) {
          const ratio = box.width / box.height;
          expect(ratio).toBeGreaterThan(1.2); // 4:3 = 1.33
          expect(ratio).toBeLessThan(1.5);
        }
        
        // Check caption overlay
        await expect(page.locator('[data-testid="hero-caption-overlay"]')).toBeVisible();
      }
    });

    test("normal posts are compact (1:1)", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const normalPosts = page.locator('[data-testid="feed-post-card"]').filter({ hasNotText: /hero/i });
      const count = await normalPosts.count();
      
      if (count > 1) {
        const secondPost = normalPosts.nth(1);
        const box = await secondPost.boundingBox();
        if (box) {
          const ratio = box.width / box.height;
          expect(ratio).toBeGreaterThan(0.8);
          expect(ratio).toBeLessThan(1.2);
        }
      }
    });

    test("feed loads without layout shift", async ({ page }) => {
      await demoLogin(page, "student");
      
      // Measure CLS using Performance API
      const cls = await page.evaluate(() => {
        return new Promise<number>(resolve => {
          let clsValue = 0;
          const observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number };
              if (!layoutShiftEntry.hadRecentInput) {
                clsValue += layoutShiftEntry.value;
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => resolve(clsValue), 2000);
        });
      });
      
      expect(cls).toBeLessThan(0.1);
    });
  });

  test.describe("Feed Interactions", () => {
    test("like post increments count", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const firstPost = page.locator('[data-testid="feed-post-card"]').first();
      const likeButton = firstPost.getByTestId("like-button");
      
      if (await likeButton.count() > 0) {
        const initialCount = await firstPost.getByTestId("like-count").textContent();
        await likeButton.click();
        await page.waitForTimeout(500);
        
        const newCount = await firstPost.getByTestId("like-count").textContent();
        expect(parseInt(newCount || "0")).toBeGreaterThan(parseInt(initialCount || "0"));
      }
    });

    test("comment opens modal", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const firstPost = page.locator('[data-testid="feed-post-card"]').first();
      await firstPost.getByTestId("comment-button").click();
      
      await expect(page.locator('[data-testid="comment-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="comment-input"]')).toBeVisible();
    });

    test("share copies link", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      const firstPost = page.locator('[data-testid="feed-post-card"]').first();
      await firstPost.getByTestId("share-button").click();
      
      // Check clipboard or share modal
      await expect(page.locator('[data-testid="share-modal"], [data-testid="toast"]').first()).toBeVisible();
    });
  });

  test.describe("Video/Micro Content", () => {
    test("video plays and tracks progress", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/micro");
      
      const videoPost = page.locator('[data-testid="video-post"]').first();
      if (await videoPost.count() > 0) {
        const video = videoPost.locator("video").first();
        await expect(video).toBeVisible();
        
        // Play video
        await video.evaluate((v: HTMLVideoElement) => v.play());
        await page.waitForTimeout(2000);
        
        const currentTime = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
        expect(currentTime).toBeGreaterThan(0);
      }
    });

    test("watch 60 seconds awards points", async () => {
      test.skip(true, "Requires video and point tracking");
    });
  });

  test.describe("Quiz Flow", () => {
    test("quiz loads with questions", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/learn");
      
      const quizCard = page.locator('[data-testid="learn-quiz-card"]').first();
      if (await quizCard.count() > 0) {
        await expect(quizCard).toBeVisible();
        await expect(quizCard.locator('[data-testid="quiz-question"]')).toBeVisible();
        await expect(quizCard.locator('[data-testid="quiz-option"]').first()).toBeVisible();
      }
    });

    test("submit answer shows result", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/learn");
      
      const quizCard = page.locator('[data-testid="learn-quiz-card"]').first();
      if (await quizCard.count() > 0) {
        await quizCard.getByTestId("quiz-option").first().click();
        await quizCard.getByTestId("submit-answer").click();
        
        await expect(page.locator('[data-testid="quiz-result"]').first()).toBeVisible();
      }
    });

    test("multi-question quiz navigation", async () => {
      test.skip(true, "Requires multi-question quiz");
    });
  });

  test.describe("Story/Sparks", () => {
    test("story tray displays stories", async ({ page }) => {
      await demoLogin(page, "student");
      await page.goto("/");
      
      await expect(page.locator('[data-testid="story-tray"]')).toBeVisible();
    });

    test("create story opens camera/upload", async () => {
      test.skip(true, "Requires camera permission");
    });
  });
});