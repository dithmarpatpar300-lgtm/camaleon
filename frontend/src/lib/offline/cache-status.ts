import { WASM_CRATES, wasmAssetUrls, type WasmCrateName } from "@/lib/wasm/wasm-crates";
import { WASM_CACHE_NAME as _WASM_CACHE_NAME } from "@/lib/wasm/wasm-cache-constants";
import type { TransmutationModule } from "@/workers/types";
import { reprecacheAppShell } from "./reprecache-app-shell";

export const WASM_CACHE_NAME = _WASM_CACHE_NAME;

export type ClearOfflineCachesOptions = {
  /** When true and online, repopulate app shell after wipe. Default true. */
  reprecacheShell?: boolean;
};

export type ClearOfflineCachesResult = {
  shellRestored: boolean;
};

export async function isWasmReady(): Promise<boolean> {
  const crates = await listCachedWasmCrates();
  return crates.length === WASM_CRATES.length;
}

export async function isWasmCrateCached(
  crate: TransmutationModule | WasmCrateName
): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const cache = await caches.open(WASM_CACHE_NAME);
    const urls = wasmAssetUrls(crate);
    const matches = await Promise.all(urls.map((url) => cache.match(url)));
    return matches.every(Boolean);
  } catch {
    return false;
  }
}

export async function listCachedWasmCrates(): Promise<WasmCrateName[]> {
  if (typeof caches === "undefined") return [];
  try {
    const cache = await caches.open(WASM_CACHE_NAME);
    const keys = await cache.keys();
    const cachedPaths = new Set(keys.map((req) => new URL(req.url).pathname));
    return WASM_CRATES.filter((crate) =>
      wasmAssetUrls(crate).every((url) => cachedPaths.has(url))
    );
  } catch {
    return [];
  }
}

export async function estimateWasmCacheBytes(): Promise<number | null> {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(WASM_CACHE_NAME);
    const keys = await cache.keys();
    let total = 0;
    for (const req of keys) {
      const res = await cache.match(req);
      if (!res) continue;
      const blob = await res.clone().blob();
      total += blob.size;
    }
    return total;
  } catch {
    return null;
  }
}

export async function clearOfflineCaches(
  options: ClearOfflineCachesOptions = {}
): Promise<ClearOfflineCachesResult> {
  const reprecacheShell = options.reprecacheShell ?? true;

  if (typeof caches === "undefined") {
    return { shellRestored: false };
  }

  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));

  const online =
    typeof navigator !== "undefined" ? navigator.onLine : false;

  if (!reprecacheShell || !online) {
    return { shellRestored: false };
  }

  const result = await reprecacheAppShell();
  return { shellRestored: result.ok };
}
