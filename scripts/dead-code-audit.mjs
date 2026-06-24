/* global console, process */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";

const root = process.cwd();
const allowlistPath = join(root, "scripts/dead-code-allowlist.json");
const allowlist = existsSync(allowlistPath)
  ? JSON.parse(readFileSync(allowlistPath, "utf8"))
  : { scripts: [], components: [] };

function readPackageScriptTargets() {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const targets = new Set();

  for (const command of Object.values(packageJson.scripts ?? {})) {
    for (const match of String(command).matchAll(/scripts\/([A-Za-z0-9._-]+\.mjs)/g)) {
      targets.add(match[1]);
    }
  }

  return targets;
}

function collectScriptReferences() {
  const targets = readPackageScriptTargets();
  const scriptDir = join(root, "scripts");

  for (const filePath of walkFiles(scriptDir, (name) => name.endsWith(".mjs"))) {
    const content = readFileSync(filePath, "utf8");
    for (const match of content.matchAll(/(?:from\s+["']\.\/|read\("scripts\/|["'])([A-Za-z0-9._-]+\.mjs)/g)) {
      targets.add(match[1]);
    }
  }

  return targets;
}

function walkFiles(dir, matcher, acc = []) {
  if (!existsSync(dir)) return acc;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walkFiles(full, matcher, acc);
    } else if (matcher(entry.name)) {
      acc.push(full);
    }
  }

  return acc;
}

function loadSourceCorpus() {
  const files = walkFiles(join(root, "src"), (name) => /\.(ts|tsx|mjs)$/.test(name));
  files.push(...walkFiles(join(root, "scripts"), (name) => name.endsWith(".mjs")));
  files.push(join(root, "package.json"));
  return files.map((filePath) => ({
    filePath,
    content: readFileSync(filePath, "utf8"),
  }));
}

function isReferenced(symbol, corpus, originPath) {
  const needle = basename(symbol, ".tsx").replace(/\.ts$/, "");
  const importPatterns = [
    new RegExp(`from\\s+["']@/components/${needle}["']`),
    new RegExp(`from\\s+["']\\.\\./components/${needle}["']`),
    new RegExp(`from\\s+["']\\./${needle}["']`),
    new RegExp(`["']@/components/${needle}["']`),
    new RegExp(`["']\\.\\./\\.\\./components/${needle}["']`),
  ];

  for (const file of corpus) {
    if (file.filePath === originPath) continue;
    if (importPatterns.some((pattern) => pattern.test(file.content))) {
      return true;
    }
  }

  return false;
}

const referencedScripts = collectScriptReferences();
const scriptFiles = walkFiles(join(root, "scripts"), (name) => name.endsWith(".mjs"));
const orphanScripts = scriptFiles
  .map((filePath) => basename(filePath))
  .filter((name) => !referencedScripts.has(name) && !allowlist.scripts.includes(name));

const componentFiles = walkFiles(join(root, "src/components"), (name) => name.endsWith(".tsx"));
const corpus = loadSourceCorpus();
const orphanComponents = componentFiles
  .map((filePath) => relative(root, filePath).replace(/\\/g, "/"))
  .filter((relPath) => {
    const name = basename(relPath);
    if (allowlist.components.includes(name)) return false;
    return !isReferenced(name, corpus, join(root, relPath));
  });

const failures = [];

if (orphanScripts.length > 0) {
  failures.push(`Unreferenced scripts (${orphanScripts.length}): ${orphanScripts.join(", ")}`);
}

if (orphanComponents.length > 0) {
  failures.push(`Unreferenced components (${orphanComponents.length}): ${orphanComponents.join(", ")}`);
}

if (failures.length > 0) {
  console.error("FAIL dead-code audit");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error("Add intentional orphans to scripts/dead-code-allowlist.json or wire them up.");
  process.exit(1);
}

console.log(
  `PASS dead-code audit (${scriptFiles.length} scripts, ${componentFiles.length} components scanned)`,
);
