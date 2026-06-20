import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { clearOfflineCaches, isWasmReady } from "./cache-status";
import { reprecacheAppShell } from "./reprecache-app-shell";

vi.mock("./reprecache-app-shell", () => ({
  reprecacheAppShell: vi.fn(async () => ({
    ok: true,
    viaServiceWorker: false,
    fetched: 10,
    failed: 0,
  })),
}));

describe("clearOfflineCaches", () => {
  beforeEach(() => {
    vi.mocked(reprecacheAppShell).mockClear();
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reprecaches shell when online by default", async () => {
    const deleted: string[] = [];
    vi.stubGlobal("caches", {
      keys: async () => ["camaleon-wasm-v1", "serwist-precache-v2"],
      delete: async (name: string) => {
        deleted.push(name);
        return true;
      },
    } as CacheStorage);

    const result = await clearOfflineCaches();

    expect(deleted).toHaveLength(2);
    expect(reprecacheAppShell).toHaveBeenCalledOnce();
    expect(result.shellRestored).toBe(true);
  });

  it("skips reprecache when offline", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    vi.stubGlobal("caches", {
      keys: async () => ["serwist-precache-v2"],
      delete: async () => true,
    } as CacheStorage);

    const result = await clearOfflineCaches();

    expect(reprecacheAppShell).not.toHaveBeenCalled();
    expect(result.shellRestored).toBe(false);
  });

  it("skips reprecache when reprecacheShell is false", async () => {
    vi.stubGlobal("caches", {
      keys: async () => ["serwist-precache-v2"],
      delete: async () => true,
    } as CacheStorage);

    const result = await clearOfflineCaches({ reprecacheShell: false });

    expect(reprecacheAppShell).not.toHaveBeenCalled();
    expect(result.shellRestored).toBe(false);
  });
});

describe("isWasmReady", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when caches API unavailable", async () => {
    vi.stubGlobal("caches", undefined);
    expect(await isWasmReady()).toBe(false);
  });
});
