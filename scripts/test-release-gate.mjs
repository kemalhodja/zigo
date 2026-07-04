/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { liveTestsForced } from "./live-test-utils.mjs";

const root = process.cwd();

function runShell(cmd) {
  const result = spawnSync(cmd, { cwd: root, stdio: "inherit", encoding: "utf8", shell: true, env: process.env });
  return result.status === 0;
}

function runScript(name) {
  const result = spawnSync(process.execPath, [join(root, "scripts", name)], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  return result.status === 0;
}

function main() {
  console.log("=== Zigo release gate ===\n");

  const steps = [
    { label: "test:repo", run: () => runShell("npm run test:repo") },
    { label: "test:unit:coverage", run: () => runShell("npm run test:unit:coverage") },
    { label: "visual-regression-probe", run: () => runScript("visual-regression-probe.mjs") },
    {
      label: "qa-coverage-map",
      run: () => existsSync(join(root, "docs/qa-coverage-map.md")) && readFileSync(join(root, "docs/qa-coverage-map.md"), "utf8").includes("test:release"),
    },
    {
      label: "bug-report-template",
      run: () => existsSync(join(root, ".github/ISSUE_TEMPLATE/bug_report.yml")),
    },
  ];

  if (liveTestsForced()) {
    steps.push({ label: "test:live:all", run: () => runShell("npm run test:live:all") });
  } else {
    console.log("SKIP test:live:all (set ZIGO_RUN_LIVE_TESTS=1 for release with Docker Supabase)\n");
  }

  const outcomes = steps.map((step) => ({ label: step.label, ok: step.run() }));

  console.log("\n=== RELEASE GATE SUMMARY ===");
  for (const item of outcomes) {
    console.log(`${item.ok ? "PASS" : "FAIL"} ${item.label}`);
  }

  const failed = outcomes.filter((item) => !item.ok);
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
