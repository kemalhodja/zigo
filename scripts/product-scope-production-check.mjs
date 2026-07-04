/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) throw new Error(`Missing file: ${relativePath}`);
  return readFileSync(filePath, "utf8");
}

const failures = [];
const packageJson = read("package.json");
const doc = read("docs/product-scope-audit.md");

const required = [
  [packageJson.includes('"audit:product-scope"'), "audit:product-scope wired"],
  [packageJson.includes("match-feed-invariant-audit"), "match-feed audit in bundle"],
  [packageJson.includes("store-parent-approval-audit"), "store approval audit in bundle"],
  [doc.includes("Match-Feed"), "product-scope doc mentions Match-Feed"],
  [existsSync(join(root, "src/lib/domain/feed/queries.test.ts")), "feed/queries.test.ts exists"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL product scope production audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS product scope production audit");
