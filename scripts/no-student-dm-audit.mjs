/* global console, process */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

for (const filePath of walk(join(root, "src/app"))) {
  const rel = filePath.replace(`${root}${join.sep}`, "").replace(/\\/g, "/");
  if (/\/messages(\/|$)/.test(rel)) {
    failures.push(`forbidden student DM route: ${rel}`);
  }
}

const dbTypes = readFileSync(join(root, "src/lib/supabase/database.types.ts"), "utf8");
for (const table of ["direct_messages", "conversations", "private_messages"]) {
  if (dbTypes.includes(`${table}:`)) {
    failures.push(`database.types mentions forbidden table ${table}`);
  }
}

const qaSpec = readFileSync(join(root, "e2e/qa-checklist.spec.ts"), "utf8");
if (!qaSpec.includes("/messages")) {
  failures.push("e2e qa-checklist must assert /messages is not exposed");
}

const gamification = readFileSync(join(root, "src/app/api/gamification/award/route.ts"), "utf8");
if (!gamification.includes("disabled") && !gamification.includes("410")) {
  failures.push("gamification award route must stay disabled");
}

if (failures.length > 0) {
  console.error("FAIL no-student-dm audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS no-student-dm audit");
