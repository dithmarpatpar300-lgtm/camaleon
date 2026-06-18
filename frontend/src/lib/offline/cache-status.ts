import { WASM_CRATES, wasmAssetUrls, type WasmCrateName } from "@/lib/wasm/wasm-crates";
import type { TransmutationModule } from "@/workers/types";

export const WASM_CACHE_NAME = "camaleon-wasm-v1";

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

export async function clearOfflineCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
}
