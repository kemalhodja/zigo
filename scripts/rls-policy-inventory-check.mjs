/* global console, process */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const REQUIRED_POLICY_MARKERS = [
  { migration: "014_social_match_feed_rls.sql", marker: "Users can read matched social posts" },
  { migration: "039_unified_content_posts.sql", marker: "Verified teachers can create area social posts" },
  { migration: "021_story_area_match_feed.sql", marker: "Verified teachers can create assigned area stories" },
  { migration: "042_parent_child_activity.sql", marker: "Parents can read child activity events" },
  { migration: "043_content_moderation_publish_rls.sql", marker: "Platform admins can update content reports" },
  { migration: "020_lock_teacher_interest_self_assignment.sql", marker: "teacher areas are assigned by platform admins" },
];

const DOC_MARKERS = [
  "social_posts",
  "child_activity_events",
  "createAdminClient",
  "current_user_has_area",
];

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Missing file: ${relativePath}`);
  }
  return readFileSync(filePath, "utf8");
}

const failures = [];

for (const item of REQUIRED_POLICY_MARKERS) {
  const path = `supabase/migrations/${item.migration}`;
  const content = read(path);
  if (!content.includes(item.marker)) {
    failures.push(`Migration ${item.migration} missing policy marker: ${item.marker}`);
  }
}

const inventory = read("docs/rls-policy-inventory.md");
for (const marker of DOC_MARKERS) {
  if (!inventory.includes(marker)) {
    failures.push(`docs/rls-policy-inventory.md missing marker: ${marker}`);
  }
}

const migrationCount = readdirSync(join(root, "supabase/migrations")).filter((name) =>
  name.endsWith(".sql"),
).length;
if (!inventory.includes(String(migrationCount)) && !inventory.includes("001–044") && !inventory.includes("001-044") && !inventory.includes("001–043") && !inventory.includes("001-043")) {
  failures.push("RLS inventory should reference migration range through 044");
}

if (failures.length > 0) {
  console.error("FAIL RLS policy inventory check");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`PASS RLS policy inventory (${REQUIRED_POLICY_MARKERS.length} migration markers, doc wired)`);
