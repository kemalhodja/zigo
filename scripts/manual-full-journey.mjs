/* global console, process */

import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const scripts = [
  "manual-student-journey.mjs",
  "manual-parent-journey.mjs",
  "manual-teacher-journey.mjs",
  "e2e-flow-check.mjs",
];

function runScript(name) {
  console.log(`\n========== ${name} ==========\n`);
  const result = spawnSync(process.execPath, [join(root, "scripts", name)], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  return result.status === 0;
}

function main() {
  const outcomes = scripts.map((script) => ({ script, ok: runScript(script) }));
  const failed = outcomes.filter((item) => !item.ok);

  console.log("\n========== FULL JOURNEY SUMMARY ==========");
  for (const item of outcomes) {
    console.log(`${item.ok ? "PASS" : "FAIL"} ${item.script}`);
  }

  console.log(`\nTam yolculuk: ${outcomes.length - failed.length}/${outcomes.length} suite geçti`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
