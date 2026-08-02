/**
 * Edit zigo.app DNS at GoDaddy dnsmanagement page (direct URL).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const IP = "62.238.61.234";
const profile = join(process.cwd(), ".playwright-godaddy");
mkdirSync(profile, { recursive: true });

const context = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
  slowMo: 80,
});
const page = context.pages()[0] || (await context.newPage());
page.setDefaultTimeout(60_000);

const dnsUrl = "https://dcc.godaddy.com/control/dnsmanagement?domainName=zigo.app";
console.log("Opening DNS management...");
await page.goto(dnsUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(10_000);
console.log("URL:", page.url());
await page.screenshot({ path: "godaddy-dns-mgmt-1.png", fullPage: true });

const body = await page.locator("body").innerText();
console.log("Body head:", body.replace(/\s+/g, " ").slice(0, 800));

// Expand / scroll to records
await page.mouse.wheel(0, 800);
await page.waitForTimeout(2000);

// Try clicking "DNS Records" or similar tabs
for (const name of ["DNS Records", "DNS Kayıtları", "Records", "Kayıtlar", "A", "Edit"]) {
  const btn = page.getByRole("button", { name: new RegExp(name, "i") }).first();
  if (await btn.count()) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  const link = page.getByRole("link", { name: new RegExp(name, "i") }).first();
  if (await link.count()) {
    await link.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
}

await page.screenshot({ path: "godaddy-dns-mgmt-2.png", fullPage: true });

// Strategy: find any element containing the old IPs and click nearby edit
for (const oldIp of ["76.223.105.230", "13.248.243.5", "76.76.21.21"]) {
  const cell = page.getByText(oldIp, { exact: false }).first();
  if (await cell.count()) {
    console.log("Found IP text:", oldIp);
    await cell.click({ button: "right" }).catch(() => cell.click());
    await page.waitForTimeout(500);
    // Look for edit icon near it
    const row = cell.locator("xpath=ancestor::*[self::tr or self::li or self::div][1]");
    const edit = row.getByRole("button", { name: /edit|düzenle|pencil/i }).first();
    if (await edit.count()) {
      await edit.click();
      console.log("Clicked edit for", oldIp);
      await page.waitForTimeout(1500);
    }
  }
}

// Fill inputs that look like IPv4
const inputs = page.locator("input");
const n = await inputs.count();
console.log("inputs", n);
let changed = 0;
for (let i = 0; i < n; i++) {
  const input = inputs.nth(i);
  const val = await input.inputValue().catch(() => "");
  const visible = await input.isVisible().catch(() => false);
  if (!visible) continue;
  if (/^(76\.223\.105\.230|13\.248\.243\.5|76\.76\.21\.21)$/.test(val)) {
    await input.fill(IP);
    changed++;
    console.log("Filled", val, "->", IP);
  }
}

// Also try "Add" A record if no existing editable A
if (changed === 0) {
  const add = page.getByRole("button", { name: /Add|Ekle|Add Record/i }).first();
  if (await add.count()) {
    console.log("Clicking Add...");
    await add.click();
    await page.waitForTimeout(2000);
    // Select type A if dropdown
    const typeSelect = page.locator("select").first();
    if (await typeSelect.count()) {
      await typeSelect.selectOption({ label: "A" }).catch(() =>
        typeSelect.selectOption("A").catch(() => {}),
      );
    }
    // Fill name @ and data IP — best effort on last empty inputs
    for (let i = 0; i < (await inputs.count()); i++) {
      const input = inputs.nth(i);
      if (!(await input.isVisible().catch(() => false))) continue;
      const ph = ((await input.getAttribute("placeholder")) || "").toLowerCase();
      const name = ((await input.getAttribute("name")) || "").toLowerCase();
      const aria = ((await input.getAttribute("aria-label")) || "").toLowerCase();
      const hint = `${ph} ${name} ${aria}`;
      if (/data|value|ip|points|hedef|adres/.test(hint)) {
        await input.fill(IP);
        changed++;
        console.log("Filled data field via hint", hint);
      }
      if (/name|host|ad/.test(hint) && !(await input.inputValue())) {
        await input.fill("@");
      }
    }
  }
}

const save = page.getByRole("button", { name: /Save|Kaydet|Apply|Onayla|Continue/i }).first();
if (await save.count()) {
  await save.click();
  console.log("Clicked save");
  await page.waitForTimeout(4000);
} else {
  console.log("No save button found — waiting 120s for manual save");
  await page.waitForTimeout(120_000);
}

await page.screenshot({ path: "godaddy-dns-mgmt-3.png", fullPage: true });
console.log("Changed fields:", changed);

// Poll DNS up to 2 minutes
for (let i = 1; i <= 12; i++) {
  const res = await fetch("https://dns.google/resolve?name=zigo.app&type=A").then((r) => r.json());
  const addrs = (res.Answer || []).filter((a) => a.type === 1).map((a) => a.data);
  console.log(`poll ${i}`, addrs);
  if (addrs.includes(IP)) {
    await context.close();
    process.exit(0);
  }
  await page.waitForTimeout(10_000);
}

await context.close();
process.exit(2);
