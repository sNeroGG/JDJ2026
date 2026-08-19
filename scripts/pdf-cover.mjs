import fs from "node:fs";
import path from "node:path";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";

if (!globalThis.DOMMatrix) globalThis.DOMMatrix = DOMMatrix;
if (!globalThis.ImageData) globalThis.ImageData = ImageData;
if (!globalThis.Path2D) globalThis.Path2D = Path2D;

export function coverUrlForPdf(pdfUrl) {
  const file = pdfUrl.split("?")[0].split("/").pop() || "";
  if (!file.toLowerCase().endsWith(".pdf")) return "";
  return `/docs/covers/${file.replace(/\.pdf$/i, "")}.webp`;
}

export async function renderPdfCover(pdfPath, coversDir) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height),
  );
  const context = canvas.getContext("2d");
  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  fs.mkdirSync(coversDir, { recursive: true });
  const outName = `${path.basename(pdfPath).replace(/\.pdf$/i, "")}.webp`;
  const outPath = path.join(coversDir, outName);
  await sharp(canvas.toBuffer("image/png"))
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outPath);

  return `/docs/covers/${outName}`;
}

export async function renderCoversInDir(docsDir) {
  const coversDir = path.join(docsDir, "covers");
  if (!fs.existsSync(docsDir)) return;
  for (const name of fs.readdirSync(docsDir)) {
    if (!name.toLowerCase().endsWith(".pdf")) continue;
    await renderPdfCover(path.join(docsDir, name), coversDir);
  }
}

if (process.argv.includes("--all")) {
  await renderCoversInDir(path.join(process.cwd(), "public", "docs"));
}
