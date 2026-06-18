import { isServiceWorkerSupported } from "@/lib/offline/connectivity";
import { SW_CONTROL_TIMEOUT_MS } from "./constants";

export function activateWaitingServiceWorker(): void {
  if (!isServiceWorkerSupported()) return;
  navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
  void navigator.serviceWorker.ready.then((reg) => {
    reg.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}

export function waitForServiceWorkerControl(
  timeoutMs = SW_CONTROL_TIMEOUT_MS
): Promise<boolean> {
  if (!isServiceWorkerSupported()) return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      resolve(value);
    };

    const onChange = () => {
      finish(true);
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
  });
}

export async function applyWaitingServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  const reg = await navigator.serviceWorker.ready;
  if (!reg.waiting) return false;

  const controlPromise = waitForServiceWorkerControl();
  reg.waiting.postMessage({ type: "SKIP_WAITING" });
  return controlPromise;
}

export async function hasWaitingServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  return Boolean(reg.waiting);
}
