import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/lib/domain/moderation.ts",
        "src/lib/domain/moderation-ai.ts",
        "src/lib/domain/stripe-webhook.ts",
        "src/lib/domain/social/schemas.ts",
        "src/lib/domain/questions.ts",
        "src/lib/domain/parent-dashboard.ts",
        "src/lib/domain/social/feed.ts",
        "src/lib/domain/social/safety.ts",
        "src/app/api/posts/route.ts",
        "src/app/api/gamification/award/route.ts",
        "src/app/api/setup/health/route.ts",
      ],
      exclude: ["src/**/*.test.ts"],
      thresholds: {
        lines: 40,
      },
    },
  },
});
