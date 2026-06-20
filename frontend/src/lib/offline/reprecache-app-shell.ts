import { SHELL_CACHE_NAME } from "./constants";
import { getAllShellPrecacheUrls } from "./precache-routes";
import { reprecacheShellRoutes } from "./shell-reprecache-core";
import { getShellCacheStatus } from "./shell-cache-status";
import { requestShellReprecacheViaSw } from "./sw-sync-shell";

export type ReprecacheShellProgress = { done: number; total: number };

export type ReprecacheShellResult = {
  ok: boolean;
  viaServiceWorker: boolean;
  fetched: number;
  failed: number;
  staticAssets: number;
};

/**
 * Repopulate app shell in Cache Storage. Tries SW handler first, then main-thread fallback.
 */
export async function reprecacheAppShell(
  onProgress?: (progress: ReprecacheShellProgress) => void
): Promise<ReprecacheShellResult> {
  const urls = getAllShellPrecacheUrls();
  onProgress?.({ done: 0, total: urls.length });

  const viaSw = await requestShellReprecacheViaSw();
  if (viaSw) {
    const status = await getShellCacheStatus();
    if (status.shellReady) {
      onProgress?.({ done: urls.length, total: urls.length });
      return {
        ok: true,
        viaServiceWorker: true,
        fetched: urls.length,
        failed: 0,
        staticAssets: status.staticChunkCount,
      };
    }
  }

  const { fetched, failed, staticAssets } = await reprecacheShellRoutes(
    urls,
    SHELL_CACHE_NAME,
    onProgress
  );

  return {
    ok: fetched > 0 && failed === 0,
    viaServiceWorker: false,
    fetched,
    failed,
    staticAssets,
  };
}

export async function ensureShellCached(): Promise<boolean> {
  const { ok } = await reprecacheAppShell();
  return ok;
}
