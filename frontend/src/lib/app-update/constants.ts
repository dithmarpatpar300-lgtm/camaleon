/** How often to poll for SW updates and the live version beacon. */
export const UPDATE_POLL_INTERVAL_MS = 2 * 60 * 1000;

/** Max wait for a waiting service worker to take control after skipWaiting. */
export const SW_CONTROL_TIMEOUT_MS = 10_000;

export const VERSION_BEACON_PATH = "/version.json";

/** Serwist wasm runtime cache — preserved during shell purge. */
import { WASM_CACHE_NAME as _WASM_CACHE_NAME } from "@/lib/wasm/wasm-cache-constants";
export const WASM_CACHE_NAME = _WASM_CACHE_NAME;

export const HARD_RELOAD_QUERY_PARAM = "_camaleon_update";
