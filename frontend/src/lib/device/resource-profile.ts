export type ResourceTier = "high" | "mid" | "low";

export type ResourceProfile = {
  score: number;
  tier: ResourceTier;
  debounceMs: number;
  autoEstimate: boolean;
  maxAutoEstimateBytes: number;
  enableResultCache: boolean;
  cacheMaxOutputBytes: number;
  /** Multi-entry result cache slots for quality/compression slider (E1.4). */
  cacheMaxEntries: number;
};

export type ResourceSignals = {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  effectiveType?: string;
  saveData?: boolean;
  visibilityState?: DocumentVisibilityState;
};

/** Tier-derived tuning knobs (shared by auto-detect and manual tier override). */
export function buildResourceProfileForTier(
  tier: ResourceTier,
  fileSize: number,
  score?: number
): ResourceProfile {
  const debounceMs = tier === "high" ? 400 : tier === "mid" ? 600 : 800;
  const maxAutoEstimateBytes =
    tier === "high" ? 40_000_000 : tier === "mid" ? 25_000_000 : 15_000_000;
  const enableResultCache = tier !== "low";
  const cacheMaxOutputBytes = tier === "high" ? 25_000_000 : tier === "mid" ? 15_000_000 : 0;
  const cacheMaxEntries = tier === "high" ? 5 : tier === "mid" ? 3 : 0;
  const autoEstimate = fileSize <= maxAutoEstimateBytes;
  const resolvedScore = score ?? (tier === "high" ? 75 : tier === "mid" ? 50 : 25);

  return {
    score: resolvedScore,
    tier,
    debounceMs,
    autoEstimate,
    maxAutoEstimateBytes,
    enableResultCache,
    cacheMaxOutputBytes,
    cacheMaxEntries,
  };
}

export function computeResourceProfile(
  fileSize: number,
  signals: ResourceSignals
): ResourceProfile {
  let score = 70;

  const mem = signals.deviceMemory;
  if (mem !== undefined && mem <= 2) score -= 25;
  else if (mem !== undefined && mem <= 4) score -= 15;
  else if (mem !== undefined && mem >= 8) score += 10;

  const cpu = signals.hardwareConcurrency;
  if (cpu !== undefined && cpu <= 2) score -= 20;
  else if (cpu !== undefined && cpu <= 4) score -= 10;
  else if (cpu !== undefined && cpu >= 8) score += 10;

  const net = signals.effectiveType;
  if (net === "slow-2g" || net === "2g") score -= 20;
  else if (net === "3g") score -= 10;

  if (signals.saveData) score -= 15;

  score = Math.max(0, Math.min(100, score));

  const tier: ResourceTier = score >= 65 ? "high" : score >= 35 ? "mid" : "low";

  return buildResourceProfileForTier(tier, fileSize, score);
}
