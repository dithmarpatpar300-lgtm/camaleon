import type { TranslateFn } from "@/lib/i18n/types";
import type { RgbColor } from "@/lib/tools/types";

type KnownColor = { key: string; r: number; g: number; b: number };

const KNOWN_COLORS: KnownColor[] = [
  { key: "white", r: 255, g: 255, b: 255 },
  { key: "black", r: 0, g: 0, b: 0 },
  { key: "gray", r: 128, g: 128, b: 128 },
];

function toHex(color: RgbColor): string {
  return `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
}

export function colorLabel(color: RgbColor, t?: TranslateFn): string {
  const match = KNOWN_COLORS.find(
    (c) => c.r === color.r && c.g === color.g && c.b === color.b
  );
  if (match) {
    if (t) {
      const key = `colors.${match.key}`;
      const resolved = t(key);
      return resolved !== key ? resolved : match.key;
    }
    return match.key;
  }
  return toHex(color);
}

export function isKnownColor(color: RgbColor): boolean {
  return KNOWN_COLORS.some(
    (c) => c.r === color.r && c.g === color.g && c.b === color.b
  );
}
