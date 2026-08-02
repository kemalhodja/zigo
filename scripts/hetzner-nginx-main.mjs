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
  "wc -l /opt/hizmetpazari/nginx/nginx.hetzner.conf; cat /opt/hizmetpazari/nginx/nginx.hetzner.conf",
  "docker exec hizmetpazari_nginx ls -la /etc/nginx/conf.d/ /etc/nginx/",
  "docker exec hizmetpazari_nginx cat /etc/nginx/nginx.conf | head -120",
  "ls /opt/hizmetpazari/*.yml /opt/hizmetpazari/docker-compose*.yml /opt/hizmetpazari/compose*.yml 2>/dev/null; ls /opt/hizmetpazari/scripts/hetzner/ 2>/dev/null | head -40",
];

for (const c of cmds) {
  console.log("##", c.slice(0, 90));
  const r = await ssh.execCommand(c);
  console.log((r.stdout || r.stderr || "").slice(0, 12000));
}
ssh.dispose();
