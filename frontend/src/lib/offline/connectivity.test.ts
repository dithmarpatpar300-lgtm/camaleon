import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  readBrowserOnline,
  subscribeConnectivity,
  isServiceWorkerSupported,
} from "./connectivity";

describe("connectivity", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("readBrowserOnline reflects navigator.onLine", () => {
    expect(readBrowserOnline()).toBe(true);
    vi.stubGlobal("navigator", { onLine: false });
    expect(readBrowserOnline()).toBe(false);
  });

  it("subscribeConnectivity fires online/offline handlers", () => {
    const listeners = new Map<string, Set<EventListener>>();
    vi.stubGlobal("window", {
      addEventListener: (type: string, listener: EventListener) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(listener);
      },
      removeEventListener: (type: string, listener: EventListener) => {
        listeners.get(type)?.delete(listener);
      },
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.forEach((listener) => listener(event));
        return true;
      },
    });

    const online = vi.fn();
    const offline = vi.fn();
    const unsubscribe = subscribeConnectivity(online, offline);

    window.dispatchEvent(new Event("online"));
    window.dispatchEvent(new Event("offline"));

    expect(online).toHaveBeenCalledOnce();
    expect(offline).toHaveBeenCalledOnce();

    unsubscribe();
    window.dispatchEvent(new Event("online"));
    expect(online).toHaveBeenCalledOnce();
  });

  it("isServiceWorkerSupported is true when serviceWorker in navigator", () => {
    vi.stubGlobal("navigator", { onLine: true, serviceWorker: {} });
    expect(isServiceWorkerSupported()).toBe(true);
  });
});
