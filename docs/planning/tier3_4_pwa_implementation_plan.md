# Tier 3.4 — PWA / Offline Implementation Plan

> **Target:** v3.0.0 (PWA) + **v3.0.1** (Offline mode polish) · **Analysis:** `tier3_4_pwa_offline_analysis.md`  
> **Status:** ✅ Shipped on `dev`

## Phase 3.4.0 — Serwist core

| File | Action |
|------|--------|
| `frontend/package.json` | Add `serwist`, `@serwist/next` |
| `frontend/next.config.ts` | `withSerwistInit` wrapper |
| `frontend/tsconfig.json` | `webworker` lib, `@serwist/next/typings` |
| `frontend/src/app/sw.ts` | Service worker — defaultCache + `/wasm/` CacheFirst |
| `frontend/src/app/manifest.ts` | Web App Manifest |
| `frontend/public/pwa/icon-192.png` | PWA icon |
| `frontend/public/pwa/icon-512.png` | PWA icon |
| `frontend/src/app/~offline/page.tsx` | Offline fallback |
| `frontend/src/lib/i18n/metadata.ts` | PWA metadata exports |
| `frontend/src/components/layout/SerwistRegister.tsx` | Client SW registration |

## Phase 3.4.0 — Offline UX

| File | Action |
|------|--------|
| `frontend/src/lib/offline/connectivity.ts` | online/offline helpers |
| `frontend/src/lib/offline/sw-registration.ts` | register, update detection |
| `frontend/src/providers/OfflineProvider.tsx` | Context + connectivity |
| `frontend/src/components/layout/OfflineBanner.tsx` | Banner UI |
| `frontend/src/app/layout.tsx` | Wire OfflineProvider + banner |

## Phase 3.4.1 — Shell hardening

| File | Action |
|------|--------|
| `frontend/src/lib/wasm/wasm-crates.ts` | 12 crate names DRY |
| `frontend/src/lib/offline/cache-status.ts` | Query Cache Storage for wasm |
| `frontend/src/lib/offline/precache-routes.ts` | 21 tool + legal URLs |
| `frontend/src/app/sw.ts` | additionalPrecacheEntries, message handler |
| `frontend/src/components/transmute/UncachedToolNotice.tsx` | Workspace notice |
| `frontend/src/components/layout/SwUpdatePrompt.tsx` | Update toast |
| `frontend/src/components/transmute/StagedWorkspace.tsx` | Integrate uncached notice |

## Phase 3.4.2 — Settings S5

| File | Action |
|------|--------|
| `frontend/src/lib/prefs/user-settings.ts` | `offline` schema |
| `frontend/src/lib/prefs/offline-prefs.ts` | read/write/subscribe |
| `frontend/src/lib/offline/precache-toolkit.ts` | Full toolkit precache |
| `frontend/src/components/settings/OfflineSettingsSection.tsx` | Settings UI |
| `frontend/src/components/settings/SettingsDrawer.tsx` | Mount S5 |
| `frontend/src/lib/i18n/dictionaries/en.ts` | `settings.offline.*` |
| `frontend/src/lib/i18n/dictionaries/es.ts` | `settings.offline.*` |

## v3.0.1 release (Offline mode polish)

| File | Action |
|------|--------|
| `frontend/package.json` | version 3.0.1 |
| `docs/releases/v3.0.1.md` | Release notes |
| `frontend/src/lib/releases/entries/v3.0.1.ts` | What's New |
| `frontend/src/lib/offline/force-offline.ts` | Offline mode toggle |
| `docs/planning/force_offline_mode_notes.md` | Architecture + QA |

## v3.0.0 release

| File | Action |
|------|--------|
| `frontend/package.json` | version 3.0.0 |
| `docs/releases/v3.0.0.md` | Release notes |
| `frontend/src/lib/releases/entries/v3.0.0.ts` | What's New |
| `frontend/src/lib/releases/manifest.ts` | Register v300 |
| `docs/SPEC.md`, `docs/ROADMAP.md`, `docs/planning/tier3_plan.md` | Tier 3 complete |
| `docs/DEPLOY.md` | PWA QA section |

## Deprecation cleanup

| File | Action |
|------|--------|
| `progress-preference.ts` | Delete; import from `notices-prefs` |
| `limits.ts` | Remove `ENGINE_MAX_INPUT_BYTES` |
| `globals.css` | Remove orphan `.glass-header` if unused |
