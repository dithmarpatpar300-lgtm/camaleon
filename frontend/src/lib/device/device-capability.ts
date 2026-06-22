import type { ResourceProfile, ResourceTier } from "./resource-profile";

export type WasmLoadStrategy = "streaming" | "buffered" | "buffered-with-retry";

export type WasmLoadHints = {
  strategy: WasmLoadStrategy;
  retries: number;
};

export type StoragePressure = "critical" | "warning" | "normal";

export type DeviceCapabilityProfile = {
  score: number;
  tier: ResourceTier;
  wasmLoadHints: WasmLoadHints;
  storagePressure: StoragePressure;
  freeStoragePercent: number | null;
};

/** Derive WASM load hints from resource tier. */
export function computeWasmLoadHints(tier: ResourceTier): WasmLoadHints {
  if (tier === "low") return { strategy: "buffered-with-retry", retries: 2 };
  if (tier === "mid") return { strategy: "streaming", retries: 1 };
  return { strategy: "streaming", retries: 0 };
}

/** Classify storage pressure from percentage free (0-100). */
export function computeStoragePressure(freePercent: number | null): StoragePressure {
  if (freePercent === null) return "normal";
  if (freePercent < 5) return "critical";
  if (freePercent < 15) return "warning";
  return "normal";
}

/** Build full capability profile from resource profile + storage estimate. */
export function computeDeviceCapabilityProfile(
  resource: ResourceProfile,
  freeStoragePercent: number | null
): DeviceCapabilityProfile {
  const storagePressure = computeStoragePressure(freeStoragePercent);
  const wasmLoadHints = computeWasmLoadHints(resource.tier);

  return {
    score: resource.score,
    tier: resource.tier,
    wasmLoadHints,
    storagePressure,
    freeStoragePercent,
  };
}

/**
 * Human-readable recommendation label per tier, used in Performance settings.
 * i18n key path: settings.performance.scoreRecommendation[<key>]
 */
export function scoreRecommendationKey(tier: ResourceTier): string {
  if (tier === "low") return "conservative";
  if (tier === "mid") return "balanced";
  return "aggressive";
}
