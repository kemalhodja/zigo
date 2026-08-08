/* global console, process */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const warnings = [];

const FORBIDDEN_WORDS = [
  "Yükleniyor",
  "İptal Et",
  "İptal Edildi",
  "Onaylandı",
  "Askıya Alındı",
  "Sınırlandırıldı",
  "Kapatıldı",
  "Mesaj At",
];

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walkFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }

  return acc;
}

const files = [
  ...walkFiles(join(root, "src/app")),
  ...walkFiles(join(root, "src/components")),
];

for (const filePath of files) {
  const content = readFileSync(filePath, "utf8");
  const relPath = relative(root, filePath).replace(/\\/g, "/");

  // Skip i18n catalogs themselves or demo feed files
  if (relPath.includes("/i18n/") || relPath.includes("demo")) continue;

  for (const word of FORBIDDEN_WORDS) {
    if (content.includes(`"${word}"`) || content.includes(`'${word}'`) || content.includes(`>${word}<`)) {
      warnings.push(`${relPath}: contains hardcoded TR string "${word}"`);
    }
  }
}

if (warnings.length > 0) {
  console.warn("WARN i18n audit (Hardcoded TR strings detected):");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
} else {
  console.log("PASS i18n audit (No hardcoded TR strings found in app/components)");
}

// Exit 0 to start in warn-only mode as requested in plan
process.exit(0);
