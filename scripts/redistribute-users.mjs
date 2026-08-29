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

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE env vars");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rawList = `35ozyurt.kemal35@gmail.com
Sedatgulec2000@gmail.com
ahmetalkus4563@gmail.com
ahmetalkus@gmail.com
aliefeozyurt@gmail.com
alkus6335@gmail.com
alkusayse53@gmail.com
alkusyunusemre@gmail.com
fatihalkus35@gmail.com
fener_6209@hotmail.com
freemann6931@gmail.com
furkanalkus234@gmail.com
gudukboy5151@gmail.com
guneyfenbilimlerishirinyer@gmail.com
haticezammur8@gmail.com
hizmetpazari@gmail.com
hsn_03_@hotmail.com
idrisalkus3@gmail.com
kirisbartu3@gmail.com
nezihegitimkurumlari@gmail.com
ozlembayramcayir@gmail.com
ozyurtayshe@gmail.com
ozyurthasanhuseyin50@gmail.com
ozyurtkemal35@gmail.com
ozyurtugur3551@gmail.com
tufancanik2019@gmail.com
yusufalkus35@gmail.com
zehralkus35@gmail.com
zehralkus@gmail.com`;

  const emails = rawList.split("\n").map(s => s.trim().toLowerCase()).filter(Boolean);
  const adminEmail = "ozyurtkemal35@gmail.com";
  
  // Exclude admin from the regular distribution
  const usersToDistribute = emails.filter(e => e !== adminEmail);

  // 1. Fetch education areas
  const { data: areas, error: areaErr } = await supabase.from("education_areas").select("id, area_name");
  if (areaErr || !areas || areas.length === 0) {
    console.error("Could not load education areas", areaErr);
    return;
  }

  const roles = ["student", "teacher", "parent", "education_institution", "education_platform", "publisher"];
  
  // 2. Fetch all users from auth to get their IDs
  const { data: authUsersRes, error: authErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authErr) {
    console.error("Could not fetch auth users", authErr);
    return;
  }
  
  const allUsers = authUsersRes.users;
  
  let roleIndex = 0;

  for (const email of usersToDistribute) {
    const user = allUsers.find(u => u.email === email);
    if (!user) {
      console.log("User " + email + " not found in auth.users, skipping.");
      continue;
    }
    
    const assignedRole = roles[roleIndex % roles.length];
    roleIndex++;
    
    // Update Auth Metadata
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role: assignedRole }
    });
    
    // Update public.users
    await supabase.from("users").update({ role: assignedRole }).eq("id", user.id);
    
    // Assign a random interest area
    const randomArea = areas[Math.floor(Math.random() * areas.length)];
    
    // Delete existing interests to avoid conflicts
    await supabase.from("user_interests").delete().eq("user_id", user.id);
    
    // Insert new interest
    await supabase.from("user_interests").insert({
      user_id: user.id,
      area_id: randomArea.id
    });
    
    console.log("[" + assignedRole.toUpperCase() + "] " + email + " -> Area: " + randomArea.area_name);
  }
  
  console.log("Distribution complete!");
}

main();
