/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const required = [
  ["supabase/migrations/006_platform_admin_ops.sql", "verify_teacher"],
  ["src/app/api/admin/teachers/verify/route.ts", "verifyTeacher"],
  ["src/app/api/social/posts/route.ts", ["is_verified", "requireVerified: true"]],
  ["src/app/api/answers/route.ts", ["is_verified", "requireVerified: true"]],
  ["src/app/api/interests/route.ts", "403"],
  ["src/components/admin-teacher-actions.tsx", "verify"],
];

for (const [relativePath, marker] of required) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    failures.push(`missing ${relativePath}`);
    continue;
  }
  const source = readFileSync(path, "utf8");
  const markers = Array.isArray(marker) ? marker : [marker];
  if (!markers.some((entry) => source.includes(entry))) {
    failures.push(`${relativePath} missing marker ${markers.join(" or ")}`);
  }
}

if (failures.length > 0) {
  console.error("FAIL teacher verification audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS teacher verification audit");
