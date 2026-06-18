import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import type { PreparedFileContext } from "@/lib/transmutation/prepare/types";

/** Minimal prepared context for cache-only transmute (metadata already on the row). */
export function minimalBatchPreparedContext(
  sourceMeta: SourceImageMeta | null
): PreparedFileContext {
  return {
    hasAlpha: false,
    alphaAssessment: null,
    gifSession: null,
    avifMeta: null,
    tiffMeta: null,
    icoMeta: null,
    svgMeta: null,
    sourceMeta,
  };
}
