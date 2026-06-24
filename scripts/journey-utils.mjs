/* global process, fetch */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const DEMO_PASSWORD = "ZigoTest123!";

export function loadEnvFile(name) {
  const filePath = join(process.cwd(), name);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

export function journeyStep(name, ok, detail = "") {
  const item = { name, ok, detail };
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  return item;
}

export function parseSetCookie(headers) {
  const getSetCookie = headers.getSetCookie?.bind(headers);
  if (getSetCookie) return getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

export async function detectBaseUrl() {
  const forced = process.env.E2E_BASE_URL?.replace(/\/$/, "");
  if (forced) {
    try {
      const response = await fetch(`${forced}/api/setup/health`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) return forced;
    } catch {
      return null;
    }
  }

  const candidates = [
    process.env.E2E_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://127.0.0.1:3005",
    "http://localhost:3005",
    "http://localhost:3004",
    "http://localhost:3001",
    "http://localhost:3003",
    "http://localhost:3002",
    "http://localhost:3000",
  ].filter(Boolean);

  for (const base of candidates) {
    try {
      const response = await fetch(`${base}/api/setup/health`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) return String(base).replace(/\/$/, "");
    } catch {
      // try next
    }
  }
  return null;
}

export async function apiSignIn(baseUrl, email) {
  const response = await fetch(`${baseUrl}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: DEMO_PASSWORD }),
  });
  const body = await response.json().catch(() => ({}));
  const cookies = parseSetCookie(response.headers);
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
  return { response, body, cookieHeader };
}

export async function apiGet(baseUrl, path, cookieHeader) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

export async function apiPost(baseUrl, path, cookieHeader, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

export async function pageOk(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  return response.status === 200 || response.status === 307 || response.status === 308;
}

export function printJourneySummary(label, results) {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${label}: ${results.length - failed.length}/${results.length} adım doğrulandı`);
  return failed.length;
}
