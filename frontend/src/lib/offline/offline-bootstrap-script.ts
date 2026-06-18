import { FORCE_OFFLINE_SESSION_KEY } from "./force-offline";

/**
 * Inline script — installs fetch guard before React/first paint when simulation is ON.
 * Must stay in sync with `network-guard.ts` behaviour.
 */
export const OFFLINE_BOOTSTRAP_SCRIPT = `
(function() {
  try {
    if (sessionStorage.getItem('${FORCE_OFFLINE_SESSION_KEY}') !== '1') return;
    if (window.__camaleonFetchGuardActive) return;

    var nativeFetch = window.fetch.bind(window);
    window.__camaleonNativeFetch = nativeFetch;
    window.__camaleonFetchGuardActive = true;

    function matchAnyCache(req) {
      return caches.match(req).then(function(direct) {
        if (direct) return direct;
        return caches.keys().then(function(names) {
          var idx = 0;
          function walk() {
            if (idx >= names.length) return undefined;
            var name = names[idx++];
            return caches.open(name).then(function(cache) {
              return cache.match(req).then(function(hit) {
                return hit || walk();
              });
            });
          }
          return walk();
        });
      });
    }

    window.fetch = function(input, init) {
      var req = new Request(input, init);
      if (req.method !== 'GET') return nativeFetch(input, init);
      try {
        if (new URL(req.url).origin !== location.origin) return nativeFetch(input, init);
      } catch (e) {
        return nativeFetch(input, init);
      }
      return matchAnyCache(req).then(function(cached) {
        if (cached) return cached.clone();
        var err = new TypeError('Failed to fetch (simulated offline — not in cache)');
        window.dispatchEvent(new CustomEvent('camaleon:simulated-offline-miss'));
        throw err;
      });
    };
  } catch (e) {}
})();
`;
