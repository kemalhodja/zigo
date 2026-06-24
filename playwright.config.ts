import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3005";
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npm run dev -- -p ${port}`,
        url: `${baseURL}/api/setup/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ZIGO_DISABLE_AUTH_RATE_LIMIT: "1",
        },
      },
});
