const ELLIPSIS = "…";

/** Split a filename into base name and extension (extension includes the dot). */
export function splitFilename(name: string): { base: string; extension: string } {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0) return { base: name, extension: "" };
  return { base: name.slice(0, lastDot), extension: name.slice(lastDot) };
}

/**
 * Middle-ellipsis truncation that always preserves the file extension.
 *
 * Example (maxLength 28):
 *   "facebook-f-logo-blue-png-1488x1484-11735759336kyqq8b8wjw.webp"
 *   → "facebook-f-logo-b…qq8b8wjw.webp"
 */
export function truncateFilenameMiddle(name: string, maxLength: number): string {
  const minLength = 12;
  const limit = Math.max(minLength, maxLength);

  if (name.length <= limit) return name;

  const { base, extension } = splitFilename(name);
  const budget = limit - extension.length;

  if (budget <= ELLIPSIS.length + 4) {
    return name.slice(0, limit - 1) + ELLIPSIS;
  }

  const innerBudget = budget - ELLIPSIS.length;
  const headLen = Math.max(4, Math.ceil(innerBudget * 0.58));
  const tailLen = Math.max(3, innerBudget - headLen);

  if (base.length <= headLen + tailLen) {
    return base + extension;
  }

  return base.slice(0, headLen) + ELLIPSIS + base.slice(base.length - tailLen) + extension;
}

/** Estimate how many characters fit in a pixel width for a given font. */
export function estimateFilenameCharCapacity(
  widthPx: number,
  font: string,
  measureChar = "0"
): number {
  if (widthPx <= 0) return 32;
  if (typeof document === "undefined") return 32;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return 32;

  ctx.font = font;
  const charWidth = ctx.measureText(measureChar).width || 8;
  return Math.max(12, Math.floor(widthPx / charWidth));
}
