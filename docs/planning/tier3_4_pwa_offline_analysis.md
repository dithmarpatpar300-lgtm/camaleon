# Tier 3 Phase 3.4 — PWA / Offline Shell: Format Science & Product Plan

> **Date:** 2026-06-11  
> **Status:** Analysis complete — **implementation starts at 3.4.0**  
> **Prerequisites:** v2.3.8 on `main`/`dev` — **21 tools**, 12 Wasm crates, format matrix **final**; Settings S1–S4 + S6 Risk ✅  
> **Implementation plan:** `docs/planning/tier3_4_pwa_implementation_plan.md` *(create after Chief Architect go/no-go)*  
> **Target versions:** v2.4.0 (3.4.0 MVP) · v2.4.1 (shell hardening) · v2.4.2 (Settings S5 full toolkit opt-in)  
> **Doctrine:** Extend NFR-1 — files never leave the device **and** the app can run without network after honest first-use caching  
> **SPEC anchor:** §7.13 Settings S5 · NFR-1 · NFR-7 · planned **NFR-9** offline shell · **`docs/planning/tier3_plan.md` §14**

---

## 0. Executive summary

**Phase 3.4 is not a new image format.** It is **delivery infrastructure**: make Camaleon a **Progressive Web App (PWA)** with a **Service Worker (SW)** that caches the app shell and (optionally) Wasm engines so transmutation works **without internet** after the user has visited while online.

| Question | Short answer |
|----------|--------------|
| **What is 3.4.x?** | PWA manifest + Service Worker + offline UX + Settings **S5** opt-in for full toolkit cache |
| **Is it viable?** | **Yes** for Camaleon's architecture — conversion already runs 100% in-browser; gap is **asset caching**, not engine rewrite |
| **Must users "download" anything?** | **No by default.** Baseline offline = shell + **tools you already used** cached automatically. **Full toolkit** = optional ~10–17 MB cache — user choice in Settings |
| **What does "download" mean?** | **Not** a `.exe` or zip. It means **precaching URLs** (JS, HTML, `.wasm`) into **browser storage** via the Service Worker — same class as "Add to Home Screen" + "make available offline" |
| **Hard requirement** | **At least one online session** (or install while online) before offline works — browsers cannot bootstrap from zero without network |

**Capstone role:** Tier 3 closes after 3.4. Tier 4 (compress, crop) starts only after offline shell ships.

---

## 1. What Phase 3.4 is (precise definition)

### 1.1 Layer model — today vs target

```
TODAY (online-dependent shell)
  User opens camaleon.app
    → Cloudflare Worker (OpenNext) serves HTML/SSR
    → Browser fetches Next.js JS/CSS chunks
    → User picks tool → worker loads /wasm/transmutador_*.js + .wasm (HTTP)
    → Transmute runs locally (NFR-1 ✅)
    → Output via Blob download (local ✅)

TARGET (3.4.x — offline-capable shell)
  User opens camaleon.app (online or offline)
    → Service Worker intercepts requests
    → Cache hit → serve shell + cached chunks + cached /wasm/*
    → Cache miss → network (if online) OR honest offline error
    → Transmute still 100% local when engine is cached
```

| Layer | Role today | 3.4 adds |
|-------|------------|----------|
| **Hosting (Cloudflare + OpenNext)** | SSR + static assets | Unchanged — SW is **client-side** cache in front of CDN |
| **Next.js app shell** | React UI, routing, Settings | **Precache** critical routes + hashed bundles |
| **Web Workers** | `transmutation.worker.ts`, frame preview | Must be in precache or runtime cache rules |
| **Wasm engines** | 12 crates under `/wasm/{crate}/` | **Runtime cache** on first use; **optional full precache** (S5) |
| **User files** | File API — never uploaded | **Unchanged** — offline does not change NFR-1 |
| **Preferences** | `localStorage` | Unchanged; add `offlineToolkit` pref for S5 |

