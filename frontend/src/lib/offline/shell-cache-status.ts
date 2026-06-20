import { SHELL_ROUTE_READY_RATIO } from "./constants";
import { getToolPrecacheUrls } from "./precache-routes";

export type ShellCacheStatus = {
  precacheBucketPresent: boolean;
  shellBucketPresent: boolean;
  hasHome: boolean;
  hasOfflineFallback: boolean;
  toolRoutesCached: number;
  toolRoutesTotal: number;
  staticChunkCount: number;
  shellReady: boolean;
};

async function isPathCached(pathname: string): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const names = await caches.keys();
    for (const name of names) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      for (const key of keys) {
        if (new URL(key.url).pathname === pathname) return true;
      }
    }

    try {
      const request = new Request(pathname, { method: "GET" });
      const direct = await caches.match(request);
      if (direct) return true;
    } catch {
      /* relative Request may be unsupported in some runtimes */
    }
  } catch {
    return false;
  }
  return false;
}

async function countStaticChunks(): Promise<number> {
  if (typeof caches === "undefined") return 0;
  let count = 0;
  try {
    const names = await caches.keys();
    for (const name of names) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      for (const key of keys) {
        if (new URL(key.url).pathname.includes("/_next/static/")) count += 1;
      }
    }
  } catch {
    return 0;
  }
  return count;
}

export async function getShellCacheStatus(): Promise<ShellCacheStatus> {
  const toolRoutesTotal = getToolPrecacheUrls().length;
  let toolRoutesCached = 0;

  if (typeof caches !== "undefined") {
    for (const path of getToolPrecacheUrls()) {
      if (await isPathCached(path)) toolRoutesCached += 1;
    }
  }

  const names =
    typeof caches !== "undefined" ? await caches.keys().catch(() => [] as string[]) : [];

  const precacheBucketPresent = names.some((n) => n.startsWith("serwist-precache"));
  const shellBucketPresent = names.includes("camaleon-shell-v1");

  const hasHome = await isPathCached("/");
  const hasOfflineFallback = await isPathCached("/~offline");
  const staticChunkCount = await countStaticChunks();

  const routeThreshold = Math.ceil(toolRoutesTotal * SHELL_ROUTE_READY_RATIO);
  const shellReady =
    hasHome &&
    hasOfflineFallback &&
    toolRoutesCached >= routeThreshold &&
    staticChunkCount >= 1;

  return {
    precacheBucketPresent,
    shellBucketPresent,
    hasHome,
    hasOfflineFallback,
    toolRoutesCached,
    toolRoutesTotal,
    staticChunkCount,
    shellReady,
  };
}

export async function isShellReady(): Promise<boolean> {
  return (await getShellCacheStatus()).shellReady;
}
