import { describe, expect, it, vi, afterEach } from "vitest";
import { tryOfflineCacheFallback } from "./offline-cache-fallback";
import { OFFLINE_FALLBACK_PATH } from "./constants";

function mockCachesWithPaths(paths: string[]) {
  const bucket = new Map(paths.map((p) => [`https://camaleon.test${p}`, new Response("cached")]));

  return {
    keys: async () => ["camaleon-shell-v1"],
    open: async () => ({
      keys: async () => [...bucket.keys()].map((url) => ({ url } as Request)),
      match: async (req: Request | string) => {
        const url = typeof req === "string" ? req : req.url;
        return bucket.get(url);
      },
    }),
    match: async () => undefined,
  } as CacheStorage;
}

describe("tryOfflineCacheFallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serves offline fallback page for document navigation miss", async () => {
    vi.stubGlobal("caches", mockCachesWithPaths([OFFLINE_FALLBACK_PATH]));

    const request = new Request("https://camaleon.test/transmute/png-to-jpg", {
      method: "GET",
    });
    Object.defineProperty(request, "destination", { value: "document" });

    const response = await tryOfflineCacheFallback(request);
    expect(response).toBeDefined();
  });

  it("matches static assets by pathname", async () => {
    const chunkPath = "/_next/static/chunks/page-abc.js";
    vi.stubGlobal("caches", mockCachesWithPaths([chunkPath]));

    const request = new Request(`https://camaleon.test${chunkPath}`, { method: "GET" });
    const response = await tryOfflineCacheFallback(request);
    expect(response).toBeDefined();
  });

  it("falls back to brand asset when Next image optimizer misses", async () => {
    vi.stubGlobal("caches", mockCachesWithPaths(["/brand/camaleon-mark.png"]));

    const request = new Request(
      "https://camaleon.test/_next/image?url=%2Fbrand%2Fcamaleon-mark.png&w=128&q=75",
      { method: "GET" }
    );
    const response = await tryOfflineCacheFallback(request);
    expect(response).toBeDefined();
  });
});
