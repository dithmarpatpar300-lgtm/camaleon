import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import type { SvgMeta } from "@/lib/svg/svg-wasm-client";
import { pixelCountFromMeta } from "@/lib/transmutation/limit-context";
import type { CostFactorKey, OperationCost, ToolNoticeProfile } from "./types";

export type ToolNoticeContext = {
  sourceMeta: SourceImageMeta | null;
  animatedFrameCount?: number;
  tiffPageCount?: number;
  icoEntryCount?: number;
  svgMeta?: SvgMeta | null;
};

const DEFAULT_PROFILE: ToolNoticeProfile = {
  estimateCost: "moderate",
  transmuteCost: "moderate",
};

const TOOL_PROFILES: Record<string, ToolNoticeProfile> = {
  "jpg-to-png": { estimateCost: "cheap", transmuteCost: "cheap", costFactors: ["compression"] },
  "png-to-jpg": { estimateCost: "cheap", transmuteCost: "cheap", costFactors: ["quality"] },
  "webp-to-png": { estimateCost: "moderate", transmuteCost: "moderate", costFactors: ["compression"] },
  "webp-to-jpg": { estimateCost: "moderate", transmuteCost: "moderate", costFactors: ["quality"] },
  "png-to-webp": { estimateCost: "moderate", transmuteCost: "moderate" },
  "jpg-to-webp": { estimateCost: "moderate", transmuteCost: "moderate" },
  "gif-to-png": {
    estimateCost: "moderate",
    transmuteCost: "moderate",
    costFactors: ["compression", "frameIndex"],
  },
  "gif-to-jpg": {
    estimateCost: "moderate",
    transmuteCost: "moderate",
    costFactors: ["quality", "frameIndex"],
  },
  "bmp-to-png": { estimateCost: "moderate", transmuteCost: "moderate", costFactors: ["compression"] },
  "bmp-to-jpg": { estimateCost: "moderate", transmuteCost: "moderate", costFactors: ["quality"] },
  "tiff-to-png": {
    estimateCost: "moderate",
    transmuteCost: "moderate",
    costFactors: ["compression", "pageIndex"],
  },
  "tiff-to-jpg": {
    estimateCost: "moderate",
    transmuteCost: "moderate",
    costFactors: ["quality", "pageIndex"],
  },
  "ico-to-png": { estimateCost: "cheap", transmuteCost: "cheap", costFactors: ["entryIndex"] },
  "png-to-ico": { estimateCost: "cheap", transmuteCost: "cheap" },
  "tga-to-png": { estimateCost: "cheap", transmuteCost: "cheap", costFactors: ["compression"] },
  "avif-to-png": {
    estimateCost: "expensive",
    transmuteCost: "expensive",
    costFactors: ["compression", "frameIndex"],
  },
  "avif-to-jpg": {
    estimateCost: "expensive",
    transmuteCost: "expensive",
    costFactors: ["quality", "frameIndex"],
  },
  "png-to-avif": {
    estimateCost: "expensive",
    transmuteCost: "expensive",
    costFactors: ["speed", "quality"],
  },
  "jpg-to-avif": {
    estimateCost: "expensive",
    transmuteCost: "expensive",
    costFactors: ["speed", "quality"],
  },
  "svg-to-png": {
    estimateCost: "expensive",
    transmuteCost: "expensive",
    costFactors: ["compression", "outputScale"],
  },
};

function withAnimatedGifOverride(
  profile: ToolNoticeProfile,
  context: ToolNoticeContext
): ToolNoticeProfile {
  if (context.animatedFrameCount != null && context.animatedFrameCount > 1) {
    return {
      ...profile,
      estimateCost: "expensive" as OperationCost,
    };
  }
  return profile;
}

export function getToolNoticeProfile(
  toolId: string,
  context: ToolNoticeContext = { sourceMeta: null }
): ToolNoticeProfile {
  const base = TOOL_PROFILES[toolId] ?? DEFAULT_PROFILE;
  if (toolId.startsWith("gif-to-")) {
    return withAnimatedGifOverride(base, context);
  }
  return base;
}

export function megapixelsFromMeta(sourceMeta: SourceImageMeta | null): number | null {
  const pixels = pixelCountFromMeta(sourceMeta);
  if (pixels == null) return null;
  return pixels / 1_000_000;
}

export function hasExtremeCostFactors(
  costFactors: CostFactorKey[] | undefined,
  options: {
    speed?: number;
    compression?: number;
    quality?: number;
    frameIndex?: number;
    pageIndex?: number;
    entryIndex?: number;
    outputScale?: number;
  }
): boolean {
  if (!costFactors?.length) return false;

  for (const factor of costFactors) {
    if (factor === "speed" && options.speed != null && options.speed <= 5) return true;
    if (factor === "compression" && options.compression != null && options.compression >= 8) {
      return true;
    }
    if (factor === "quality" && options.quality != null && options.quality >= 90) return true;
    if (factor === "frameIndex" && (options.frameIndex ?? 0) > 0) return true;
    if (factor === "pageIndex" && (options.pageIndex ?? 0) > 0) return true;
    if (factor === "entryIndex" && (options.entryIndex ?? 0) > 0) return true;
    if (factor === "outputScale" && options.outputScale != null && options.outputScale >= 1024) {
      return true;
    }
  }
  return false;
}

export function resolveCostTier(args: {
  profile: ToolNoticeProfile;
  megapixels: number | null;
  zone: "normal" | "elevated" | "hard";
  resourceTier: "high" | "mid" | "low";
  extremeOptions: boolean;
}): import("./types").CostTier {
  const { profile, megapixels, zone, resourceTier, extremeOptions } = args;
  const mp = megapixels ?? 0;
  const maxCost = maxOperationCost(profile.estimateCost, profile.transmuteCost);

  if (maxCost === "cheap" && mp < 2 && !extremeOptions) {
    return "L0";
  }

  const expensive = maxCost === "expensive";
  const l3Signals =
    expensive && (mp > 20 || zone === "elevated" || resourceTier === "low");
  if (l3Signals) return "L3";

  if (expensive || extremeOptions || mp > 8) return "L2";
  if (maxCost === "moderate" || mp >= 2) return "L1";
  return "L0";
}

function maxOperationCost(a: OperationCost, b: OperationCost): OperationCost {
  const rank: Record<OperationCost, number> = { cheap: 0, moderate: 1, expensive: 2 };
  return rank[a] >= rank[b] ? a : b;
}
