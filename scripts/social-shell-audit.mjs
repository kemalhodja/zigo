/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    failures.push(`missing file: ${relativePath}`);
    return "";
  }
  return readFileSync(filePath, "utf8");
}

const layout = read("src/app/layout.tsx");
const productStandard = read("src/lib/domain/product-standard.ts");
const bottomNav = read("src/components/bottom-nav.tsx");
const appShell = read("src/components/app-shell.tsx");
const vocab = read("src/lib/zigo-vocabulary.ts");
const nextConfig = read("next.config.ts");
const safeChecklist = read("docs/safe-instagram-feel-checklist.md");

if (layout.includes("Instagram") || productStandard.includes("Instagram")) {
  failures.push("user-facing copy must not mention Instagram brand");
}
if (!bottomNav.includes("grid-cols-5")) {
  failures.push("bottom nav must use 5-column mobile shell");
}
if (!bottomNav.includes("ZIGO_PATHS.micro")) {
  failures.push("bottom nav must link Micro via ZIGO_PATHS");
}
if (!appShell.includes("skip-to-content") || !appShell.includes("LegalFooter")) {
  failures.push("app shell must expose skip link and legal footer");
}
if (!vocab.includes("microLessons") || !vocab.includes("sparks")) {
  failures.push("zigo vocabulary must define microLessons and sparks");
}
if (!nextConfig.includes('source: "/reels"') || !nextConfig.includes('destination: "/micro"')) {
  failures.push("next.config must redirect legacy /reels to /micro");
}
if (!safeChecklist.includes("Verified Education Feed")) {
  failures.push("safe-instagram-feel checklist must define store-safe positioning");
}

if (failures.length > 0) {
  console.error("FAIL social shell audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS social shell audit");
