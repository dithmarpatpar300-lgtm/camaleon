import type { PreparedFileContext } from "@/lib/transmutation/prepare/types";
import type { TransmutationOptions } from "@/workers/types";

export type BatchRowPickerKind = "gif-frame" | "tiff-page" | "ico-entry";

export type BatchRowPickerConfig = {
  kind: BatchRowPickerKind;
  maxIndex: number;
  labelKey: string;
};

const PER_ROW_BATCH_SLUGS = new Set([
  "gif-to-png",
  "gif-to-jpg",
  "tiff-to-png",
  "tiff-to-jpg",
  "ico-to-png",
]);

export function isPerRowBatchTool(slug: string): boolean {
  return PER_ROW_BATCH_SLUGS.has(slug);
}

export function defaultItemOptionsFromPrepared(
  prepared: PreparedFileContext | null
): TransmutationOptions {
  return {
    frameIndex: 0,
    pageIndex: 0,
    entryIndex: prepared?.icoMeta?.defaultEntryIndex ?? 0,
  };
}

export function mergeBatchItemOptions(
  global: TransmutationOptions,
  item?: TransmutationOptions
): TransmutationOptions {
  if (!item) return { ...global };
  return { ...global, ...item };
}

export function resolveBatchRowPicker(
  toolSlug: string,
  prepared: PreparedFileContext | null,
  sourceMeta: { frameCount?: number } | null
): BatchRowPickerConfig | null {
  if (!isPerRowBatchTool(toolSlug)) return null;

  if (toolSlug === "gif-to-png" || toolSlug === "gif-to-jpg") {
    const frameCount =
      prepared?.gifSession?.frame_count ??
      (sourceMeta?.frameCount && sourceMeta.frameCount > 1 ? sourceMeta.frameCount : 1);
    if (frameCount <= 1) return null;
    return {
      kind: "gif-frame",
      maxIndex: frameCount - 1,
      labelKey: "panel.batch.rowFrame",
    };
  }

  if (toolSlug === "tiff-to-png" || toolSlug === "tiff-to-jpg") {
    const pageCount = prepared?.tiffMeta?.pageCount ?? 1;
    if (pageCount <= 1) return null;
    return {
      kind: "tiff-page",
      maxIndex: pageCount - 1,
      labelKey: "panel.batch.rowPage",
    };
  }

  if (toolSlug === "ico-to-png") {
    const entryCount = prepared?.icoMeta?.entryCount ?? 1;
    if (entryCount <= 1) return null;
    return {
      kind: "ico-entry",
      maxIndex: entryCount - 1,
      labelKey: "panel.batch.rowEntry",
    };
  }

  return null;
}
