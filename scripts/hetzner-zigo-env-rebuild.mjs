/**
 * Point Hetzner Zigo env at https://zigo.app and rebuild/restart PM2.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NodeSSH } from "node-ssh";

const env = {};
for (const line of readFileSync(join(process.cwd(), ".env.hetzner"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  env[t.slice(0, i)] = t.slice(i + 1);
}

const SITE = "https://zigo.app";
const ssh = new NodeSSH();
await ssh.connect({
  host: env.HETZNER_HOST,
  username: "root",
  password: env.HETZNER_PASSWORD,
  tryKeyboard: true,
  readyTimeout: 30_000,
  onKeyboardInteractive: (_a, _b, _c, _d, f) => f([env.HETZNER_PASSWORD]),
});

const patch = await ssh.execCommand(`
SITE='${SITE}'
for f in /root/zigo/.env.local /root/zigo/.env.production.local; do
  if grep -q '^NEXT_PUBLIC_SITE_URL=' "$f"; then
    sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=$SITE|" "$f"
  else
    echo "NEXT_PUBLIC_SITE_URL=$SITE" >> "$f"
  fi
  # Ensure HOST binding hints
  grep -q '^HOSTNAME=' "$f" || echo 'HOSTNAME=0.0.0.0' >> "$f"
  grep -q '^PORT=' "$f" || echo 'PORT=3000' >> "$f"
done
grep '^NEXT_PUBLIC_SITE_URL=' /root/zigo/.env.local
`);
console.log(patch.stdout || patch.stderr);

console.log("Building (may take a few minutes)...");
const build = await ssh.execCommand("cd /root/zigo && npm run build", {
  execOptions: { maxBuffer: 30 * 1024 * 1024 },
});
console.log((build.stdout || "").slice(-2500));
if (build.code) {
  console.log((build.stderr || "").slice(0, 3000));
  throw new Error("build failed");
}

const restart = await ssh.execCommand("cd /root/zigo && pm2 restart zigo && pm2 save && sleep 3 && curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/setup/health");
console.log("restart/health", restart.stdout || restart.stderr);

const viaNginx = await ssh.execCommand(
  "curl -sk --resolve zigo.app:443:127.0.0.1 -o /dev/null -w '%{http_code}' https://zigo.app/api/setup/health",
);
console.log("via-nginx", viaNginx.stdout);
ssh.dispose();
