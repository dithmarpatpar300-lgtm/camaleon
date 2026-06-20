import {
  buildResourceProfileForTier,
  type ResourceProfile,
  type ResourceTier,
} from "@/lib/device/resource-profile";
import type { PerformancePrefs } from "./user-settings";
import { readUserSettings, writeUserSettings } from "./user-settings";
import { buildFactoryUserSettings } from "@/lib/storage/factory-defaults";

export type PerformanceTierMode = NonNullable<PerformancePrefs["tier"]>;
export type PerformanceToggleMode = NonNullable<PerformancePrefs["resultCache"]>;

const TIER_OVERRIDE: Record<Exclude<PerformanceTierMode, "auto">, ResourceTier> = {
  conservative: "low",
  balanced: "mid",
  aggressive: "high",
};

const AGGRESSIVE_CACHE = {
  enableResultCache: true,
  cacheMaxOutputBytes: 25_000_000,
  cacheMaxEntries: 5,
} as const;

const listeners = new Set<() => void>();

export function subscribePerformancePrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyPerformancePrefsListeners(): void {
  listeners.forEach((listener) => listener());
}

export function readPerformancePrefs(): PerformancePrefs {
  return readUserSettings().performance ?? {};
}

export function getEffectivePerformancePrefs(): Required<PerformancePrefs> {
  const stored = readPerformancePrefs();
  return {
    tier: stored.tier ?? "auto",
    resultCache: stored.resultCache ?? "auto",
    autoEstimate: stored.autoEstimate ?? "auto",
  };
}

export function writePerformancePrefs(partial: Partial<PerformancePrefs>): PerformancePrefs {
  const next = { ...readPerformancePrefs(), ...partial };
  writeUserSettings({ performance: next });
  notifyPerformancePrefsListeners();
  return next;
}

export function resetPerformancePrefs(): void {
  writeUserSettings({ performance: buildFactoryUserSettings().performance });
  notifyPerformancePrefsListeners();
}

export function applyPerformancePrefs(
  base: ResourceProfile,
  prefs: PerformancePrefs,
  fileSize: number
): ResourceProfile {
  let profile = base;

  const tierMode = prefs.tier ?? "auto";
  if (tierMode !== "auto") {
    profile = buildResourceProfileForTier(TIER_OVERRIDE[tierMode], fileSize, base.score);
  }

  const cacheMode = prefs.resultCache ?? "auto";
  if (cacheMode === "on") {
    profile = { ...profile, ...AGGRESSIVE_CACHE };
  } else if (cacheMode === "off") {
    profile = {
      ...profile,
      enableResultCache: false,
      cacheMaxOutputBytes: 0,
      cacheMaxEntries: 0,
    };
  }

  const estimateMode = prefs.autoEstimate ?? "auto";
  if (estimateMode === "on") {
    profile = {
      ...profile,
      autoEstimate: true,
      maxAutoEstimateBytes: Math.max(profile.maxAutoEstimateBytes, 40_000_000),
    };
  } else if (estimateMode === "off") {
    profile = { ...profile, autoEstimate: false };
  }

  return profile;
}
