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
  "docker ps -a --filter name=hizmetpazari_nginx --format '{{.Status}}'",
  "docker logs hizmetpazari_nginx --tail 80 2>&1",
  "grep -n 'map\\|conf.d\\|upstream' /opt/hizmetpazari/nginx/nginx.hetzner.conf | head -40",
  "sed -n '1,80p' /opt/hizmetpazari/nginx/nginx.hetzner.conf",
  "cat /opt/hizmetpazari/nginx/conf.d/zigo.app.conf | head -80",
];

for (const c of cmds) {
  console.log("##", c.slice(0, 90));
  const r = await ssh.execCommand(c);
  console.log((r.stdout || r.stderr || "").slice(0, 5000));
}
ssh.dispose();
