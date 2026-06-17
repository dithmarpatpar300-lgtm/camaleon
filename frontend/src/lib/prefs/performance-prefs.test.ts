import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  applyPerformancePrefs,
  writePerformancePrefs,
  resetPerformancePrefs,
  getEffectivePerformancePrefs,
} from "./performance-prefs";
import { computeResourceProfile, buildResourceProfileForTier } from "@/lib/device/resource-profile";
import { USER_SETTINGS_STORAGE_KEY } from "./user-settings";

const store: Record<string, string> = {};

function mockLocalStorage() {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
  });
}

describe("performance prefs", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    mockLocalStorage();
    localStorage.removeItem(USER_SETTINGS_STORAGE_KEY);
    resetPerformancePrefs();
  });

  it("defaults all modes to auto", () => {
    expect(getEffectivePerformancePrefs()).toEqual({
      tier: "auto",
      resultCache: "auto",
      autoEstimate: "auto",
    });
  });

  it("persists tier override to user settings", () => {
    writePerformancePrefs({ tier: "conservative" });
    const raw = JSON.parse(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)!);
    expect(raw.performance.tier).toBe("conservative");
  });

  it("applies conservative tier override", () => {
    const base = computeResourceProfile(5_000_000, {
      deviceMemory: 8,
      hardwareConcurrency: 8,
    });
    expect(base.tier).toBe("high");

    const profile = applyPerformancePrefs(base, { tier: "conservative" }, 5_000_000);
    expect(profile.tier).toBe("low");
    expect(profile.debounceMs).toBe(800);
    expect(profile.enableResultCache).toBe(false);
  });

  it("forces result cache on", () => {
    const base = buildResourceProfileForTier("low", 1_000_000);
    const profile = applyPerformancePrefs(base, { resultCache: "on" }, 1_000_000);
    expect(profile.enableResultCache).toBe(true);
    expect(profile.cacheMaxEntries).toBe(5);
    expect(profile.cacheMaxOutputBytes).toBe(25_000_000);
  });

  it("forces result cache off on high tier", () => {
    const base = buildResourceProfileForTier("high", 1_000_000);
    const profile = applyPerformancePrefs(base, { resultCache: "off" }, 1_000_000);
    expect(profile.enableResultCache).toBe(false);
    expect(profile.cacheMaxEntries).toBe(0);
  });

  it("forces auto-estimate on with raised byte cap", () => {
    const base = buildResourceProfileForTier("low", 20_000_000);
    expect(base.autoEstimate).toBe(false);

    const profile = applyPerformancePrefs(base, { autoEstimate: "on" }, 20_000_000);
    expect(profile.autoEstimate).toBe(true);
    expect(profile.maxAutoEstimateBytes).toBeGreaterThanOrEqual(40_000_000);
  });

  it("forces auto-estimate off", () => {
    const base = buildResourceProfileForTier("high", 1_000_000);
    const profile = applyPerformancePrefs(base, { autoEstimate: "off" }, 1_000_000);
    expect(profile.autoEstimate).toBe(false);
  });
});
