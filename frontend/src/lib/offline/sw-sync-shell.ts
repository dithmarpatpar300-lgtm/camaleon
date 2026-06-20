import { isServiceWorkerSupported } from "./connectivity";
import { SW_MESSAGE_REPRECACHE_SHELL } from "./constants";

export type ReprecacheShellSwMessage = {
  type: typeof SW_MESSAGE_REPRECACHE_SHELL;
};

export const REPRECACHE_SHELL_ACK = "REPRECACHE_SHELL_DONE";

/** Ask the active Service Worker to reprecache shell routes. Returns true if SW acked. */
export async function requestShellReprecacheViaSw(timeoutMs = 30_000): Promise<boolean> {
  if (typeof navigator === "undefined" || !isServiceWorkerSupported()) return false;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      navigator.serviceWorker.removeEventListener("message", onMessage);
      clearTimeout(timer);
      resolve(value);
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string } | undefined;
      if (data?.type === REPRECACHE_SHELL_ACK) finish(true);
    };

    navigator.serviceWorker.addEventListener("message", onMessage);

    const message: ReprecacheShellSwMessage = { type: SW_MESSAGE_REPRECACHE_SHELL };
    navigator.serviceWorker.controller?.postMessage(message);

    void navigator.serviceWorker.ready
      .then((registration) => {
        registration.active?.postMessage(message);
      })
      .catch(() => finish(false));

    const timer = setTimeout(() => finish(false), timeoutMs);
  });
}
