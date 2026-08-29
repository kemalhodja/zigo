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
  
  const { data: usersData, error: usersError } = await supabase.from("users").select("id").eq("email", email).single();

  if (usersError || !usersData) {
    console.error("User not found in public.users!", usersError);
    return;
  }

  const userId = usersData.id;

  const { error: adminError } = await supabase.from("platform_admins").upsert({ user_id: userId }, { onConflict: "user_id" });

  if (adminError) {
    console.error("Failed to insert into platform_admins:", adminError);
  } else {
    console.log("Successfully made", email, "a platform admin!");
  }
}

main();
