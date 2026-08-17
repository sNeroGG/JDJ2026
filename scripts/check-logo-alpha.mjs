import sharp from "sharp";
import fs from "node:fs";

const files = {
  nuevo: process.argv[2],
  actual: "public/images/logo-principal.png",
};

for (const [key, filePath] of Object.entries(files)) {
  const meta = await sharp(filePath).metadata();
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let transparent = 0;
  let opaque = 0;
  let nearBlackOpaque = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) {
      transparent++;
      continue;
    }
    opaque++;
    if (data[i] <= 20 && data[i + 1] <= 20 && data[i + 2] <= 20) {
      nearBlackOpaque++;
    }
  }

  console.log(
    JSON.stringify(
      {
        key,
        hasAlpha: meta.hasAlpha,
        format: meta.format,
        size: fs.statSync(filePath).size,
        w: info.width,
        h: info.height,
        transparent,
        opaque,
        nearBlackOpaque,
        transparentRatio: Number((transparent / (transparent + opaque)).toFixed(3)),
      },
      null,
      2,
    ),
  );
}
