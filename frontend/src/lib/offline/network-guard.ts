import { matchAnyCache } from "./cache-match";
import { tryOfflineCacheFallback } from "./offline-cache-fallback";
import { readForceOffline } from "./force-offline";

declare global {
  interface Window {
    __camaleonNativeFetch?: typeof fetch;
    __camaleonFetchGuardActive?: boolean;
    __camaleonConnectivityFetchBridge?: typeof fetch;
  }
}

function getNativeFetch(): typeof fetch {
  if (typeof window === "undefined") {
    return fetch;
  }
  if (!window.__camaleonNativeFetch) {
    window.__camaleonNativeFetch = window.fetch.bind(window);
  }
  return window.__camaleonNativeFetch;
}

function isSameOriginGet(request: Request): boolean {
  if (request.method !== "GET") return false;
  try {
    return new URL(request.url).origin === window.location.origin;
  } catch {
    return false;
  }
}

async function guardedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const request = new Request(input, init);

  if (readForceOffline() && isSameOriginGet(request)) {
    const cached = await matchAnyCache(request);
    if (cached) return cached.clone();

    const fallback = await tryOfflineCacheFallback(request);
    if (fallback) return fallback.clone();

    window.dispatchEvent(new CustomEvent("camaleon:simulated-offline-miss"));
    throw new TypeError("Failed to fetch (simulated offline — not in cache)");
  }

  return getNativeFetch()(input, init);
}

/**
 * Force-offline cache-only patch. Does not infer server status from app fetch failures
 * (RSC/tunnel blips caused false offline — see origin-reachability hysteresis probes).
 */
export function installConnectivityFetchBridge(): () => void {
  if (typeof window === "undefined") return () => undefined;

  // Capture real fetch before patching — probes and passthrough must not recurse through the bridge.
  if (!window.__camaleonNativeFetch) {
    window.__camaleonNativeFetch = window.fetch.bind(window);
  }

  const bridge = guardedFetch.bind(null) as typeof fetch;
  window.__camaleonConnectivityFetchBridge = bridge;
  window.fetch = bridge;
  window.__camaleonFetchGuardActive = false;

  return () => {
    if (window.fetch === bridge) {
      window.fetch = getNativeFetch();
    }
    window.__camaleonConnectivityFetchBridge = undefined;
    window.__camaleonFetchGuardActive = false;
  };
}

export function setNetworkGuardEnabled(_enabled: boolean): void {
  if (typeof window === "undefined") return;
  const bridge = window.__camaleonConnectivityFetchBridge;
  if (bridge) {
    window.fetch = bridge;
    window.__camaleonFetchGuardActive = false;
  }
}

export function isNetworkGuardActive(): boolean {
  return readForceOffline();
}

/** @deprecated Use evaluateOriginReachability from origin-reachability.ts */
export async function probeOriginReachable(_timeoutMs?: number): Promise<boolean> {
  const { evaluateOriginReachability } = await import("./origin-reachability");
  return evaluateOriginReachability();
}

export { buildProbeUrl, isProbeRequest } from "./origin-reachability";
