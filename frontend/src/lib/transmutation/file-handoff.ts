const HANDOFF_TTL_MS = 60_000;

export type FileHandoffPayload = {
  fileName: string;
  bytes: ArrayBuffer;
  lastModified: number;
  /** Original file size from disk (preserved across handoff reconstruction). */
  originalSize: number;
};

type HandoffEntry = {
  payload: FileHandoffPayload;
  expiresAt: number;
};

const store = new Map<string, HandoffEntry>();

/** Survives Strict Mode remount — cleared after successful consume. */
let pendingNavigationHandoffId: string | null = null;

/** Maps reconstructed File objects to their original disk size. */
const originalSizeMap = new WeakMap<File, number>();

export function getOriginalHandoffSize(file: File): number | undefined {
  return originalSizeMap.get(file);
}

function purgeExpired(): void {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt <= now) store.delete(id);
  }
}

export function handoffPayloadToFile(payload: FileHandoffPayload): File {
  const file = new File([payload.bytes], payload.fileName, {
    lastModified: payload.lastModified,
  });
  originalSizeMap.set(file, payload.originalSize);
  return file;
}

/** Read file bytes before navigation so the payload survives route changes. */
export async function stageFileHandoffFromFile(file: File): Promise<string> {
  purgeExpired();
  const bytes = await file.arrayBuffer();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `handoff-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  store.set(id, {
    payload: {
      fileName: file.name,
      bytes,
      lastModified: file.lastModified,
      originalSize: file.size,
    },
    expiresAt: Date.now() + HANDOFF_TTL_MS,
  });
  return id;
}

/** @deprecated Use stageFileHandoffFromFile — kept for tests migrating from File-only staging. */
export function stageFileHandoffPayload(payload: FileHandoffPayload): string {
  purgeExpired();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `handoff-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  store.set(id, { payload, expiresAt: Date.now() + HANDOFF_TTL_MS });
  return id;
}

export function markPendingHandoffNavigation(id: string): void {
  pendingNavigationHandoffId = id;
}

export function peekPendingHandoffNavigation(): string | null {
  return pendingNavigationHandoffId;
}

export function clearPendingHandoffNavigation(): void {
  pendingNavigationHandoffId = null;
}

/** Resolve handoff id from in-flight navigation marker or URL query. */
export function resolveHandoffId(queryId: string | null): string | null {
  return queryId ?? peekPendingHandoffNavigation();
}

/** Consume a staged payload (single use). Returns null if missing or expired. */
export function consumeFileHandoff(id: string): FileHandoffPayload | null {
  purgeExpired();
  const entry = store.get(id);
  if (!entry) return null;
  store.delete(id);
  if (entry.expiresAt <= Date.now()) return null;
  clearPendingHandoffNavigation();
  return entry.payload;
}

/** Test helper — clear all staged handoffs. */
export function clearFileHandoffsForTests(): void {
  store.clear();
  pendingNavigationHandoffId = null;
}

export const FILE_HANDOFF_TTL_MS = HANDOFF_TTL_MS;
