/**
 * Detach zigo.app from Vercel only after public DNS points at Hetzner.
 * Usage: node scripts/vercel-detach-zigo.mjs
 */
import { spawnSync } from "node:child_process";

const IP = "62.238.61.234";

async function resolveA(name) {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=A`);
  const json = await res.json();
  return (json.Answer || []).filter((a) => a.type === 1).map((a) => a.data);
}

const addrs = await resolveA("zigo.app");
console.log("Public A:", addrs);
if (!addrs.includes(IP)) {
  console.error(`Refusing detach: zigo.app does not resolve to ${IP} yet.`);
  process.exit(2);
}

// Confirm Hetzner serves the domain
const curl = spawnSync(
  "curl.exe",
  [
    "-sS",
    "-o",
    "NUL",
    "-w",
    "%{http_code}",
    "--max-time",
    "20",
    `https://zigo.app/api/setup/health`,
  ],
  { encoding: "utf8" },
);
const code = (curl.stdout || "").trim();
console.log("https://zigo.app health:", code);
if (code !== "200") {
  console.error("Public health not 200 — fix SSL/nginx before detaching Vercel.");
  process.exit(2);
}

function vercel(args) {
  console.log("vercel", args.join(" "));
  const r = spawnSync("vercel", args, { encoding: "utf8", shell: true });
  console.log(r.stdout || "");
  if (r.stderr) console.log(r.stderr.slice(0, 1500));
  return r.status ?? 1;
}

// Remove project domains (www first, then apex)
for (const d of ["www.zigo.app", "zigo.app"]) {
  const status = vercel(["domains", "rm", d, "--yes"]);
  if (status !== 0) {
    // fallback older CLI
    vercel(["project", "rm", d, "--yes"]);
  }
}

console.log("Vercel domain detach attempted. Verify: vercel domains ls");
vercel(["domains", "ls"]);
