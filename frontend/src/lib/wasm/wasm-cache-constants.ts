/**
 * Single source of truth for the Wasm runtime cache name.
 *
 * Used by:
 * - `lib/offline/cache-status.ts` (DOM side — cache inspection, purge)
 * - `lib/app-update/constants.ts` (DOM side — shell purge preserves this)
 * - `app/sw.ts` (SW side — inlined as a string literal, see comment there)
 *
 * Bump this string ONLY when the cache schema changes in a way that requires
 * a full purge of all cached Wasm entries (e.g. URL path structure change).
 * The Wasm Sync Engine handles content-level staleness independently.
 */
export const WASM_CACHE_NAME = "camaleon-wasm-v1";
