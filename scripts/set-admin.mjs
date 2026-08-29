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

async function main() {
  loadEnvFile(".env.vercel.production");
  loadEnvFile(".env.local");
  loadEnvFile(".env.production.local");
  loadEnvFile(".env");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = "ozyurtkemal35@gmail.com".toLowerCase();
  
  const existingUsersRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = existingUsersRes.data.users.find(u => u.email?.toLowerCase() === email);

  if (user) {
    const updateRes = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role: "admin" },
    });
    console.log("Auth user updated to admin:", updateRes.error ? updateRes.error : "Success");

    const profileRes = await supabase.from("users").update({ role: "admin" }).eq("id", user.id);
    console.log("Public profile updated to admin:", profileRes.error ? profileRes.error : "Success");
  } else {
    console.log("User not found!");
  }
}

main();
