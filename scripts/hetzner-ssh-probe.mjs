import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NodeSSH } from "node-ssh";

function loadEnv(name) {
  const p = join(process.cwd(), name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(".env.hetzner");
const host = process.env.HETZNER_HOST;
const password = process.env.HETZNER_PASSWORD;
const ssh = new NodeSSH();

try {
  await ssh.connect({
    host,
    username: "root",
    password,
    readyTimeout: 60000,
    tryKeyboard: true,
    onKeyboardInteractive: (_n, _i, _l, prompts, finish) => {
      finish(prompts.map(() => password));
    },
  });
  const r = await ssh.execCommand("uname -a && whoami && hostname");
  console.log("OK", r.stdout || r.stderr);
  ssh.dispose();
} catch (e) {
  console.error("FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
}
