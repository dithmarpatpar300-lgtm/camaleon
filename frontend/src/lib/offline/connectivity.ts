/** Whether the browser reports a network connection (best-effort). */
export function readBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function subscribeConnectivity(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

export function isServiceWorkerSupported(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}
