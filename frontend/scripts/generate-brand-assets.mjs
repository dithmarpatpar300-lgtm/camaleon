/**
 * Regenerates brand PNGs from the approved Lamina 3C reference screenshot.
 * Run from frontend/: node scripts/generate-brand-assets.mjs
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const brandBg = { r: 14, g: 15, b: 17, alpha: 255 };
const brandGreen = { r: 34, g: 197, b: 94 };

/** Final reference crop — dark mode icon with oval head intact. */
const REFERENCE_DARK = path.join(root, "public/brand/reference-dark.png");

function extractGreen({ data, info }) {
  const px = Buffer.from(data);
  const { channels } = info;
  for (let i = 0; i < px.length; i += channels) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const greenness = g - Math.max(r, b);
    if (greenness > 6) {
      const alpha = Math.min(255, Math.round(greenness * 3.2 + 50));
      px[i] = brandGreen.r;
      px[i + 1] = brandGreen.g;
      px[i + 2] = brandGreen.b;
      px[i + 3] = alpha;
    } else {
      px[i + 3] = 0;
    }
  }
  return px;
}

async function extractFromReference() {
  const raw = await sharp(REFERENCE_DARK).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buf = extractGreen(raw);
  return sharp(buf, {
    raw: { width: raw.info.width, height: raw.info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** PWA / install tile — brand background, mark scaled for `any` or maskable safe zone. */
async function composePwaTile(mark256, tileSize, { maskable = false } = {}) {
  const scale = maskable ? 0.52 : 0.78;
  const markPx = Math.round(tileSize * scale);
  const mark = await sharp(mark256)
    .resize(markPx, markPx, { fit: "contain", background: transparent })
    .png()
    .toBuffer();

  return sharp({
    create: { width: tileSize, height: tileSize, channels: 4, background: brandBg },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

/** Trim soft alpha, square-fit, add even padding — preserves oval head curve. */
async function centerMark(input, outputSize, paddingRatio = 0.1) {
  const trimmed = await sharp(input).trim({ threshold: 8 }).png().toBuffer();
  const { width = 0, height = 0 } = await sharp(trimmed).metadata();
  const content = Math.max(width, height);
  const pad = Math.round(content * paddingRatio);

  return sharp(trimmed)
    .resize(content, content, { fit: "contain", background: transparent })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: transparent,
    })
    .resize(outputSize, outputSize, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
}

async function run() {
  const extracted = await extractFromReference();
  const mark256 = await centerMark(extracted, 256, 0.1);
  const mark128 = await sharp(mark256).resize(128, 128).png().toBuffer();
  const mark64 = await sharp(mark128).resize(64, 64).png().toBuffer();

  await sharp(mark128).toFile(path.join(root, "public/brand/camaleon-mark.png"));
  await sharp(mark64).toFile(path.join(root, "public/brand/camaleon-mark-64.png"));

  // Favicon: transparent, mark ~80% of tile
  const faviconMark = await sharp(mark256)
    .resize(410, 410, { fit: "contain", background: transparent })
    .png()
    .toBuffer();

  await sharp({
    create: { width: 512, height: 512, channels: 4, background: transparent },
  })
    .composite([{ input: faviconMark, gravity: "center" }])
    .png()
    .toFile(path.join(root, "src/app/icon.png"));

  const appleMark = await sharp(mark256)
    .resize(140, 140, { fit: "contain", background: transparent })
    .png()
    .toBuffer();

  await sharp({
    create: { width: 180, height: 180, channels: 4, background: brandBg },
  })
    .composite([{ input: appleMark, gravity: "center" }])
    .png()
    .toFile(path.join(root, "src/app/apple-icon.png"));

  const pwaDir = path.join(root, "public/pwa");
  await sharp(await composePwaTile(mark256, 192)).toFile(path.join(pwaDir, "icon-192.png"));
  await sharp(await composePwaTile(mark256, 512)).toFile(path.join(pwaDir, "icon-512.png"));
  await sharp(await composePwaTile(mark256, 512, { maskable: true })).toFile(
    path.join(pwaDir, "icon-512-maskable.png")
  );

  console.log("brand assets generated (mark, favicon, apple, PWA icons)");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
