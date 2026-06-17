import { formatBytes } from "@/lib/format/bytes";
import { formatHardLimitLabel } from "@/lib/transmutation/limits";
import type { LimitContext } from "@/lib/transmutation/limit-context";
import { isNearPixelLimit, pixelCountFromMeta } from "@/lib/notices/pixel-limit";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import { formatMegapixels } from "@/lib/transmutation/limit-context";
import type { Notice } from "./types";
import { NOTICE_PRIORITY } from "./types";

export type LimitNoticeContext = {
  limitContext: LimitContext;
  sourceMeta: SourceImageMeta | null;
  estimatedOutputSize: number | null;
  needsInputConsent: boolean;
  canClientResize: boolean;
  dimensionBlocked: boolean;
};

export function computeLimitNotices(ctx: LimitNoticeContext): Notice[] {
  const notices: Notice[] = [];
  const { limitContext, sourceMeta, estimatedOutputSize, needsInputConsent, canClientResize, dimensionBlocked } =
    ctx;

  if (
    estimatedOutputSize != null &&
    limitContext.warnings.includes("output_may_exceed_hard_limit")
  ) {
    notices.push({
      id: "limit-output-size",
      severity: "info",
      messageKey: "notices.limit.outputSize",
      params: {
        size: formatBytes(estimatedOutputSize),
        limit: formatHardLimitLabel(limitContext.hardLimitBytes),
      },
      priority: NOTICE_PRIORITY.info,
    });
  }

  const pixelCount = pixelCountFromMeta(sourceMeta);
  if (
    isNearPixelLimit(pixelCount) &&
    !needsInputConsent &&
    limitContext.warnings.includes("near_pixel_limit")
  ) {
    notices.push({
      id: "limit-near-pixels",
      severity: "warn",
      messageKey: "notices.limit.nearPixelLimit",
      params: {
        megapixels: pixelCount != null ? formatMegapixels(pixelCount) : "",
      },
      priority: NOTICE_PRIORITY.warnLimit,
    });
  }

  if (limitContext.warnings.includes("high_ram_peak")) {
    notices.push({
      id: "limit-high-ram",
      severity: "warn",
      messageKey: "notices.limit.highRamPeak",
      priority: NOTICE_PRIORITY.warnLimit,
    });
  }

  if (
    dimensionBlocked &&
    limitContext.isAstronomicalScale &&
    canClientResize &&
    limitContext.warnings.includes("astro_tier_dimensions")
  ) {
    notices.push({
      id: "limit-astro-tier",
      severity: "info",
      messageKey: "notices.limit.astroTier",
      priority: NOTICE_PRIORITY.info,
    });
  }

  return notices;
}
