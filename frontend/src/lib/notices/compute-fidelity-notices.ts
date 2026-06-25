import type { SizeDelta } from "@/lib/format/metrics";
import type { Notice } from "./types";
import { NOTICE_PRIORITY } from "./types";

export type FidelityNoticeContext = {
  toolId: string;
  estimateDelta: SizeDelta | null;
  resizePercent?: number;
  resizeFilter?: number;
  compression?: number;
  quality?: number;
  subsampling?: number;
  optimizationLevel?: number;
  lossyMode?: number;
  webpSourceFormat?: "lossy" | "lossless" | "extended";
};

export function computeFidelityNotices(ctx: FidelityNoticeContext): Notice[] {
  const notices: Notice[] = [];

  if (ctx.toolId === "bmp-to-png" && ctx.estimateDelta != null && ctx.estimateDelta.deltaPct > 0) {
    notices.push({
      id: "fidelity-bmp-growth",
      severity: "warn",
      messageKey: "notices.fidelity.bmpPngGrowth",
      priority: NOTICE_PRIORITY.warnFidelity,
    });
  }

  if (ctx.toolId === "jpg-resize" || ctx.toolId === "jpg-compress") {
    notices.push({
      id: "fidelity-jpeg-generational",
      severity: "warn",
      messageKey: "notices.fidelity.jpegGenerational",
      priority: NOTICE_PRIORITY.warnFidelity,
    });
  }

  if (
    ctx.toolId === "png-compress" &&
    ctx.compression != null &&
    ctx.compression <= 3
  ) {
    notices.push({
      id: "fidelity-png-compress-fast",
      severity: "info",
      messageKey: "notices.fidelity.pngCompressFast",
      priority: NOTICE_PRIORITY.info,
    });
  }

  if (
    ctx.toolId === "png-compress" &&
    ctx.compression != null &&
    ctx.compression >= 8
  ) {
    notices.push({
      id: "fidelity-png-compress-slow",
      severity: "info",
      messageKey: "notices.fidelity.pngCompressSlow",
      priority: NOTICE_PRIORITY.info,
    });
  }

  if (
    (ctx.toolId === "png-compress" || ctx.toolId === "jpg-compress" || ctx.toolId === "webp-compress") &&
    ctx.estimateDelta != null &&
    ctx.estimateDelta.deltaPct >= 0
  ) {
    notices.push({
      id: "fidelity-compress-larger",
      severity: "warn",
      messageKey: "notices.fidelity.compressLarger",
      priority: NOTICE_PRIORITY.warnFidelity,
    });
  }

  if (
    ctx.toolId === "png-compress" &&
    ctx.optimizationLevel != null &&
    ctx.optimizationLevel >= 2
  ) {
    notices.push({
      id: "fidelity-png-zopfli",
      severity: "info",
      messageKey: "notices.fidelity.pngZopfli",
      priority: NOTICE_PRIORITY.info,
    });
  }

  if (
    ctx.toolId === "jpg-compress" &&
    ctx.subsampling != null &&
    ctx.subsampling === 1
  ) {
    notices.push({
      id: "fidelity-jpeg-subsampling-444",
      severity: "info",
      messageKey: "notices.fidelity.jpegSubsampling444",
      priority: NOTICE_PRIORITY.info,
    });
  }

  if (
    ctx.toolId === "png-compress" &&
    ctx.optimizationLevel != null &&
    ctx.optimizationLevel >= 1
  ) {
    notices.push({
      id: "fidelity-png-optimized",
      severity: "info",
      messageKey: "notices.fidelity.pngOptimized",
      priority: NOTICE_PRIORITY.info,
    });
  }

  if (
    ctx.toolId === "png-compress" &&
    ctx.lossyMode != null &&
    ctx.lossyMode >= 1
  ) {
    notices.push({
      id: "fidelity-png-lossy",
      severity: "warn",
      messageKey: "notices.fidelity.pngLossy",
      priority: NOTICE_PRIORITY.warnFidelity,
    });
  }

  if (
    ctx.resizePercent != null &&
    ctx.resizePercent < 25 &&
    (ctx.toolId === "png-resize" || ctx.toolId === "jpg-resize")
  ) {
    notices.push({
      id: "fidelity-resize-extreme-downscale",
      severity: "info",
      messageKey: "notices.fidelity.resizeExtremeDownscale",
      priority: NOTICE_PRIORITY.info,
    });
  }

  if (
    ctx.resizePercent != null &&
    ctx.resizePercent > 100 &&
    (ctx.toolId === "png-resize" || ctx.toolId === "jpg-resize")
  ) {
    notices.push({
      id: "fidelity-resize-upscale",
      severity: "warn",
      messageKey: "notices.fidelity.resizeUpscale",
      priority: NOTICE_PRIORITY.warnFidelity,
    });
  }

  if (
    ctx.resizePercent != null &&
    ctx.resizePercent > 200 &&
    ctx.resizeFilter != null &&
    (ctx.toolId === "png-resize" || ctx.toolId === "jpg-resize")
  ) {
    const filterKey =
      ctx.resizeFilter === 4 ? "lanczos" :
      ctx.resizeFilter === 2 || ctx.resizeFilter === 3 ? "blur" :
      "general";
    notices.push({
      id: "fidelity-resize-advanced-scale",
      severity: "warn",
      messageKey: `notices.fidelity.resizeAdvancedScale.${filterKey}`,
      priority: NOTICE_PRIORITY.warnFidelity,
    });
  }

  if (ctx.toolId === "webp-compress" && (ctx.webpSourceFormat === "lossy" || ctx.webpSourceFormat === "extended")) {
    notices.push({
      id: "fidelity-webp-lossy-source",
      severity: "warn",
      messageKey: "notices.fidelity.webpLossySource",
      priority: NOTICE_PRIORITY.warnFidelity,
    });
  }

  if (ctx.toolId === "webp-compress" && ctx.webpSourceFormat === "lossless") {
    notices.push({
      id: "fidelity-webp-lossless-source",
      severity: "info",
      messageKey: "notices.fidelity.webpLosslessSource",
      priority: NOTICE_PRIORITY.info,
    });
    // If the estimate shows no significant change (+-2%), explain the VP8L ceiling
    if (ctx.estimateDelta != null && Math.abs(ctx.estimateDelta.deltaPct) <= 2) {
      notices.push({
        id: "fidelity-webp-lossless-limit",
        severity: "info",
        messageKey: "notices.fidelity.webpCompressLosslessLimit",
        priority: NOTICE_PRIORITY.info,
      });
    }
  }

  if (ctx.toolId === "webp-compress") {
    notices.push({
      id: "fidelity-webp-metadata-stripped",
      severity: "info",
      messageKey: "notices.fidelity.webpMetadataStripped",
      priority: NOTICE_PRIORITY.info,
    });
  }

  return notices;
}
