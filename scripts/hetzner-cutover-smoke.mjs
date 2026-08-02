/**
 * Smoke tests for Hetzner cutover (works with --resolve before public DNS flips).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const IP = "62.238.61.234";
const host = "zigo.app";

async function req(path, { insecure = true } = {}) {
  const url = `https://${host}${path}`;
  // Node fetch can't easily do --resolve; use curl via child for Host:IP mapping
  const { spawnSync } = await import("node:child_process");
  const args = [
    "-sS",
    "-o",
    "-",
    "-w",
    "\\n__HTTP__:%{http_code}",
    "--max-time",
    "20",
    "--resolve",
    `${host}:443:${IP}`,
  ];
  if (insecure) args.push("-k");
  args.push(url);
  const r = spawnSync("curl.exe", args, { encoding: "utf8" });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const m = out.match(/__HTTP__:(\d+)/);
  const code = m ? Number(m[1]) : 0;
  const body = out.replace(/\n__HTTP__:\d+\s*$/, "");
  return { code, body };
}

const checks = [];
async function check(name, fn) {
  try {
    const ok = await fn();
    checks.push({ name, ok: Boolean(ok), detail: ok === true ? "ok" : String(ok) });
    console.log(ok ? "PASS" : "FAIL", name, ok === true ? "" : ok);
  } catch (e) {
    checks.push({ name, ok: false, detail: e instanceof Error ? e.message : String(e) });
    console.log("FAIL", name, e instanceof Error ? e.message : e);
  }
}

await check("health", async () => {
  const { code, body } = await req("/api/setup/health");
  if (code !== 200) return `status ${code}`;
  const json = JSON.parse(body);
  return json?.data?.status === "healthy" || json?.data?.readyCount >= 10;
});

await check("home_or_auth", async () => {
  const { code } = await req("/");
  return code === 200 || code === 307 || code === 302;
});

await check("feed_route", async () => {
  const { code } = await req("/feed");
  return code === 200 || code === 307 || code === 302;
});

await check("auth_page", async () => {
  const { code } = await req("/auth");
  return code === 200 || code === 307;
});

await check("billing_webhook_route", async () => {
  // GET may 405/401 — route must exist (not 404)
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(
    "curl.exe",
    [
      "-sS",
      "-o",
      "NUL",
      "-w",
      "%{http_code}",
      "-k",
      "--max-time",
      "15",
      "--resolve",
      `${host}:443:${IP}`,
      "-X",
      "POST",
      `https://${host}/api/billing/webhook`,
      "-H",
      "Content-Type: application/json",
      "-d",
      "{}",
    ],
    { encoding: "utf8" },
  );
  const code = Number((r.stdout || "").trim());
  // 400/401/405 = route alive; 404 = missing
  return code !== 404 && code !== 0;
});

await check("direct_3000_health", async () => {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(
    "curl.exe",
    ["-sS", "-o", "NUL", "-w", "%{http_code}", "--max-time", "10", `http://${IP}:3000/api/setup/health`],
    { encoding: "utf8" },
  );
  return (r.stdout || "").trim() === "200";
});

const failed = checks.filter((c) => !c.ok);
console.log("\nSummary:", checks.length - failed.length, "/", checks.length, "passed");
if (failed.length) {
  console.error("Failed:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}

// Stripe: no secret in env — note only
const envPath = join(process.cwd(), ".env.vercel.production");
const hasStripe =
  existsSync(envPath) && /STRIPE_SECRET_KEY=.+/m.test(readFileSync(envPath, "utf8"));
console.log(
  hasStripe
    ? "Stripe secret present — update webhook URL in Stripe dashboard to https://zigo.app/api/billing/webhook"
    : "No STRIPE_SECRET_KEY in pulled env — webhook URL stays https://zigo.app/api/billing/webhook (same origin).",
);
