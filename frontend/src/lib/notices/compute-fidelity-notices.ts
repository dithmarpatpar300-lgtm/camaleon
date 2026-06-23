import type { SizeDelta } from "@/lib/format/metrics";
import type { Notice } from "./types";
import { NOTICE_PRIORITY } from "./types";

export type FidelityNoticeContext = {
  toolId: string;
  estimateDelta: SizeDelta | null;
  resizePercent?: number;
  resizeFilter?: number;
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

  if (ctx.toolId === "jpg-resize") {
    notices.push({
      id: "fidelity-jpeg-resize-generational",
      severity: "warn",
      messageKey: "notices.fidelity.jpegResizeGenerational",
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

  return notices;
}
