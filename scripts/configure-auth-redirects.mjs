/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const root = process.cwd();
const siteUrl = "https://zigo-kohl.vercel.app";
const callbacks = [
  `${siteUrl}/auth/callback`,
  `${siteUrl}/auth/callback?next=/onboarding`,
  "http://localhost:3000/auth/callback",
  "http://localhost:3000/auth/callback?next=/onboarding",
];

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

  const directUrl = `postgresql://${process.env.POSTGRES_USER ?? "postgres"}:${encodeURIComponent(process.env.POSTGRES_PASSWORD ?? "")}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE ?? "postgres"}`;
  const client = new pg.Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const tables = await client.query(`
    select table_schema, table_name
    from information_schema.tables
    where table_schema in ('auth', 'supabase_migrations', 'public')
      and table_name ilike '%config%'
    order by 1, 2
  `);

  console.log("Config-like tables:", tables.rows);

  const authSettings = await client.query(`
    select key, value
    from auth.config
    where key in ('site_url', 'uri_allow_list', 'additional_redirect_urls')
  `).catch(() => null);

  if (authSettings?.rows?.length) {
    console.log("Current auth.config:", authSettings.rows);
    const allowList = callbacks.join(",");
    await client.query(
      `
      insert into auth.config (key, value)
      values
        ('site_url', $1),
        ('uri_allow_list', $2)
      on conflict (key) do update set value = excluded.value
      `,
      [siteUrl, allowList],
    );
    console.log("PASS Updated auth.config redirect URLs");
  } else {
    console.log("SKIP auth.config table not available; rely on Supabase dashboard / Vercel integration.");
  }

  await client.end();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
