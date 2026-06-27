/* global console, process */

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

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

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = randomBytes(16);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function main() {
  loadEnvFile(".env.vercel.production");
  loadEnvFile(".env.local");
  loadEnvFile(".env.production.local");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const email = (process.env.ZIGO_ADMIN_EMAIL ?? "platform.admin@zigo.app").trim().toLowerCase();
  const password = process.env.ZIGO_ADMIN_PASSWORD?.trim() || generatePassword();
  const fullName = process.env.ZIGO_ADMIN_FULL_NAME?.trim() || "Zigo Platform Admin";

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (existing.error) throw existing.error;

  let userId = existing.data.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
  let created = false;

  if (userId) {
    const updated = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "parent" },
    });
    if (updated.error) throw updated.error;
  } else {
    const createdUser = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "parent" },
    });
    if (createdUser.error) throw createdUser.error;
    userId = createdUser.data.user?.id ?? null;
    created = true;
  }

  if (!userId) {
    throw new Error("Admin user id could not be resolved.");
  }

  const profileUpsert = await admin.from("users").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role: "parent",
      is_verified: false,
    },
    { onConflict: "id" },
  );
  if (profileUpsert.error) throw profileUpsert.error;

  const adminGrant = await admin.from("platform_admins").upsert(
    { user_id: userId },
    { onConflict: "user_id" },
  );
  if (adminGrant.error) throw adminGrant.error;

  console.log("PASS Platform admin ready.");
  console.log(JSON.stringify({ email, password, userId, created, adminUrl: "/admin" }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
