import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getShellCacheStatus, isShellReady } from "./shell-cache-status";
import { getToolPrecacheUrls } from "./precache-routes";

function buildMockCaches(paths: string[], bucketNames: string[] = ["camaleon-shell-v1"]) {
  const store = new Map<string, Map<string, Response>>();

  for (const name of bucketNames) {
    store.set(name, new Map());
  }

  for (const path of paths) {
    const bucket = store.get(bucketNames[0])!;
    bucket.set(`https://camaleon.test${path}`, new Response("ok"));
  }

  const matchByPathname = (pathname: string) => {
    for (const bucket of store.values()) {
      for (const [url, res] of bucket) {
        if (new URL(url).pathname === pathname) return res;
      }
    }
    return undefined;
  };

  return {
    keys: async () => [...store.keys()],
    open: async (name: string) => {
      if (!store.has(name)) store.set(name, new Map());
      const bucket = store.get(name)!;
      return {
        keys: async () =>
          [...bucket.keys()].map((url) => ({ url } as Request)),
        match: async (req: Request | string) => {
          const url = typeof req === "string" ? req : req.url;
          return bucket.get(url) ?? matchByPathname(new URL(url).pathname);
        },
      };
    },
    match: async (req: Request) => {
      try {
        return matchByPathname(new URL(req.url).pathname);
      } catch {
        return undefined;
      }
    },
  } as CacheStorage;
}

describe("shell-cache-status", () => {
  beforeEach(() => {
    vi.stubGlobal("caches", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports missing shell when caches API unavailable", async () => {
    const status = await getShellCacheStatus();
    expect(status.shellReady).toBe(false);
    expect(status.toolRoutesCached).toBe(0);
    expect(await isShellReady()).toBe(false);
  });

  it("reports shellReady when home, offline page, routes, and static chunks present", async () => {
    const toolPaths = getToolPrecacheUrls();
    const threshold = Math.ceil(toolPaths.length * 0.9);
    const cachedTools = toolPaths.slice(0, threshold);

    vi.stubGlobal(
      "caches",
      buildMockCaches(
        ["/", "/~offline", ...cachedTools, "/_next/static/chunks/main.js"],
        ["serwist-precache-v2"]
      )
    );

    const status = await getShellCacheStatus();
    expect(status.hasHome).toBe(true);
    expect(status.hasOfflineFallback).toBe(true);
    expect(status.precacheBucketPresent).toBe(true);
    expect(status.staticChunkCount).toBeGreaterThanOrEqual(1);
    expect(status.shellReady).toBe(true);
  });

  it("reports partial shell when tool routes below threshold", async () => {
    vi.stubGlobal(
      "caches",
      buildMockCaches(["/", "/~offline", "/_next/static/chunks/main.js"])
    );

    const status = await getShellCacheStatus();
    expect(status.hasHome).toBe(true);
    expect(status.shellReady).toBe(false);
  });
});
