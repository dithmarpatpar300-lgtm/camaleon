const HANDOFF_TTL_MS = 60_000;

type HandoffEntry = {
  file: File;
  expiresAt: number;
};

const store = new Map<string, HandoffEntry>();

function purgeExpired(): void {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt <= now) store.delete(id);
  }
}

/** Stage a file for same-tab navigation to a transmutator route. */
export function stageFileHandoff(file: File): string {
  purgeExpired();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `handoff-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  store.set(id, { file, expiresAt: Date.now() + HANDOFF_TTL_MS });
  return id;
}

/** Consume a staged file (single use). Returns null if missing or expired. */
export function consumeFileHandoff(id: string): File | null {
  purgeExpired();
  const entry = store.get(id);
  if (!entry) return null;
  store.delete(id);
  if (entry.expiresAt <= Date.now()) return null;
  return entry.file;
}

/** Test helper — clear all staged handoffs. */
export function clearFileHandoffsForTests(): void {
  store.clear();
}

export const FILE_HANDOFF_TTL_MS = HANDOFF_TTL_MS;
