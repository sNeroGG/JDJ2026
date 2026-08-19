import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { readSavedContent } from "./seo.mjs";

/**
 * Genera la imagen de compartir (1200×630), el favicon de la pestaña y el
 * icono de iOS. El OG usa el logo del hero; la pestaña usa el emblema del footer.
 *
 *   node scripts/og-image.mjs [ruta-del-logo-hero]
 */

const ROOT = process.cwd();
const IMAGES_DIR = path.join(ROOT, "public", "images");
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function resolvePublicImage(url, fallback) {
  const relative = String(url || fallback || "").replace(/^\//, "");
  const abs = path.join(ROOT, "public", relative);
  if (abs.toLowerCase().endsWith(".webp")) {
    const png = abs.replace(/\.webp$/i, ".png");
    if (fs.existsSync(png)) return png;
  }
  return abs;
}

function resolveLogoPath(explicit) {
  if (explicit) return path.resolve(ROOT, explicit);
  const saved = readSavedContent(ROOT);
  return resolvePublicImage(saved.logoUrl, "/images/logo-jdj-2026.webp");
}

function resolveFooterLogoPath() {
  const saved = readSavedContent(ROOT);
  return resolvePublicImage(
    saved.footer?.logoUrl,
    "/images/logo-pja.webp",
  );
}

async function croppedLogo(logoPath, size, pad = 0) {
  return sharp(logoPath)
    .trim({ threshold: 10 })
    .resize({
      width: Math.max(1, size - pad * 2),
      height: Math.max(1, size - pad * 2),
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

function background(width, height) {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7f5f0" />
      <stop offset="55%" stop-color="#e9f0e6" />
      <stop offset="100%" stop-color="#d4e4e8" />
    </linearGradient>
    <radialGradient id="glow" cx="20%" cy="18%" r="65%">
      <stop offset="0%" stop-color="#a3b97a" stop-opacity="0.38" />
      <stop offset="100%" stop-color="#a3b97a" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="warm" cx="85%" cy="88%" r="55%">
      <stop offset="0%" stop-color="#f5c96a" stop-opacity="0.32" />
      <stop offset="100%" stop-color="#f5c96a" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#base)" />
  <rect width="${width}" height="${height}" fill="url(#glow)" />
  <rect width="${width}" height="${height}" fill="url(#warm)" />
</svg>`);
}

async function buildOgImage(logoPath) {
  // El logo oficial viene con mucho margen transparente: se recorta para que
  // ocupe bien la vista previa pequeña de WhatsApp.
  const logo = await sharp(logoPath)
    .trim()
    .resize({
      width: Math.round(OG_WIDTH * 0.74),
      height: Math.round(OG_HEIGHT * 0.66),
      fit: "inside",
    })
    .png()
    .toBuffer();

  const bar = Buffer.from(
    `<svg width="${OG_WIDTH}" height="14" xmlns="http://www.w3.org/2000/svg"><rect width="${OG_WIDTH}" height="14" fill="#6f8647" /></svg>`,
  );

  const out = path.join(IMAGES_DIR, "og-jdj-2026.jpg");
  await sharp(background(OG_WIDTH, OG_HEIGHT))
    .composite([
      { input: logo, gravity: "centre" },
      { input: bar, gravity: "south" },
    ])
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(out);
  return out;
}

async function buildFavicon(logoPath, size) {
  const logo = await croppedLogo(logoPath, size, Math.round(size * 0.04));
  const out = path.join(IMAGES_DIR, `favicon-${size}.png`);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(out);
  return out;
}

async function buildAppleIcon(logoPath) {
  const size = 180;
  const logo = await croppedLogo(logoPath, size, Math.round(size * 0.06));
  const out = path.join(IMAGES_DIR, "apple-touch-icon.png");
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: "#f7f5f0",
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(out);
  return out;
}

async function main() {
  const logoPath = resolveLogoPath(process.argv[2]);
  if (!fs.existsSync(logoPath)) {
    throw new Error(`No se encontró el logo: ${logoPath}`);
  }
  const footerLogoPath = resolveFooterLogoPath();
  if (!fs.existsSync(footerLogoPath)) {
    throw new Error(`No se encontró el logo del footer: ${footerLogoPath}`);
  }
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const og = await buildOgImage(logoPath);
  const icon32 = await buildFavicon(footerLogoPath, 32);
  const icon48 = await buildFavicon(footerLogoPath, 48);
  const apple = await buildAppleIcon(footerLogoPath);
  console.log(
    `Listo:\n  ${path.relative(ROOT, og)}\n  ${path.relative(ROOT, icon32)}\n  ${path.relative(ROOT, icon48)}\n  ${path.relative(ROOT, apple)}`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
