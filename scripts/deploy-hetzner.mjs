import { NodeSSH } from 'node-ssh';
import * as fs from 'fs';

const ssh = new NodeSSH();

async function run() {
  console.log("Connecting to server...");
  await ssh.connect({
    host: '62.238.61.234',
    username: 'root',
    password: 'Hhkz2005....',
    tryKeyboard: true,
    onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
      console.log("Keyboard Interactive Prompt:", prompts);
      if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
        finish(['Hhkz2005....']);
      } else if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('new')) {
        finish(['ZigoProd2026!']); // If it asks for new password
      } else {
        finish(['ZigoProd2026!']);
      }
    }
  });

  console.log("Connected! Setting up environment...");
  
  // Install node 20
  await ssh.execCommand('curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs npm docker.io docker-compose');
  await ssh.execCommand('npm install -g pm2');

  console.log("Creating /root/zigo directory...");
  await ssh.execCommand('mkdir -p /root/zigo');

  console.log("Uploading zigo.tar.gz...");
  await ssh.putFile('zigo.tar.gz', '/root/zigo.tar.gz');

  console.log("Extracting tarball...");
  await ssh.execCommand('tar -xzf /root/zigo.tar.gz -C /root/zigo');

  console.log("Creating .env.local on server...");
  const envContent = `NEXT_PUBLIC_SITE_URL=http://62.238.61.234
PORT=80
NEXT_PUBLIC_SUPABASE_URL=http://62.238.61.234:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
`;
  await ssh.execCommand(`echo "${envContent}" > /root/zigo/.env.local`);

  console.log("Installing npm packages on server...");
  const installResult = await ssh.execCommand('npm install', { cwd: '/root/zigo' });
  if (installResult.stderr) console.log("NPM Install warnings:", installResult.stderr.slice(0, 500));

  console.log("Building Next.js...");
  const buildResult = await ssh.execCommand('npm run build', { cwd: '/root/zigo' });
  if (buildResult.stderr) console.log("Build warnings:", buildResult.stderr.slice(0, 500));

  console.log("Starting PM2 on port 80...");
  await ssh.execCommand('pm2 stop zigo || true');
  await ssh.execCommand('pm2 start npm --name "zigo" -- start -- -p 80', { cwd: '/root/zigo' });

  console.log("Deployment finished.");
  ssh.dispose();
}

run().catch(err => {
  console.error("Deployment failed", err);
  process.exit(1);
});
