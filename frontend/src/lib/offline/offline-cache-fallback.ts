import { matchAnyCache } from "./cache-match";
import { OFFLINE_FALLBACK_PATH } from "./constants";
import {
  decodeNextImageAssetPath,
  isOfflineAssetPath,
} from "./offline-asset-fallback";

async function matchByPathname(pathname: string): Promise<Response | undefined> {
  if (typeof caches === "undefined") return undefined;
  try {
    const names = await caches.keys();
    for (const name of names) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      for (const key of keys) {
        if (new URL(key.url).pathname === pathname) {
          const hit = await cache.match(key);
          if (hit) return hit;
        }
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Force-offline / network-guard fallback before failing a same-origin GET.
 */
export async function tryOfflineCacheFallback(
  request: Request
): Promise<Response | undefined> {
  const direct = await matchAnyCache(request);
  if (direct) return direct;

  const url = new URL(request.url);

  if (request.destination === "document") {
    for (const path of [OFFLINE_FALLBACK_PATH, "/"]) {
      const hit = await matchByPathname(path);
      if (hit) return hit;
    }
  }

  if (
    url.pathname.includes("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    isOfflineAssetPath(url.pathname)
  ) {
    const byPath = await matchByPathname(url.pathname);
    if (byPath) return byPath;

    const imageAsset = decodeNextImageAssetPath(url.pathname, url.search);
    if (imageAsset) {
      const assetHit = await matchByPathname(imageAsset);
      if (assetHit) return assetHit;
    }
  }

  return undefined;
}
