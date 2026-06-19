import type { LimitBlockReason } from "@/lib/transmutation/limit-context";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import type { PreparedFileContext } from "@/lib/transmutation/prepare/types";
import type { TransmutationOptions } from "@/workers/types";
import { getBatchDefaultSelection } from "@/lib/prefs/batch-universal-prefs";
import { defaultItemOptionsFromPrepared } from "./batch-per-row-options";

export type BatchItemResult = {
  bytes: ArrayBuffer;
  mime: string;
  extension: string;
};

export type BatchItemStatus =
  | "queued"
  | "preparing"
  | "ready"
  | "blocked"
  | "needs_consent"
  | "processing"
  | "done"
  | "error";

export type BatchItem = {
  id: string;
  file: File;
  bytes: ArrayBuffer | null;
  prepared: PreparedFileContext | null;
  /** Denormalized for row UI — survives after prepared is released post-transmute. */
  sourceMeta: SourceImageMeta | null;
  /** Per-row frame/page/entry overrides (GIF/TIFF/ICO batch). */
  itemOptions: TransmutationOptions;
  /** Cached output for ZIP export and re-download. */
  result: BatchItemResult | null;
  selected: boolean;
  status: BatchItemStatus;
  blockReason: LimitBlockReason | null;
  errorMessage: string | null;
};

export type BatchItemPatch = Partial<
  Pick<
    BatchItem,
    | "bytes"
    | "prepared"
    | "sourceMeta"
    | "itemOptions"
    | "result"
    | "selected"
    | "status"
    | "blockReason"
    | "errorMessage"
  >
>;

export type BatchPhase = "loading" | "staged" | "running" | "done";

export function createBatchItemId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function batchItemsFromFiles(files: File[]): BatchItem[] {
  const selected = getBatchDefaultSelection() === "all";
  return files.map((file) => ({
    id: createBatchItemId(),
    file,
    bytes: null,
    prepared: null,
    sourceMeta: null,
    itemOptions: {},
    result: null,
    selected,
    status: "queued" as const,
    blockReason: null,
    errorMessage: null,
  }));
}
