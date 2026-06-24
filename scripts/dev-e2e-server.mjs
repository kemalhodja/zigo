/* global process */

import { spawnSync } from "node:child_process";

process.env.ZIGO_DISABLE_AUTH_RATE_LIMIT = "1";
const port = process.env.E2E_PORT ?? "3005";

const result = spawnSync("npx", ["next", "dev", "-p", port], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

process.exit(result.status ?? 1);
