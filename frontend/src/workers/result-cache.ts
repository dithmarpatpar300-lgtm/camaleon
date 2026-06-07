import type { TransmutationOptions } from "@/workers/types";

export type CacheEntry = {
  fingerprint: string;
  bytes: ArrayBuffer;
  outputSize: number;
  mime: string;
  extension: string;
  createdAt: number;
};

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

export function buildFingerprint(
  module: string,
  fileIdentity: string,
  options: TransmutationOptions,
  outputExtension?: string
): string {
  return JSON.stringify(
    sortKeysDeep({ module, fileIdentity, outputExtension, opts: options })
  );
}

export class ResultCache {
  private entry: CacheEntry | null = null;

  get(fingerprint: string): CacheEntry | null {
    if (!this.entry || this.entry.fingerprint !== fingerprint) return null;
    if (Date.now() - this.entry.createdAt > 60_000) {
      this.entry = null;
      return null;
    }
    return this.entry;
  }

  set(entry: CacheEntry, maxBytes: number): boolean {
    if (entry.outputSize > maxBytes) return false;
    this.entry = entry;
    return true;
  }

  clear(): void {
    this.entry = null;
  }
}
