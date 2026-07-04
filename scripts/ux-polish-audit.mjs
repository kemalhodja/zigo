/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
const cachedFeed = readFileSync(join(root, "src/lib/domain/social/cached-feed.ts"), "utf8");
const frame = readFileSync(join(root, "src/components/social-media-frame.tsx"), "utf8");

if (!nextConfig.includes("allowedDevOrigins")) {
  failures.push("next.config must set allowedDevOrigins for Playwright");
}
if (!cachedFeed.includes("getCachedSocialFeed")) {
  failures.push("cached social feed helper must exist for RSC performance");
}
if (!frame.includes("fetchPriority")) {
  failures.push("SocialMediaFrame should support fetchPriority for LCP");
}
if (!existsSync(join(root, "src/app/error.tsx"))) {
  failures.push("global error boundary (src/app/error.tsx) required");
}

if (failures.length > 0) {
  console.error("FAIL UX polish audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS UX polish audit");
