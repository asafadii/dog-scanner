import { readFileSync } from "fs";
import sharp from "sharp";

const svg = readFileSync("public/dora-icon.svg");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`);
  console.log(`Generated ${size}x${size}`);
}

await sharp(Buffer.from(svg))
  .resize(400, 400)
  .extend({
    top: 56,
    bottom: 56,
    left: 56,
    right: 56,
    background: { r: 7, g: 125, b: 115, alpha: 1 },
  })
  .resize(512, 512)
  .png()
  .toFile("public/icons/icon-512x512-maskable.png");

console.log("Generated 512x512 maskable icon");
