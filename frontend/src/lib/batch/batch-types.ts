import type { LimitBlockReason } from "@/lib/transmutation/limit-context";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import type { PreparedFileContext } from "@/lib/transmutation/prepare/types";
import { getBatchDefaultSelection } from "@/lib/prefs/batch-universal-prefs";

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
    selected,
    status: "queued" as const,
    blockReason: null,
    errorMessage: null,
  }));
}
