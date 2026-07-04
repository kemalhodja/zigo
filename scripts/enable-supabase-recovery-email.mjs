/* global console, process */

import pg from "pg";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile(name) {
  const filePath = join(process.cwd(), name);
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

loadEnvFile(".env.probe");

const siteUrl = "https://zigo-kohl.vercel.app";
const recoveryTemplate = `<h2>Zigo şifre sıfırlama</h2><p><a href="${siteUrl}/auth/recover?token_hash={{ .TokenHash }}&type=recovery">Şifremi sıfırla</a></p>`;

const client = new pg.Client({
  connectionString: `postgresql://${process.env.POSTGRES_USER ?? "postgres"}:${encodeURIComponent(process.env.POSTGRES_PASSWORD ?? "")}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE ?? "postgres"}`,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const current = await client.query("select raw_base_config from auth.instances limit 1");
const raw = current.rows[0]?.raw_base_config;
const config = typeof raw === "string" ? JSON.parse(raw) : { ...(raw ?? {}) };

config.site_url = siteUrl;
config.uri_allow_list = [
  `${siteUrl}/auth/callback`,
  `${siteUrl}/auth/callback?next=/onboarding`,
  `${siteUrl}/auth/callback?next=/auth/reset-password`,
  `${siteUrl}/auth/recover`,
].join(",");
config.hook_send_email_enabled = false;
config.hook_send_email_uri = null;
config.mailer_subjects_recovery = "Zigo şifre sıfırlama";
config.mailer_templates_recovery_content = recoveryTemplate;

await client.query("update auth.instances set raw_base_config = $1::jsonb, updated_at = now()", [
  JSON.stringify(config),
]);

console.log("Updated auth.instances:");
console.log(
  JSON.stringify(
    {
      site_url: config.site_url,
      hook_send_email_enabled: config.hook_send_email_enabled,
      recovery_template: config.mailer_templates_recovery_content?.slice(0, 100),
    },
    null,
    2,
  ),
);

await client.end();
