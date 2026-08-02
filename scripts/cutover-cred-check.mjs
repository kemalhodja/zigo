import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { NodeSSH } from "node-ssh";

const root = process.cwd();
function load(name) {
  const p = join(root, name);
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

const local = {
  ...load(".env.vercel.production"),
  ...load(".env.production.local"),
  ...load(".env.local"),
  ...load(".env.hetzner"),
  ...process.env,
};

const keys = [
  "SUPABASE_ACCESS_TOKEN",
  "GODADDY_API_KEY",
  "GODADDY_API_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
];
for (const k of keys) {
  console.log(`${k}=${local[k] ? "present" : "missing"}`);
}

const tokenPaths = [
  join(homedir(), ".supabase", "access-token"),
  join(homedir(), "AppData", "Roaming", "supabase", "access-token"),
];
for (const p of tokenPaths) {
  console.log(`tokenFile ${p}: ${existsSync(p)}`);
}

const ssh = new NodeSSH();
await ssh.connect({
  host: local.HETZNER_HOST,
  username: "root",
  password: local.HETZNER_PASSWORD,
  tryKeyboard: true,
  readyTimeout: 15_000,
  onKeyboardInteractive: (_a, _b, _c, _d, f) => f([local.HETZNER_PASSWORD]),
});
const r = await ssh.execCommand(
  "python3 - <<'PY'\nfrom pathlib import Path\ntext=Path('/root/zigo/.env.local').read_text()\nfor k in ['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','NEXT_PUBLIC_SITE_URL','SUPABASE_SERVICE_ROLE_KEY']:\n print(k, 'present' if any(line.startswith(k+'=') and len(line)>len(k)+2 for line in text.splitlines()) else 'missing')\nPY",
);
console.log(r.stdout || r.stderr);
ssh.dispose();
