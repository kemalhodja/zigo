/* global console, process */

/**
 * Optional Hetzner/VPS deploy helper.
 * Never commit credentials — pass via env:
 *   HETZNER_HOST, HETZNER_USER, HETZNER_PASSWORD
 *   HETZNER_SITE_URL, HETZNER_SUPABASE_URL, HETZNER_SUPABASE_ANON_KEY
 *   HETZNER_TARBALL (default: zigo.tar.gz)
 *   HETZNER_REMOTE_DIR (default: /root/zigo)
 */
import { existsSync } from "node:fs";
import { NodeSSH } from "node-ssh";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function optionalEnv(name, fallback) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

async function run() {
  const host = requiredEnv("HETZNER_HOST");
  const username = optionalEnv("HETZNER_USER", "root");
  const password = requiredEnv("HETZNER_PASSWORD");
  const siteUrl = requiredEnv("HETZNER_SITE_URL");
  const supabaseUrl = requiredEnv("HETZNER_SUPABASE_URL");
  const supabaseAnonKey = requiredEnv("HETZNER_SUPABASE_ANON_KEY");
  const tarball = optionalEnv("HETZNER_TARBALL", "zigo.tar.gz");
  const remoteDir = optionalEnv("HETZNER_REMOTE_DIR", "/root/zigo");

  if (!existsSync(tarball)) {
    throw new Error(`Tarball not found: ${tarball}`);
  }

  const ssh = new NodeSSH();

  console.log(`Connecting to ${host} as ${username}...`);
  await ssh.connect({
    host,
    username,
    password,
    tryKeyboard: true,
    onKeyboardInteractive: (_name, _instructions, _lang, prompts, finish) => {
      if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes("password")) {
        finish([password]);
      } else {
        finish([]);
      }
    },
  });

  console.log("Connected. Preparing remote environment...");
  await ssh.execCommand(
    "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs npm docker.io docker-compose",
  );
  await ssh.execCommand("npm install -g pm2");
  await ssh.execCommand(`mkdir -p ${remoteDir}`);

  console.log(`Uploading ${tarball}...`);
  await ssh.putFile(tarball, "/root/zigo.tar.gz");
  await ssh.execCommand(`tar -xzf /root/zigo.tar.gz -C ${remoteDir}`);

  const envContent = [
    `NEXT_PUBLIC_SITE_URL=${siteUrl}`,
    "PORT=80",
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`,
  ].join("\n");

  // Avoid shell interpolation of secrets — write via base64.
  const envB64 = Buffer.from(`${envContent}\n`, "utf8").toString("base64");
  await ssh.execCommand(`echo '${envB64}' | base64 -d > ${remoteDir}/.env.local`);

  console.log("Installing npm packages...");
  const installResult = await ssh.execCommand("npm install", { cwd: remoteDir });
  if (installResult.stderr) console.log("NPM install notes:", installResult.stderr.slice(0, 500));

  console.log("Building Next.js...");
  const buildResult = await ssh.execCommand("npm run build", { cwd: remoteDir });
  if (buildResult.stderr) console.log("Build notes:", buildResult.stderr.slice(0, 500));

  console.log("Restarting PM2...");
  await ssh.execCommand("pm2 stop zigo || true");
  await ssh.execCommand('pm2 start npm --name "zigo" -- start -- -p 80', { cwd: remoteDir });

  console.log("Deployment finished.");
  ssh.dispose();
}

run().catch((error) => {
  console.error("Deployment failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
