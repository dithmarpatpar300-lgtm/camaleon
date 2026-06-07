export type PngAlphaDetection = {
  hasAlpha: boolean;
  reason: "rgba" | "trns" | "none" | "not-png";
};

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function detectPngAlpha(bytes: ArrayBuffer): PngAlphaDetection {
  const view = new Uint8Array(bytes);

  if (view.length < 26) {
    return { hasAlpha: false, reason: "not-png" };
  }

  for (let i = 0; i < 8; i++) {
    if (view[i] !== PNG_SIG[i]) {
      return { hasAlpha: false, reason: "not-png" };
    }
  }

  const colorType = view[25];
  // 4 = grayscale + alpha, 6 = RGBA
  if (colorType === 4 || colorType === 6) {
    return { hasAlpha: true, reason: "rgba" };
  }

  // For color types 0 (grayscale), 2 (RGB), 3 (indexed):
  // scan chunks for tRNS (transparency chunk)
  const limit = Math.min(view.length, 64 * 1024);
  let pos = 8; // past signature

  while (pos + 12 <= limit) {
    const dataLen = (view[pos] << 24) | (view[pos + 1] << 16) | (view[pos + 2] << 8) | view[pos + 3];
    const type = String.fromCharCode(view[pos + 4], view[pos + 5], view[pos + 6], view[pos + 7]);

    if (type === "tRNS") {
      return { hasAlpha: true, reason: "trns" };
    }

    pos += 12 + dataLen;
  }

  return { hasAlpha: false, reason: "none" };
}