### 1.2 What a PWA is (for Camaleon)

A **PWA** is a web app that meets installability criteria:

1. **`manifest.webmanifest`** — name, icons, `display: standalone`, theme colors  
2. **Service Worker** — programmatic cache + offline fallback  
3. **HTTPS** — already satisfied on Cloudflare  

**Install** ("Add to Home Screen" / "Install app") gives a standalone window and often **better storage persistence** on mobile — but **install is optional**; offline caching works in a normal tab once SW is registered.

### 1.3 What Phase 3.4 is **not**

| Misconception | Reality |
|---------------|---------|
| Desktop installer (.exe, .msi) | **Out of scope** — browser PWA only |
| Downloading a single "Camaleon offline file" | **No** — many hashed assets + 12 Wasm modules |
| Syncing settings to cloud | **No** — localStorage only (Settings doctrine) |
| Offline **first** visit with zero prior network | **Impossible** in browsers — honest UX required |
| Forcing 17 MB download on every user | **Rejected** — opt-in full toolkit (S5) |
| New transmutator crate | **No** — zero Rust changes required for MVP |

---

## 2. What "download" means — user language vs engineering

### 2.1 User-facing vocabulary (proposed)

| User hears | Engineering meaning | Default? |
|------------|---------------------|----------|
| *"Use offline"* / *"Works without internet"* | SW installed; shell cached; tools used before are cached | **Automatic** after first online visit (Model B) |
| *"Download all tools for offline"* (Settings S5) | SW **precache list** for all `/wasm/transmutador_*` URLs (~10–17 MB) | **Opt-in only** |
| *"Add to home screen"* | Browser install prompt; same caches, better persistence on some OSes | Optional browser UI |
| *"Update available"* | New SW version waiting; user reloads to activate | After each deploy |

**Copy doctrine (NFR-8 honesty):** Never say *"Download Camaleon"* without clarifying *"stores conversion engines in your browser — no separate app file."*

### 2.2 What actually gets stored

Each cached item is an HTTP response in **Cache Storage** (Service Worker API):

| Asset type | Example URL | Typical size |
|------------|-------------|--------------|
| App JS chunk | `/_next/static/chunks/…` | KB–MB |
| CSS | `/_next/static/css/…` | KB |
| Worker script | bundled worker URL | ~100–500 KB |
| Wasm glue | `/wasm/transmutador_jpg/transmutador_jpg.js` | ~10–50 KB |
| Wasm binary | `/wasm/transmutador_jpg/transmutador_jpg_bg.wasm` | **0.5–3 MB each** (NFR-7) |
| Icons / manifest | `/manifest.webmanifest`, icons | KB |

**Aggregate (current matrix):**

| Bundle | Estimate |
|--------|----------|
| App shell (JS + CSS + workers + fonts + icons) | ~2–5 MB |
| All 12 Wasm crates (`public/wasm/`) | ≤ **12 MB** (NFR-7 aggregate cap) |
| **Full offline toolkit** | ~**10–17 MB** total |

User's **photo files** are **not** stored in the SW cache — only Camaleon's **app code**. Photos stay in memory / File API for the session.

### 2.3 Three offline product models

| Model | ID | Behavior | Default? |
|-------|-----|----------|----------|
| **Partial offline** | A | Only routes/assets visited while online are cached | 3.4.0 MVP stepping stone |
| **Shell + lazy Wasm** | B | App opens offline; each tool works offline **after one online use** of that tool | **✅ Target default** |
| **Full toolkit precache** | C | All 12 engines cached without visiting each tool | **Opt-in via Settings S5** |

```mermaid
flowchart TB
  subgraph default [Default — Model B]
    O[Online visit] --> SW[Service Worker installs]
    SW --> S[Shell precached]
    SW --> U[User opens PNG→JPEG]
    U --> W[Fetch + cache /wasm/transmutador_png]
    OFF[Offline later] --> OK[PNG→JPEG works]
  end
  subgraph optin [Opt-in — Model C via Settings S5]
    SET[User enables Offline toolkit] --> PC[Precache all /wasm/*]
    OFF2[Offline] --> ALL[All 21 tools work]
  end
```

