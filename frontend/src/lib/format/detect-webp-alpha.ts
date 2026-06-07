export function detectWebpAlpha(bytes: ArrayBuffer): boolean {
  const view = new Uint8Array(bytes);
  if (view.length < 30) return false;
  if (view[0] !== 0x52 || view[1] !== 0x49 || view[2] !== 0x46 || view[3] !== 0x46) return false;
  if (view[8] !== 0x57 || view[9] !== 0x45 || view[10] !== 0x42 || view[11] !== 0x50) return false;

  let pos = 12;
  const limit = Math.min(view.length, 64 * 1024);
  while (pos + 8 <= limit) {
    const fourCC = String.fromCharCode(view[pos], view[pos + 1], view[pos + 2], view[pos + 3]);
    const chunkSize = view[pos + 4] | (view[pos + 5] << 8) | (view[pos + 6] << 16) | (view[pos + 7] << 24);
    if (fourCC === "VP8X" && pos + 8 + chunkSize <= limit) {
      return (view[pos + 8] & 0x10) !== 0;
    }
    pos += 8 + chunkSize;
    if (chunkSize % 2 !== 0) pos += 1;
  }
  return false;
}
