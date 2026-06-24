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

const ci = read(".github/workflows/ci.yml");
const nightly = read(".github/workflows/live-tests-nightly.yml");
const packageJson = read("package.json");

const required = [
  [ci.includes("npm run test:repo"), "CI must run test:repo"],
  [ci.includes("test:unit:coverage"), "CI must run unit coverage gate"],
  [ci.includes("build:safe"), "CI must run production build"],
  [ci.includes("playwright install"), "CI must install Playwright"],
  [nightly.includes("test:live:all"), "nightly workflow must run live suite"],
  [nightly.includes("/api/setup/health"), "nightly workflow must wait for health"],
  [packageJson.includes('"test:repo": "npm run audit:all'), "test:repo must start with audit:all"],
  [packageJson.includes('"test:repo:fast": "npm run audit:all'), "test:repo:fast must start with audit:all"],
  [packageJson.includes('"test:release"'), "test:release gate must exist"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL CI alignment audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS CI alignment audit");