---

## 3. Viability analysis (science & constraints)

### 3.1 Technical viability — **HIGH**

| Factor | Assessment |
|--------|------------|
| **Engine already local** | Transmutation = File API → Worker → Wasm → Blob. No server API for bytes. |
| **Static Wasm layout** | `importWasmGlue()` loads `/wasm/{crate}/{crate}.js` — SW can `CacheFirst` this pattern |
| **OpenNext + Cloudflare** | SW caches **browser-side**; no migration to static export required (`docs/DEPLOY.md`) |
| **Serwist + Next 15** | `@serwist/next` is the maintained App Router successor to `next-pwa` |
| **Tool routes** | `generateStaticParams` on `/transmute/[slug]` — finite precache list (21 slugs) |
| **Risk mode / Settings** | `localStorage` prefs work offline once shell loads |

**Blockers:** None architectural. Implementation is frontend + build config + UX.

### 3.2 Browser & platform conditions

| Condition | Required for | Notes |
|-----------|--------------|-------|
| **HTTPS** | SW registration | ✅ Production |
| **First online visit** | SW install + initial cache | Cannot avoid |
| **Storage quota** | Full toolkit (~17 MB) | Mobile Safari can evict; desktop generous |
| **Service Worker support** | All 3.4 features | Chrome, Firefox, Edge, Safari 11.1+ — Camaleon's target browsers |
| **iOS installed PWA** | Best mobile persistence | Optional; recommend in copy for heavy offline users |
| **User gesture** | Some install prompts | `beforeinstallprompt` — Chrome/Edge; Safari uses Share → Add to Home Screen |

**Safari/iOS caveats:**

- Storage may be **evicted** under pressure if PWA not installed  
- **No** background unlimited storage — full toolkit precache should warn on mobile  
- SW update requires page reload — must surface "New version" toast  

### 3.3 Cloudflare / deploy conditions

| Condition | Detail |
|-----------|--------|
| **Build pipeline** | Unchanged: `npm run build:wasm` → `opennextjs-cloudflare build` → `sync-wasm-assets.mjs` |
| **Wasm on CDN** | `/wasm/**` must return cache-friendly headers (immutable hashed wasm optional; currently stable paths) |
| **SW scope** | Must be same-origin (`/` ) |
| **Dev vs prod** | SW **disabled in `next dev`** — production build only (standard Serwist pattern) |
| **Deploy invalidation** | New deploy = new hashed JS chunks + possibly new wasm — SW version bump + user reload prompt |

### 3.4 SSR / cookies caveat

`layout.tsx` and tool pages call `cookies()` for locale/theme SSR — may mark routes **dynamic**. Implications:

| Impact | Mitigation |
|--------|------------|
| HTML varies by cookie | SW caches **per-response** from visited sessions; precache `/` with default locale first |
| Precache list less predictable | 3.4.1: reduce cookie-driven SSR where `PREFERENCES_BOOTSTRAP_SCRIPT` + `localStorage` suffice |
| Not a MVP blocker | 3.4.0 caches what user actually fetched while online |

---

## 4. What already works offline (no 3.4 code)

Once the **shell and Wasm module are in memory or SW cache**:

```
User → File API (local disk)
     → transmutation.worker.ts (in-memory or cached)
     → importWasmGlue("transmutador_*") (cached /wasm/*)
     → Wasm heap transmute
     → URL.createObjectURL → download link
```

| Property | Status |
|----------|--------|
| File bytes on network | **Never** (NFR-1) |
| Analytics / trackers | **None** |
| Locale / theme | `localStorage` + bootstrap script |
| Transmutation logic | 100% client |

**Gap:** Without SW, **every cold start** re-fetches HTML, JS, and Wasm from Cloudflare — **fails completely offline**.

