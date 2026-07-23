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

const generatedPath = join(root, "android/app/src/main/assets/capacitor.config.json");
const generatedAndroidConfig = existsSync(generatedPath) ? readFileSync(generatedPath, "utf8") : "";
const capacitorSource = read("capacitor.config.ts");
const androidBuild = read("scripts/android-build-aab.mjs");
const serviceWorker = read("public/sw.js");
const manifest = read("public/manifest.json");
const packageJson = read("package.json");

const checks = [
  { name: "mobile routes exist", ok: mobileRoutes.every((route) => existsSync(join(root, route))) },
  {
    name: "capacitor source is localhost-free",
    ok: !capacitorSource.includes("localhost") && capacitorSource.includes("CAPACITOR_SERVER_URL || undefined"),
  },
  {
    name: "generated android config is localhost-free",
    // File is gitignored and created by `cap sync`; when absent, source + release default are enough.
    ok: !generatedAndroidConfig.includes("localhost"),
  },
  {
    name: "android release default uses hosted URL",
    ok: androidBuild.includes("zigo-kohl.vercel.app") && !androidBuild.includes('|| "https://zigo.app"'),
  },
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
