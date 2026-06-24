/* global console, process */

import { rmSync } from "node:fs";
import { join } from "node:path";

const nextDir = join(process.cwd(), ".next");

try {
  rmSync(nextDir, { force: true, recursive: true });
  console.log("Cleaned .next build cache.");
} catch (error) {
  console.error("Could not clean .next build cache.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
