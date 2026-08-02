/**
 * Broader GoDaddy portfolio search for zigo.app after login.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const IP = "62.238.61.234";
const profile = join(process.cwd(), ".playwright-godaddy");
mkdirSync(profile, { recursive: true });

const context = await chromium.launchPersistentContext(profile, {
  headless: false,
  viewport: { width: 1440, height: 900 },
});
const page = context.pages()[0] || (await context.newPage());
page.setDefaultTimeout(90_000);

const urls = [
  "https://dcc.godaddy.com/control/portfolio/?searchTerm=zigo.app",
  "https://account.godaddy.com/products",
  "https://dcc.godaddy.com/manage/zigo.app/dns",
];

for (const u of urls) {
  console.log("GOTO", u);
  await page.goto(u, { waitUntil: "domcontentloaded" }).catch((e) => console.log(e.message));
  await page.waitForTimeout(6000);
  console.log(" URL", page.url());
  const t = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 400);
  console.log(" TXT", t);
  await page.screenshot({
    path: `godaddy-${urls.indexOf(u)}.png`,
    fullPage: true,
  });
  if (/zigo\.app/i.test(t) && !/eşleşme bulunamadı|no domains/i.test(t)) {
    console.log("Found domain mention — trying manage DNS link");
    const link = page.getByRole("link", { name: /zigo\.app|DNS|Manage/i }).first();
    if (await link.count()) {
      await link.click().catch(() => {});
      await page.waitForTimeout(4000);
    }
  }
}

// Manual window
console.log(`\nIf you see zigo.app, set A @ = ${IP} then press Enter in this terminal is not available — waiting 90s`);
await page.waitForTimeout(90_000);
await page.screenshot({ path: "godaddy-final-wait.png", fullPage: true });

const res = await fetch("https://dns.google/resolve?name=zigo.app&type=A").then((r) => r.json());
const addrs = (res.Answer || []).filter((a) => a.type === 1).map((a) => a.data);
console.log("Public A:", addrs);
await context.close();
process.exit(addrs.includes(IP) ? 0 : 2);
