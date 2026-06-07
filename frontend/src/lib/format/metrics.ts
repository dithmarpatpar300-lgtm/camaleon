import { formatBytes } from "./bytes";

export type SizeDelta = {
  originalSize: number;
  finalSize: number;
  deltaPct: number;
  deltaLabel: string;
  formatted: string;
};

export function computeSizeDelta(originalSize: number, finalSize: number): SizeDelta {
  const deltaPct =
    originalSize > 0
      ? Math.round(((finalSize - originalSize) / originalSize) * 100)
      : 0;
  const sign = deltaPct >= 0 ? "+" : "";
  const deltaLabel = `${sign}${deltaPct}%`;
  return {
    originalSize,
    finalSize,
    deltaPct,
    deltaLabel,
    formatted: `${formatBytes(originalSize)} → ${formatBytes(finalSize)} (${deltaLabel})`,
  };
}
