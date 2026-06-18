import { isServiceWorkerSupported } from "./connectivity";

export type ForceOfflineSwMessage = {
  type: "SET_FORCE_OFFLINE";
  enabled: boolean;
};

/** Sync tab-scoped simulation flag to the active Service Worker (production). */
export async function syncForceOfflineToServiceWorker(enabled: boolean): Promise<void> {
  if (typeof navigator === "undefined" || !isServiceWorkerSupported()) return;

  const message: ForceOfflineSwMessage = { type: "SET_FORCE_OFFLINE", enabled };

  navigator.serviceWorker.controller?.postMessage(message);

  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage(message);
    registration.waiting?.postMessage(message);
  } catch {
    // SW not available (dev or unsupported)
  }
}
