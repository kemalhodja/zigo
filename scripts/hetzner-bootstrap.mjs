/* global console, process */
/**
 * Bootstrap / refresh Zigo on Hetzner (production host after DNS cutover).
 * Loads: .env.hetzner + .env.vercel.production (for Supabase/secrets)
 *
 * Usage: node scripts/hetzner-bootstrap.mjs
 * Prefer HETZNER_SITE_URL=https://zigo.app
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { NodeSSH } from "node-ssh";

const root = process.cwd();

function loadEnvFile(name) {
  const filePath = join(root, name);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function makeTarball(outPath) {
  const args = [
    "-czf",
    outPath,
    "--exclude=node_modules",
    "--exclude=.next",
    "--exclude=.git",
    "--exclude=android",
    "--exclude=ios",
    "--exclude=coverage",
    "--exclude=playwright-report",
    "--exclude=test-results",
    "--exclude=.env.hetzner",
    ".",
  ];
  // Prefer tar (Git Bash / Windows tar)
  const result = spawnSync("tar", args, { cwd: root, encoding: "utf8", shell: true });
  if (result.status !== 0) {
    throw new Error(`tar failed: ${result.stderr || result.stdout || result.status}`);
  }
}

async function run() {
  loadEnvFile(".env.hetzner");
  loadEnvFile(".env.vercel.production");
  loadEnvFile(".env.production.local");

  const host = required("HETZNER_HOST");
  const username = process.env.HETZNER_USER?.trim() || "root";
  const password = required("HETZNER_PASSWORD");
  const remoteDir = process.env.HETZNER_REMOTE_DIR?.trim() || "/root/zigo";
  const siteUrl = process.env.HETZNER_SITE_URL?.trim() || "https://zigo.app";
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnon = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  const tarball = join(root, "zigo-hetzner.tar.gz");
  console.log("Creating tarball (no node_modules/.next)...");
  await makeTarball(tarball);

  const ssh = new NodeSSH();
  console.log(`Connecting to ${host}...`);
  await ssh.connect({
    host,
    username,
    password,
    tryKeyboard: true,
    readyTimeout: 60_000,
    onKeyboardInteractive: (_n, _i, _l, prompts, finish) => {
      if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes("password")) {
        finish([password]);
      } else {
        finish([]);
      }
    },
  });

  async function remote(cmd, opts = {}) {
    console.log(`$ ${cmd}`);
    const result = await ssh.execCommand(cmd, opts);
    if (result.stdout) console.log(result.stdout.slice(0, 2000));
    if (result.stderr) console.log(result.stderr.slice(0, 1000));
    if (result.code && result.code !== 0) {
      throw new Error(`Remote failed (${result.code}): ${cmd}`);
    }
    return result;
  }

  console.log("Preparing server packages...");
  await remote("export DEBIAN_FRONTEND=noninteractive; apt-get update -y");
  await remote(
    "export DEBIAN_FRONTEND=noninteractive; apt-get install -y curl ca-certificates gnupg build-essential",
  );

  // Node 20 LTS binary (NodeSource often breaks on brand-new Ubuntu codenames)
  const nodeOk = await ssh.execCommand("node -v && npm -v");
  if (nodeOk.code !== 0) {
    console.log("Installing Node 20 from nodejs.org binary...");
    await remote(
      [
        "export DEBIAN_FRONTEND=noninteractive",
        "apt-get remove -y nodejs npm libnode* 2>/dev/null || true",
        "curl -fsSL https://nodejs.org/dist/v20.19.3/node-v20.19.3-linux-x64.tar.xz -o /tmp/node20.tar.xz",
        "tar -xJf /tmp/node20.tar.xz -C /usr/local --strip-components=1",
        "node -v && npm -v",
      ].join(" && "),
    );
  }
  await remote("npm install -g pm2");

  await remote(`mkdir -p ${remoteDir}`);
  console.log("Uploading app...");
  await ssh.putFile(tarball, "/root/zigo-hetzner.tar.gz");
  await remote(`rm -rf ${remoteDir}/* ${remoteDir}/.[!.]* 2>/dev/null || true`);
  await remote(`tar -xzf /root/zigo-hetzner.tar.gz -C ${remoteDir}`);

  // Build env for Hetzner mirror (same Supabase as Vercel)
  const envLines = [
    `NEXT_PUBLIC_SITE_URL=${siteUrl}`,
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnon}`,
  ];
  if (serviceRole) envLines.push(`SUPABASE_SERVICE_ROLE_KEY=${serviceRole}`);

  // Copy other useful keys from vercel production without overriding site URL
  const vercelPath = join(root, ".env.vercel.production");
  if (existsSync(vercelPath)) {
    for (const line of readFileSync(vercelPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      if (
        key === "NEXT_PUBLIC_SITE_URL" ||
        key === "NEXT_PUBLIC_SUPABASE_URL" ||
        key === "NEXT_PUBLIC_SUPABASE_ANON_KEY" ||
        key === "SUPABASE_SERVICE_ROLE_KEY"
      ) {
        continue;
      }
      envLines.push(trimmed);
    }
  }

  const envContent = `${envLines.join("\n")}\n`;
  const envB64 = Buffer.from(envContent, "utf8").toString("base64");
  await remote(`echo '${envB64}' | base64 -d > ${remoteDir}/.env.local`);
  await remote(`echo '${envB64}' | base64 -d > ${remoteDir}/.env.production.local`);

  console.log("npm ci / install...");
  const install = await ssh.execCommand("npm ci || npm install", { cwd: remoteDir });
  console.log((install.stdout || "").slice(-1500));
  if (install.code && install.code !== 0) {
    console.log((install.stderr || "").slice(0, 2000));
    throw new Error("npm install failed");
  }

  console.log("Building...");
  const build = await ssh.execCommand("npm run build", { cwd: remoteDir, execOptions: { maxBuffer: 20 * 1024 * 1024 } });
  console.log((build.stdout || "").slice(-2000));
  if (build.code && build.code !== 0) {
    console.log((build.stderr || "").slice(0, 3000));
    throw new Error("build failed");
  }

  console.log("Starting with PM2 on :3000...");
  await remote("pm2 delete zigo || true");
  await remote('pm2 start npm --name zigo -- start -- -p 3000 -H 0.0.0.0', { cwd: remoteDir });
  await remote("pm2 save || true");

  // Open firewall if ufw present
  await ssh.execCommand("command -v ufw >/dev/null && ufw allow 22 && ufw allow 3000 && ufw allow 80 && ufw --force enable || true");

  const health = await ssh.execCommand("curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/setup/health || true");
  console.log(`Local health HTTP: ${health.stdout}`);
  console.log(`\nDone. Test: ${siteUrl}`);
  console.log("Vercel production unchanged. Point DNS only after verifying Hetzner.");

  ssh.dispose();
}

run().catch((error) => {
  console.error("Hetzner bootstrap failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
