/* global console, process */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const failures = [];

const SECRET_PATTERNS = [
  { name: "Stripe live secret", pattern: /\bsk_live_[0-9a-zA-Z]{16,}\b/ },
  { name: "Stripe webhook secret", pattern: /\bwhsec_[0-9a-zA-Z]{16,}\b/ },
  { name: "Supabase service_role JWT", pattern: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/ },
];

const SKIP_DIRS = new Set(["node_modules", ".next", "out", "dist", "android", ".git"]);
const SKIP_FILES = new Set([
  ".env.example",
  ".env.production.example",
  ".env.staging.example",
  "supabase/zigo-full-migrations.sql",
]);

const ALLOWLIST_PATH_FRAGMENTS = [
  "scripts/env-leak-audit.mjs",
  "docs/operational-security.md",
  "docs/hosted-deploy-checklist.md",
];

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, acc);
    } else if (/\.(ts|tsx|js|jsx|mjs|md|json|sql|env|example|yml|yaml)$/i.test(entry.name)) {
      acc.push(full);
    }
  }

  return acc;
}

function isAllowlisted(fileRel) {
  return ALLOWLIST_PATH_FRAGMENTS.some((fragment) => fileRel.includes(fragment));
}

function looksLikePlaceholder(value) {
  return (
    /your_|YOUR_|example|placeholder|changeme|xxx|\.\.\./i.test(value) ||
    value.includes("your_") ||
    value.length < 24
  );
}

const gitignore = read(".gitignore");
if (!gitignore.includes(".env") || !gitignore.includes(".env*.local")) {
  failures.push(".gitignore must ignore .env and .env*.local");
}

for (const envName of [".env", ".env.local", ".env.staging"]) {
  if (existsSync(join(root, envName))) {
    console.log(`NOTE ${envName} present locally (ignored by git if listed in .gitignore)`);
  }
}

try {
  const tracked = execSync("git ls-files", { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const file of tracked) {
    if (
      /^\.env(\.|$)/.test(file) &&
      file !== ".env.example" &&
      file !== ".env.staging.example" &&
      file !== ".env.production.example"
    ) {
      failures.push(`Tracked env file must not be committed: ${file}`);
    }
  }
} catch {
  console.log("NOTE git not available — skipping tracked-file env scan");
}

for (const filePath of walkFiles(root)) {
  const fileRel = relative(root, filePath).replace(/\\/g, "/");
  if (SKIP_FILES.has(fileRel)) continue;
  if (isAllowlisted(fileRel)) continue;
  if (fileRel.startsWith("node_modules/")) continue;

  const stats = statSync(filePath);
  if (stats.size > 512_000) continue;

  const source = readFileSync(filePath, "utf8");
  for (const { name, pattern } of SECRET_PATTERNS) {
    const match = source.match(pattern);
    if (match && !looksLikePlaceholder(match[0])) {
      failures.push(`${fileRel}: possible ${name} (${match[0].slice(0, 12)}…)`);
    }
  }
}

if (failures.length > 0) {
  console.error("FAIL env leak audit");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("PASS env leak audit (gitignore, tracked env files, secret pattern scan)");
