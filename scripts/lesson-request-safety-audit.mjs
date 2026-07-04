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

if (!dbTypes.includes("lesson_requests:")) {
  failures.push("lesson_requests table must exist in database.types");
}

if (!dbTypes.includes("lesson_request_messages:")) {
  failures.push("lesson_request_messages table must exist in database.types");
}

const lessonApi = readFileSync(join(root, "src/app/api/lesson-requests/route.ts"), "utf8");
if (!lessonApi.includes('profile.role === "student"')) {
  failures.push("lesson-requests API must block students");
}

const lessonMutations = readFileSync(join(root, "src/lib/domain/lesson-requests/mutations.ts"), "utf8");
if (!lessonMutations.includes("STUDENT_MESSAGING_BLOCKED")) {
  failures.push("lesson-requests mutations must block student messaging");
}

const migration = readFileSync(
  join(root, "supabase/migrations/063_lesson_requests_professional_comms.sql"),
  "utf8",
);
if (!migration.includes("lesson_request_messages")) {
  failures.push("063 migration must define lesson_request_messages");
}

const hardening = readFileSync(
  join(root, "supabase/migrations/064_lesson_requests_hardening.sql"),
  "utf8",
);
if (!hardening.includes("lesson_requests_one_pending_per_pair_idx")) {
  failures.push("064 migration must dedupe pending lesson requests");
}

if (failures.length > 0) {
  console.error("FAIL lesson-request safety audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS lesson-request safety audit");
