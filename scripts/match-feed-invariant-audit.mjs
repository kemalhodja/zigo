/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const files = [
  { path: "src/lib/domain/social/helpers.ts", markers: ["user_interests"] },
  { path: "src/lib/domain/social/feed.ts", markers: ["getUserSocialFeedAreaIds"] },
  { path: "src/lib/domain/feed/queries.ts", markers: ["user_interests"] },
  { path: "src/lib/domain/questions/queries.ts", markers: ["user_interests"] },
  { path: "src/lib/domain/children.ts", markers: ["child_profile_interests"] },
];

for (const file of files) {
  const source = readFileSync(join(root, file.path), "utf8");
  for (const marker of file.markers) {
    if (!source.includes(marker)) {
      failures.push(`${file.path} missing ${marker}`);
    }
  }
}

const feedQueries = readFileSync(join(root, "src/lib/domain/feed/queries.ts"), "utf8");
if (!feedQueries.includes('.in("area_id", areaIds)')) {
  failures.push("feed/queries.ts must filter posts by matched area_ids");
}

if (failures.length > 0) {
  console.error("FAIL match-feed invariant audit");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`PASS match-feed invariant audit (${files.length} modules)`);
