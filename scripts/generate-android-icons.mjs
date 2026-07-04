/* global console, process */

import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const svgPath = path.join(root, "public/icon-maskable.svg");
const resDir = path.join(root, "android/app/src/main/res");

const launcherSizes = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const foregroundSizes = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

for (const [density, size] of Object.entries(launcherSizes)) {
  const folder = path.join(resDir, `mipmap-${density}`);
  await mkdir(folder, { recursive: true });

  const png = sharp(svgPath).resize(size, size, { fit: "cover" });

  await png.clone().toFile(path.join(folder, "ic_launcher.png"));
  await png.clone().toFile(path.join(folder, "ic_launcher_round.png"));
  await sharp(svgPath)
    .resize(foregroundSizes[density], foregroundSizes[density], { fit: "cover" })
    .toFile(path.join(folder, "ic_launcher_foreground.png"));
}

console.log("Android launcher icons generated from public/icon-maskable.svg");