---

## 5. Architecture — Service Worker design

### 5.1 Recommended stack

| Piece | Choice |
|-------|--------|
| SW integration | **`@serwist/next`** |
| Manifest | `app/manifest.ts` or `public/manifest.webmanifest` |
| Registration | Production build only; client component or Serwist auto-register |
| Cache naming | Versioned prefix `camaleon-v{appVersion}-*` |

### 5.2 Cache strategies (proposal)

| Route pattern | Strategy | Phase |
|---------------|----------|-------|
| `/_next/static/*` | **CacheFirst** (immutable hashed) | 3.4.0 |
| `/wasm/**` | **CacheFirst** (runtime populate on first fetch) | 3.4.0 |
| `/`, `/transmute/*`, legal pages | **StaleWhileRevalidate** or precache on visit | 3.4.0 / 3.4.1 |
| API routes (if any) | NetworkOnly | — |
| External (GitHub) | NetworkOnly — fail gracefully | — |

### 5.3 Three cache layers (normative)

```
Layer 1 — App shell (precache on SW install)
  manifest, icons, core JS/CSS, workers, /, visited /transmute/[slug]

Layer 2 — Wasm lazy (runtime CacheFirst on /wasm/**)
  First online use of a tool → store glue + .wasm
  Offline → tool works if Layer 2 populated

Layer 3 — Full toolkit (Settings S5 opt-in)
  Explicit precache of all 12 transmutador_* directories
  Progress UI; storage failure handling
```

### 5.4 Wasm crate inventory (Layer 3 list)

From `frontend/scripts/build-wasm.mjs` — **12 crates**, 21 tools map to subset:

| Crate | Tools served (examples) |
|-------|-------------------------|
| `transmutador_jpg` | JPG→PNG |
| `transmutador_png` | PNG→JPEG |
| `transmutador_webp` | WebP suite |
| `transmutador_encode` | WebP encode |
| `transmutador_gif` | GIF suite |
| `transmutador_bmp` | BMP suite |
| `transmutador_tiff` | TIFF suite |
| `transmutador_ico` | ICO suite |
| `transmutador_tga` | TGA suite |
| `transmutador_avif` | AVIF decode |
| `transmutador_avif_encode` | AVIF encode |
| `transmutador_svg` | SVG rasterize |

Precache URL set = for each crate: `{crate}.js`, `{crate}_bg.wasm`, plus any `.d.ts` not needed at runtime.

---

## 6. Settings Panel — S5 offline (opt-in doctrine)

### 6.1 Product rule — **never force full download**

| Policy | Rationale |
|--------|-----------|
| **Default = Model B** | Minimal storage; respects mobile quotas; tools cache on use |
| **Full toolkit = opt-in** | ~10–17 MB; user must explicitly enable in Settings |
| **No modal on first visit** | No dark-pattern "download now" — optional discoverability in Settings + What's New |
| **Reversible** | User can clear offline cache / disable precache — deletes SW caches, not user files |
| **Transparent** | Show cached size, list of ready tools, "needs online once" for missing |

### 6.2 Proposed S5 UI (Settings drawer)

New section: **Storage / Offline** (`OfflineSettingsSection.tsx`)

| Control | Type | Default | Maps to |
|---------|------|---------|---------|
| **Offline mode info** | Read-only status | — | `navigator.onLine`, SW active yes/no |
| **Download all tools for offline use** | Toggle (opt-in) | **OFF** | Triggers Layer 3 precache |
| **Cached tools** | List / chips | — | Query Cache Storage keys under `/wasm/` |
| **Storage used** | Text | — | `estimate()` or sum cache entries |
| **Clear offline cache** | Destructive button | — | `caches.delete()` + reset S5 toggle |

**Storage key** (extend `camaleon-user-settings-v1`):

```typescript
offline?: {
  fullToolkitPrecache: boolean;  // default false
  precacheCompletedAt?: string;  // ISO date
  dismissedMobileWarning?: boolean;
};
```

