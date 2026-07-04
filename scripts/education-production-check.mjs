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
const doc = read("docs/education-core.md");
const productDoc = read("docs/product-scope-audit.md");

const required = [
  [packageJson.includes('"audit:education"'), "audit:education script wired"],
  [doc.includes("+10"), "education-core doc documents +10 watch/quiz rewards"],
  [doc.includes("+25"), "education-core doc documents duel reward"],
  [doc.includes("402"), "education-core doc documents study plan Plus gate"],
  [productDoc.includes("micro-lesson-gates"), "product-scope doc references micro lesson gates"],
  [existsSync(join(root, "src/lib/domain/learning/progress.ts")), "learning/progress.ts exists"],
  [existsSync(join(root, "src/app/api/learn/quiz/route.ts")), "learn quiz API exists"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL education production check");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS education production check");
