import { isServiceWorkerSupported } from "@/lib/offline/connectivity";

export type SwUpdateCallback = () => void;

export async function registerServiceWorker(
  onUpdateWaiting?: SwUpdateCallback
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (process.env.NODE_ENV !== "production") return null;
  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    if (registration.waiting && navigator.serviceWorker.controller) {
      onUpdateWaiting?.();
    }

    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (
          installing.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          onUpdateWaiting?.();
        }
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
    });

    return registration;
  } catch {
    return null;
  }
}

export function activateWaitingServiceWorker(): void {
  if (!isServiceWorkerSupported()) return;
  navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
  void navigator.serviceWorker.ready.then((reg) => {
    reg.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}
