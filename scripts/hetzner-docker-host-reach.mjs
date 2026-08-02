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
  "docker exec hizmetpazari_nginx sh -c 'getent hosts host.docker.internal; ip route | head -5; wget -qO- --timeout=3 http://172.17.0.1:3000/api/setup/health 2>&1 | head -c 200; echo; wget -qO- --timeout=3 http://host.docker.internal:3000/api/setup/health 2>&1 | head -c 200'",
  "docker inspect hizmetpazari_nginx --format '{{json .HostConfig.ExtraHosts}} {{.HostConfig.NetworkMode}}'",
  "grep -n include /opt/hizmetpazari/nginx/nginx.hetzner.conf || true",
  "ls /opt/hizmetpazari/scripts/hetzner/; grep -n certbot /opt/hizmetpazari/docker-compose.hetzner.yml | head -30",
  "head -120 /opt/hizmetpazari/docker-compose.hetzner.yml",
];

for (const c of cmds) {
  console.log("##", c.slice(0, 100));
  const r = await ssh.execCommand(c);
  console.log((r.stdout || r.stderr || "").slice(0, 5000));
}
ssh.dispose();
