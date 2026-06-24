/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const healthRoute = readFileSync(join(root, "src/app/api/setup/health/route.ts"), "utf8");
const ciWorkflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const nightlyWorkflow = readFileSync(join(root, ".github/workflows/live-tests-nightly.yml"), "utf8");

if (!healthRoute.includes("MIGRATION_TARGET")) {
  failures.push("health route must export migration target");
}
if (!healthRoute.includes('status:')) {
  failures.push("health route must return status healthy/degraded");
}
if (!healthRoute.includes("getLiveGates")) {
  failures.push("health route must probe live gates");
}
if (!ciWorkflow.includes("test:repo")) {
  failures.push("CI workflow must run test:repo");
}
if (!ciWorkflow.includes("build:safe")) {
  failures.push("CI workflow must run production build");
}
if (!nightlyWorkflow.includes("test:live:all")) {
  failures.push("nightly workflow must run live integration suite");
}
if (!nightlyWorkflow.includes("/api/setup/health")) {
  failures.push("nightly workflow must wait for health endpoint");
}

if (failures.length > 0) {
  console.error("FAIL monitoring health audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS monitoring health audit");
