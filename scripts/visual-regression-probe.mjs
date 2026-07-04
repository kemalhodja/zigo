/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) throw new Error(`Missing: ${relativePath}`);
  return readFileSync(filePath, "utf8");
}

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
  return { name, ok };
}

function main() {
  const checks = [];

  checks.push(check("Home loading skeleton", read("src/app/loading.tsx").includes("skeleton-shimmer")));
  checks.push(check("Explore loading skeleton", read("src/app/explore/loading.tsx").includes("skeleton-shimmer")));
  checks.push(check("Profile loading skeleton", read("src/app/profile/loading.tsx").includes("skeleton-shimmer")));
  checks.push(check("Micro loading skeleton", read("src/app/micro/loading.tsx").includes("skeleton-shimmer")));

  checks.push(check("Story ring styling", read("src/app/globals.css").includes(".story-ring")));
  checks.push(check("Follow button test id", read("src/components/follow-button.tsx").includes('data-testid="follow-button"')));
  checks.push(check("Learn quiz card test id", read("src/components/learn-quiz-card.tsx").includes('data-testid="learn-quiz-card"')));

  checks.push(check("State card empty states", read("src/components/state-card.tsx").includes("StateCard")));
  checks.push(check("Safe duel card", read("src/components/safe-duel-card.tsx").includes("SafeDuelCard")));
  checks.push(check("Legal footer wired", read("src/components/app-shell.tsx").includes("LegalFooter")));

  checks.push(check("Offline fallback page", existsSync(join(root, "public/offline.html"))));
  checks.push(check("PWA manifest", existsSync(join(root, "public/manifest.json"))));

  const manifest = JSON.parse(read("public/manifest.json"));
  checks.push(check("Manifest icons", Array.isArray(manifest.icons) && manifest.icons.length >= 1, `${manifest.icons?.length ?? 0} icons`));

  checks.push(check("Visual regression checklist doc", read("docs/visual-regression-checklist.md").includes("Micro fills the vertical viewport")));
  checks.push(check("QA coverage map", read("docs/qa-coverage-map.md").includes("manual → automated")));

  const failed = checks.filter((row) => !row.ok);
  console.log(`\nVisual regression probe: ${checks.length - failed.length}/${checks.length} passed`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
