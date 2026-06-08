export type BmpMeta = {
  width: number;
  height: number;
  bitCount: number;
  compression: number;
  topDown: boolean;
  pixelDataOffset: number;
  rowStride: number;
};

export type BmpAlphaDetection = {
  hasAlpha: boolean;
  reason: "bgra" | "opaque32" | "rgb" | "indexed" | "not-bmp" | "truncated";
};

const BMP_SIG = [0x42, 0x4d] as const;
const BI_RGB = 0;
const BI_RLE8 = 1;
const BI_RLE4 = 2;
/** Max pixels to sample when scanning for semantic alpha (32-bit BGRA). */
const MAX_ALPHA_SAMPLES = 8192;

function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function readI32(view: DataView, offset: number): number {
  return view.getInt32(offset, true);
}

/** Parse BMP header fields without decoding pixel data. */
export function inspectBmpMeta(bytes: ArrayBuffer): BmpMeta | null {
  const view = new DataView(bytes);
  if (view.byteLength < 54) return null;
  if (view.getUint8(0) !== BMP_SIG[0] || view.getUint8(1) !== BMP_SIG[1]) return null;

  const pixelDataOffset = readU32(view, 10);
  const rawHeight = readI32(view, 22);
  const width = readU32(view, 18);
  const height = Math.abs(rawHeight);
  const bitCount = readU16(view, 28);
  const compression = readU32(view, 30);

  if (width === 0 || height === 0 || pixelDataOffset >= view.byteLength) return null;

  const rowStride = Math.floor((bitCount * width + 31) / 32) * 4;

  return {
    width,
    height,
    bitCount,
    compression,
    topDown: rawHeight < 0,
    pixelDataOffset,
    rowStride,
  };
}

/**
 * Returns true only when the BMP carries meaningful per-pixel transparency
 * (32-bit BGRA with at least one alpha byte below 255).
 */
export function detectBmpAlpha(bytes: ArrayBuffer): BmpAlphaDetection {
  const meta = inspectBmpMeta(bytes);
  if (!meta) {
    const view = new Uint8Array(bytes);
    if (view.length < 2 || view[0] !== BMP_SIG[0] || view[1] !== BMP_SIG[1]) {
      return { hasAlpha: false, reason: "not-bmp" };
    }
    return { hasAlpha: false, reason: "truncated" };
  }

  if (meta.bitCount !== 32) {
    return {
      hasAlpha: false,
      reason: meta.bitCount <= 8 ? "indexed" : "rgb",
    };
  }

  if (meta.compression !== BI_RGB && meta.compression !== BI_RLE8 && meta.compression !== BI_RLE4) {
    // Exotic compression (e.g. bitfields) — defer to decode path; assume no alpha UI.
    return { hasAlpha: false, reason: "rgb" };
  }

  const view = new Uint8Array(bytes);
  const { width, height, topDown, pixelDataOffset, rowStride } = meta;
  const totalPixels = width * height;
  if (totalPixels === 0) return { hasAlpha: false, reason: "rgb" };

  const step = Math.max(1, Math.floor(totalPixels / MAX_ALPHA_SAMPLES));
  let sampled = 0;

  for (let i = 0; i < totalPixels && sampled < MAX_ALPHA_SAMPLES; i += step) {
    const x = i % width;
    const row = topDown ? Math.floor(i / width) : height - 1 - Math.floor(i / width);
    const alphaOffset = pixelDataOffset + row * rowStride + x * 4 + 3;

    if (alphaOffset >= view.length) break;
    if (view[alphaOffset] < 255) {
      return { hasAlpha: true, reason: "bgra" };
    }
    sampled++;
  }

  return { hasAlpha: false, reason: "opaque32" };
}

/** Convenience for callers that only need a boolean. */
export function bmpHasMeaningfulAlpha(bytes: ArrayBuffer): boolean {
  return detectBmpAlpha(bytes).hasAlpha;
}
