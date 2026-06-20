# Offline Persistence Fix — v3.5.0

**Status:** Implemented in v3.5.0 (development started as v3.4.1 on `dev`)  
**Scope:** App shell + Wasm dual readiness, app-update purge fix, force-offline Serwist alignment, origin reachability, brand offline, mobile notice stack

---

## Root causes fixed

| ID | Issue | Fix |
|----|-------|-----|
| P0 | `applyAppUpdate()` purged shell after SW install | Remove post-activate purge; Serwist `cleanupOutdatedCaches` |
| P1 | `clearOfflineCaches()` wiped shell without restore | Auto `reprecacheAppShell()` when online |
| P2 | UI showed 13/13 Wasm as "offline ready" | Dual stats: shell routes + Wasm engines |
| P3 | Force-offline returned 503 before Serwist fallback | Document → `/~offline`; assets → pathname cache scan |
| P4 | No recovery after clear/update | `ShellCacheBootstrap` + session reprecache flag |

---

## Dual readiness model

- **shellReady:** `/`, `/~offline`, ≥90% tool routes, ≥1 `_next/static` chunk in Cache Storage
- **wasmReady:** all 13 Wasm crates in `camaleon-wasm-v1`
- **offlineReady:** `shellReady && wasmReady`

---

## QA matrix

| Step | Expected |
|------|----------|
| Clear cache (online) → auto shell restore → S5 → F5 offline `/` | Camaleon loads |
| Same → F5 offline `/transmute/svg-to-jpg` | Tool page loads; transmute works |
| App update "Update now" → F5 offline | Same (P0 regression) |
| Offline Mode ON, shell+wasm ready → navigate + F5 | No 503 / ChunkLoadError |
| Offline Mode ON, shell missing | Gate warning; Restore button |
| Real airplane mode | Same as ready force-offline |
| Settings UI | Shell + Wasm stats separate; offline readiness bar |

---

## Key modules

- `lib/offline/shell-cache-status.ts` — readiness probe
- `lib/offline/reprecache-app-shell.ts` — SW message + main-thread fallback
- `lib/offline/constants.ts` — `SHELL_CACHE_NAME`, session flags
- `components/layout/ShellCacheBootstrap.tsx` — silent online recovery
- `app/sw.ts` — `REPRECACHE_SHELL`, force-offline fallbacks
