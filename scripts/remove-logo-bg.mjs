import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, "../public/images/logo-principal.png");
const output = path.join(__dirname, "../public/images/logo-principal-clear.png");
const finalPath = input;

const THRESHOLD = 28;

const image = sharp(input).ensureAlpha();
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const pixels = new Uint8ClampedArray(data);
const visited = new Uint8Array(width * height);
const queue = [];

function isBg(i) {
  const o = i * channels;
  return pixels[o] <= THRESHOLD && pixels[o + 1] <= THRESHOLD && pixels[o + 2] <= THRESHOLD;
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
  const o = i * channels;
  pixels[o + 3] = 0;
  const x = i % width;
  const y = (i / width) | 0;
  push(x + 1, y);
  push(x - 1, y);
  push(x, y + 1);
  push(x, y - 1);
}

await sharp(pixels, {
  raw: { width, height, channels },
})
  .png()
  .toFile(output);

await sharp(output).png().toFile(finalPath + ".tmp.png");
console.log(`Transparent logo saved: ${width}x${height} -> ${output}`);
