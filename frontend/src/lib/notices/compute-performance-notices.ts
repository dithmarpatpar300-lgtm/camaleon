import type { LimitZone } from "@/lib/transmutation/limits";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import type { ResourceProfile } from "@/lib/device/resource-profile";
import type { TransmutationOptions } from "@/workers/types";
import {
  getToolNoticeProfile,
  hasExtremeCostFactors,
  megapixelsFromMeta,
  resolveCostTier,
  type ToolNoticeContext,
} from "./tool-notice-profiles";
import type { CostTier, Notice, ToolNoticeProfile } from "./types";
import { NOTICE_PRIORITY } from "./types";

export type PerformanceNoticeContext = {
  toolId: string;
  sourceMeta: SourceImageMeta | null;
  options: TransmutationOptions;
  zone: LimitZone;
  resourceProfile: ResourceProfile;
  noticeContext?: ToolNoticeContext;
};

export function computeCostTier(ctx: PerformanceNoticeContext): CostTier {
  const profile = getToolNoticeProfile(ctx.toolId, ctx.noticeContext ?? { sourceMeta: ctx.sourceMeta });
  return resolveCostTier({
    profile,
    megapixels: megapixelsFromMeta(ctx.sourceMeta),
    zone: ctx.zone,
    resourceTier: ctx.resourceProfile.tier,
    extremeOptions: hasExtremeCostFactors(profile.costFactors, ctx.options),
  });
}

export function computePerformanceNotices(ctx: PerformanceNoticeContext): Notice[] {
  const tier = computeCostTier(ctx);
  if (tier === "L0") return [];

  const profile = getToolNoticeProfile(ctx.toolId, ctx.noticeContext ?? { sourceMeta: ctx.sourceMeta });
  const mp = megapixelsFromMeta(ctx.sourceMeta);
  const slowSpeed =
    profile.costFactors?.includes("speed") &&
    ctx.options.speed != null &&
    ctx.options.speed <= 5;

  const messageKey =
    tier === "L1"
      ? "notices.performance.L1"
      : tier === "L2"
        ? slowSpeed
          ? "notices.performance.L2SlowEncode"
          : "notices.performance.L2"
        : slowSpeed
          ? "notices.performance.L3SlowEncode"
          : "notices.performance.L3";

  return [
    {
      id: "performance-latency",
      severity: "warn",
      messageKey,
      params: mp != null ? { megapixels: mp.toFixed(1) } : undefined,
      priority: NOTICE_PRIORITY.warnPerf,
    },
  ];
}

export function getProfileForTool(
  toolId: string,
  noticeContext?: ToolNoticeContext
): ToolNoticeProfile {
  return getToolNoticeProfile(toolId, noticeContext ?? { sourceMeta: null });
}
