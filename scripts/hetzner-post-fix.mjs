import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NodeSSH } from "node-ssh";

const root = process.cwd();
const env = {};
for (const line of readFileSync(join(root, ".env.hetzner"), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const i = trimmed.indexOf("=");
  env[trimmed.slice(0, i)] = trimmed.slice(i + 1);
}

const siteUrl = env.HETZNER_SITE_URL || `http://${env.HETZNER_HOST}:3000`;
const ssh = new NodeSSH();
await ssh.connect({
  host: env.HETZNER_HOST,
  username: env.HETZNER_USER || "root",
  password: env.HETZNER_PASSWORD,
  tryKeyboard: true,
  readyTimeout: 20_000,
  onKeyboardInteractive: (_n, _i, _l, prompts, finish) => finish([env.HETZNER_PASSWORD]),
});

const patch = [
  `SITE='${siteUrl}'`,
  "for f in /root/zigo/.env.local /root/zigo/.env.production.local; do",
  "  if grep -q '^NEXT_PUBLIC_SITE_URL=' \"$f\"; then",
  "    sed -i \"s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=$SITE|\" \"$f\"",
  "  else",
  "    echo \"NEXT_PUBLIC_SITE_URL=$SITE\" >> \"$f\"",
  "  fi",
  "done",
  "grep '^NEXT_PUBLIC_SITE_URL=' /root/zigo/.env.local",
].join("\n");

const patched = await ssh.execCommand(patch);
console.log(patched.stdout || patched.stderr);

const startup = await ssh.execCommand("pm2 startup systemd -u root --hp /root");
console.log(startup.stdout);
const match = (startup.stdout || "").match(/sudo env[^\n]+/);
if (match) {
  const cmd = match[0].replace(/^sudo\s+/, "");
  const run = await ssh.execCommand(cmd);
  console.log(run.stdout || run.stderr || "startup installed");
}

await ssh.execCommand("pm2 restart zigo && pm2 save");
const health = await ssh.execCommand(
  "sleep 3; curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/setup/health",
);
console.log("health", health.stdout);
ssh.dispose();
