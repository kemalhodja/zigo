/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const mobileRoutes = [
  "src/app/page.tsx",
  "src/app/micro/page.tsx",
  "src/app/explore/page.tsx",
  "src/app/profile/page.tsx",
  "src/app/create/page.tsx",
  "src/app/auth/page.tsx",
  "src/app/onboarding/page.tsx",
  "src/app/sparks/page.tsx",
];

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return readFileSync(filePath, "utf8");
}

const generatedAndroidConfig = read("android/app/src/main/assets/capacitor.config.json");
const serviceWorker = read("public/sw.js");
const manifest = read("public/manifest.json");
const packageJson = read("package.json");

const checks = [
  { name: "mobile routes exist", ok: mobileRoutes.every((route) => existsSync(join(root, route))) },
  { name: "generated android config is localhost-free", ok: !generatedAndroidConfig.includes("localhost") },
  { name: "service worker has offline fallback", ok: serviceWorker.includes("caches.match(\"/offline.html\")") },
  { name: "service worker avoids stale page caching", ok: serviceWorker.includes("request.mode === \"navigate\"") && serviceWorker.includes("STATIC_ASSET_PATTERN") },
  { name: "manifest is install ready", ok: manifest.includes("\"display\": \"standalone\"") && manifest.includes("\"orientation\": \"portrait\"") },
  { name: "android preflight scripts exist", ok: packageJson.includes("android:preflight") && packageJson.includes("build:safe") },
  { name: "android run script exists", ok: packageJson.includes("android:run") && existsSync(join(root, "scripts/android-run.mjs")) },
  { name: "android release keystore template exists", ok: existsSync(join(root, "android/keystore.properties.example")) },
  { name: "pending migration apply script exists", ok: packageJson.includes("migrations:pending") && existsSync(join(root, "scripts/apply-pending-migrations.mjs")) },
];

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}`);
}

process.exit(failed.length > 0 ? 1 : 0);
