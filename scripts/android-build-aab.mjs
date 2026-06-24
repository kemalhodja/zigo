/* global console, process */

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const androidDir = join(root, "android");
const gradleHome = "C:\\dev\\gradle85";
const tmpDir = "C:\\dev\\tmp";
const aabSource = join(androidDir, "app", "build", "outputs", "bundle", "release", "app-release.aab");
const aabTarget = join(root, "Zigo-release.aab");
const keystorePath = join(androidDir, "app", "zigo-release.keystore");
const keystorePropsPath = join(androidDir, "keystore.properties");

function ensureReleaseKeystore() {
  const storePassword = "zigoLocalRelease1";
  const keyPassword = storePassword;
  const alias = "zigo";

  if (!existsSync(keystorePath)) {
    const result = spawnSync(
      "keytool",
      [
        "-genkeypair",
        "-v",
        "-storetype",
        "PKCS12",
        "-keystore",
        keystorePath,
        "-alias",
        alias,
        "-keyalg",
        "RSA",
        "-keysize",
        "2048",
        "-validity",
        "10000",
        "-storepass",
        storePassword,
        "-keypass",
        keyPassword,
        "-dname",
        "CN=Zigo Education, OU=Mobile, O=Zigo, L=Istanbul, ST=TR, C=TR",
      ],
      { encoding: "utf8" },
    );

    if (result.status !== 0) {
      console.error(result.stderr || result.stdout || "keytool failed");
      process.exit(1);
    }
  }

  if (!existsSync(keystorePropsPath)) {
    writeFileSync(
      keystorePropsPath,
      [
        "storeFile=zigo-release.keystore",
        `storePassword=${storePassword}`,
        `keyAlias=${alias}`,
        `keyPassword=${keyPassword}`,
        "",
      ].join("\n"),
      "utf8",
    );
  }
}

function runGradle() {
  const result = spawnSync(
    process.platform === "win32" ? "gradlew.bat" : "./gradlew",
    ["bundleRelease", "--no-daemon", "--max-workers=1", "--no-build-cache"],
    {
      cwd: androidDir,
      env: {
        ...process.env,
        GRADLE_USER_HOME: gradleHome,
        TEMP: tmpDir,
        TMP: tmpDir,
      },
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.status === 0;
}

const productionServerUrl = (process.env.CAPACITOR_SERVER_URL || "https://zigo.app").replace(/\/$/, "");

function runCapSync() {
  console.log(`Capacitor server URL: ${productionServerUrl}`);
  return spawnSync("npm.cmd", ["run", "android:sync"], {
    cwd: root,
    encoding: "utf8",
    shell: true,
    env: {
      ...process.env,
      CAPACITOR_SERVER_URL: productionServerUrl,
    },
  });
}

mkdirSync(tmpDir, { recursive: true });
spawnSync(
  "powershell",
  ["-NoProfile", "-Command", "Add-MpPreference -ExclusionPath 'C:\\dev' -ErrorAction SilentlyContinue"],
  { encoding: "utf8" },
);

ensureReleaseKeystore();

const sync = runCapSync();

if (sync.status !== 0) {
  console.error(sync.stdout ?? sync.stderr ?? "android:sync failed");
  process.exit(1);
}

if (!runGradle()) {
  console.error("\nFAIL AAB build failed.");
  process.exit(1);
}

if (!existsSync(aabSource)) {
  console.error(`FAIL missing output: ${aabSource}`);
  process.exit(1);
}

copyFileSync(aabSource, aabTarget);
console.log(`\nPASS AAB ready: ${aabTarget}`);
