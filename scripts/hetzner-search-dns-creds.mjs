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

const ssh = new NodeSSH();
await ssh.connect({
  host: env.HETZNER_HOST,
  username: "root",
  password: env.HETZNER_PASSWORD,
  tryKeyboard: true,
  readyTimeout: 20_000,
  onKeyboardInteractive: (_a, _b, _c, _d, f) => f([env.HETZNER_PASSWORD]),
});

const cmds = [
  "grep -RIn -E 'GODADDY|godaddy|DOMAIN_API|CLOUDFLARE_API|dns_api' /opt/hizmetpazari --include='*.env*' --include='*.yml' --include='*.sh' --include='*.md' 2>/dev/null | head -40",
  "ls /opt/hizmetpazari/.env* 2>/dev/null; ls /root/*.env* 2>/dev/null",
  "grep -E '^[A-Z0-9_]*(DNS|GODADDY|CLOUDFLARE|DOMAIN)' /opt/hizmetpazari/.env 2>/dev/null | sed 's/=.*/=***/' || true",
  "grep -E '^[A-Z0-9_]*(DNS|GODADDY|CLOUDFLARE|DOMAIN|SUPABASE)' /root/hizmetpazari.env.bak.deploy 2>/dev/null | sed 's/=.*/=***/' || true",
];

for (const c of cmds) {
  console.log("##", c.slice(0, 120));
  const r = await ssh.execCommand(c);
  console.log((r.stdout || r.stderr || "").slice(0, 3000));
}
ssh.dispose();
