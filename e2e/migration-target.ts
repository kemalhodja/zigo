import { readFileSync } from "node:fs";
import { join } from "node:path";

export function expectedMigrationTarget() {
  const healthPath = join(process.cwd(), "src/app/api/setup/health/route.ts");
  const health = readFileSync(healthPath, "utf8");
  const match = health.match(/MIGRATION_TARGET\s*=\s*(\d+)/);
  return match ? Number(match[1]) : null;
}