### 6.3 Messaging (EN/ES draft intent)

| Key | Intent |
|-----|--------|
| `settings.offline.title` | Storage & offline |
| `settings.offline.description` | Camaleon already converts files on your device. Offline mode keeps the app and engines in your browser so you can convert without internet — after one online visit. |
| `settings.offline.fullToolkit.label` | Download all conversion tools |
| `settings.offline.fullToolkit.hint` | Stores about 10–15 MB in your browser. Not a separate app file. Optional — tools you use are saved automatically. |
| `settings.offline.mobileWarning` | On phones, the browser may remove cached data if storage is low. Installing the app to your home screen helps. |

Update **`/privacy`** when S5 ships — document Cache Storage, SW scope, no new network transmission of user files.

---

## 7. Offline UX surfaces (beyond Settings)

| Surface | Behavior | Phase |
|---------|----------|-------|
| **Connection banner** | "You're offline — Camaleon works with what's already saved" | 3.4.0 |
| **Uncached tool** | "This tool needs one online visit before offline use" + link to Settings | 3.4.1 |
| **Install hint** | Subtle CTA when `beforeinstallprompt` (desktop) | 3.4.1 |
| **SW update toast** | "New version available — Reload" (Release Comms pattern) | 3.4.1 |
| **Precache progress** | Progress bar during S5 full toolkit download | 3.4.2 |

---

## 8. Update & version lifecycle

| Event | Behavior |
|-------|----------|
| **New deploy** | New SW + new precache manifest (hashed JS changes) |
| **Waiting SW** | Show reload prompt — do not force `skipWaiting` silently (user may mid-transmute) |
| **Wasm crate update** | New `.wasm` URL or cache bust — full toolkit users re-precache on next online visit or via Settings "Update offline tools" |
| **User declines reload** | Old SW serves until tab closed — acceptable |

Align with **Release Comms** (`useReleaseCommsState`) — offline update toast complements changelog modal.

---

## 9. Privacy & NFR alignment

| NFR | 3.4 impact |
|-----|------------|
| **NFR-1** | **Strengthened** — offline reinforces no upload; QA must verify zero file bytes on network when offline |
| **NFR-7** | Full toolkit bounded by existing 12 MB Wasm aggregate guidance |
| **NFR-8** | Honest copy — offline ≠ magic; first visit needs network; "download" = browser cache |
| **NFR-9 (proposed)** | *Optional at 3.4 ship:* "App shell and user-opt-in toolkit may be cached locally via Service Worker; user files are not persisted in SW cache." |

Settings doctrine unchanged: **no server sync** of preferences.

---

## 10. Phase breakdown & exit gates

### 10.1 Phase 3.4.0 — PWA MVP (Model A→B)

- [ ] `manifest.webmanifest` + icons 192/512  
- [ ] `@serwist/next` integration; SW precache minimal shell  
- [ ] Runtime `CacheFirst` for `/wasm/**`  
- [ ] Offline banner + i18n EN/ES  
- [ ] Manual QA: visit JPG→PNG online → airplane mode → transmute + download  

**Exit gate:** Home + one visited tool work offline.

### 10.2 Phase 3.4.1 — Shell hardening (Model B default)

- [ ] Precache all 21 `/transmute/[slug]` static params  
- [ ] Reliable worker bundle caching  
- [ ] Uncached-tool offline component  
- [ ] SW update UX + release version integration  
- [ ] SSR/cookie hardening where safe  

**Exit gate:** App opens offline; any **previously used** tool transmutes offline.

### 10.3 Phase 3.4.2 — Settings S5 full toolkit (Model C opt-in)

- [ ] `OfflineSettingsSection` + `offline` prefs schema  
- [ ] Precache all `/wasm/transmutador_*` on user toggle  
- [ ] Progress + storage failure + clear cache  
- [ ] Mobile warning copy  
- [ ] `/privacy` update  

