import type { SourceImageMeta } from "./types";
import { scanJpegDimensions } from "./jpeg-scan";

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

function pngBitDepthLabel(bitDepth: number, colorType: number): string {
  switch (colorType) {
    case 0:
      return `${bitDepth}-bit grayscale`;
    case 2:
      return `${bitDepth * 3}-bit`;
    case 3:
      return `${bitDepth}-bit indexed`;
    case 4:
      return `${bitDepth}-bit grayscale+alpha`;
    case 6:
      return `${bitDepth * 4}-bit`;
    default:
      return `${bitDepth}-bit`;
  }
}

export function probePngSourceMeta(bytes: ArrayBuffer): SourceImageMeta | null {
  const view = new Uint8Array(bytes);
  if (view.length < 26) return null;
  for (let i = 0; i < 8; i++) {
    if (view[i] !== PNG_SIG[i]) return null;
  }
  const width =
    (view[16] << 24) | (view[17] << 16) | (view[18] << 8) | view[19];
  const height =
    (view[20] << 24) | (view[21] << 16) | (view[22] << 8) | view[23];
  if (width === 0 || height === 0) return null;
  return {
    width,
    height,
    bitDepthLabel: pngBitDepthLabel(view[24], view[25]),
  };
}

export function probeJpegSourceMeta(bytes: ArrayBuffer): SourceImageMeta | null {
  const dims = scanJpegDimensions(new Uint8Array(bytes));
  if (!dims) return null;
  return { width: dims.width, height: dims.height, bitDepthLabel: "24-bit" };
}

export function probeGifSourceMeta(bytes: ArrayBuffer): SourceImageMeta | null {
  const view = new Uint8Array(bytes);
  if (view.length < 10) return null;
  if (view[0] !== 0x47 || view[1] !== 0x49 || view[2] !== 0x46) return null;

  const width = view[6] | (view[7] << 8);
  const height = view[8] | (view[9] << 8);
  if (width === 0 || height === 0) return null;

  let frameCount = 0;
  for (let i = 0; i < view.length - 1; i++) {
    if (view[i] === 0x21 && view[i + 1] === 0xf9) frameCount++;
  }
  if (frameCount === 0) frameCount = 1;

  return {
    width,
    height,
    bitDepthLabel: "8-bit",
    frameCount,
  };
}

export function probeWebpSourceMeta(bytes: ArrayBuffer): SourceImageMeta | null {
  const view = new Uint8Array(bytes);
  if (view.length < 30) return null;
  if (
    view[0] !== 0x52 ||
    view[1] !== 0x49 ||
    view[2] !== 0x46 ||
    view[3] !== 0x46 ||
    view[8] !== 0x57 ||
    view[9] !== 0x45 ||
    view[10] !== 0x42 ||
    view[11] !== 0x50
  ) {
    return null;
  }

  let pos = 12;
  while (pos + 8 <= view.length) {
    const tag = String.fromCharCode(view[pos], view[pos + 1], view[pos + 2], view[pos + 3]);
    const chunkSize = view[pos + 4] | (view[pos + 5] << 8) | (view[pos + 6] << 16) | (view[pos + 7] << 24);

    if (tag === "VP8X" && pos + 18 <= view.length) {
      const width = 1 + (view[pos + 12] | (view[pos + 13] << 8) | ((view[pos + 14] & 0x0f) << 16));
      const height = 1 + (view[pos + 15] | (view[pos + 16] << 8) | ((view[pos + 17] & 0x0f) << 16));
      return { width, height, bitDepthLabel: "24-bit" };
    }

    if (tag === "VP8 " && pos + 14 <= view.length) {
      const width = view[pos + 14] | (view[pos + 15] << 8);
      const height = view[pos + 16] | (view[pos + 17] << 8);
      if (width > 0 && height > 0) {
        return { width, height, bitDepthLabel: "24-bit" };
      }
    }

    if (tag === "VP8L" && pos + 13 <= view.length) {
      const bits = view[pos + 9] | (view[pos + 10] << 8) | (view[pos + 11] << 16) | (view[pos + 12] << 24);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      return { width, height, bitDepthLabel: "32-bit" };
    }

    pos += 8 + chunkSize + (chunkSize % 2);
  }

  return null;
}
