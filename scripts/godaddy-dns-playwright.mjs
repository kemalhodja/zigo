/**
 * Attempt GoDaddy DNS edit via Playwright (reuses a persistent profile).
 * Sets A @ → 62.238.61.234
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const IP = "62.238.61.234";
const profile = join(process.cwd(), ".playwright-godaddy");
mkdirSync(profile, { recursive: true });

const context = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: { width: 1400, height: 900 },
  args: ["--disable-blink-features=AutomationControlled"],
});
const page = context.pages()[0] || (await context.newPage());
page.setDefaultTimeout(60_000);

const dnsUrl = "https://dcc.godaddy.com/control/portfolio/zigo.app/settings?tab=dns";
console.log("Opening", dnsUrl);
await page.goto(dnsUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(8000);

const url = page.url();
console.log("Landed:", url);
await page.screenshot({ path: "godaddy-dns-state.png", fullPage: true });

if (/sso\.godaddy|login|signin/i.test(url) || (await page.content()).match(/Sign In|Log In/i)) {
  console.log("LOGIN REQUIRED — sign in in the opened browser window within 3 minutes...");
  try {
    await page.waitForURL(/dcc\.godaddy\.com.*dns|portfolio/i, { timeout: 180_000 });
  } catch {
    console.error("Still not logged in after wait.");
    await context.close();
    process.exit(2);
  }
}

// Navigate again to DNS tab after login
await page.goto(dnsUrl, { waitUntil: "networkidle" }).catch(() => page.goto(dnsUrl));
await page.waitForTimeout(5000);
await page.screenshot({ path: "godaddy-dns-after-login.png", fullPage: true });

// Try to find A record rows / edit buttons — GoDaddy UI changes often
const text = await page.locator("body").innerText();
console.log("Body snippet:", text.slice(0, 500).replace(/\s+/g, " "));

// Click "DNS" if needed
for (const label of ["DNS", "Manage DNS", "DNS Records"]) {
  const el = page.getByRole("link", { name: label }).first();
  if (await el.count()) {
    await el.click().catch(() => {});
    await page.waitForTimeout(2000);
  }
}

// Look for inputs containing old IPs or Add button
const addBtn = page.getByRole("button", { name: /Add|Add Record|Yeni/i }).first();
if (await addBtn.count()) {
  console.log("Found Add button");
}

// Heuristic: fill any visible A-record value field
const inputs = page.locator('input[type="text"], input:not([type])');
const count = await inputs.count();
console.log("Visible inputs:", count);

let edited = false;
for (let i = 0; i < Math.min(count, 40); i++) {
  const input = inputs.nth(i);
  const val = await input.inputValue().catch(() => "");
  if (val === "76.223.105.230" || val === "13.248.243.5" || val === "76.76.21.21") {
    await input.fill(IP);
    edited = true;
    console.log("Replaced", val, "→", IP);
  }
}

if (edited) {
  const save = page.getByRole("button", { name: /Save|Kaydet|Apply/i }).first();
  if (await save.count()) {
    await save.click();
    console.log("Clicked Save");
    await page.waitForTimeout(3000);
  }
} else {
  console.log("Could not auto-edit A records. Use manual edit: A @ =", IP);
  console.log("Browser left open 60s for manual edit...");
  await page.waitForTimeout(60_000);
}

await page.screenshot({ path: "godaddy-dns-final.png", fullPage: true });
await context.close();

const res = await fetch(`https://dns.google/resolve?name=zigo.app&type=A`).then((r) => r.json());
const addrs = (res.Answer || []).filter((a) => a.type === 1).map((a) => a.data);
console.log("Public A now:", addrs);
process.exit(addrs.includes(IP) ? 0 : 2);
