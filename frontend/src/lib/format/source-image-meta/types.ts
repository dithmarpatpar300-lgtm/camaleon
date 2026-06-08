/** Lightweight source image metadata (header probe — no full decode). */
export type SourceImageMeta = {
  width: number;
  height: number;
  /** Display label, e.g. "24-bit", "32-bit", "8-bit indexed" */
  bitDepthLabel: string;
  /** Present for animated GIF sources. */
  frameCount?: number;
  /** Present for multi-page TIFF sources. */
  pageCount?: number;
  /** Present for multi-size ICO/CUR sources. */
  entryCount?: number;
  /** BMP semantic alpha — set when probed via Wasm. */
  hasMeaningfulAlpha?: boolean;
};
