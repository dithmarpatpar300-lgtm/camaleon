import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { reprecacheAppShell } from "./reprecache-app-shell";
import { getShellCacheStatus } from "./shell-cache-status";
import { requestShellReprecacheViaSw } from "./sw-sync-shell";

vi.mock("./sw-sync-shell", () => ({
  requestShellReprecacheViaSw: vi.fn(),
}));

vi.mock("./shell-cache-status", () => ({
  getShellCacheStatus: vi.fn(),
}));

describe("reprecacheAppShell", () => {
  beforeEach(() => {
    vi.mocked(requestShellReprecacheViaSw).mockReset();
    vi.mocked(getShellCacheStatus).mockReset();
    vi.stubGlobal("location", { origin: "http://127.0.0.1:8787" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns success when service worker acks and shell is ready", async () => {
    vi.mocked(requestShellReprecacheViaSw).mockResolvedValue(true);
    vi.mocked(getShellCacheStatus).mockResolvedValue({
      shellReady: true,
      staticChunkCount: 3,
      toolRoutesCached: 25,
      toolRoutesTotal: 25,
      hasHome: true,
      hasOfflineFallback: true,
      precacheBucketPresent: true,
      shellBucketPresent: true,
    });

    const progress: { done: number; total: number }[] = [];
    const result = await reprecacheAppShell((p) => progress.push(p));

    expect(result.ok).toBe(true);
    expect(result.viaServiceWorker).toBe(true);
    expect(result.staticAssets).toBe(3);
    expect(progress.at(-1)?.done).toBe(progress.at(-1)?.total);
  });

  it("falls back to main-thread fetch loop when SW does not ack", async () => {
    vi.mocked(requestShellReprecacheViaSw).mockResolvedValue(false);

    const stored = new Map<string, Response>();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response('<script src="/_next/static/chunks/main.js"></script>', { status: 200 })
      )
    );
    vi.stubGlobal("caches", {
      open: async () => ({
        put: async (key: Request, res: Response) => {
          stored.set(key.url, res);
        },
      }),
    } as CacheStorage);

    const result = await reprecacheAppShell();

    expect(result.viaServiceWorker).toBe(false);
    expect(result.fetched).toBeGreaterThan(0);
    expect(result.ok).toBe(true);
    expect(stored.size).toBeGreaterThan(0);
  });
});
