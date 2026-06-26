import type { Notice, NoticeAction } from "./types";
import { NOTICE_PRIORITY } from "./types";
import type { SizeDelta } from "@/lib/format/metrics";
import type { TransmutationOptions } from "@/workers/types";
import type { ToolNoticeContext } from "./tool-notice-profiles";

export type RecommendationContext = {
  toolId: string;
  estimateDelta: SizeDelta | null;
  options: TransmutationOptions;
  noticeContext?: ToolNoticeContext;
  hasAlpha?: boolean;
};

function alphaPreserveSlug(toolId: string): string | null {
  const map: Record<string, string> = {
    "png-to-jpg": "png-compress",
    "webp-to-jpg": "png-to-webp",
    "bmp-to-jpg": "bmp-to-png",
    "gif-to-jpg": "gif-to-png",
    "tiff-to-jpg": "tiff-to-png",
  };
  return map[toolId] ?? null;
}

/**
 * Computes actionable recommendation notices that suggest alternative tools
 * when the current transmutation is suboptimal.
 *
 * Each notice may carry inline action pills rendered at {action:0}, {action:1}
 * positions in the i18n message text. See NoticePanel for the parsing logic.
 */
export function computeRecommendationNotices(ctx: RecommendationContext): Notice[] {
  const notices: Notice[] = [];
  const { toolId, estimateDelta, noticeContext } = ctx;

  // Only emit recommendations when an estimate is available
  if (!estimateDelta) return notices;

  // ------------------------------------------------------------------
  // R1 — Lossy-to-lossless inflation
  // When the user converts a lossy source to a lossless target, output
  // inflates. Recommend the best lossy alternative for size reduction.
  // ------------------------------------------------------------------
  if (
    (toolId === "jpg-to-webp" || toolId === "webp-compress") &&
    (noticeContext?.webpSourceFormat === "lossy" || noticeContext?.webpSourceFormat === "extended") &&
    estimateDelta.deltaPct >= 0
  ) {
    const actions: NoticeAction[] = [];
    if (toolId === "webp-compress") {
      actions.push({ labelKey: "noticeActions.tryWebpToJpg", toolSlug: "webp-to-jpg" });
    }
    if (toolId === "jpg-to-webp") {
      actions.push({ labelKey: "noticeActions.tryJpgCompress", toolSlug: "jpg-compress" });
    }
    notices.push({
      id: "rec-lossy-to-lossless",
      severity: "warn",
      messageKey: "notices.recommendations.lossyToLossless",
      priority: NOTICE_PRIORITY.warnFidelity,
      actions,
    });
  }

  // ------------------------------------------------------------------
  // R2 — Lossless already optimal
  // Only fires for genuinely lossless sources (PNG is always lossless;
  // WebP must be explicitly detected as lossless VP8L, not lossy VP8).
  // When delta is within ±2%, VP8L/DEFLATE can't improve further.
  // ------------------------------------------------------------------
  if (
    (toolId === "png-compress" ||
      (toolId === "webp-compress" && noticeContext?.webpSourceFormat === "lossless")) &&
    Math.abs(estimateDelta.deltaPct) <= 2
  ) {
    notices.push({
      id: "rec-lossless-ceiling",
      severity: "info",
      messageKey: "notices.recommendations.losslessCeiling",
      priority: NOTICE_PRIORITY.info,
    });
  }

  // ------------------------------------------------------------------
  // R3 — JPEG generational loss
  // Each re-encode of a JPEG accumulates artifacts. If the user is
  // editing or intends to re-encode multiple times, use PNG as master.
  // ------------------------------------------------------------------
  if (toolId === "jpg-compress" || toolId === "jpg-resize") {
    notices.push({
      id: "rec-jpeg-generational",
      severity: "warn",
      messageKey: "notices.recommendations.jpegGenerational",
      priority: NOTICE_PRIORITY.warnFidelity,
      actions: [{ labelKey: "noticeActions.tryPngAsMaster", toolSlug: "jpg-to-png" }],
    });
  }

  // ------------------------------------------------------------------
  // R4 — Alpha flatten
  // When converting an image with transparency to JPEG (no alpha),
  // suggest a lossless preserve tool that keeps the alpha channel.
  // ------------------------------------------------------------------
  if (ctx.hasAlpha) {
    const preserveSlug = alphaPreserveSlug(toolId);
    if (preserveSlug) {
      notices.push({
        id: "rec-alpha-flatten",
        severity: "warn",
        messageKey: "notices.recommendations.alphaFlatten",
        priority: NOTICE_PRIORITY.warnFidelity,
        actions: [
          { labelKey: "noticeActions.tryPngCompress", toolSlug: preserveSlug },
        ],
      });
    }
  }

  // ------------------------------------------------------------------
  // R5 — Size increase on compress
  // When the estimated output is larger than the input on a compress
  // tool, suggest adjusting options or trying an alternative.
  // ------------------------------------------------------------------
  if (
    (toolId === "png-compress" || toolId === "jpg-compress" || toolId === "webp-compress") &&
    estimateDelta.deltaPct > 5
  ) {
    const actions: NoticeAction[] = [];
    if (toolId === "png-compress") {
      actions.push({ labelKey: "noticeActions.tryHigherCompression", toolSlug: "png-compress" });
    }
    if (toolId === "jpg-compress") {
      actions.push({ labelKey: "noticeActions.tryLowerQuality", toolSlug: "jpg-compress" });
    }
    if (toolId === "webp-compress") {
      actions.push({ labelKey: "noticeActions.tryWebpToJpg", toolSlug: "webp-to-jpg" });
    }
    notices.push({
      id: "rec-compress-larger",
      severity: "warn",
      messageKey: "notices.recommendations.compressLarger",
      priority: NOTICE_PRIORITY.warnFidelity,
      actions: actions.length > 0 ? actions : undefined,
    });
  }

  return notices;
}
