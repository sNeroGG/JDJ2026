import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const src = process.argv[2] || "public/images/logo-oficial-nuevo.png";
const out = "public/images/logo-principal.png";
const tmp = "public/images/logo-principal.tmp.png";
const THRESHOLD = 25;

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixels = new Uint8ClampedArray(data);
const visited = new Uint8Array(width * height);
const queue = [];

function isBg(i) {
  const o = i * channels;
  return (
    pixels[o] <= THRESHOLD &&
    pixels[o + 1] <= THRESHOLD &&
    pixels[o + 2] <= THRESHOLD &&
    pixels[o + 3] > 0
  );
}

function push(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = y * width + x;
  if (visited[i] || !isBg(i)) return;
  visited[i] = 1;
  queue.push(i);
}

for (let x = 0; x < width; x++) {
  push(x, 0);
  push(x, height - 1);
}
for (let y = 0; y < height; y++) {
  push(0, y);
  push(width - 1, y);
}

while (queue.length) {
  const i = queue.pop();
  pixels[i * channels + 3] = 0;
  const x = i % width;
  const y = (i / width) | 0;
  push(x + 1, y);
  push(x - 1, y);
  push(x, y + 1);
  push(x, y - 1);
}

await sharp(pixels, { raw: { width, height, channels } }).png().toFile(tmp);
fs.copyFileSync(tmp, out);
fs.unlinkSync(tmp);

const check = await sharp(out).metadata();
console.log(
  JSON.stringify(
    {
      src,
      out,
      hasAlpha: check.hasAlpha,
      width,
      height,
      size: fs.statSync(out).size,
    },
    null,
    2,
  ),
);
