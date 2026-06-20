import { describe, expect, it, vi, afterEach } from "vitest";
import { installConnectivityFetchBridge } from "./network-guard";

describe("installConnectivityFetchBridge", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("captures native fetch before installing the bridge", () => {
    const nativeFetch = vi.fn(async () => new Response("ok"));
    const w = {
      fetch: nativeFetch,
      __camaleonNativeFetch: undefined as typeof fetch | undefined,
      __camaleonConnectivityFetchBridge: undefined as typeof fetch | undefined,
      __camaleonFetchGuardActive: false,
    };
    vi.stubGlobal("window", w);

    const uninstall = installConnectivityFetchBridge();
    expect(w.__camaleonNativeFetch).toBeDefined();
    expect(w.fetch).not.toBe(w.__camaleonNativeFetch);
    uninstall();
  });
});
