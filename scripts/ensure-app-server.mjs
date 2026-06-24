/* global console, process */

import { spawn } from "node:child_process";

import { detectBaseUrl } from "./journey-utils.mjs";

const root = process.cwd();
const DEFAULT_PORT = 3005;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ensureAppServer(port = DEFAULT_PORT) {
  const existing = await detectBaseUrl();
  if (existing) {
    return { baseUrl: existing, started: false, child: null };
  }

  console.log(`Starting production server on port ${port}...`);
  const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "start", "--", "-p", String(port)], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    shell: process.platform === "win32",
    env: { ...process.env, E2E_BASE_URL: `http://127.0.0.1:${port}` },
  });
  child.unref();

  process.env.E2E_BASE_URL = `http://127.0.0.1:${port}`;

  for (let attempt = 0; attempt < 45; attempt += 1) {
    await sleep(2000);
    const baseUrl = await detectBaseUrl();
    if (baseUrl) {
      console.log(`PASS App server ready at ${baseUrl}`);
      return { baseUrl, started: true, child };
    }
  }

  throw new Error(`App server did not become ready on port ${port}`);
}
