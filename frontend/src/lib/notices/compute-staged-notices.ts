import type { ResourceProfile } from "@/lib/device/resource-profile";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import type { LimitContext } from "@/lib/transmutation/limit-context";
import type { SizeDelta } from "@/lib/format/metrics";
import type { TransmutationOptions } from "@/workers/types";
import { computeEstimateNotices } from "./compute-estimate-notices";
import { computeFidelityNotices } from "./compute-fidelity-notices";
import { computeSvgHonestyNotices } from "./compute-svg-honesty-notices";
import { computeLimitNotices } from "./compute-limit-notices";
import {
  computePerformanceNotices,
  getProfileForTool,
  type PerformanceNoticeContext,
} from "./compute-performance-notices";
import type { ToolNoticeContext } from "./tool-notice-profiles";
import { mergeNotices, type Notice, type NoticePhase } from "./types";
import { computeRecommendationNotices } from "./compute-recommendation-notices";

export type StagedNoticeContext = {
  toolId: string;
  sourceMeta: SourceImageMeta | null;
  options: TransmutationOptions;
  limitContext: LimitContext;
  resourceProfile: ResourceProfile;
  estimateDelta: SizeDelta | null;
  estimatedOutputSize: number | null;
  estimating: boolean;
  estimateElapsedMs: number;
  estimateError: string | null;
  canEstimate: boolean;
  needsInputConsent: boolean;
  canClientResize: boolean;
  dimensionBlocked: boolean;
  noticeContext?: ToolNoticeContext;
  svgMeta?: import("@/lib/svg/svg-wasm-client").SvgMeta | null;
  hasAlpha?: boolean;
  phase?: NoticePhase;
};

export function computeStagedNotices(ctx: StagedNoticeContext): Notice[] {
  const perfCtx: PerformanceNoticeContext = {
    toolId: ctx.toolId,
    sourceMeta: ctx.sourceMeta,
    options: ctx.options,
    zone: ctx.limitContext.zone,
    resourceProfile: ctx.resourceProfile,
    noticeContext: ctx.noticeContext,
  };

  const toolProfile = getProfileForTool(ctx.toolId, ctx.noticeContext);

  const estimateNotices = computeEstimateNotices({
    estimating: ctx.estimating,
    estimateElapsedMs: ctx.estimateElapsedMs,
    estimateError: ctx.canEstimate ? ctx.estimateError : null,
    estimateCost: toolProfile.estimateCost,
  });

  const errorNotice = estimateNotices.find((n) => n.id === "estimate-error");
  const nonErrorEstimate = estimateNotices.filter((n) => n.id !== "estimate-error");

  // Compute recommendations first — they supersede overlapping fidelity notices
  const rawRecommendationNotices = computeRecommendationNotices({
    toolId: ctx.toolId,
    estimateDelta: ctx.estimateDelta,
    options: ctx.options,
    noticeContext: ctx.noticeContext,
    hasAlpha: ctx.hasAlpha,
  });

  // Deduplicate recommendations: when R1 (lossy→lossless) fires, it already
  // explains the size increase and offers an action pill. R5 (compress larger)
  // would repeat the same diagnosis with the same or duplicate action pill.
  // When R3 (JPEG generational) fires, R5's size warning adds noise without
  // new insight — the user already has the more important quality warning.
  const activeRecIds = new Set<string>();
  const recommendationNotices: Notice[] = [];
  for (const rec of rawRecommendationNotices) {
    // R5 is suppressed when R1 or R3 is already active (same symptom: output larger)
    if (rec.id === "rec-compress-larger" && activeRecIds.has("rec-lossy-to-lossless")) continue;
    if (rec.id === "rec-compress-larger" && activeRecIds.has("rec-jpeg-generational")) continue;
    activeRecIds.add(rec.id);
    recommendationNotices.push(rec);
  }

  // Fidelity notices are filtered to avoid redundancy with active recommendations.
  // Recommendation notices always take precedence when both cover the same concern,
  // because recommendations include action pills while fidelity notices are passive.
  const fidelityNotices = computeFidelityNotices({
    toolId: ctx.toolId,
    estimateDelta: ctx.estimateDelta,
    resizePercent: ctx.options.resizePercent,
    resizeFilter: ctx.options.resizeFilter,
    compression: ctx.options.compression,
    quality: ctx.options.quality,
    subsampling: ctx.options.subsampling,
    optimizationLevel: ctx.options.optimizationLevel,
    lossyMode: ctx.options.lossyMode,
    webpSourceFormat: ctx.noticeContext?.webpSourceFormat,
  }).filter((n) => {
    // Suppressed by R1 (lossy→lossless covers the "size increase" explanation)
    if (n.id === "fidelity-webp-lossy-source" && activeRecIds.has("rec-lossy-to-lossless")) return false;
    if (n.id === "fidelity-compress-larger" && activeRecIds.has("rec-lossy-to-lossless")) return false;
    // Suppressed by R3 (JPEG generational covers the quality loss explanation)
    if (n.id === "fidelity-jpeg-generational" && activeRecIds.has("rec-jpeg-generational")) return false;
    if (n.id === "fidelity-compress-larger" && activeRecIds.has("rec-jpeg-generational")) return false;
    // Suppressed by R5 (compress larger covers the "output > input" explanation)
    if (n.id === "fidelity-compress-larger" && activeRecIds.has("rec-compress-larger")) return false;
    // Suppressed by R2 (lossless ceiling covers the "can't compress further" explanation)
    if (n.id === "fidelity-webp-lossless-limit" && activeRecIds.has("rec-lossless-ceiling")) return false;
    return true;
  });

  const allNotices: Notice[] = [
    ...computeLimitNotices({
      limitContext: ctx.limitContext,
      sourceMeta: ctx.sourceMeta,
      estimatedOutputSize: ctx.estimatedOutputSize,
      needsInputConsent: ctx.needsInputConsent,
      canClientResize: ctx.canClientResize,
      dimensionBlocked: ctx.dimensionBlocked,
    }),
    ...fidelityNotices,
    ...recommendationNotices,
    ...computeSvgHonestyNotices({
      toolId: ctx.toolId,
      svgMeta: ctx.svgMeta ?? ctx.noticeContext?.svgMeta,
    }),
    ...computePerformanceNotices(perfCtx),
    ...nonErrorEstimate,
  ];

  if (errorNotice && ctx.estimateError) {
    allNotices.unshift({
      id: "estimate-error",
      severity: "error",
      messageKey: "notices.estimate.errorRaw",
      params: { message: ctx.estimateError },
      priority: errorNotice.priority,
      phase: "staged",
    });
  }

  return mergeNotices(allNotices, { maxVisible: 3, phase: ctx.phase ?? "staged" });
}
