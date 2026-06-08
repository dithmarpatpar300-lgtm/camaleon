import type { GifSessionHandle } from "@/lib/gif/gif-wasm-client";
import type { TiffMeta } from "@/lib/tiff/tiff-wasm-client";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";

export type PreparePhaseId =
  | "reading"
  | "engine"
  | "analyze"
  | "finalize"
  | "resizing"
  | "transmuting";

export type PrepareProgress = {
  progress: number;
  phase: PreparePhaseId;
  /** When true, the UI shows a spinning indeterminate indicator instead of a fixed arc. */
  indeterminate?: boolean;
  /** Optional i18n key override for the phase label (e.g. GIF frame decode). */
  phaseLabelKey?: string;
  /** Optional i18n key for a secondary line (e.g. frame counter). */
  detailLabelKey?: string;
  detailParams?: Record<string, string | number>;
};

export type PreparedFileContext = {
  hasAlpha: boolean;
  gifSession: GifSessionHandle | null;
  tiffMeta: TiffMeta | null;
  /** Effective dimensions after optional client resize. */
  sourceMeta: SourceImageMeta | null;
  /** Original header meta before downscale (science imagery path). */
  originalSourceMeta?: SourceImageMeta | null;
  resizeMaxEdge?: number;
};

export function releasePreparedContext(ctx: PreparedFileContext | null): void {
  ctx?.gifSession?.free();
}

export type PrepareOptions = {
  /** Raised Wasm session limit for elevated-zone prepare probes. */
  sessionInputLimitBytes?: number;
};
