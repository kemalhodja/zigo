/* global process */
import { spawnSync } from "node:child_process";

const ACCOUNT_NAME =
  "NEZİH EĞİTİM KURUMLARI TURİZM GIDA İNŞAAT VE TİCARET LİMİTED ŞİRKETİ";

const vars = {
  ZIGO_BANK_IBAN: "TR610001200972100010262175",
  ZIGO_BANK_ACCOUNT_NAME: ACCOUNT_NAME,
  ZIGO_BANK_NAME: "Halkbank",
  ZIGO_BANK_BRANCH: "721 / ŞİRİNYER / İZMİR ŞB.",
  ZIGO_BANK_ACCOUNT_NO: "10262175",
  ZIGO_BANK_LABEL: "Halkbank",
  ZIGO_BANK_2_IBAN: "TR930015700000000128332548",
  ZIGO_BANK_2_ACCOUNT_NAME: ACCOUNT_NAME,
  ZIGO_BANK_2_NAME: "Enpara Bank A.Ş.",
  ZIGO_BANK_2_LABEL: "Enpara Bank",
};

for (const [key, value] of Object.entries(vars)) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", key, "production", "--force"],
    { encoding: "utf8", shell: true, cwd: process.cwd(), input: value },
  );

  if (result.status !== 0) {
    console.error(`Failed ${key}:`, result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }

  console.log(`✓ ${key}`);
}
