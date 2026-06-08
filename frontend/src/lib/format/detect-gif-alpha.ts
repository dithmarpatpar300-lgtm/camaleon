/** Heuristic: GIF Graphic Control Extension with transparent color index. */
export function detectGifAlpha(bytes: ArrayBuffer): boolean {
  const view = new Uint8Array(bytes);
  if (view.length < 13) return false;
  if (view[0] !== 0x47 || view[1] !== 0x49 || view[2] !== 0x46) return false;

  for (let i = 0; i < view.length - 7; i++) {
    if (view[i] === 0x21 && view[i + 1] === 0xf9 && (view[i + 3] & 0x01) !== 0) {
      return true;
    }
  }
  return false;
}
