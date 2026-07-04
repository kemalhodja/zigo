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

const legalRoutes = [
  ["src/app/legal/privacy/page.tsx", ["KVKK", "privacy", "Privacy"]],
  ["src/app/legal/terms/page.tsx", ["Terms", "terms", "Kullanım"]],
  ["src/app/legal/kvkk/page.tsx", ["KVKK", "kvkk"]],
  ["src/app/legal/delete-account/page.tsx", ["/api/account/export", "/api/account/delete-request"]],
];

for (const [file, markers] of legalRoutes) {
  const content = read(file);
  if (!content.includes("LegalLayout")) {
    failures.push(`${file} must use LegalLayout`);
  }
  const hasMarker = markers.some((marker) => content.includes(marker));
  if (!hasMarker) {
    failures.push(`${file} missing expected legal marker (${markers.join(" | ")})`);
  }
}

const footer = read("src/components/legal-footer.tsx");
for (const route of ["/legal/privacy", "/legal/terms", "/legal/kvkk", "/legal/delete-account"]) {
  if (!footer.includes(route)) {
    failures.push(`legal-footer missing link to ${route}`);
  }
}

const e2eHelpers = read("e2e/helpers.ts");
for (const route of ["/legal/privacy", "/legal/terms", "/legal/kvkk", "/legal/delete-account"]) {
  if (!e2eHelpers.includes(route)) {
    failures.push(`e2e LEGAL_ROUTES missing ${route}`);
  }
}

if (!existsSync(join(root, "e2e/legal.spec.ts"))) {
  failures.push("e2e/legal.spec.ts missing");
}

if (failures.length > 0) {
  console.error("FAIL legal pages audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS legal pages audit (4 routes, footer, e2e)");
