/**
 * Verify / document Supabase Auth URL config for https://zigo.app cutover.
 * Public origin does not change — only hosting IP — so existing Site URL should already match.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function load(name) {
  const p = join(process.cwd(), name);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    out[t.slice(0, i)] = t.slice(i + 1).replace(/^['"]|['"]$/g, "");
  }
  return out;
}

const env = { ...load(".env.vercel.production"), ...load(".env.local"), ...process.env };
const url = (env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "").replace(/\/$/, "");
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
const token = env.SUPABASE_ACCESS_TOKEN?.trim();
const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];

if (!url || !anon) throw new Error("Missing Supabase URL/anon key");

const settings = await fetch(`${url}/auth/v1/settings`, {
  headers: { apikey: anon, Authorization: `Bearer ${anon}` },
}).then((r) => r.json());
console.log("Auth providers email:", settings?.external?.email === true);

const SITE = "https://zigo.app";
const desiredAllow = [
  `${SITE}`,
  `${SITE}/**`,
  `${SITE}/auth/callback`,
  `${SITE}/auth/recover`,
  `${SITE}/auth/reset-password`,
  `${SITE}/auth/verify-email`,
  "http://localhost:3000/**",
];

if (token && ref) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_url: SITE,
      uri_allow_list: desiredAllow.join(","),
    }),
  });
  const text = await res.text();
  console.log("Management API PATCH", res.status, text.slice(0, 500));
  if (!res.ok) throw new Error("Failed to patch auth config");
} else {
  console.log(`
Supabase Auth URL config (origin unchanged at ${SITE}):
  Site URL: ${SITE}
  Redirect allow list should include:
${desiredAllow.map((u) => `    - ${u}`).join("\n")}

No SUPABASE_ACCESS_TOKEN found — cannot PATCH via Management API.
Dashboard opened earlier; confirm Auth → URL Configuration matches above.
Because production already served https://zigo.app, Site URL should already be correct.
`);
}

// Sanity: health on Hetzner mirror reports site URL configured
const health = await fetch("http://62.238.61.234:3000/api/setup/health").then((r) => r.json());
const siteGate = health?.data?.gates?.find((g) => g.id === "site_url");
console.log("Hetzner site_url gate:", siteGate?.ready, siteGate?.detail);
if (!siteGate?.ready) throw new Error("site_url gate not ready on Hetzner");
console.log("supabase-auth check OK");
