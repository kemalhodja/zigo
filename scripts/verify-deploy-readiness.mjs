/* global console, process, URL */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return readFileSync(filePath, "utf8");
}

function loadEnvFile(name) {
  const filePath = join(root, name);
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

function check(name, ok, message = "") {
  return { name, ok, message };
}

function main() {
  loadEnvFile(".env.vercel.production.local");
  loadEnvFile(".env.production.local");
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const checks = [];

  const callbackRoute = read("src/app/auth/callback/route.ts");
  const signUpRoute = read("src/app/api/auth/sign-up/route.ts");
  const deployConfig = read("src/lib/domain/deploy-config.ts");
  const hostedCard = read("src/components/hosted-deploy-card.tsx");
  const roleQa = read("src/lib/domain/role-qa-checklist.ts");
  const packageJson = read("package.json");

  checks.push(check("Auth callback route exchanges code", callbackRoute.includes("exchangeCodeForSession")));
  checks.push(check("Auth callback supports next param", callbackRoute.includes('searchParams.get("next")')));
  checks.push(check("Sign-up uses email redirect callback", signUpRoute.includes("/auth/callback?next=/onboarding")));
  checks.push(check("Deploy config exposes callback URL helper", deployConfig.includes("getAuthCallbackUrl")));
  checks.push(check("Hosted deploy card is wired", hostedCard.includes("getSupabaseRedirectUrls")));
  checks.push(check("Role QA checklist covers four roles", roleQa.includes('"student"') && roleQa.includes('"admin"')));
  checks.push(check("Hosted deploy checklist exists", existsSync(join(root, "docs/hosted-deploy-checklist.md"))));
  checks.push(check("test:deploy script exists", packageJson.includes('"test:deploy"')));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    checks.push(check("NEXT_PUBLIC_SITE_URL configured", false, "Set it in .env.local for local auth redirect parity"));
  } else {
    checks.push(check("NEXT_PUBLIC_SITE_URL configured", true, siteUrl));
    try {
      const callback = new URL("/auth/callback", siteUrl).toString();
      checks.push(check("Auth callback URL parses", callback.includes("/auth/callback"), callback));
    } catch (error) {
      checks.push(
        check(
          "Auth callback URL parses",
          false,
          error instanceof Error ? error.message : "Invalid NEXT_PUBLIC_SITE_URL",
        ),
      );
    }
  }

  const failed = checks.filter((item) => !item.ok);
  for (const item of checks) {
    console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}${item.message ? `: ${item.message}` : ""}`);
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main();
