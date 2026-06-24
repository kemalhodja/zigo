import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { APIRequestContext, Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export const DEMO_PASSWORD = "ZigoTest123!";

const DEMO_ACCOUNT_EMAILS = [
  "student@zigo.test",
  "parent@zigo.test",
  "aylin.teacher@zigo.test",
  "mert.teacher@zigo.test",
  "admin@zigo.test",
];

function loadEnvFile(name: string) {
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

loadEnvFile(".env.local");
loadEnvFile(".env");

/** Idempotent reset so repeated Playwright runs do not inherit moderation strikes. */
export async function resetDemoSocialAccountsForE2e() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return;

  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
  const { data: users, error: usersError } = await admin.from("users").select("id").in("email", DEMO_ACCOUNT_EMAILS);
  if (usersError) throw usersError;

  const ids = (users ?? []).map((user) => user.id);
  if (ids.length === 0) return;

  await admin.from("moderation_admin_alerts").delete().in("user_id", ids);
  await admin.from("moderation_violations").delete().in("user_id", ids);
  const { error } = await admin
    .from("users")
    .update({
      social_safety_strike_count: 0,
      social_interactions_blocked: false,
      social_interactions_blocked_at: null,
    })
    .in("id", ids);
  if (error) throw error;
}

export const DEMO_ACCOUNTS = {
  student: "student@zigo.test",
  parent: "parent@zigo.test",
  teacher: "aylin.teacher@zigo.test",
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

export async function isDemoAuthAvailable(request: APIRequestContext) {
  if (process.env.E2E_SKIP_LIVE_AUTH === "1") return false;

  try {
    const response = await request.post("/api/auth/sign-in", {
      data: { email: DEMO_ACCOUNTS.student, password: DEMO_PASSWORD },
    });
    return response.ok();
  } catch {
    return false;
  }
}

export async function demoLogin(page: Page, role: DemoRole) {
  const response = await page.request.post("/api/auth/sign-in", {
    data: { email: DEMO_ACCOUNTS[role], password: DEMO_PASSWORD },
  });

  if (!response.ok()) {
    await page.goto("/auth");
    await page.getByTestId(`demo-login-${role}`).waitFor();
    await Promise.all([
      page.waitForResponse(
        (signIn) => signIn.url().includes("/api/auth/sign-in") && signIn.ok(),
        { timeout: 30_000 },
      ),
      page.getByTestId(`demo-login-${role}`).click(),
    ]);
  }

  await page.goto("/");
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 30_000 });
  await page.locator("#main-content").waitFor({ timeout: 30_000 });
}

export const PUBLIC_APP_ROUTES = [
  "/",
  "/auth",
  "/setup",
  "/learn",
  "/duels",
  "/focus",
  "/family",
  "/parent",
  "/student",
  "/teacher",
  "/explore",
  "/micro",
  "/sparks",
  "/notifications",
  "/moderation",
  "/onboarding",
  "/profiles",
  "/store",
  "/questions",
  "/create",
  "/collections",
  "/readiness",
] as const;

export const LEGAL_ROUTES = [
  "/legal/privacy",
  "/legal/terms",
  "/legal/kvkk",
  "/legal/delete-account",
] as const;
