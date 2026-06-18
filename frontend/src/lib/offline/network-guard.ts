import { matchAnyCache } from "./cache-match";
import { readForceOffline } from "./force-offline";

declare global {
  interface Window {
    __camaleonNativeFetch?: typeof fetch;
    __camaleonFetchGuardActive?: boolean;
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
  const nativeFetch = getNativeFetch();

  if (readForceOffline() && isSameOriginGet(request)) {
    const cached = await matchAnyCache(request);
    if (cached) return cached.clone();
    window.dispatchEvent(new CustomEvent("camaleon:simulated-offline-miss"));
    throw new TypeError("Failed to fetch (simulated offline — not in cache)");
  }

  try {
    return await nativeFetch(input, init);
  } catch (error) {
    if (readForceOffline()) throw error;
    window.dispatchEvent(
      new CustomEvent("camaleon:server-unreachable", { detail: { url: request.url } })
    );
    throw error;
  }
}

/** Patch window.fetch to serve cache-only for same-origin GET when force offline is on. */
export function setNetworkGuardEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;

  const nativeFetch = getNativeFetch();

  if (enabled) {
    if (!window.__camaleonFetchGuardActive) {
      window.fetch = guardedFetch;
      window.__camaleonFetchGuardActive = true;
    }
    return;
  }

  if (window.__camaleonFetchGuardActive) {
    window.fetch = nativeFetch;
    window.__camaleonFetchGuardActive = false;
  }
}

export function isNetworkGuardActive(): boolean {
  return Boolean(window.__camaleonFetchGuardActive);
}

/** Probe origin without simulation guard (uses native fetch). */
export async function probeOriginReachable(): Promise<boolean> {
  if (typeof window === "undefined") return true;
  if (!navigator.onLine) return false;

  const nativeFetch = getNativeFetch();
  try {
    const response = await nativeFetch("/manifest.webmanifest", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });
    return response.ok;
  } catch {
    return false;
  }
}
