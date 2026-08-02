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
  "ls -la /opt/hizmetpazari/nginx/conf.d/",
  "ls -la /opt/hizmetpazari/certbot/conf/live/ 2>/dev/null || true",
  "head -200 /opt/hizmetpazari/nginx/proxy_params.conf",
  "for f in /opt/hizmetpazari/nginx/conf.d/*.conf; do echo ===== $f =====; cat \"$f\"; echo; done",
  "head -80 /opt/hizmetpazari/scripts/hetzner/nginx-init-ssl.sh",
  "docker ps --format '{{.Names}} {{.Status}}' | grep -E 'hizmet|cert'",
];

for (const c of cmds) {
  console.log("##", c.slice(0, 80));
  const r = await ssh.execCommand(c);
  console.log((r.stdout || r.stderr || "").slice(0, 8000));
}
ssh.dispose();
