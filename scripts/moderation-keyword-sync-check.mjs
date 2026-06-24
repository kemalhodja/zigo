/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const keywordsSource = readFileSync(
  join(root, "src/lib/domain/moderation-keywords.ts"),
  "utf8",
);

const migrationPaths = [
  "supabase/migrations/040_moderation_keyword_filter.sql",
  "supabase/migrations/052_obscenity_moderation.sql",
  "supabase/migrations/053_moderation_strikes.sql",
];

const dbTerms = migrationPaths.flatMap((relativePath) => {
  const migrationSource = readFileSync(join(root, relativePath), "utf8");
  const insertBlock =
    migrationSource.match(/insert into public\.blocked_keywords[\s\S]*?on conflict/i)?.[0] ??
    migrationSource;
  return [...insertBlock.matchAll(/\('([^']+)',\s*'[^']+'\)/g)].map((match) => match[1]);
});

const appTerms = [...keywordsSource.matchAll(/^\s+"([^"]+)",/gm)].map((match) => match[1]);

const appSet = new Set(appTerms);
const dbSet = new Set(dbTerms);

const missingInDb = appTerms.filter((term) => !dbSet.has(term));
const missingInApp = dbTerms.filter((term) => !appSet.has(term));

if (missingInDb.length > 0 || missingInApp.length > 0) {
  console.error("FAIL keyword sync audit");
  for (const term of missingInDb) {
    console.error(`- App term missing in migrations 040/052: ${term}`);
  }
  for (const term of missingInApp) {
    console.error(`- DB term missing in moderation-keywords.ts: ${term}`);
  }
  process.exit(1);
}

const versionMatch = keywordsSource.match(/KEYWORD_LIST_VERSION = "([^"]+)"/);
if (!versionMatch) {
  console.error("FAIL keyword sync audit: KEYWORD_LIST_VERSION not found");
  process.exit(1);
}

console.log(`PASS keyword sync audit (${appTerms.length} terms, version ${versionMatch[1]})`);
