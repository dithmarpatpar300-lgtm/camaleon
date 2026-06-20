import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  buildProbeUrl,
  evaluateOriginReachability,
  isProbeRequest,
  resetOriginReachabilityForTests,
  runOriginLivenessProbes,
} from "./origin-reachability";

describe("origin-reachability", () => {
  beforeEach(() => {
    resetOriginReachabilityForTests();
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal("location", { origin: "http://127.0.0.1:8787" });
    vi.stubGlobal("window", {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds probe urls with cache-bust query", () => {
    expect(buildProbeUrl("/api/health")).toMatch(/^\/api\/health\?camaleon-probe=\d+$/);
  });

  it("detects probe requests by query param", () => {
    expect(
      isProbeRequest(new Request("http://127.0.0.1:8787/api/health?camaleon-probe=1"))
    ).toBe(true);
    expect(isProbeRequest(new Request("http://127.0.0.1:8787/api/health"))).toBe(false);
  });

  it("stays optimistic until consecutive probe failures", async () => {
    const mockFetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    vi.stubGlobal("fetch", mockFetch);
    (globalThis as typeof globalThis & { window: { __camaleonNativeFetch?: typeof fetch } }).window.__camaleonNativeFetch =
      mockFetch;

    expect(await evaluateOriginReachability()).toBe(true);
    expect(await evaluateOriginReachability()).toBe(false);
  });

  it("marks reachable when any probe succeeds", async () => {
    const mockFetch = vi.fn(async (url: string) => {
      if (String(url).includes("/api/health")) {
        return new Response(null, { status: 204 });
      }
      throw new TypeError("Failed to fetch");
    });
    vi.stubGlobal("fetch", mockFetch);
    (globalThis as typeof globalThis & { window: { __camaleonNativeFetch?: typeof fetch } }).window.__camaleonNativeFetch =
      mockFetch;

    expect(await runOriginLivenessProbes()).toBe(true);
    expect(await evaluateOriginReachability()).toBe(true);
  });

  it("returns false immediately when navigator is offline", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(await evaluateOriginReachability()).toBe(false);
  });
});
