import { hardReloadApp } from "./hard-reload";
import { markShellReprecachePending } from "@/lib/offline/shell-reprecache-session";
import {
  activateWaitingServiceWorker,
  applyWaitingServiceWorker,
  waitForServiceWorkerControl,
} from "./sw-activation";

export { waitForServiceWorkerControl };

/**
 * Deep update: activate waiting SW, hard-reload with cache-bust.
 * Serwist cleanupOutdatedCaches removes stale precache on new SW install —
 * do not purge active shell caches post-activate (v3.4.1).
 */
export async function applyAppUpdate(): Promise<void> {
  const activated = await applyWaitingServiceWorker();
  if (!activated) {
    activateWaitingServiceWorker();
    await waitForServiceWorkerControl(2_000);
  }

  markShellReprecachePending();
  hardReloadApp();
}
