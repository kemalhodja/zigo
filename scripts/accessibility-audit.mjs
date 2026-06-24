/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const appShell = readFileSync(join(root, "src/components/app-shell.tsx"), "utf8");
const bottomNav = readFileSync(join(root, "src/components/bottom-nav.tsx"), "utf8");
const globals = readFileSync(join(root, "src/app/globals.css"), "utf8");
const qaSpec = readFileSync(join(root, "e2e/accessibility.spec.ts"), "utf8");

if (!appShell.includes("skipToContent")) {
  failures.push("app-shell must expose skip-to-content link");
}
if (!appShell.includes('aria-label')) {
  failures.push("app-shell header actions need aria-label");
}
if (!bottomNav.includes("aria-label")) {
  failures.push("bottom-nav items need aria-label");
}
if (!globals.includes("prefers-reduced-motion")) {
  failures.push("globals.css must respect prefers-reduced-motion");
}
if (!qaSpec.includes("skip-to-content")) {
  failures.push("accessibility e2e should cover skip link");
}

if (failures.length > 0) {
  console.error("FAIL accessibility audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS accessibility audit");
