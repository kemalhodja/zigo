/* global console, process */

import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const examplePath = join(root, ".env.example");
const localPath = join(root, ".env.local");

function readExample() {
  if (!existsSync(examplePath)) {
    throw new Error("Missing .env.example");
  }
  return readFileSync(examplePath, "utf8");
}

function main() {
  if (existsSync(localPath)) {
    console.log("SKIP .env.local already exists — edit it manually instead of overwriting.");
    console.log(`Path: ${localPath}`);
  } else {
    copyFileSync(examplePath, localPath);
    console.log("PASS Created .env.local from .env.example");
    console.log(`Path: ${localPath}`);
  }

  console.log("");
  console.log("Fill these values next:");
  for (const line of readExample().split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const key = trimmed.split("=")[0]?.trim();
    if (key) console.log(`- ${key}`);
  }

  console.log("");
  console.log("Then run:");
  console.log("1. Apply supabase/migrations 001-044 in order (or supabase/zigo-full-migrations.sql)");
  console.log("2. npm run test:live");
  console.log("3. npm run test:deploy");
  console.log("4. Open http://localhost:3000/setup");
}

main();
