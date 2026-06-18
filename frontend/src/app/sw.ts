/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, Serwist, type RuntimeCaching } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const WASM_CACHE = "camaleon-wasm-v1";

/** When true, same-origin GET requests are cache-only (simulated offline). */
let forceOfflineSim = false;

async function matchAnyCacheInSw(request: Request): Promise<Response | undefined> {
  const direct = await caches.match(request);
  if (direct) return direct;
  const names = await caches.keys();
  for (const name of names) {
    const cache = await caches.open(name);
    const hit = await cache.match(request);
    if (hit) return hit;
  }
  return undefined;
}

const wasmRuntimeCache: RuntimeCaching = {
  matcher({ url }) {
    return url.pathname.startsWith("/wasm/");
  },
  handler: new CacheFirst({
    cacheName: WASM_CACHE,
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [wasmRuntimeCache, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
});

self.addEventListener("message", (event) => {
  const data = event.data as { type?: string; enabled?: boolean } | undefined;
  if (data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
    return;
  }
  if (data?.type === "SET_FORCE_OFFLINE") {
    forceOfflineSim = Boolean(data.enabled);
  }
});

/** Cache-only fetch when simulated offline — registered before Serwist so we respond first. */
self.addEventListener("fetch", (event) => {
  if (!forceOfflineSim) return;

  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cached = await matchAnyCacheInSw(request);
      if (cached) return cached;
      return new Response("Offline mode — resource not in cache", {
        status: 503,
        statusText: "Offline Mode",
      });
    })()
  );
});

serwist.addEventListeners();
