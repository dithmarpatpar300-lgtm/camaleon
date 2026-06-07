import type { TransmutationOptions } from "@/workers/types";

export type CacheEntry = {
  fingerprint: string;
  bytes: ArrayBuffer;
  outputSize: number;
  mime: string;
  extension: string;
  createdAt: number;
};

export function buildFingerprint(
  module: string,
  fileIdentity: string,
  options: TransmutationOptions
): string {
  const payload = {
    module,
    fileIdentity,
    opts: options,
  };
  return JSON.stringify(payload, Object.keys(payload).sort());
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
