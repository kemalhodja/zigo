/**
 * GoDaddy DNS cutover: point zigo.app (+ www CNAME) at Hetzner.
 * Requires GODADDY_API_KEY + GODADDY_API_SECRET in env or .env.hetzner
 *
 * Also attempts Let's Encrypt once public DNS answers with Hetzner IP.
 */
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { NodeSSH } from "node-ssh";

const root = process.cwd();
function loadEnv() {
  const out = { ...process.env };
  for (const name of [".env.hetzner", ".env.local", ".env.production.local"]) {
    const p = join(root, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      const k = t.slice(0, i);
      const v = t.slice(i + 1).replace(/^['"]|['"]$/g, "");
      if (!out[k]) out[k] = v;
    }
  }
  return out;
}

const env = loadEnv();
const DOMAIN = "zigo.app";
const HETZNER_IP = env.HETZNER_HOST || "62.238.61.234";
const key = env.GODADDY_API_KEY?.trim();
const secret = env.GODADDY_API_SECRET?.trim();

async function resolveA(name) {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=A`);
  const json = await res.json();
  return (json.Answer || []).filter((a) => a.type === 1).map((a) => a.data);
}

async function godaddy(method, path, body) {
  const res = await fetch(`https://api.godaddy.com/v1${path}`, {
    method,
    headers: {
      Authorization: `sso-key ${key}:${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GoDaddy ${method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

console.log("Current public A records:", await resolveA(DOMAIN));

if (!key || !secret) {
  console.error(`
Missing GODADDY_API_KEY / GODADDY_API_SECRET.

Create keys at: https://developer.godaddy.com/keys
Then either:
  setx GODADDY_API_KEY "..."
  setx GODADDY_API_SECRET "..."
or add them to .env.hetzner and re-run:
  node scripts/godaddy-point-zigo-hetzner.mjs

Manual DNS (GoDaddy → DNS):
  Type A    Name @     Value ${HETZNER_IP}    TTL 600
  Type CNAME Name www  Value zigo.app         TTL 600
  Remove old A/AAAA/ALIAS pointing at Vercel/AWS parking.
`);
  process.exit(2);
}

console.log("Updating apex A + www CNAME only (safe, no full-zone replace)...");
await godaddy("PUT", `/domains/${DOMAIN}/records/A/@`, [
  { data: HETZNER_IP, ttl: 600 },
]);
await godaddy("PUT", `/domains/${DOMAIN}/records/CNAME/www`, [
  { data: `${DOMAIN}.`, ttl: 600 },
]);
// Drop apex AAAA that would shadow A on IPv6 clients
try {
  await godaddy("PUT", `/domains/${DOMAIN}/records/AAAA/@`, []);
} catch {
  /* optional */
}
console.log("GoDaddy DNS updated.");

// Poll until public DNS shows Hetzner
for (let i = 0; i < 36; i++) {
  const addrs = await resolveA(DOMAIN);
  console.log(`poll ${i + 1}:`, addrs.join(", ") || "(none)");
  if (addrs.includes(HETZNER_IP)) {
    console.log("DNS live on Hetzner.");
    break;
  }
  await new Promise((r) => setTimeout(r, 10_000));
}

// Let's Encrypt via existing certbot container / compose
const ssh = new NodeSSH();
await ssh.connect({
  host: HETZNER_IP,
  username: "root",
  password: env.HETZNER_PASSWORD,
  tryKeyboard: true,
  readyTimeout: 30_000,
  onKeyboardInteractive: (_a, _b, _c, _d, f) => f([env.HETZNER_PASSWORD]),
});

const le = await ssh.execCommand(`
set -e
cd /opt/hizmetpazari
# Issue cert using webroot (HTTP-01) — nginx already serves /.well-known for zigo.app
docker run --rm \\
  -v /opt/hizmetpazari/certbot/conf:/etc/letsencrypt \\
  -v /opt/hizmetpazari/certbot/www:/var/www/certbot \\
  certbot/certbot:latest certonly --webroot -w /var/www/certbot \\
  -d zigo.app -d www.zigo.app \\
  --email admin@zigo.app --agree-tos --non-interactive --force-renewal || true
ls -la /opt/hizmetpazari/certbot/conf/live/zigo.app/ || true
docker exec hizmetpazari_nginx nginx -t && docker exec hizmetpazari_nginx nginx -s reload
curl -sS -o /dev/null -w 'public-local-resolve:%{http_code}\\n' --resolve zigo.app:443:127.0.0.1 https://zigo.app/api/setup/health || true
`);
console.log(le.stdout || le.stderr);
ssh.dispose();
