/* global console, process */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const failures = [];

function walkApiRoutes(dir, acc = []) {
  if (!existsSync(dir)) return acc;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkApiRoutes(full, acc);
    } else if (entry.name === "route.ts" || entry.name === "route.tsx") {
      acc.push(full);
    }
  }

  return acc;
}

const middlewarePath = join(root, "middleware.ts");
if (existsSync(middlewarePath)) {
  const middleware = readFileSync(middlewarePath, "utf8");
  if (/Access-Control-Allow-Origin/i.test(middleware)) {
    failures.push("middleware.ts must not set global CORS headers");
  }
}

for (const routePath of walkApiRoutes(join(root, "src/app/api"))) {
  const fileRel = relative(root, routePath).replace(/\\/g, "/");
  const source = readFileSync(routePath, "utf8");

  if (/Access-Control-Allow-Origin\s*:\s*['"]\*['"]/i.test(source)) {
    failures.push(`${fileRel}: wildcard CORS is forbidden on API routes`);
  }

  if (/headers\.set\(\s*['"]Access-Control-Allow-Origin['"]\s*,\s*['"]\*['"]/i.test(source)) {
    failures.push(`${fileRel}: wildcard CORS via headers.set is forbidden`);
  }
}

const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
if (!nextConfig.includes("buildSecurityHeaders")) {
  failures.push("next.config.ts must apply buildSecurityHeaders");
}

if (failures.length > 0) {
  console.error("FAIL CORS / HTTP security audit");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const routeCount = walkApiRoutes(join(root, "src/app/api")).length;
console.log(`PASS CORS / HTTP security audit (${routeCount} API route handlers scanned)`);
