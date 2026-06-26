/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkOnly, Serwist, type RuntimeCaching } from "serwist";
import { getAllShellPrecacheUrls } from "../lib/offline/precache-routes";
import { reprecacheShellRoutes } from "../lib/offline/shell-reprecache-core";
import {
  OFFLINE_FALLBACK_PATH,
  SHELL_CACHE_NAME,
  SW_MESSAGE_REPRECACHE_SHELL,
  SERVER_PROBE_QUERY,
} from "../lib/offline/constants";
import {
  decodeNextImageAssetPath,
  isOfflineAssetPath,
} from "../lib/offline/offline-asset-fallback";
import { REPRECACHE_SHELL_ACK } from "../lib/offline/sw-sync-shell";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Canonical source: lib/wasm/wasm-cache-constants.ts (cannot import in SW scope)
const WASM_CACHE = "camaleon-wasm-v1";
const SHELL_CACHE_MAX_ENTRIES = 75;

/** When true, same-origin GET requests are cache-only (simulated offline). */
let forceOfflineSim = false;
let trimShellCachePending = false;

/** Remove oldest entries from SHELL_CACHE_NAME when it exceeds the limit. */
async function trimShellCache(): Promise<void> {
  if (trimShellCachePending) return;
  trimShellCachePending = true;
  try {
    const cache = await caches.open(SHELL_CACHE_NAME);
    const keys = await cache.keys();
    if (keys.length > SHELL_CACHE_MAX_ENTRIES) {
      const excess = keys.length - SHELL_CACHE_MAX_ENTRIES;
      for (let i = 0; i < excess; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch {
    // Never block on cache maintenance
  } finally {
    trimShellCachePending = false;
  }
}

/** Check if a request URL is already cached in any bucket (avoids duplication). */
async function isAlreadyCachedInSw(request: Request): Promise<boolean> {
  try {
    const direct = await caches.match(request);
    if (direct) return true;
    const names = await caches.keys();
    for (const name of names) {
      const cache = await caches.open(name);
      const hit = await cache.match(request);
      if (hit) return true;
    }
  } catch {
    // On error, assume not cached
  }
  return false;
}

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

async function matchByPathnameInSw(pathname: string): Promise<Response | undefined> {
  const names = await caches.keys();
  for (const name of names) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    for (const key of keys) {
      if (new URL(key.url).pathname === pathname) {
        const hit = await cache.match(key);
        if (hit) return hit;
      }
    }
  }
  return undefined;
}

async function tryForceOfflineFallbackInSw(
  request: Request
): Promise<Response | undefined> {
  const url = new URL(request.url);

  if (request.destination === "document") {
    for (const path of [OFFLINE_FALLBACK_PATH, "/"]) {
      const hit = await matchByPathnameInSw(path);
      if (hit) return hit;
    }
  }

  if (
    url.pathname.includes("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    isOfflineAssetPath(url.pathname)
  ) {
    const byPath = await matchByPathnameInSw(url.pathname);
    if (byPath) return byPath;

    const stripped = url.pathname.replace(/\?.*$/, "").replace(/#.*$/, "");
    if (stripped !== url.pathname) {
      const strippedMatch = await matchByPathnameInSw(stripped);
      if (strippedMatch) return strippedMatch;
    }

    const imageAsset = decodeNextImageAssetPath(url.pathname, url.search);
    if (imageAsset) {
      const assetHit = await matchByPathnameInSw(imageAsset);
      if (assetHit) return assetHit;
    }
  }

  return undefined;
}

function isShellStaticAssetPath(pathname: string): boolean {
  return pathname.startsWith("/_next/static/") || isOfflineAssetPath(pathname);
}

/** Cache-first for brand/static assets — runs before Serwist precache (real offline logo fix). */
async function serveOfflineShellAssetRequest(request: Request): Promise<Response> {
  const cached = await matchAnyCacheInSw(request);
  if (cached) return cached;

  const fallback = await tryForceOfflineFallbackInSw(request);
  if (fallback) return fallback;

  if (forceOfflineSim) {
    return new Response("Offline mode — resource not in cache", {
      status: 503,
      statusText: "Offline Mode",
    });
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const alreadyCached = await isAlreadyCachedInSw(request);
      if (!alreadyCached) {
        const cache = await caches.open(SHELL_CACHE_NAME);
        await cache.put(request, response.clone());
        trimShellCache();
      }
    }
    return response;
  } catch {
    const lastChance = await tryForceOfflineFallbackInSw(request);
    if (lastChance) return lastChance;
    return Response.error();
  }
}

async function reprecacheShellInSw(): Promise<void> {
  await reprecacheShellRoutes(getAllShellPrecacheUrls(), SHELL_CACHE_NAME);
}

/** Origin liveness checks must hit the network — never serve cached health/version/manifest. */
const originProbeNetworkOnly: RuntimeCaching = {
  matcher({ url, request }) {
    if (!url.searchParams.has(SERVER_PROBE_QUERY)) return false;
    if (request.method !== "GET" && request.method !== "HEAD") return false;
    return (
      url.pathname === "/api/health" ||
      url.pathname === "/version.json" ||
      url.pathname === "/manifest.webmanifest"
    );
  },
  handler: new NetworkOnly(),
};

const shellDocumentRuntimeCache: RuntimeCaching = {
  matcher({ request }) {
    return (
      request.method === "GET" &&
      (request.mode === "navigate" || request.destination === "document")
    );
  },
  handler: {
    handle: async ({ request }) => {
      const url = new URL(request.url);
      try {
        const response = await fetch(request);
        if (response.ok) {
          const alreadyCached = await isAlreadyCachedInSw(request);
          if (!alreadyCached) {
            const cache = await caches.open(SHELL_CACHE_NAME);
            await cache.put(request, response.clone());
            trimShellCache();
          }
        }
        return response;
      } catch {
        const cached = await matchAnyCacheInSw(request);
        if (cached) return cached;

        const byPath = await matchByPathnameInSw(url.pathname);
        if (byPath) return byPath;

        for (const path of [OFFLINE_FALLBACK_PATH, "/"]) {
          const hit = await matchByPathnameInSw(path);
          if (hit) return hit;
        }

        return Response.error();
      }
    },
  },
};

const shellStaticRuntimeCache: RuntimeCaching = {
  matcher({ url, request }) {
    return request.method === "GET" && isShellStaticAssetPath(url.pathname);
  },
  handler: {
    handle: async ({ request }) => serveOfflineShellAssetRequest(request),
  },
};

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
  navigationPreload: false,
  runtimeCaching: [
    originProbeNetworkOnly,
    shellDocumentRuntimeCache,
    shellStaticRuntimeCache,
    wasmRuntimeCache,
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: OFFLINE_FALLBACK_PATH,
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
    return;
  }
  if (data?.type === SW_MESSAGE_REPRECACHE_SHELL) {
    event.waitUntil(
      reprecacheShellInSw().then(() => {
        event.source?.postMessage({ type: REPRECACHE_SHELL_ACK });
      })
    );
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(trimShellCache());
});

/** Cache-first shell assets before Serwist precache — real offline must match force-offline logo path. */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!isShellStaticAssetPath(url.pathname)) return;

  event.respondWith(serveOfflineShellAssetRequest(request));
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

      const fallback = await tryForceOfflineFallbackInSw(request);
      if (fallback) return fallback;

      if (request.destination === "document") {
        const offlineHtml = await matchByPathnameInSw(OFFLINE_FALLBACK_PATH);
        if (offlineHtml) return offlineHtml;
        const homeHtml = await matchByPathnameInSw("/");
        if (homeHtml) return homeHtml;
      }

      return new Response("Offline mode — resource not in cache", {
        status: 503,
        statusText: "Offline Mode",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    })()
  );
});

serwist.addEventListeners();
