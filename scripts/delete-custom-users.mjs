/* global console, process */

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

const USERS_LIST = [
  "35ozyurt.kemal35@gmail.com",
  "sedatgulec2000@gmail.com",
  "ahmetalkus4563@gmail.com",
  "ahmetalkus@gmail.com",
  "aliefeozyurt@gmail.com",
  "alkus6335@gmail.com",
  "alkusayse53@gmail.com",
  "alkusyunusemre@gmail.com",
  "fatihalkus35@gmail.com",
  "fener_6209@hotmail.com",
  "freemann6931@gmail.com",
  "furkanalkus234@gmail.com",
  "gudukboy5151@gmail.com",
  "guneyfenbilimlerishirinyer@gmail.com",
  "haticezammur8@gmail.com",
  "hizmetpazari@gmail.com",
  "hsn_03_@hotmail.com",
  "idrisalkus3@gmail.com",
  "kirisbartu3@gmail.com",
  "nezihegitimkurumlari@gmail.com",
  "ozlembayramcayir@gmail.com",
  "ozyurtayshe@gmail.com",
  "ozyurthasanhuseyin50@gmail.com",
  "ozyurtkemal35@gmail.com",
  "ozyurtugur3551@gmail.com",
  "tufancanik2019@gmail.com",
  "yusufalkus35@gmail.com",
  "zehralkus35@gmail.com",
  "zehralkus@gmail.com"
];

async function main() {
  loadEnvFile(".env.vercel.production");
  loadEnvFile(".env.local");
  loadEnvFile(".env.production.local");
  loadEnvFile(".env");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Connecting to Supabase at ${supabaseUrl}...`);

  const existingUsersRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (existingUsersRes.error) {
    throw existingUsersRes.error;
  }
  const existingUsers = existingUsersRes.data.users;

  let deletedCount = 0;
  let errorCount = 0;

  for (const email of USERS_LIST) {
    const targetEmail = email.toLowerCase();
    const existing = existingUsers.find((u) => u.email?.toLowerCase() === targetEmail);

    if (existing) {
      const deleteRes = await supabase.auth.admin.deleteUser(existing.id);
      if (deleteRes.error) {
        console.error(`[ERROR] Could not delete ${targetEmail}:`, deleteRes.error.message);
        errorCount++;
      } else {
        console.log(`[DELETED] ${targetEmail}`);
        deletedCount++;
      }
    } else {
      console.log(`[NOT_FOUND] ${targetEmail}`);
    }
  }

  console.log("\n================ SUMMARY ================");
  console.log(`Users to delete: ${USERS_LIST.length}`);
  console.log(`Successfully deleted: ${deletedCount}`);
  console.log(`Errors: ${errorCount}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
