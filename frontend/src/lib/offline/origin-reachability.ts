import { SERVER_PROBE_QUERY } from "./constants";

/** Optimistic until repeated probe failures (avoids false offline on flaky RSC/tunnel). */
const FAILURES_BEFORE_DOWN = 2;
const SUCCESSES_BEFORE_UP = 1;
const PROBE_TIMEOUT_MS = 8_000;

let consecutiveFailures = 0;
let consecutiveSuccesses = 0;
let reachable = true;

function getNativeFetch(): typeof fetch {
  if (typeof window === "undefined") return fetch;
  const w = window as Window & { __camaleonNativeFetch?: typeof fetch };
  if (w.__camaleonNativeFetch) return w.__camaleonNativeFetch;
  w.__camaleonNativeFetch = window.fetch.bind(window);
  return w.__camaleonNativeFetch;
}

export function buildProbeUrl(pathname: string): string {
  return `${pathname}?${SERVER_PROBE_QUERY}=${Date.now()}`;
}

export function isProbeRequest(request: Request): boolean {
  try {
    const url = new URL(request.url);
    return url.searchParams.has(SERVER_PROBE_QUERY);
  } catch {
    return false;
  }
}

async function probeOnce(url: string, method: "GET" | "HEAD" = "GET"): Promise<boolean> {
  const nativeFetch = getNativeFetch();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await nativeFetch(url, {
      method,
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    return response.ok || response.status === 204;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Try dedicated health route first, then version/manifest fallbacks.
 * At least one must succeed for the origin to count as live.
 */
export async function runOriginLivenessProbes(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return false;
  }

  const candidates: Array<{ url: string; method?: "GET" | "HEAD" }> = [
    { url: buildProbeUrl("/api/health"), method: "HEAD" },
    { url: buildProbeUrl("/api/health"), method: "GET" },
    { url: buildProbeUrl("/version.json"), method: "GET" },
    { url: buildProbeUrl("/manifest.webmanifest"), method: "GET" },
  ];

  for (const { url, method } of candidates) {
    if (await probeOnce(url, method ?? "GET")) return true;
  }

  return false;
}

/** Apply hysteresis so a single failed RSC/tunnel blip does not flip UI offline. */
export async function evaluateOriginReachability(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    consecutiveFailures = FAILURES_BEFORE_DOWN;
    consecutiveSuccesses = 0;
    reachable = false;
    return false;
  }

  const live = await runOriginLivenessProbes();

  if (live) {
    consecutiveSuccesses += 1;
    consecutiveFailures = 0;
    if (!reachable && consecutiveSuccesses >= SUCCESSES_BEFORE_UP) {
      reachable = true;
    } else if (reachable) {
      consecutiveSuccesses = SUCCESSES_BEFORE_UP;
    } else if (consecutiveSuccesses >= SUCCESSES_BEFORE_UP) {
      reachable = true;
    }
  } else {
    consecutiveFailures += 1;
    consecutiveSuccesses = 0;
    if (reachable && consecutiveFailures >= FAILURES_BEFORE_DOWN) {
      reachable = false;
    }
  }

  return reachable;
}

export function resetOriginReachabilityForTests(): void {
  consecutiveFailures = 0;
  consecutiveSuccesses = 0;
  reachable = true;
}
