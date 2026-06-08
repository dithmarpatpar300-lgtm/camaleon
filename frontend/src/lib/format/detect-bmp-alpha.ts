/** BMP 32-bit (BGRA) typically carries an alpha channel. */
export function detectBmpAlpha(bytes: ArrayBuffer): boolean {
  const view = new Uint8Array(bytes);
  if (view.length < 30) return false;
  if (view[0] !== 0x42 || view[1] !== 0x4d) return false;
  const bitCount = view[28] | (view[29] << 8);
  return bitCount === 32;
}
