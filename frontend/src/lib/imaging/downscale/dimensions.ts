import { MAX_PIXELS } from "@/lib/transmutation/limit-context";

/** Default longest-edge cap for science imagery downscale. */
export const DEFAULT_MAX_EDGE = 8192;

/** Optional desktop extended cap (requires extra consent). */
export const EXTENDED_MAX_EDGE = 12288;

export type TargetDimensions = {
  width: number;
  height: number;
  pixelCount: number;
  scale: number;
};

/** Compute target size preserving aspect ratio; longest edge ≤ maxEdge. */
export function computeTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  maxEdge: number
): TargetDimensions {
  if (srcWidth <= 0 || srcHeight <= 0) {
    throw new Error("Invalid source dimensions");
  }
  const longest = Math.max(srcWidth, srcHeight);
  const scale = longest <= maxEdge ? 1 : maxEdge / longest;
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));
  return {
    width,
    height,
    pixelCount: width * height,
    scale,
  };
}

export function isWithinPixelLimit(width: number, height: number): boolean {
  return width * height <= MAX_PIXELS;
}

export function presetExceedsPixelLimit(
  srcWidth: number,
  srcHeight: number,
  maxEdge: number,
  riskModeEnabled = false
): boolean {
  if (riskModeEnabled) return false;
  const { pixelCount } = computeTargetDimensions(srcWidth, srcHeight, maxEdge);
  return pixelCount > MAX_PIXELS;
}

/** Largest preset edge (from list) that stays within MAX_PIXELS, or the smallest preset. */
export function pickLargestValidPresetEdge(
  srcWidth: number,
  srcHeight: number,
  presetEdges: number[]
): number {
  const sorted = [...presetEdges].sort((a, b) => a - b);
  let best = sorted[0];
  for (const edge of sorted) {
    if (!presetExceedsPixelLimit(srcWidth, srcHeight, edge)) {
      best = edge;
    }
  }
  return best;
}

export function assertWithinPixelLimit(width: number, height: number): void {
  const pc = width * height;
  if (pc > MAX_PIXELS) {
    throw new Error(
      `Target dimensions ${width}×${height} (${pc} px) exceed the ${MAX_PIXELS} pixel limit`
    );
  }
}

export function getMaxEdgeForDevice(deviceMemoryGb?: number): number {
  if (deviceMemoryGb !== undefined && deviceMemoryGb <= 4) {
    return DEFAULT_MAX_EDGE;
  }
  return DEFAULT_MAX_EDGE;
}

export function allowsExtendedMaxEdge(
  deviceMemoryGb?: number,
  riskModeEnabled = false
): boolean {
  if (riskModeEnabled) return true;
  return deviceMemoryGb === undefined || deviceMemoryGb > 4;
}
