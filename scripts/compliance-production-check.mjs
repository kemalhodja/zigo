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

const packageJson = read("package.json");
const complianceDoc = read("docs/compliance.md");
const productionChecklist = read("docs/production-checklist.md");
const finalAcceptance = read("docs/final-acceptance-checklist.md");

const required = [
  [packageJson.includes('"audit:compliance"'), "audit:compliance script wired"],
  [complianceDoc.includes("export_user_data"), "compliance.md documents export RPC"],
  [complianceDoc.includes("lawyer review"), "compliance.md mentions lawyer review"],
  [productionChecklist.includes("/legal/kvkk"), "production-checklist lists KVKK page"],
  [finalAcceptance.includes("/legal/"), "final-acceptance-checklist references legal pages"],
  [existsSync(join(root, "scripts/legal-pages-audit.mjs")), "legal-pages-audit.mjs exists"],
  [existsSync(join(root, "scripts/export-completeness-audit.mjs")), "export-completeness-audit.mjs exists"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL compliance production check");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS compliance production check");
