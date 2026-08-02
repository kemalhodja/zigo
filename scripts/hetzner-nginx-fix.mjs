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

const ZIGO_CONF = `# Managed by Zigo cutover — isolated vhost (does not alter hizmetpazari.com.tr)
upstream zigo_backend {
    server 172.18.0.1:3000 max_fails=3 fail_timeout=30s;
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
  host: env.HETZNER_HOST,
  username: "root",
  password: env.HETZNER_PASSWORD,
  tryKeyboard: true,
  readyTimeout: 20_000,
  onKeyboardInteractive: (_a, _b, _c, _d, f) => f([env.HETZNER_PASSWORD]),
});

const b64 = Buffer.from(ZIGO_CONF, "utf8").toString("base64");
await ssh.execCommand(`echo '${b64}' | base64 -d > /opt/hizmetpazari/nginx/conf.d/zigo.app.conf`);
const restart = await ssh.execCommand("docker restart hizmetpazari_nginx && sleep 5 && docker ps --filter name=hizmetpazari_nginx --format '{{.Status}}'");
console.log(restart.stdout || restart.stderr);
const test = await ssh.execCommand("docker exec hizmetpazari_nginx nginx -t 2>&1");
console.log(test.stdout || test.stderr);
const smoke = await ssh.execCommand(`
curl -sk --resolve zigo.app:443:127.0.0.1 -o /tmp/zigo-h.json -w 'zigo:%{http_code}\\n' https://zigo.app/api/setup/health
head -c 200 /tmp/zigo-h.json; echo
curl -sS -o /dev/null -w 'hp:%{http_code}\\n' http://127.0.0.1:5001/readyz || true
docker exec hizmetpazari_nginx wget -qO- --timeout=3 http://web:5001/readyz; echo
`);
console.log(smoke.stdout || smoke.stderr);
ssh.dispose();
