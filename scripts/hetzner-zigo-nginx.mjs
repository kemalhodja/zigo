/**
 * Add zigo.app vhost to hizmetpazari nginx (minimal, isolated) + dummy SSL,
 * then attempt Let's Encrypt once DNS points here.
 *
 * Does NOT rewrite hizmetpazari.com.tr server blocks — only adds include + zigo conf.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NodeSSH } from "node-ssh";

const root = process.cwd();
const env = {};
for (const line of readFileSync(join(root, ".env.hetzner"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  env[t.slice(0, i)] = t.slice(i + 1);
}

const HOST = env.HETZNER_HOST;
const PASS = env.HETZNER_PASSWORD;
const ZIGO_UPSTREAM = "172.18.0.1:3000"; // docker-compose bridge gateway → host PM2

const ZIGO_CONF = `# Managed by Zigo cutover — do not merge into hizmetpazari catch-all
# Upstream: host PM2 Next.js via docker bridge gateway
upstream zigo_backend {
    server ${ZIGO_UPSTREAM} max_fails=3 fail_timeout=30s;
    keepalive 16;
}

server {
    listen 80;
    listen [::]:80;
    server_name zigo.app www.zigo.app;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://zigo.app$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name zigo.app www.zigo.app;

    ssl_certificate /etc/letsencrypt/live/zigo.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zigo.app/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    # Do NOT declare shared:SSL here — conflicts with hizmetpazari 50m zone

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 100M;

    location / {
        proxy_pass http://zigo_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        proxy_buffering on;
    }
}
`;

const ssh = new NodeSSH();
await ssh.connect({
  host: HOST,
  username: "root",
  password: PASS,
  tryKeyboard: true,
  readyTimeout: 30_000,
  onKeyboardInteractive: (_a, _b, _c, _d, f) => f([PASS]),
});

async function remote(cmd) {
  console.log("$", cmd.slice(0, 160));
  const r = await ssh.execCommand(cmd);
  if (r.stdout) console.log(r.stdout.slice(0, 2500));
  if (r.stderr) console.log(r.stderr.slice(0, 1500));
  if (r.code && r.code !== 0) throw new Error(`Remote failed (${r.code}): ${cmd}`);
  return r;
}

// 1) Backup nginx template
await remote(
  "cp -a /opt/hizmetpazari/nginx/nginx.hetzner.conf /opt/hizmetpazari/nginx/nginx.hetzner.conf.bak.zigo.$(date +%s)",
);

// 2) Ensure map for Connection upgrade + include conf.d (idempotent)
const patch = await ssh.execCommand(`python3 - <<'PY'
from pathlib import Path
p = Path('/opt/hizmetpazari/nginx/nginx.hetzner.conf')
text = p.read_text()
changed = False
if 'map $http_upgrade $connection_upgrade' not in text:
    needle = 'http {\\n    include /etc/nginx/mime.types;'
    insert = '''http {
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }
    include /etc/nginx/mime.types;'''
    if needle not in text:
        raise SystemExit('needle not found for map')
    text = text.replace(needle, insert, 1)
    changed = True
if 'include /etc/nginx/conf.d/*.conf;' not in text:
    # Insert after upstream web_backend block closing brace
    marker = 'upstream web_backend {\\n        server web:5001 max_fails=3 fail_timeout=30s;\\n    }\\n'
    if marker not in text:
        raise SystemExit('upstream marker not found')
    text = text.replace(
        marker,
        marker + '\\n    # Zigo + extra vhosts (conf.d). Exact server_name beats catch-all regex.\\n    include /etc/nginx/conf.d/*.conf;\\n',
        1,
    )
    changed = True
if changed:
    p.write_text(text)
    print('patched nginx.hetzner.conf')
else:
    print('nginx.hetzner.conf already patched')
PY`);
console.log(patch.stdout || patch.stderr);
if (patch.code) throw new Error("patch failed");

// 3) Write zigo conf
const confB64 = Buffer.from(ZIGO_CONF, "utf8").toString("base64");
await remote(`echo '${confB64}' | base64 -d > /opt/hizmetpazari/nginx/conf.d/zigo.app.conf`);

// 4) Dummy cert so nginx can start before LE (same pattern as hizmetpazari init)
await remote(`
set -e
SSL_DIR=/opt/hizmetpazari/certbot/conf/live/zigo.app
mkdir -p "$SSL_DIR" /opt/hizmetpazari/certbot/conf/archive/zigo.app
if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 3 \\
    -keyout "$SSL_DIR/privkey.pem" \\
    -out "$SSL_DIR/fullchain.pem" \\
    -subj "/CN=zigo.app"
  cp "$SSL_DIR/fullchain.pem" "$SSL_DIR/chain.pem"
  echo "dummy cert created"
else
  echo "cert already present"
fi
ls -la "$SSL_DIR"
`);

// 5) Restart nginx so templates/envsubst re-render (reload alone won't apply template edits)
await remote("docker restart hizmetpazari_nginx");
await remote("sleep 3; docker exec hizmetpazari_nginx nginx -t");
await remote(
  "docker exec hizmetpazari_nginx sh -c 'grep -n conf.d /etc/nginx/nginx.conf | head -5; ls /etc/nginx/conf.d/'",
);

// 6) Smoke via Host header on server
await remote(
  `curl -sk --resolve zigo.app:443:127.0.0.1 -o /dev/null -w 'local-https:%{http_code}\\n' https://zigo.app/api/setup/health`,
);
await remote(
  `curl -s --resolve zigo.app:80:127.0.0.1 -o /dev/null -w 'local-http:%{http_code}\\n' http://zigo.app/api/setup/health`,
);

// Verify hizmetpazari still healthy
await remote("curl -sS -o /dev/null -w 'hp-readyz:%{http_code}\\n' http://127.0.0.1:5001/readyz || true");
await remote("docker exec hizmetpazari_nginx wget -qO- --timeout=3 http://web:5001/readyz | head -c 80; echo");

console.log("Nginx zigo.app vhost ready (dummy SSL until DNS+certbot).");
ssh.dispose();
