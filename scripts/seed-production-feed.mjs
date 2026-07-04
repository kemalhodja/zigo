/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";
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

for (const file of [
  ".env.local",
  ".env.vercel.production.local",
  ".env.vercel.production",
  ".env.check",
  ".env",
]) {
  loadEnvFile(file);
}

function resolveDbUrl() {
  const password = process.env.POSTGRES_PASSWORD?.trim();
  const host = process.env.POSTGRES_HOST?.trim();

  if (password && host) {
    const user = process.env.POSTGRES_USER?.trim() || "postgres";
    const database = process.env.POSTGRES_DATABASE?.trim() || "postgres";
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:5432/${database}`;
  }

  return (
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    null
  );
}

function createPgClient(dbUrl) {
  return new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
}

const SEED_SQL = `
do $$
declare
  v_teacher_id uuid;
  v_area_id int;
  v_post_count bigint;
begin
  select count(*) into v_post_count from public.social_posts;
  if v_post_count > 0 then
    return;
  end if;

  select u.id
  into v_teacher_id
  from public.users u
  where u.role = 'teacher' and u.is_verified = true
  order by u.created_at asc
  limit 1;

  if v_teacher_id is null then
    select u.id
    into v_teacher_id
    from public.users u
    where u.role = 'teacher'
    order by u.created_at asc
    limit 1;
  end if;

  if v_teacher_id is null then
    raise notice 'No teacher profile found for feed seed.';
    return;
  end if;

  select ui.area_id
  into v_area_id
  from public.user_interests ui
  where ui.user_id = v_teacher_id
  limit 1;

  if v_area_id is null then
    select id into v_area_id from public.education_areas order by id asc limit 1;
  end if;

  if v_area_id is null then
    raise notice 'No education area found for feed seed.';
    return;
  end if;

  insert into public.social_posts (author_id, area_id, caption, media_url, media_type, is_reel)
  values
    (
      v_teacher_id,
      v_area_id,
      'Kesirleri 60 saniyede görselleştir: önce parça, sonra sayı doğrusu, sonra mini pratik.',
      null,
      'video',
      true
    ),
    (
      v_teacher_id,
      v_area_id,
      'LGS Matematik için günlük 5 dakikalık tekrar rutini: 2 soru, 1 hata analizi, 1 mini hedef.',
      null,
      'image',
      false
    ),
    (
      v_teacher_id,
      v_area_id,
      'Veli güvenli mini ders: kısa video izle, tek soru çöz, puan kazan.',
      null,
      'video',
      true
    );

  insert into public.stories (author_id, media_url, caption, area_id)
  select v_teacher_id, null, 'Bugün kesir pratiği: 1 dakika izle, 1 soru çöz.', v_area_id
  where not exists (
    select 1 from public.stories s where s.author_id = v_teacher_id
  );
end $$;
`;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = resolveDbUrl();

  if (!url || !serviceRole || !dbUrl) {
    console.error("Missing Supabase env or database URL.");
    process.exit(1);
  }

  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
  const { count, error: countError } = await admin
    .from("social_posts")
    .select("id", { count: "exact", head: true });

  if (countError) {
    console.error("FAIL Could not read social_posts:", countError.message);
    process.exit(1);
  }

  if ((count ?? 0) > 0) {
    console.log(`SKIP Feed seed — ${count} social posts already exist.`);
    return;
  }

  console.log("Seeding starter feed content...");
  const client = createPgClient(dbUrl);
  await client.connect();

  try {
    await client.query(SEED_SQL);
  } finally {
    await client.end();
  }

  const { count: afterCount } = await admin.from("social_posts").select("id", { count: "exact", head: true });
  console.log(`PASS Feed seed complete — ${afterCount ?? 0} social posts.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
