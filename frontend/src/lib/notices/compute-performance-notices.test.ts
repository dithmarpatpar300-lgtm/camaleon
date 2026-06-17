import { describe, expect, it } from "vitest";
import { computePerformanceNotices, computeCostTier } from "./compute-performance-notices";
import { mergeNotices } from "./types";
import type { ResourceProfile } from "@/lib/device/resource-profile";

const baseProfile: ResourceProfile = {
  score: 80,
  tier: "high",
  debounceMs: 400,
  autoEstimate: true,
  maxAutoEstimateBytes: 40_000_000,
  enableResultCache: true,
  cacheMaxOutputBytes: 25_000_000,
  cacheMaxEntries: 5,
};

describe("computeCostTier", () => {
  it("returns L0 for cheap tools on small images", () => {
    const tier = computeCostTier({
      toolId: "jpg-to-png",
      sourceMeta: { width: 800, height: 600, bitDepthLabel: "24-bit" },
      options: {},
      zone: "normal",
      resourceProfile: baseProfile,
    });
    expect(tier).toBe("L0");
  });

  it("returns L2 for PNG to AVIF with low speed at 1080p", () => {
    const tier = computeCostTier({
      toolId: "png-to-avif",
      sourceMeta: { width: 1920, height: 1080, bitDepthLabel: "24-bit" },
      options: { speed: 4, quality: 80 },
      zone: "normal",
      resourceProfile: baseProfile,
    });
    expect(tier).toBe("L2");
  });
});

describe("computePerformanceNotices", () => {
  it("emits no notice for L0", () => {
    const notices = computePerformanceNotices({
      toolId: "jpg-to-png",
      sourceMeta: { width: 640, height: 480, bitDepthLabel: "24-bit" },
      options: {},
      zone: "normal",
      resourceProfile: baseProfile,
    });
    expect(notices).toHaveLength(0);
  });

  it("emits slow encode notice for PNG to AVIF speed 4", () => {
    const notices = computePerformanceNotices({
      toolId: "png-to-avif",
      sourceMeta: { width: 1920, height: 1080, bitDepthLabel: "24-bit" },
      options: { speed: 4, quality: 80 },
      zone: "normal",
      resourceProfile: baseProfile,
    });
    expect(notices).toHaveLength(1);
    expect(notices[0]?.messageKey).toBe("notices.performance.L2SlowEncode");
  });
});

describe("mergeNotices", () => {
  it("caps visible notices at two by priority", () => {
    const merged = mergeNotices(
      [
        {
          id: "a",
          severity: "info",
          messageKey: "notices.performance.L1",
          priority: 40,
        },
        {
          id: "b",
          severity: "warn",
          messageKey: "notices.performance.L2",
          priority: 60,
        },
        {
          id: "c",
          severity: "error",
          messageKey: "notices.estimate.errorRaw",
          priority: 100,
        },
      ],
      { maxVisible: 2 }
    );
    expect(merged).toHaveLength(2);
    expect(merged[0]?.id).toBe("c");
    expect(merged[1]?.id).toBe("b");
  });
});
