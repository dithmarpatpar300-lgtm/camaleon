import type { CostTier } from "./types";

export function resolveCacheReadyKey(costTier: CostTier): string {
  return costTier === "L2" || costTier === "L3"
    ? "panel.metrics.cacheReadySlow"
    : "panel.metrics.cacheReady";
}
