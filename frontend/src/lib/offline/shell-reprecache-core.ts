import { extractStaticAssetUrls, extractBrandAssetUrls } from "./extract-static-assets";
import { OFFLINE_SHELL_ASSET_PATHS } from "./constants";
import { toShellRequest } from "./shell-cache-request";

export type ShellReprecacheProgress = { done: number; total: number };

export type ShellReprecacheCounts = {
  fetched: number;
  failed: number;
  staticAssets: number;
};

/**
 * Fetch shell routes + linked /_next/static assets into the shell cache bucket.
 * Shared by main-thread reprecache and SW REPRECACHE_SHELL handler.
 */
export async function reprecacheShellRoutes(
  paths: string[],
  cacheName: string,
  onProgress?: (progress: ShellReprecacheProgress) => void
): Promise<ShellReprecacheCounts> {
  const cache = await caches.open(cacheName);
  const staticQueued = new Set<string>();
  let fetched = 0;
  let failed = 0;
  let staticAssets = 0;

  const bump = (total: number) => {
    onProgress?.({ done: fetched + failed, total });
  };

  const totalSteps = paths.length;

  for (const path of paths) {
    try {
      const request = toShellRequest(path);
      const response = await fetch(request);
      if (!response.ok) {
        failed += 1;
        bump(totalSteps);
        continue;
      }

      await cache.put(request, response.clone());
      fetched += 1;

      const html = await response.text();
      for (const assetPath of extractStaticAssetUrls(html)) {
        staticQueued.add(assetPath);
      }
      for (const assetPath of extractBrandAssetUrls(html)) {
        staticQueued.add(assetPath);
      }
    } catch {
      failed += 1;
    }
    bump(totalSteps);
  }

  for (const assetPath of OFFLINE_SHELL_ASSET_PATHS) {
    staticQueued.add(assetPath);
  }

  for (const assetPath of staticQueued) {
    try {
      const request = toShellRequest(assetPath);
      const response = await fetch(request);
      if (!response.ok) continue;
      await cache.put(request, response.clone());
      staticAssets += 1;
    } catch {
      // skip failed asset
    }
  }

  return { fetched, failed, staticAssets };
}
