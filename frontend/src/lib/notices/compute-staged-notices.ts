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

  const allNotices: Notice[] = [
    ...computeLimitNotices({
      limitContext: ctx.limitContext,
      sourceMeta: ctx.sourceMeta,
      estimatedOutputSize: ctx.estimatedOutputSize,
      needsInputConsent: ctx.needsInputConsent,
      canClientResize: ctx.canClientResize,
      dimensionBlocked: ctx.dimensionBlocked,
    }),
    ...computeFidelityNotices({
      toolId: ctx.toolId,
      estimateDelta: ctx.estimateDelta,
      resizePercent: ctx.options.resizePercent,
      resizeFilter: ctx.options.resizeFilter,
      compression: ctx.options.compression,
      quality: ctx.options.quality,
    }),
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

  return mergeNotices(allNotices, { maxVisible: 2, phase: ctx.phase ?? "staged" });
}
