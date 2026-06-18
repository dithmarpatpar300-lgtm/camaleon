/** Max bytes to scan for JPEG metadata (SOF) before entropy-coded data. */
export const JPEG_METADATA_SCAN_LIMIT = 512 * 1024;

function isJpegSofMarker(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

export function scanJpegDimensions(
  view: Uint8Array
): { width: number; height: number } | null {
  if (view.length < 4 || view[0] !== 0xff || view[1] !== 0xd8) return null;

  let pos = 2;
  const limit = Math.min(view.length, JPEG_METADATA_SCAN_LIMIT);

  while (pos + 4 <= limit) {
    if (view[pos] !== 0xff) return null;
    const marker = view[pos + 1];

    if (marker === 0xd8 || marker === 0x00) {
      pos += 1;
      continue;
    }

    if (marker >= 0xd0 && marker <= 0xd7) {
      pos += 2;
      continue;
    }

    if (marker === 0xd9 || marker === 0xda) break;

    const len = (view[pos + 2] << 8) | view[pos + 3];
    if (len < 2) return null;

    if (isJpegSofMarker(marker)) {
      if (pos + 9 > view.length) return null;
      const height = (view[pos + 5] << 8) | view[pos + 6];
      const width = (view[pos + 7] << 8) | view[pos + 8];
      if (width > 0 && height > 0) return { width, height };
      return null;
    }

    pos += 2 + len;
  }

  return null;
}
