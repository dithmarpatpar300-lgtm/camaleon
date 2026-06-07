import type { RgbColor } from "@/lib/tools/types";

const KNOWN_COLORS: { label: string; r: number; g: number; b: number }[] = [
  { label: "White", r: 255, g: 255, b: 255 },
  { label: "Black", r: 0, g: 0, b: 0 },
];

export function colorLabel(color: RgbColor): string {
  const match = KNOWN_COLORS.find(
    (c) => c.r === color.r && c.g === color.g && c.b === color.b
  );
  if (match) return match.label;

  const hex = `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
  return hex;
}
