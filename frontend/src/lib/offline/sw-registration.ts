import { isServiceWorkerSupported } from "@/lib/offline/connectivity";

export type SwUpdateCallback = () => void;

const updateListeners = new Set<SwUpdateCallback>();

let registerPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function subscribeSwUpdateWaiting(callback: SwUpdateCallback): () => void {
  updateListeners.add(callback);
  return () => {
    updateListeners.delete(callback);
  };
}

function notifyUpdateWaiting(): void {
  for (const callback of updateListeners) {
    callback();
  }
}

async function registerServiceWorkerInternal(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (process.env.NODE_ENV !== "production") return null;
  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    if (registration.waiting && navigator.serviceWorker.controller) {
      notifyUpdateWaiting();
    }

    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (
          installing.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          notifyUpdateWaiting();
        }
      });
    });

    return registration;
  } catch {
    return null;
  }
}

export function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!registerPromise) {
    registerPromise = registerServiceWorkerInternal();
  }
  return registerPromise;
}

/** @deprecated Use getServiceWorkerRegistration + subscribeSwUpdateWaiting */
export async function registerServiceWorker(
  onUpdateWaiting?: SwUpdateCallback
): Promise<ServiceWorkerRegistration | null> {
  if (onUpdateWaiting) {
    subscribeSwUpdateWaiting(onUpdateWaiting);
  }
  return getServiceWorkerRegistration();
}

export function activateWaitingServiceWorker(): void {
  if (!isServiceWorkerSupported()) return;
  navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
  void navigator.serviceWorker.ready.then((reg) => {
    reg.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}
