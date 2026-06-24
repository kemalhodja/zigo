/* global console, process */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const SCAN_DIRS = ["src/app", "src/components", "src/lib/domain"];
const TYPES_PATH = join(root, "src/lib/supabase/database.types.ts");

const FORBIDDEN_PATTERNS = [
  { name: "@ts-ignore", regex: /@ts-ignore\b/ },
  { name: "@ts-nocheck", regex: /@ts-nocheck\b/ },
  { name: "explicit any type", regex: /:\s*any\b/ },
  { name: "as any cast", regex: /\bas any\b/ },
];

const REQUIRED_DB_MARKERS = [
  "social_posts",
  "get_parent_child_activity",
  "export_user_data",
];

function walkSourceFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__snapshots__") continue;
      walkSourceFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }

  return acc;
}

function listSourceFiles() {
  const files = SCAN_DIRS.flatMap((dir) => walkSourceFiles(join(root, dir)));
  return [...new Set(files)];
}

function checkForbiddenPatterns(files) {
  const violations = [];
  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.regex.test(line)) {
          violations.push({
            file: relative(root, filePath),
            line: index + 1,
            rule: pattern.name,
            text: line.trim(),
          });
        }
      }
    }
  }
  return violations;
}

function checkDeepDomainImports(files) {
  const violations = [];
  const deepImport = /from\s+["']@\/lib\/domain\/([^/"']+)\/([^/"']+)/;

  for (const filePath of files) {
    const rel = relative(root, filePath).replace(/\\/g, "/");
    if (!rel.startsWith("src/app/") && !rel.startsWith("src/components/")) continue;

    const content = readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(deepImport);
      if (match) {
        violations.push({
          file: rel,
          rule: "deep domain import",
          text: line.trim(),
          hint: `Use @/lib/domain/${match[1]} barrel instead of submodule path.`,
        });
      }
    }
  }
  return violations;
}

function verifyDatabaseTypesFile() {
  if (!existsSync(TYPES_PATH)) {
    return [{ rule: "database.types.ts missing", file: TYPES_PATH }];
  }

  const content = readFileSync(TYPES_PATH, "utf8");
  const missing = REQUIRED_DB_MARKERS.filter((marker) => !content.includes(marker));
  return missing.map((marker) => ({
    rule: "database.types marker missing",
    file: "src/lib/supabase/database.types.ts",
    hint: marker,
  }));
}

function main() {
  console.log("=== TypeScript strict audit ===\n");

  const files = listSourceFiles();
  const patternViolations = checkForbiddenPatterns(files);
  const importViolations = checkDeepDomainImports(files);
  const dbViolations = verifyDatabaseTypesFile();

  for (const item of [...patternViolations, ...importViolations, ...dbViolations]) {
    console.log(`FAIL ${item.rule} · ${item.file}${item.line ? `:${item.line}` : ""}`);
    if (item.text) console.log(`     ${item.text}`);
    if (item.hint) console.log(`     → ${item.hint}`);
  }

  const total = patternViolations.length + importViolations.length + dbViolations.length;
  if (total === 0) {
    console.log(`PASS scanned ${files.length} files — no @ts-ignore, explicit any, or deep domain imports in app/components`);
    console.log("PASS database.types.ts includes migration 042 markers");
    process.exit(0);
  }

  console.log(`\nAudit failed: ${total} issue(s)`);
  process.exit(1);
}

main();
