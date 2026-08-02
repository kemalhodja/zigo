/**
 * Poll public DNS for zigo.app → Hetzner, then issue LE cert and reload nginx.
 * Run after GoDaddy A @ is set to HETZNER_HOST.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { NodeSSH } from "node-ssh";

const root = process.cwd();
function load() {
  const out = { ...process.env };
  for (const name of [".env.hetzner"]) {
    const p = join(root, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (!out[t.slice(0, i)]) out[t.slice(0, i)] = t.slice(i + 1);
    }
  }
  return out;
}

const env = load();
const IP = env.HETZNER_HOST || "62.238.61.234";
const maxPolls = Number(process.env.DNS_POLLS || 60);
const intervalMs = Number(process.env.DNS_POLL_MS || 15_000);

async function resolveA(name) {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=A`);
  const json = await res.json();
  return (json.Answer || []).filter((a) => a.type === 1).map((a) => a.data);
}

console.log(`Waiting for ${IP} in A records of zigo.app (polls=${maxPolls})...`);
console.log(`GoDaddy DNS: A @ → ${IP} (TTL 600), CNAME www → zigo.app`);
console.log("Create API keys: https://developer.godaddy.com/keys then:");
console.log("  GODADDY_API_KEY=... GODADDY_API_SECRET=... node scripts/godaddy-point-zigo-hetzner.mjs");

let ready = false;
for (let i = 1; i <= maxPolls; i++) {
  const addrs = await resolveA("zigo.app");
  console.log(`[${i}/${maxPolls}]`, addrs.join(", ") || "(none)");
  if (addrs.includes(IP)) {
    ready = true;
    break;
  }
  // Also try GoDaddy API mid-loop if keys appear
  if (env.GODADDY_API_KEY && env.GODADDY_API_SECRET && i === 1) {
    console.log("Keys present — run godaddy-point-zigo-hetzner.mjs separately if needed");
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}

if (!ready) {
  console.error("DNS not pointing at Hetzner yet.");
  process.exit(2);
}

console.log("DNS ready — issuing Let's Encrypt cert...");
const ssh = new NodeSSH();
await ssh.connect({
  host: IP,
  username: "root",
  password: env.HETZNER_PASSWORD,
  tryKeyboard: true,
  readyTimeout: 30_000,
  onKeyboardInteractive: (_a, _b, _c, _d, f) => f([env.HETZNER_PASSWORD]),
});

const le = await ssh.execCommand(`
set -e
# Remove dummy cert directory so certbot can replace with real lineage
if openssl x509 -in /opt/hizmetpazari/certbot/conf/live/zigo.app/fullchain.pem -noout -issuer 2>/dev/null | grep -qi 'CN=zigo.app'; then
  echo "Removing self-signed placeholder"
  rm -rf /opt/hizmetpazari/certbot/conf/live/zigo.app \\
         /opt/hizmetpazari/certbot/conf/archive/zigo.app \\
         /opt/hizmetpazari/certbot/conf/renewal/zigo.app.conf || true
fi

docker run --rm \\
  -v /opt/hizmetpazari/certbot/conf:/etc/letsencrypt \\
  -v /opt/hizmetpazari/certbot/www:/var/www/certbot \\
  -v /opt/hizmetpazari/certbot/logs:/var/log/letsencrypt \\
  certbot/certbot:latest certonly --webroot -w /var/www/certbot \\
  -d zigo.app -d www.zigo.app \\
  --email admin@zigo.app --agree-tos --non-interactive --preferred-challenges http

docker exec hizmetpazari_nginx nginx -t
docker exec hizmetpazari_nginx nginx -s reload
sleep 1
curl -sS -o /dev/null -w 'health:%{http_code} ssl_verify_ok\\n' https://127.0.0.1/api/setup/health -H 'Host: zigo.app' --resolve zigo.app:443:127.0.0.1 || \\
curl -sk -o /dev/null -w 'health_insecure:%{http_code}\\n' https://127.0.0.1/api/setup/health -H 'Host: zigo.app' --resolve zigo.app:443:127.0.0.1
openssl x509 -in /opt/hizmetpazari/certbot/conf/live/zigo.app/fullchain.pem -noout -issuer -subject -dates | head -10
`);
console.log(le.stdout || "");
if (le.stderr) console.log(le.stderr.slice(0, 2000));
if (le.code) throw new Error("certbot/nginx failed");
ssh.dispose();
console.log("LE + nginx reload done.");
