import type { TransmutationOptions } from "@/workers/types";

function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const record = value as Record<string, unknown>;
  return Object.keys(record)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortKeysDeep(record[key]);
      return acc;
    }, {});
}

export function batchOptionsEqual(
  a: TransmutationOptions,
  b: TransmutationOptions
): boolean {
  return JSON.stringify(sortKeysDeep(a)) === JSON.stringify(sortKeysDeep(b));
}

export type BatchLastRunSnapshot = {
  options: TransmutationOptions;
  /** File identities successfully transmuted in the last run. */
  fileIdentities: string[];
};

export function canBatchCacheRedownload(
  snapshot: BatchLastRunSnapshot | null,
  options: TransmutationOptions,
  selectedIdentities: string[]
): boolean {
  if (!snapshot || selectedIdentities.length === 0) return false;
  if (!batchOptionsEqual(snapshot.options, options)) return false;
  const cached = new Set(snapshot.fileIdentities);
  return selectedIdentities.every((id) => cached.has(id));
}