**Exit gate:** User enables S5 toggle online → all 21 tools work offline without prior per-tool visit.

---

## 11. Risk matrix

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS evicts cache | Offline breaks on mobile | Default lazy cache; install PWA hint; S5 mobile warning |
| Stale SW after deploy | Old bugs persist | Update toast; version in cache name |
| Storage quota exceeded | Precache fails | Try/catch; show error; don't enable S5 toggle |
| User thinks "download" = exe | Support confusion | Settings copy + What's New |
| Dynamic SSR HTML | Incomplete precache | Visit-based cache + 3.4.1 static optimization |
| Mid-transmute reload on SW update | Bad UX | User-controlled reload only |
| Cache grows with every deploy | Storage creep | Versioned cache purge on SW activate |
| QA matrix explosion | Missed regressions | Chrome + Safari desktop + iOS installed PWA smoke |

---

## 12. Open decisions (resolve before 3.4.0)

| # | Question | Proposal | Resolve in |
|---|----------|----------|------------|
| **Q1** | Serwist vs Workbox manual? | **Serwist** (`@serwist/next`) | 3.4.0 |
| **Q2** | Default Model A or B at launch? | **B** (shell + lazy Wasm) — banner explains | 3.4.0 |
| **Q3** | S5 in 3.4.0 or 3.4.2? | **3.4.2** — MVP first without forced UI complexity | Product |
| **Q4** | Precache legal pages? | **Yes** — `/privacy`, `/terms` for offline trust | 3.4.1 |
| **Q5** | `skipWaiting`? | **No** — user reload prompt | 3.4.1 |
| **Q6** | Cache bust for `/wasm/*`? | Keep stable paths; SW revision bump on deploy | 3.4.0 |
| **Q7** | NFR-9 in SPEC? | Add at 3.4.0 ship | Architect |
| **Q8** | Command palette "Install app"? | Optional 3.4.1 | Backlog |

---

## 13. Comparison — offline vs native app

| Aspect | PWA offline (3.4) | Native (Tauri/Electron) |
|--------|-------------------|-------------------------|
| Install | Browser / optional home screen | Separate installer |
| Updates | SW + reload | App store / auto-update |
| Size | ~10–17 MB browser cache | Larger bundle |
| Camaleon scope | **In scope** | Out of scope Tier 3 |
| NFR-1 | Same — local files | Same |

---

## 14. Related documents

| Document | Role |
|----------|------|
| `docs/planning/tier3_plan.md` §14 | Umbrella checklist (sync with this doc) |
| `docs/planning/settings_panel_plan.md` §S5 | Settings UI spec |
| `docs/planning/tier3_4_pwa_implementation_plan.md` | **Create next** — file list, Serwist config |
| `docs/DEPLOY.md` | Cloudflare + Wasm sync |
| `docs/SPEC.md` §7.13, NFR-1, NFR-7 | Normative |
| `frontend/src/lib/wasm/load-glue.ts` | Wasm URL pattern for SW rules |
| `frontend/scripts/sync-wasm-assets.mjs` | Deploy asset path |

---

## 15. One-page summary for stakeholders

**Phase 3.4** makes Camaleon usable **without internet** after the user has opened it online at least once. The conversion engine already runs on the device; we add a **Service Worker** that saves the web app and Wasm modules **inside the browser** — not a separate downloadable program.

**By default**, we do **not** bulk-download all tools. We cache the app shell and whichever tools the user has already opened. **Optionally**, in **Settings → Storage / Offline**, the user can turn on **"Download all conversion tools"** (~10–15 MB in browser storage) to use every tool offline without visiting each one first.

**Requirements:** HTTPS, modern browser, first online visit, user consent for full toolkit. **Privacy unchanged:** photos never upload; cache holds only Camaleon code.

---

*Tier 3 format work is complete (21 tools). Phase 3.4 is the Tier 3 capstone — then Tier 4 optimization/editing begins.*
