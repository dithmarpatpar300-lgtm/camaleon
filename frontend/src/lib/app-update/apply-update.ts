import { purgeAppShellCaches } from "./cache-purge";
import { hardReloadApp } from "./hard-reload";
import {
  activateWaitingServiceWorker,
  applyWaitingServiceWorker,
  waitForServiceWorkerControl,
} from "./sw-activation";

export { waitForServiceWorkerControl };

/**
 * Deep update: activate waiting SW, purge shell caches, hard-reload with cache-bust.
 */
export async function applyAppUpdate(): Promise<void> {
  const activated = await applyWaitingServiceWorker();
  if (!activated) {
    activateWaitingServiceWorker();
    await waitForServiceWorkerControl(2_000);
  }

  await purgeAppShellCaches();
  hardReloadApp();
}
