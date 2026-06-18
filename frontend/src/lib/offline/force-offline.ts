import { setNetworkGuardEnabled } from "./network-guard";
import { syncForceOfflineToServiceWorker } from "./sw-sync-force-offline";

/** Tab-scoped "simulate offline" flag — sessionStorage, not persisted across browser restarts. */
export const FORCE_OFFLINE_SESSION_KEY = "camaleon:force-offline";

const listeners = new Set<() => void>();

export function subscribeForceOffline(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyForceOfflineListeners(): void {
  listeners.forEach((listener) => listener());
}

export function readForceOffline(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(FORCE_OFFLINE_SESSION_KEY) === "1";
}

export function writeForceOffline(enabled: boolean): void {
  if (typeof sessionStorage === "undefined") return;
  if (enabled) {
    sessionStorage.setItem(FORCE_OFFLINE_SESSION_KEY, "1");
  } else {
    sessionStorage.removeItem(FORCE_OFFLINE_SESSION_KEY);
  }
  notifyForceOfflineListeners();
}

/** Effective online = browser reports online AND user has not forced offline simulation. */
export function readEffectiveOnline(networkOnline = readBrowserOnlineForForceOffline()): boolean {
  return networkOnline && !readForceOffline();
}

function readBrowserOnlineForForceOffline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

/** Apply cache-only network policy for simulated offline (fetch guard + SW message). */
export async function applyForceOfflineNetworkPolicy(enabled: boolean): Promise<void> {
  setNetworkGuardEnabled(enabled);
  await syncForceOfflineToServiceWorker(enabled);
}
