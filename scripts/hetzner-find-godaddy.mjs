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

const r = await ssh.execCommand(`python3 - <<'PY'
from pathlib import Path
for p in Path('/opt/hizmetpazari').rglob('*'):
    if p.is_file() and p.suffix in {'.env','.txt','.json','.yml','.yaml','.sh','.md'} and p.stat().st_size < 500_000:
        try:
            t = p.read_text(errors='ignore')
        except Exception:
            continue
        if 'GODADDY' in t.upper() or 'godaddy' in t.lower():
            print(p)
            for line in t.splitlines():
                if 'godaddy' in line.lower() or 'GODADDY' in line:
                    k = line.split('=',1)[0] if '=' in line else line[:80]
                    print(' ', k[:120])
PY`);
console.log(r.stdout || r.stderr || "none");
ssh.dispose();
