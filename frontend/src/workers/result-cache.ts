import type { TransmutationOptions } from "@/workers/types";

export type CacheEntry = {
  fingerprint: string;
  bytes: ArrayBuffer;
  outputSize: number;
  mime: string;
  extension: string;
  createdAt: number;
};

const DEFAULT_TTL_MS = 60_000;

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
  outputExtension?: string,
  encodeSource?: string
): string {
  return JSON.stringify(
    sortKeysDeep({ module, fileIdentity, outputExtension, encodeSource, opts: options })
  );
}

/** LRU-ish multi-entry cache for estimate→transmute fast path (E1.4). */
export class ResultCache {
  /** Insertion order — oldest key first for eviction. */
  private entries = new Map<string, CacheEntry>();
  private maxEntries = 1;
  private ttlMs = DEFAULT_TTL_MS;

  configure(options?: { maxEntries?: number; ttlMs?: number }): void {
    if (options?.maxEntries != null && options.maxEntries > 0) {
      this.maxEntries = options.maxEntries;
    }
    if (options?.ttlMs != null && options.ttlMs > 0) {
      this.ttlMs = options.ttlMs;
    }
    this.evictExpired();
    this.evictOverflow();
  }

  get(fingerprint: string): CacheEntry | null {
    this.evictExpired();
    const entry = this.entries.get(fingerprint);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.entries.delete(fingerprint);
      return null;
    }
    // Touch for LRU: move to newest slot.
    this.entries.delete(fingerprint);
    this.entries.set(fingerprint, entry);
    return entry;
  }

  set(entry: CacheEntry, maxBytes: number): boolean {
    if (entry.outputSize > maxBytes) return false;
    this.evictExpired();
    if (this.entries.has(entry.fingerprint)) {
      this.entries.delete(entry.fingerprint);
    }
    this.entries.set(entry.fingerprint, entry);
    this.evictOverflow();
    return true;
  }

  clear(): void {
    this.entries.clear();
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (now - entry.createdAt > this.ttlMs) {
        this.entries.delete(key);
      }
    }
  }

  private evictOverflow(): void {
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }
}
