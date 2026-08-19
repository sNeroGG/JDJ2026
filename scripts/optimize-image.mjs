import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export async function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!IMAGE_EXT.has(ext)) return filePath;

  const before = fs.statSync(filePath).size;
  const tmp = `${filePath}.opt.tmp`;

  try {
    const image = sharp(filePath, { failOn: "none" }).rotate();
    const meta = await image.metadata();
    const resized = image.resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    });

    if (ext === ".png") {
      await resized.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(tmp);
    } else if (ext === ".webp") {
      await resized.webp({ quality: 82 }).toFile(tmp);
    } else {
      await resized.jpeg({ quality: 84, mozjpeg: true }).toFile(tmp);
    }

    const after = fs.statSync(tmp).size;
    const shrunkPixels =
      (meta.width ?? 0) > 1200 || (meta.height ?? 0) > 1200;
    if (after < before || shrunkPixels) {
      fs.renameSync(tmp, filePath);
    } else {
      fs.unlinkSync(tmp);
    }
  } catch (error) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    console.warn(`No se pudo optimizar ${filePath}:`, error);
  }

  return filePath;
}

export async function toWebp(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".webp" || ext === ".svg") return filePath;
  const webpPath = filePath.replace(/\.[^.]+$/, ".webp");
  await sharp(filePath, { failOn: "none" })
    .rotate()
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 86 })
    .toFile(webpPath);
  return webpPath;
}

export async function optimizeImagesInDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const filePath = path.join(dir, name);
    if (!fs.statSync(filePath).isFile()) continue;
    await optimizeImage(filePath);
  }
}

if (process.argv.includes("--all")) {
  await optimizeImagesInDir(path.join(process.cwd(), "public", "images"));
}
