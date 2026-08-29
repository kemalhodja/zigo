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
  loadEnvFile(".env");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, role");

  const { data: interests } = await supabase
    .from("user_interests")
    .select("user_id, education_areas(area_name)");

  const { data: admins } = await supabase
    .from("platform_admins")
    .select("user_id");

  const adminIds = new Set(admins?.map(a => a.user_id) || []);

  const rolesCount = {};
  let output = "";

  users.forEach(u => {
    if (u.email && u.email.includes("ozyurt.kemal") || u.email.includes("alkus") || u.email.includes("gulec") || u.email.includes("fener") || u.email.includes("freeman") || u.email.includes("guduk") || u.email.includes("guney") || u.email.includes("hizmet") || u.email.includes("hsn") || u.email.includes("kiris") || u.email.includes("nezih") || u.email.includes("ozlem") || u.email.includes("tufan") || u.email.includes("zammur") || u.email.includes("zehra")) {
      rolesCount[u.role] = (rolesCount[u.role] || 0) + 1;
      const userInterest = interests.find(i => i.user_id === u.id);
      const isAdmin = adminIds.has(u.id);
      const roleStr = isAdmin ? "ADMIN (" + u.role + ")" : u.role.toUpperCase();
      const area = userInterest?.education_areas?.area_name || "None";
      output += u.email + " - " + roleStr + " - Area: " + area + "\n";
    }
  });

  console.log("---- USER SUMMARY ----");
  console.log(output);
  console.log("---- ROLES COUNT ----");
  console.log(rolesCount);
}

main();
