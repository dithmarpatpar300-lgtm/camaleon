import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import {
  SOFT_LIMIT_BYTES,
  type LimitZone,
  effectiveSessionInputLimit,
  getHardLimitBytes,
  getLimitZone,
  needsOversizeConsent,
} from "@/lib/transmutation/limits";

/** Must stay aligned with `core_utils::MAX_PIXELS`. */
export const MAX_PIXELS = 40_000_000;

/** Above this pixel count we show astronomy / science-imagery guidance (e.g. Hubble/JWST mosaics). */
export const ASTRONOMICAL_PIXEL_THRESHOLD = 80_000_000;

/** Warn when within 90% of the pixel ceiling. */
const NEAR_PIXEL_RATIO = 0.9;

export type LimitWarning =
  | "output_may_exceed_hard_limit"
  | "high_ram_peak"
  | "near_pixel_limit"
  | "astro_tier_dimensions"
  | "risk_mode_active";

export type LimitBlockReason = "hard_file" | "pixels" | "consent" | null;

export type LimitContext = {
  zone: LimitZone;
  hardLimitBytes: number;
  sessionInputLimitBytes: number;
  pixelCount: number | null;
  megapixels: number | null;
  exceedsPixelLimit: boolean;
  isAstronomicalScale: boolean;
  needsInputConsent: boolean;
  canEstimate: boolean;
  canTransmute: boolean;
  blockReason: LimitBlockReason;
  warnings: LimitWarning[];
};

export function pixelCountFromMeta(meta: SourceImageMeta | null): number | null {
  if (!meta?.width || !meta?.height) return null;
  return meta.width * meta.height;
}

export function formatMegapixels(pixelCount: number): string {
  const mp = pixelCount / 1_000_000;
  return mp >= 10 ? mp.toFixed(0) : mp.toFixed(1);
}

type ComputeLimitContextArgs = {
  fileSize: number;
  sourceMeta: SourceImageMeta | null;
  deviceMemoryGb?: number;
  oversizeConsented: boolean;
  estimatedOutputSize?: number | null;
  workerReady?: boolean;
  riskModeEnabled?: boolean;
};

export function computeLimitContext({
  fileSize,
  sourceMeta,
  deviceMemoryGb,
  oversizeConsented,
  estimatedOutputSize = null,
  workerReady = true,
  riskModeEnabled = false,
}: ComputeLimitContextArgs): LimitContext {
  const hardLimitBytes = getHardLimitBytes(deviceMemoryGb, riskModeEnabled);
  const zone = getLimitZone(fileSize, hardLimitBytes);
  const sessionInputLimitBytes = effectiveSessionInputLimit(
    zone,
    hardLimitBytes,
    riskModeEnabled
  );
  const pixelCount = pixelCountFromMeta(sourceMeta);
  const megapixels = pixelCount != null ? pixelCount / 1_000_000 : null;
  const exceedsPixelLimit =
    pixelCount != null && pixelCount > MAX_PIXELS;
  const isAstronomicalScale =
    pixelCount != null && pixelCount >= ASTRONOMICAL_PIXEL_THRESHOLD;
  const needsInputConsent = riskModeEnabled
    ? false
    : needsOversizeConsent(zone, oversizeConsented);

  const warnings: LimitWarning[] = [];

  if (riskModeEnabled) {
    warnings.push("risk_mode_active");
  }

  if (
    !riskModeEnabled &&
    pixelCount != null &&
    pixelCount <= MAX_PIXELS &&
    pixelCount >= MAX_PIXELS * NEAR_PIXEL_RATIO
  ) {
    warnings.push("near_pixel_limit");
  }
  if (riskModeEnabled && exceedsPixelLimit) {
    warnings.push("astro_tier_dimensions");
  } else if (isAstronomicalScale && exceedsPixelLimit) {
    warnings.push("astro_tier_dimensions");
  }
  if (
    estimatedOutputSize != null &&
    estimatedOutputSize > hardLimitBytes
  ) {
    warnings.push("output_may_exceed_hard_limit");
  }
  if (zone === "elevated" && (oversizeConsented || riskModeEnabled)) {
    warnings.push("high_ram_peak");
  }

  let blockReason: LimitBlockReason = null;
  if (zone === "hard") blockReason = "hard_file";
  else if (!riskModeEnabled && exceedsPixelLimit) blockReason = "pixels";
  else if (!riskModeEnabled && needsInputConsent) blockReason = "consent";

  const canTransmute =
    workerReady &&
    blockReason !== "hard_file" &&
    blockReason !== "pixels" &&
    blockReason !== "consent";

  const canEstimate = canTransmute;

  return {
    zone,
    hardLimitBytes,
    sessionInputLimitBytes,
    pixelCount,
    megapixels,
    exceedsPixelLimit,
    isAstronomicalScale,
    needsInputConsent,
    canEstimate,
    canTransmute,
    blockReason,
    warnings,
  };
}
