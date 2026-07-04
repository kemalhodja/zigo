/* global console, process */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function resolveAdb() {
  const sdkRoot = process.env.ANDROID_HOME ?? join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk");
  const adb = join(sdkRoot, "platform-tools", "adb.exe");
  return existsSync(adb) ? adb : "adb";
}

if (!process.env.CAPACITOR_SERVER_URL) {
  process.env.CAPACITOR_SERVER_URL = "http://10.0.2.2:3000";
  console.log(`CAPACITOR_SERVER_URL not set; using emulator default ${process.env.CAPACITOR_SERVER_URL}`);
}

console.log("Syncing Capacitor Android project…");
run("npm", ["run", "android:sync"]);

console.log("Installing debug APK on connected device/emulator…");
run("cmd", ["/c", "cd android && gradlew.bat installDebug --max-workers=1 --no-build-cache"]);

const adb = resolveAdb();
console.log("Launching com.zigo.education…");
run(adb, [
  "shell",
  "monkey",
  "-p",
  "com.zigo.education",
  "-c",
  "android.intent.category.LAUNCHER",
  "1",
]);

console.log("Done. Ensure dev server is running at the CAPACITOR_SERVER_URL target.");
