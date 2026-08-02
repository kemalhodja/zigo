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
  "docker inspect hizmetpazari_nginx --format '{{json .Mounts}}'",
  "docker inspect hizmetpazari_certbot --format '{{json .Mounts}}'",
  "find /root /opt /var/lib/docker/volumes -maxdepth 4 -type d -iname '*hizmet*' 2>/dev/null | head -40",
  "ls -la /root 2>/dev/null | head -40",
];

for (const c of cmds) {
  console.log("##", c);
  const r = await ssh.execCommand(c);
  console.log((r.stdout || r.stderr || "").slice(0, 4000));
}
ssh.dispose();
