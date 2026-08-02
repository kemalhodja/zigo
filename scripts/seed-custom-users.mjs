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

const PASSWORD = process.env.ZIGO_SEED_USER_PASSWORD?.trim();
if (!PASSWORD) {
  console.error("Set ZIGO_SEED_USER_PASSWORD before seeding users.");
  process.exit(1);
}

const USERS_LIST = [
  // 10 Öğretmen (teacher)
  { email: "35ozyurt.kemal35@gmail.com", fullName: "Kemal Özyurt", role: "teacher" },
  { email: "Sedatgulec2000@gmail.com", fullName: "Sedat Güleç", role: "teacher" },
  { email: "ahmetalkus4563@gmail.com", fullName: "Ahmet Alkuş", role: "teacher" },
  { email: "ahmetalkus@gmail.com", fullName: "Ahmet Alkuş", role: "teacher" },
  { email: "aliefeozyurt@gmail.com", fullName: "Ali Efe Özyurt", role: "teacher" },
  { email: "alkus6335@gmail.com", fullName: "Alkuş", role: "teacher" },
  { email: "alkusayse53@gmail.com", fullName: "Ayşe Alkuş", role: "teacher" },
  { email: "alkusyunusemre@gmail.com", fullName: "Yunus Emre Alkuş", role: "teacher" },
  { email: "fatihalkus35@gmail.com", fullName: "Fatih Alkuş", role: "teacher" },
  { email: "fener_6209@hotmail.com", fullName: "Fener", role: "teacher" },

  // 10 Öğrenci (student)
  { email: "freemann6931@gmail.com", fullName: "Freeman", role: "student" },
  { email: "furkanalkus234@gmail.com", fullName: "Furkan Alkuş", role: "student" },
  { email: "gudukboy5151@gmail.com", fullName: "Güdükboy", role: "student" },
  { email: "guneyfenbilimlerishirinyer@gmail.com", fullName: "Güney Fen Bilimleri", role: "student" },
  { email: "haticezammur8@gmail.com", fullName: "Hatice Zammur", role: "student" },
  { email: "hizmetpazari@gmail.com", fullName: "Hizmet Pazarı", role: "student" },
  { email: "hsn_03_@hotmail.com", fullName: "Hasan", role: "student" },
  { email: "idrisalkus3@gmail.com", fullName: "İdris Alkuş", role: "student" },
  { email: "kirisbartu3@gmail.com", fullName: "Bartu Kiriş", role: "student" },
  { email: "nezihegitimkurumlari@gmail.com", fullName: "Nezih Eğitim Kurumları", role: "student" },

  // 9 Veli (parent)
  { email: "ozlembayramcayir@gmail.com", fullName: "Özlem Bayram Çayır", role: "parent" },
  { email: "ozyurtayshe@gmail.com", fullName: "Ayşe Özyurt", role: "parent" },
  { email: "ozyurthasanhuseyin50@gmail.com", fullName: "Hasan Hüseyin Özyurt", role: "parent" },
  { email: "ozyurtkemal35@gmail.com", fullName: "Kemal Özyurt", role: "parent" },
  { email: "ozyurtugur3551@gmail.com", fullName: "Uğur Özyurt", role: "parent" },
  { email: "tufancanik2019@gmail.com", fullName: "Tufan Canik", role: "parent" },
  { email: "yusufalkus35@gmail.com", fullName: "Yusuf Alkuş", role: "parent" },
  { email: "zehralkus35@gmail.com", fullName: "Zehra Alkuş", role: "parent" },
  { email: "zehralkus@gmail.com", fullName: "Zehra Alkuş", role: "parent" },
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

  // List existing users to avoid duplicates or update them
  const existingUsersRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (existingUsersRes.error) {
    throw existingUsersRes.error;
  }
  const existingUsers = existingUsersRes.data.users;

  const results = {
    created: 0,
    updated: 0,
    errors: [],
  };

  for (const item of USERS_LIST) {
    const targetEmail = item.email.trim().toLowerCase();
    const existing = existingUsers.find((u) => u.email?.toLowerCase() === targetEmail);

    let userId = null;

    try {
      if (existing) {
        userId = existing.id;
        const updateRes = await supabase.auth.admin.updateUserById(userId, {
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: item.fullName, role: item.role },
        });
        if (updateRes.error) throw updateRes.error;
        results.updated++;
        console.log(`[UPDATED] ${targetEmail} (${item.role})`);
      } else {
        const createRes = await supabase.auth.admin.createUser({
          email: targetEmail,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: item.fullName, role: item.role },
        });
        if (createRes.error) throw createRes.error;
        userId = createRes.data.user?.id;
        results.created++;
        console.log(`[CREATED] ${targetEmail} (${item.role})`);
      }

      if (userId) {
        const profileRes = await supabase.from("users").upsert(
          {
            id: userId,
            email: targetEmail,
            full_name: item.fullName,
            role: item.role,
            is_verified: true,
          },
          { onConflict: "id" }
        );
        if (profileRes.error) {
          console.warn(`[WARN] Could not upsert public.users for ${targetEmail}: ${profileRes.error.message}`);
        }
      }
    } catch (err) {
      console.error(`[ERROR] Failed processing ${targetEmail}:`, err?.message || err);
      results.errors.push({ email: targetEmail, error: err?.message || String(err) });
    }
  }

  console.log("\n================ SUMMARY ================");
  console.log(`Total requested: ${USERS_LIST.length}`);
  console.log(`Created: ${results.created}`);
  console.log(`Updated: ${results.updated}`);
  console.log(`Errors: ${results.errors.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
