import type { OperationCost } from "./types";
import type { Notice } from "./types";
import { NOTICE_PRIORITY } from "./types";

export type EstimateNoticeContext = {
  estimating: boolean;
  estimateElapsedMs: number;
  estimateError: string | null;
  estimateCost: OperationCost;
};

const SLOW_ESTIMATE_MS = 3000;

export function computeEstimateNotices(ctx: EstimateNoticeContext): Notice[] {
  const notices: Notice[] = [];

  if (ctx.estimateError) {
    notices.push({
      id: "estimate-error",
      severity: "error",
      messageKey: "__raw__",
      params: { message: ctx.estimateError },
      priority: NOTICE_PRIORITY.error,
      phase: "staged",
    });
  }

  if (!ctx.estimating || ctx.estimateElapsedMs < SLOW_ESTIMATE_MS) {
    return notices;
  }

  const messageKey =
    ctx.estimateCost === "expensive"
      ? "notices.estimate.expensiveSlow"
      : ctx.estimateCost === "moderate"
        ? "notices.estimate.moderateSlow"
        : "notices.estimate.cheapSlow";

  notices.push({
    id: "estimate-slow",
    severity: "status",
    messageKey,
    priority: 65,
    phase: "estimating",
  });

  return notices;
}

export function computeTransmuteDetailKey(costTier: import("./types").CostTier): string | null {
  if (costTier === "L0" || costTier === "L1") return null;
  return costTier === "L3"
    ? "notices.transmute.slowL3"
    : "notices.transmute.slowL2";
}
