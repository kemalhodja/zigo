/* global console, process */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();

const ALLOWED_ADMIN_IMPORTS = new Set([
  "src/lib/supabase/admin.ts",
  "src/app/api/billing/webhook/route.ts",
  "src/lib/domain/live-gates.ts",
  "src/lib/domain/setup-progress.ts",
]);

const ALLOWED_SERVICE_ROLE_MENTIONS = new Set([
  "src/components/hosted-deploy-card.tsx",
  "src/components/live-gates-panel.tsx",
  "src/components/supabase-setup-card.tsx",
]);

const FORBIDDEN_IN_CLIENT_DIRS = ["src/components", "src/app"];

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walkFiles(full, acc);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      acc.push(full);
    }
  }

  return acc;
}

function rel(path) {
  return relative(root, path).replace(/\\/g, "/");
}

const violations = [];

for (const filePath of walkFiles(join(root, "src"))) {
  const content = readFileSync(filePath, "utf8");
  const fileRel = rel(filePath);

  if (content.includes("SUPABASE_SERVICE_ROLE_KEY") && !fileRel.endsWith("admin.ts")) {
    if (ALLOWED_SERVICE_ROLE_MENTIONS.has(fileRel)) continue;
    const inClientDir = FORBIDDEN_IN_CLIENT_DIRS.some((prefix) => fileRel.startsWith(prefix));
    const mentionsServerOnly = content.includes("serverOnly") || content.includes("DeployEnvRow");
    if (inClientDir && !mentionsServerOnly) {
      violations.push(`${fileRel}: references SUPABASE_SERVICE_ROLE_KEY in client-facing code`);
    }
  }

  if (content.includes("createAdminClient")) {
    if (!ALLOWED_ADMIN_IMPORTS.has(fileRel)) {
      violations.push(`${fileRel}: createAdminClient must stay server-only (allowed: ${[...ALLOWED_ADMIN_IMPORTS].join(", ")})`);
    }
  }
}

if (violations.length > 0) {
  console.error("FAIL service-role audit");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`PASS service-role audit (${ALLOWED_ADMIN_IMPORTS.size} allowed import sites)`);
