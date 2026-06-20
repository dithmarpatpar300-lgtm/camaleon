import { capBatchFiles, maxFilesPerBatch, sumFileBytes } from "@/lib/batch/batch-limits";
import type { FileHandoffPayload } from "@/lib/transmutation/file-handoff";
import { handoffPayloadToFile } from "@/lib/transmutation/file-handoff";

export type BatchHandoffItem = FileHandoffPayload;

export type BatchHandoffPayload = {
  toolSlug: string;
  items: BatchHandoffItem[];
};

type BatchHandoffEntry = {
  payload: BatchHandoffPayload;
  expiresAt: number;
};

export const BATCH_HANDOFF_TTL_MS = 60_000;
const MOBILE_RAM_GB = 4;
const MAX_BATCH_HANDOFF_BYTES_DESKTOP = 500 * 1024 * 1024;
const MAX_BATCH_HANDOFF_BYTES_MOBILE = 200 * 1024 * 1024;

const store = new Map<string, BatchHandoffEntry>();

let pendingNavigationBatchHandoffId: string | null = null;

/** Maps reconstructed File objects to their original disk size (handoff path). */
const originalSizeMap = new WeakMap<File, number>();

export function getOriginalSizeForFile(file: File): number | undefined {
  return originalSizeMap.get(file);
}

export class BatchHandoffError extends Error {
  constructor(
    message: string,
    readonly code: "empty" | "too_large" | "too_many"
  ) {
    super(message);
    this.name = "BatchHandoffError";
  }
}

function purgeExpired(): void {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt <= now) store.delete(id);
  }
}

function createHandoffId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function maxBatchHandoffBytes(deviceMemoryGb?: number): number {
  if (deviceMemoryGb != null && deviceMemoryGb <= MOBILE_RAM_GB) {
    return MAX_BATCH_HANDOFF_BYTES_MOBILE;
  }
  return MAX_BATCH_HANDOFF_BYTES_DESKTOP;
}

/** Read all file bytes before navigation so the payload survives route changes. */
export async function stageBatchHandoffFromFiles(
  files: File[],
  toolSlug: string,
  deviceMemoryGb?: number
): Promise<string> {
  purgeExpired();

  if (files.length === 0) {
    throw new BatchHandoffError("Batch handoff requires at least one file", "empty");
  }

  const maxCount = maxFilesPerBatch(deviceMemoryGb);
  if (files.length > maxCount) {
    throw new BatchHandoffError(`Batch handoff exceeds file cap (${maxCount})`, "too_many");
  }

  const capped = capBatchFiles(files, deviceMemoryGb);
  const maxBytes = maxBatchHandoffBytes(deviceMemoryGb);
  const declaredSize = sumFileBytes(capped);
  if (declaredSize > maxBytes) {
    throw new BatchHandoffError("Batch handoff total size exceeds limit", "too_large");
  }

  const items: BatchHandoffItem[] = [];
  let stagedBytes = 0;

  for (const file of capped) {
    const bytes = await file.arrayBuffer();
    stagedBytes += bytes.byteLength;
    if (stagedBytes > maxBytes) {
      throw new BatchHandoffError("Batch handoff total size exceeds limit", "too_large");
    }
    items.push({
      fileName: file.name,
      bytes,
      lastModified: file.lastModified,
      originalSize: file.size,
    });
  }

  const id = createHandoffId();
  store.set(id, {
    payload: { toolSlug, items },
    expiresAt: Date.now() + BATCH_HANDOFF_TTL_MS,
  });
  return id;
}

export function stageBatchHandoffPayload(payload: BatchHandoffPayload): string {
  purgeExpired();
  const id = createHandoffId();
  store.set(id, {
    payload,
    expiresAt: Date.now() + BATCH_HANDOFF_TTL_MS,
  });
  return id;
}

export function markPendingBatchHandoffNavigation(id: string): void {
  pendingNavigationBatchHandoffId = id;
}

export function peekPendingBatchHandoffNavigation(): string | null {
  return pendingNavigationBatchHandoffId;
}

export function clearPendingBatchHandoffNavigation(): void {
  pendingNavigationBatchHandoffId = null;
}

export function resolveBatchHandoffId(queryId: string | null): string | null {
  return queryId ?? peekPendingBatchHandoffNavigation();
}

export function consumeBatchHandoff(id: string): BatchHandoffPayload | null {
  purgeExpired();
  const entry = store.get(id);
  if (!entry) return null;
  store.delete(id);
  if (entry.expiresAt <= Date.now()) return null;
  clearPendingBatchHandoffNavigation();
  return entry.payload;
}

export function batchHandoffPayloadToFiles(payload: BatchHandoffPayload): File[] {
  return payload.items.map((item) => {
    const file = handoffPayloadToFile(item);
    originalSizeMap.set(file, item.originalSize);
    return file;
  });
}

export function clearBatchHandoffsForTests(): void {
  store.clear();
  pendingNavigationBatchHandoffId = null;
}
