/* global console, process */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputPath = join(root, "src/lib/supabase/database.types.ts");

const REQUIRED_MARKERS = [
  "social_posts",
  "get_parent_child_activity",
  "export_user_data",
];

function verifyMarkers(content) {
  const missing = REQUIRED_MARKERS.filter((marker) => !content.includes(marker));
  return missing;
}

function runSupabaseGenTypes() {
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["supabase", "gen", "types", "typescript", "--local"],
    {
      cwd: root,
      encoding: "utf8",
      env: process.env,
    },
  );

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) {
    return { ok: false, output };
  }

  return { ok: true, output: result.stdout ?? "" };
}

function main() {
  console.log("=== Sync Supabase database.types.ts ===\n");

  const generated = runSupabaseGenTypes();

  if (generated.ok && generated.output.trim()) {
    writeFileSync(outputPath, generated.output, "utf8");
    console.log(`PASS Wrote ${outputPath} from local Supabase schema`);
  } else {
    console.log("SKIP supabase gen types (local Supabase unavailable)");
    if (generated.output) {
      console.log(generated.output.split("\n").slice(-3).join("\n"));
    }

    if (!existsSync(outputPath)) {
      console.error("FAIL database.types.ts is missing and could not be regenerated.");
      process.exit(1);
    }

    const missing = verifyMarkers(readFileSync(outputPath, "utf8"));
    if (missing.length > 0) {
      console.error(`FAIL database.types.ts missing markers: ${missing.join(", ")}`);
      console.error("Start Docker + `npx supabase start`, then rerun `npm run db:types`.");
      process.exit(1);
    }

    console.log("PASS Existing database.types.ts matches required migration markers");
    process.exit(0);
  }

  const missing = verifyMarkers(readFileSync(outputPath, "utf8"));
  if (missing.length > 0) {
    console.error(`FAIL Generated types missing markers: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log("PASS Generated types include migration 042 markers");
}

main();
