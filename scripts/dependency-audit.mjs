/* global console, process */

import { execSync } from "node:child_process";

const failLevel = process.env.ZIGO_AUDIT_FAIL_LEVEL ?? "high";
const reportLevel = process.env.ZIGO_AUDIT_REPORT_LEVEL ?? "moderate";

function runAudit(level) {
  try {
    const output = execSync(`npm audit --audit-level=${level} --json`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, payload: JSON.parse(output) };
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? "";
    if (!stdout.trim()) {
      throw error;
    }
    return { ok: false, payload: JSON.parse(stdout) };
  }
}

function summarize(payload) {
  const meta = payload.metadata?.vulnerabilities ?? {};
  return {
    info: meta.info ?? 0,
    low: meta.low ?? 0,
    moderate: meta.moderate ?? 0,
    high: meta.high ?? 0,
    critical: meta.critical ?? 0,
    total: meta.total ?? 0,
  };
}

const report = runAudit(reportLevel);
const counts = summarize(report.payload);

console.log(
  `Dependency audit: info=${counts.info} low=${counts.low} moderate=${counts.moderate} high=${counts.high} critical=${counts.critical}`,
);

if (counts.moderate > 0) {
  console.log(
    "NOTE: moderate findings are tracked quarterly; fail gate uses ZIGO_AUDIT_FAIL_LEVEL (default: high).",
  );
}

const gate = runAudit(failLevel);
const gateCounts = summarize(gate.payload);

if (!gate.ok || gateCounts.high > 0 || gateCounts.critical > 0) {
  console.error(`FAIL dependency audit at level "${failLevel}"`);
  process.exit(1);
}

console.log(`PASS dependency audit (fail level: ${failLevel})`);
