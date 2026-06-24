/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Missing file: ${relativePath}`);
  }
  return readFileSync(filePath, "utf8");
}

const failures = [];

const opsDoc = read("docs/operational-security.md");
const incidentDoc = read("docs/incident-response-runbook.md");
const nextConfig = read("next.config.ts");
const securityHeaders = read("src/lib/server/security-headers.ts");
const packageJson = read("package.json");
const maintenanceDoc = read("docs/maintenance.md");
const stagingExample = read(".env.staging.example");

const required = [
  [opsDoc.includes("Secret rotation playbook"), "operational-security documents secret rotation"],
  [opsDoc.includes("Log retention"), "operational-security documents log retention"],
  [opsDoc.includes("backup"), "operational-security documents backup"],
  [incidentDoc.includes("SEV-1"), "incident runbook defines severity levels"],
  [nextConfig.includes("buildSecurityHeaders"), "next.config applies security headers"],
  [securityHeaders.includes("Content-Security-Policy"), "security-headers module defines CSP"],
  [packageJson.includes('"audit:ops"'), "audit:ops script wired"],
  [packageJson.includes('"env-leak-audit.mjs"') || packageJson.includes("env-leak-audit"), "env-leak audit in audit:ops"],
  [maintenanceDoc.includes("audit:ops"), "maintenance doc references audit:ops"],
  [stagingExample.includes("Never commit real secrets"), "staging example warns against committing secrets"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL operational security production audit");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("PASS operational security production audit");
