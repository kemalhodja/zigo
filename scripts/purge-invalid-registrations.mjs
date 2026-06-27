/* global console, process */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

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

function parseKeepEmails() {
  const raw = process.env.ZIGO_KEEP_USER_EMAILS ?? "platform.admin@zigo.app";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function listTargets(client) {
  const keepEmails = parseKeepEmails();
  const { rows } = await client.query(`
    select
      au.id,
      au.email,
      pu.full_name,
      pu.role,
      pa.user_id is not null as is_admin
    from auth.users au
    left join public.users pu on pu.id = au.id
    left join public.platform_admins pa on pa.user_id = au.id
    order by au.created_at
  `);

  return rows.filter((row) => {
    if (row.is_admin) return false;
    const email = String(row.email ?? "").toLowerCase();
    if (keepEmails.has(email)) return false;
    return true;
  });
}

async function deleteViaSupabaseAdmin(userIds) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role env for auth deletion.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const userId of userIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error(`Failed to delete ${userId}: ${error.message}`);
  }
}

async function main() {
  loadEnvFile(".env.vercel.production");
  loadEnvFile(".env.local");

  const dryRun = process.env.ZIGO_PURGE_DRY_RUN === "true";
  const client = new pg.Client({
    connectionString: `postgresql://${process.env.POSTGRES_USER ?? "postgres"}:${encodeURIComponent(process.env.POSTGRES_PASSWORD ?? "")}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE ?? "postgres"}`,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const targets = await listTargets(client);
  await client.end();

  if (targets.length === 0) {
    console.log("PASS No removable registration accounts found.");
    return;
  }

  console.log(`${dryRun ? "DRY RUN" : "DELETE"} ${targets.length} account(s):`);
  for (const row of targets) {
    console.log(`- ${row.email} (${row.full_name ?? "no profile"} / ${row.role ?? "unknown"})`);
  }

  if (dryRun) {
    console.log("Set ZIGO_PURGE_DRY_RUN=false to delete.");
    return;
  }

  await deleteViaSupabaseAdmin(targets.map((row) => row.id));
  console.log(`PASS Deleted ${targets.length} registration account(s). Platform admins and keep-list emails were preserved.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
