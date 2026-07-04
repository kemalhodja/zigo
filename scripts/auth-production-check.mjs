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

const signIn = read("src/app/api/auth/sign-in/route.ts");
const signUp = read("src/app/api/auth/sign-up/route.ts");
const reports = read("src/app/api/social/reports/route.ts");
const questions = read("src/app/api/questions/route.ts");
const authPanel = read("src/components/auth-panel.tsx");
const authGates = read("src/lib/domain/auth-gates.ts");
const passwordPolicy = read("src/lib/domain/password-policy.ts");
const authDoc = read("docs/auth-production.md");
const packageJson = read("package.json");

const required = [
  [signIn.includes("enforceAuthRateLimit"), "sign-in route uses IP rate limit"],
  [signIn.includes("verifyAuthRecaptcha"), "sign-in route supports reCAPTCHA"],
  [signUp.includes("registrationPasswordSchema"), "sign-up uses registration password schema"],
  [signUp.includes("enforceAuthRateLimit"), "sign-up route uses IP rate limit"],
  [reports.includes("checkRateLimit(`report:"), "reports route rate limited"],
  [questions.includes("checkRateLimit(`question:"), "questions route rate limited"],
  [authPanel.includes('"signin"'), "auth panel sends reCAPTCHA on sign-in"],
  [authGates.includes("ZIGO_REQUIRE_EMAIL_CONFIRM"), "email confirmation gate documented in code"],
  [authGates.includes("ZIGO_REQUIRE_STUDENT_DOCUMENT"), "student document gate documented in code"],
  [passwordPolicy.includes("isCommonPassword"), "common password block exists"],
  [authDoc.includes("POST /api/auth/sign-in"), "auth production doc lists sign-in limits"],
  [packageJson.includes('"audit:auth"'), "audit:auth script wired"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL auth production audit");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("PASS auth production audit");
