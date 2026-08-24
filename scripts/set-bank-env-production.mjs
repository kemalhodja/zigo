/* global process */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// Bank details are sensitive; they must come from an untracked local file
// (.env.bank) or the process environment — never hardcoded here.
//
// .env.bank example:
//   ZIGO_BANK_IBAN=TR...
//   ZIGO_BANK_ACCOUNT_NAME=...
//   ...

function loadEnvBankFile() {
  const path = ".env.bank";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf("=");
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    const value = trimmed.slice(sep + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvBankFile();

const keys = [
  "ZIGO_BANK_IBAN",
  "ZIGO_BANK_ACCOUNT_NAME",
  "ZIGO_BANK_NAME",
  "ZIGO_BANK_BRANCH",
  "ZIGO_BANK_ACCOUNT_NO",
  "ZIGO_BANK_LABEL",
  "ZIGO_BANK_2_IBAN",
  "ZIGO_BANK_2_ACCOUNT_NAME",
  "ZIGO_BANK_2_NAME",
  "ZIGO_BANK_2_LABEL",
];

const missing = keys.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  console.error(
    `Missing bank variables: ${missing.join(", ")}\n` +
      "Set them via environment or a local untracked .env.bank file.\n" +
      "Never commit real bank credentials to the repository.",
  );
  process.exit(1);
}

for (const key of keys) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", key, "production", "--force"],
    { encoding: "utf8", shell: true, cwd: process.cwd(), input: process.env[key] },
  );

  if (result.status !== 0) {
    console.error(`Failed ${key}:`, result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }

  console.log(`✓ ${key}`);
}
