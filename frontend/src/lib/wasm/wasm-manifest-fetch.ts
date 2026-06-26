import type { WasmManifest } from "./wasm-manifest-types";

const MANIFEST_URL = "/wasm/wasm-manifest.json";

/**
 * Fetch the Wasm build manifest with `no-store` to always get the latest
 * deployed version. Returns `null` on network error, non-200, or parse failure.
 *
 * Only call when online — the manifest is never cached by the SW (it lives
 * under `/wasm/` which is `CacheFirst`, but the `no-store` fetch option
 * bypasses both the browser HTTP cache and the SW cache for this request).
 */
export async function fetchWasmManifest(): Promise<WasmManifest | null> {
  if (typeof fetch === "undefined") return null;
  try {
    const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as WasmManifest;
    if (
      typeof data?.buildId === "string" &&
      typeof data?.version === "string" &&
      typeof data?.crates === "object" &&
      data.crates !== null
    ) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
