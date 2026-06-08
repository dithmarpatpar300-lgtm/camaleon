import type { GifSessionHandle } from "@/lib/gif/gif-wasm-client";

export type PreparePhaseId =
  | "reading"
  | "engine"
  | "analyze"
  | "finalize"
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
};

export function releasePreparedContext(ctx: PreparedFileContext | null): void {
  ctx?.gifSession?.free();
}
