import { WASM_CRATES, wasmAssetUrls } from "@/lib/wasm/wasm-crates";
import { WASM_CACHE_NAME } from "@/lib/offline/cache-status";

export type PrecacheProgress = { done: number; total: number };

export async function precacheFullToolkit(
  onProgress?: (progress: PrecacheProgress) => void
): Promise<void> {
  if (typeof caches === "undefined") {
    throw new Error("Cache Storage unavailable");
  }

  const urls = WASM_CRATES.flatMap((crate) => wasmAssetUrls(crate));
  const cache = await caches.open(WASM_CACHE_NAME);
  let done = 0;

  for (const url of urls) {
    const existing = await cache.match(url);
    if (!existing) {
      const response = await fetch(url, { cache: "reload" });
      if (!response.ok) {
        throw new Error(`Failed to cache ${url}: ${response.status}`);
      }
      await cache.put(url, response);
    }
    done += 1;
    onProgress?.({ done, total: urls.length });
  }
}
