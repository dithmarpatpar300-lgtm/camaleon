# Camaleon — Product Roadmap

> Living document. Updated by the **Chief Architect (Cursor)** when scope or priorities change.
> Implementation status is reflected here after **OpenCode** delivery and **Architect validation**.

---

## North Star

**Camaleon** is a browser-local, privacy-first file transmutation platform. All conversion logic runs on the user's device via Rust/WebAssembly. No file bytes leave the browser.

---

## Current Snapshot (2026-06-11)

| Layer | Version | Status |
|-------|---------|--------|
| **Frontend (app)** | **v2.3.8** (`dev`/`main`) | Settings S1–S4 + **S6 Risk mode** + Notice Rail + **SVG→PNG/JPEG** — **21 tools** |
| **Engine (Rust workspace)** | v1.6.0 | Twelve Wasm crates incl. **`transmutador_svg`** (+ AVIF decode/encode) |
| **SPEC** | v2.3.8 | §6.12 `transmutador_svg`; §7.12 Notice Rail; §7.13 Settings S1–S4 + **S6 Risk** |

**v2.3.8** (`dev`/`main`): **Risk mode (S6)** + limit/estimate/notice hotfixes + overlay scrollbar drag fix. Release: `docs/releases/v2.3.8.md`. Next: **Tier 3.4 PWA / offline shell** — `docs/planning/tier3_plan.md` §14.

**v2.3.7** (internal dev milestone): Risk mode core — superseded by **v2.3.8** release bundle.

**v2.3.6** (`dev`): **SVG → JPEG** (3.3.2) + `LimitUnlockHint` on blockers. Release: `docs/releases/v2.3.6.md`.

**v2.3.5** (`dev`): **SVG → PNG** — `transmutador_svg`, output scale presets. Release: `docs/releases/v2.3.5.md`.

**v2.3.4** (`main`): **Settings S4** — notice rail density + prepare progress style. Releases: `docs/releases/v2.3.1.md`–`v2.3.4.md`.

**v2.3.0** (`main`): **Operational Notice Rail** — contextual warnings for estimate/transmute latency, limits, fidelity. Release: `docs/releases/v2.3.0.md`.

**v2.2.0** (`main`): **PNG/JPEG→AVIF** encode pair. Release: `docs/releases/v2.2.0.md`.

**v2.1.1** (`main`): **AVIF→JPEG** + animated preview UX. **17 tools.** Release: `docs/releases/v2.1.1.md`.

**v2.0.0** (`main`): Tier 3 baseline — AVIF→PNG, limit pipeline. Release: `docs/releases/v2.0.0.md`

**v1.12.2** (`main`): **Estimation engine performance** — GIF fast inspect, alpha hint, multi-entry cache, SIMD128 + LTO. Release: `docs/releases/v1.12.2.md`.

**v1.12.1** (`main`): **Brand mark & favicon polish** — Lamina 3C chameleon in header + transparent favicon; reference PNG pipeline. Release: `docs/releases/v1.12.1.md`.

**v1.12.0** (`main`): **Visual Identity & Discovery Shell** — UX-0–UX-8: surface system, ToolBrowser v2, Command Palette v2, transmute shell refresh, mobile hotfixes. Plan: `docs/planning/pre_tier3_ui_ux_plan.md` · Release: `docs/releases/v1.12.0.md`.

**v1.11.0** (`main`): **Semantic Alpha Engine** — meaningful-transparency detection for PNG/WebP/GIF/BMP/TIFF → JPEG. Release: `docs/releases/v1.11.0.md`.

---

## MVP Definition (v1.0.0)

The Minimum Viable Product is **bidirectional JPEG ↔ PNG transmutation**, implemented as **two independent Rust crates** because each direction owns distinct encoding/decoding logic:

| Module | Crate | Direction | Wasm entry points (contract) |
|--------|-------|-----------|------------------------------|
| JPG transmutator | `transmutador_jpg` | `.jpg` / `.jpeg` → `.png` | `transmutar_jpg_a_png`, `transmutar_jpg_a_png_with_compression` |
| PNG transmutator | `transmutador_png` | `.png` → `.jpg` / `.jpeg` | `transmutar_png_a_jpg`, `transmutar_png_a_jpg_with_quality`, `transmutar_png_a_jpg_with_options` |

**MVP acceptance criteria:**

- [x] User drops a valid source file; invalid types are rejected with clear UI feedback.
- [x] Conversion runs entirely in a Web Worker; main thread stays responsive.
- [x] Output file is downloadable in the browser (no server upload).
- [x] Both modules compile to Wasm via `wasm-pack` and are loadable from the frontend.
- [x] Zero network requests carrying file payload.
- [x] `cargo test --workspace` and `npm run build` pass without errors.

**Beyond baseline MVP (delivered on `0.6.x` track):**

- [x] Landing + `ToolRegistry` + `/transmute/[slug]` per-tool workspace (UI-2)
- [x] Configurable options: PNG compression, JPEG quality, alpha background color (UI-3 + backend v0.5.4–v0.5.6)
- [x] Full EN/ES i18n (UI-4)
- [x] Engine hardening: dimension guards, StripAll, output integrity (v0.5.1–v0.6.6)

---

## Release Phases

### Phase 0 — Foundation ✅ `v0.1.0` (Complete)

- [x] Monorepo layout (`/frontend`, `/motor_transmutacion`)
- [x] Next.js + TypeScript + Tailwind (App Router)
- [x] Rust workspace with `core_utils`, `transmutador_jpg` (stub)
- [x] README, LICENSE, `.gitignore`
- [x] JPEG dropzone UI placeholder

### Phase 1 — Build & Bridge `v0.2.0` ✅ (Complete)

Goal: connect frontend to Wasm through a reproducible pipeline.

- [x] `wasm-pack` build script for `transmutador_jpg` (target: `web`)
- [x] Artifact output convention under `frontend/public/wasm/` (gitignored; build documented)
- [x] Web Worker scaffold in `frontend/src/workers/`
- [x] Typed message protocol (`id`, `module`, `bytes`) between UI ↔ Worker ↔ Wasm
- [x] `core_utils`: shared error types and byte-validation helpers used by all transmutators

**Exit gate:** Worker loads Wasm stub, round-trips a byte array, returns structured error from placeholder. **Met** (Architect validated 2026-06-02).

### Phase 2 — JPG → PNG `v0.3.0` ✅ (Complete)

Goal: first real transmutation path.

- [x] Implement `transmutar_jpg_a_png` using `image` crate (decode JPEG, encode PNG)
- [x] Unit tests with fixture bytes in `transmutador_jpg/tests/`
- [x] UI: accept `.jpg`/`.jpeg`, show progress, trigger download of `.png`
- [x] Error surfaces: corrupt input, empty file, unsupported file types (visible in UI)

**Exit gate:** Manual E2E — drop a real JPEG, receive valid PNG download. **Met** (Architect validated 2026-06-02).

### Phase 3 — PNG → JPG `v0.4.0` ✅ (Complete)

Goal: second independent module; proves modular architecture.

- [x] Scaffold crate `transmutador_png` in workspace
- [x] Implement `transmutar_png_a_jpg` (decode PNG, encode JPEG with quality 85 via `JpegEncoder`)
- [x] Separate Wasm build entry for `transmutador_png`
- [x] UI: format detection routes to correct module by file extension
- [x] Unit tests for `transmutador_png`

**Exit gate:** Manual E2E — drop a PNG, receive valid JPEG download. **Met** (Architect validated 2026-06-02).

### Phase 3.5 — Engine Hardening `v0.5.x`–`v0.6.6` ✅ (Complete)

Goal: align engine with transmutation science doctrine (SPEC §5) before UI polish.

- [x] Dimension guards + decompression-bomb protection (`refine_core_utils_dimensions`, v0.5.1)
- [x] StripAll metadata policy verified (`refine_metadata_policy`, v0.5.3)
- [x] PNG→JPG quality + alpha flatten (`refine_transmutador_png`, v0.5.4)
- [x] JPG→PNG RGB color-type + compression (`refine_transmutador_jpg`, v0.5.5)
- [x] Selectable background for alpha flatten (`refine_png_background_option`, v0.5.6)
- [x] Post-encode output integrity (`refine_output_integrity`, v0.6.6)

### Phase 4 — MVP Polish `v1.0.0` ✅ (Complete)

Goal: shippable MVP sign-off, not feature creep.

- [x] Unified transmutation UX: landing + per-tool `TransmutationPanel` with staged flow (UI-2, UI-3)
- [x] Loading / success / error states + size delta + local preview (UI-3)
- [x] Configurable options exposed in UI (compression, quality, background) (UI-3)
- [x] Bilingual EN/ES (UI-4)
- [x] Document run/build instructions in README
- [x] **UI-5:** Accessibility baseline (ToolCard affordance, `role="alert"`, reduced motion, mobile `dvh`)
- [x] **CI:** GitHub Actions (`cargo test`, `build:wasm`, `npm run build`)
- [x] Architect validation — `mvp_1_0_0_signoff`

**Exit gate:** Met — **v1.0.0** tagged.

---

## UI Track Summary (delivered)

| Phase | Version | Scope |
|-------|---------|-------|
| UI-1 | v0.6.1 | Design tokens, theme, primitives, Header/Footer |
| UI-2 | v0.6.2 | Landing, ToolRegistry, `/transmute/[slug]` |
| UI-3 | v0.6.3 | TransmutationPanel, OptionsControls, worker options |
| UI-4 | v0.6.4 | Full EN/ES i18n |
| UI-5 | v1.0.0 | A11y + responsive baseline ✅ |

---

## Phase 5 — Format Expansion Tier 1: WebP Suite (v1.7.x — Active)

> Full doctrine in **SPEC §12**. One conversion direction per task; QA gate between each.

### Phase 5.1 — WebP → PNG `v1.7.0` ✅ (Complete)

Goal: first WebP conversion; proves `transmutador_webp` crate pattern.

- [x] Scaffold `motor_transmutacion/transmutador_webp/` (`image` feature `webp`, `default-features = false`)
- [x] `transmutar_webp_a_png`, `transmutar_webp_a_png_with_compression`, `estimate_webp_to_png_size(compression)`
- [x] 13 integration tests (lossy/lossless/alpha/corrupt/StripAll/dimensions/estimate parity)
- [x] Worker lazy-load third Wasm module; `TransmutationModule` type extended
- [x] ToolRegistry `webp-to-png` → `status: "active"`; UI strings EN + ES
- [x] Wasm binary size: **401 KB** (NFR-7 gate: ≤ 3 MB)

### Phase 5.2 — WebP → JPEG `v1.7.2` ✅ (Complete)

Goal: second WebP conversion; alpha-flatten reuse from `transmutador_png` pattern.

- [x] Add `transmutar_webp_a_jpg_with_options`, `estimate_webp_to_jpg_size` to `transmutador_webp`
- [x] Alpha flatten policy identical to §5.5.2
- [x] Worker dual-route via `outputExtension`; fingerprint cache isolation
- [x] UI two-generation lossy warning; `detectWebpAlpha` + `TransparencyNotice` parity
- [x] ToolRegistry `webp-to-jpg` → `active`
- [x] Wasm binary size: **626 KB** (NFR-7 gate: ≤ 3 MB)

### Phase 5.3 — PNG → WebP `v1.7.3` ✅ (Complete)

Goal: first encode-direction crate; lossless VP8L only; spike gate embedded in prompt.

- [x] Spike gate: `transmutador_encode` wasm **423 KB** (≤ 3 MB)
- [x] Scaffold `motor_transmutacion/transmutador_encode/`
- [x] `transmutar_png_a_webp`, `estimate_png_to_webp_size` (CountingWriter + Seek)
- [x] `OutputFormat::WebP` in `core_utils`; RIFF WEBP magic validator
- [x] Worker lazy-load fourth module; all build scripts updated
- [x] ToolRegistry `png-to-webp` → `active`; zero option sliders; Lossless WebP copy EN+ES

### Phase 5.4 — JPEG → WebP `v1.7.6`

- [x] Add `transmutar_jpg_a_webp` + `estimate_jpg_to_webp_size` to `transmutador_encode`
- [x] Dual `encodeSource` worker routing (PNG vs JPEG on same Wasm module)
- [x] UI hint: lossless-of-lossy size inflation (§5.12.4) EN+ES
- [x] ToolRegistry `jpg-to-webp` → `active`
- [x] Wasm size gate: **649 KB** (≤ 3 MB)
- [x] **Tier 1 WebP Suite complete** (four conversion directions)

---

## Public launch baseline (v1.7.8 → v1.7.9)

Minimum trust + product surface for real users — **complete before Tier 2**:

- [x] Six high-demand conversions (JPG↔PNG + full WebP suite)
- [x] Bilingual legal pages (`/about`, `/contact`, `/privacy`, `/terms`)
- [x] Footer copyright + MIT + version
- [x] Privacy banner → policy link on landing
- [x] Production deploy (Cloudflare Workers — see `docs/DEPLOY.md`)
- [x] Post-launch hardening v1.7.9 (SECURITY.md, Dependabot, issue templates, `/contact` feedback)
- [x] Git release tags `v1.7.9` on `main`
- [x] Cloudflare main-only builds + deploy path documented
- [x] Public repo hygiene (`main` / `dev` / `contrib` — see `docs/BRANCHING.md`)
- [ ] Optional: GitHub Release notes page; contact email; Playwright smoke E2E before scale
- [ ] Optional: custom domain; `docs/SECURITY_CHECKLIST.md` manual audit

---

## Tier 2 Wave 1 — Shipped on `main` (v1.8.3 → v1.9.0)

| Milestone | Version | Deliverable | Status |
|-----------|---------|-------------|--------|
| GIF + BMP crates | v1.8.3 | 4 new tools (10 total) | ✅ |
| GIF Premium | v1.8.4 | Frame scrubber, GIF89a compositing | ✅ |
| BMP Premium | v1.8.5–v1.8.6 | Alpha semantics, meta probe, adaptive limits | ✅ |
| Limits polish | v1.8.7 | `LimitContext`, `DimensionsBlockPanel`, precise i18n errors | ✅ |
| Astro downscale | v1.9.0 | `AstroResizePanel`, canvas resize, post-resize Wasm routing | ✅ |
| Memory lifecycle | v1.9.0 | Worker recycle on exit from any `/transmute/*` route | ✅ |

Planning docs: `docs/planning/gif_premium_roadmap.md`, `bmp_premium_roadmap.md`, `wave2_astro_roadmap.md`, `adaptive_limits_proposal.md`.

---

## Tier 2 Wave 2 — Shipped on `main` (v1.10.x)

| Phase | Version | Deliverable | Status |
|-------|---------|-------------|--------|
| 7.0 TIFF spike | — | `transmutador_tiff` crate, fixtures, Wasm size gate | ✅ |
| 7.1 TIFF → PNG | v1.10.0 | Multi-page picker, 16-bit policy, palette/CMYK rejection | ✅ |
| 7.2 TIFF → JPEG | v1.10.1 | Quality + background flatten, per-page alpha | ✅ |
| 7.3 ICO → PNG | v1.10.2 | `transmutador_ico` | ✅ |
| 7.4 PNG → ICO | v1.10.3 | Single-size ICO MVP | ✅ |
| 7.5 TGA → PNG | v1.10.4 | `transmutador_tga` | ✅ |

Planning: `docs/planning/tier2_wave2_plan.md`, spike results `docs/planning/tier2_wave2_spike_results.md`.

---

## Semantic Alpha Engine — Shipped (v1.11.0)

Cross-cutting honesty fix: UI and encode both use **meaningful alpha** (pixels with α &lt; 255), not structural container flags.

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 0 | SPEC §5.5.3 + fixture catalog | ✅ |
| 1 | `core_utils::semantic_alpha` + encode alignment (all flatten paths) | ✅ |
| 2 | Wasm `assess_alpha` / `assess_page_alpha` + contract tests | ✅ |
| 3 | Frontend `lib/semantic-alpha/` + prepare/panel integration | ✅ |
| 4 | Cleanup (`pageHasAlpha` deprecate), `needsSemanticAlpha` check | ✅ |
| 5 | Release v1.11.0 on `main` | ✅ |

**Verified:** opaque RGBA TIFF (e.g. `file_example_TIFF_10MB.tiff`) no longer shows `TransparencyNotice` on TIFF→JPG.

Planning: `docs/planning/semantic_alpha_engine_plan.md`, analysis: `docs/planning/transparency_engine_proposal.md`.

---

## Post-v1.9 Horizon

| Tier | Target | Features | Notes |
|------|--------|----------|-------|
| **Tier 2 Wave 1** | v1.9.0 | GIF, BMP, limits, astro | ✅ **Shipped on `main`** |
| **Release Comms** | v1.9.0 (folded) | Onboarding + changelog modal + What's New drawer | ✅ Shipped — formal manifest entry at **v1.10.0** |
| **Tier 2 Wave 2** | **v1.10.4** (`main`) | TIFF, ICO, TGA | ✅ **Shipped** — five new tools — `docs/planning/tier2_wave2_plan.md` |
| **Semantic Alpha Engine** | **v1.11.0** (`main`) | Honest transparency across lossy tools | ✅ **Shipped** — `docs/releases/v1.11.0.md` |
| **Tier 3** | v2.0.x–v2.4.x | AVIF ✅, SVG ✅, **PWA offline (3.4)** | **In progress** — format matrix complete (21 tools); **3.4 PWA next** — `docs/planning/tier3_plan.md` |
| **Tier 4a** | v2.x | Compress, Resize | Image **optimization** — same raster domain |
| **Tier 4b** | v2.x | Crop, Rotate/Flip, favicon pack | Image **editing** |
| **Tier 5** | TBD | PDF tools | **Deferred** — documents; separate planning required |

| Backlog item | Notes |
|-------------|-------|
| `refine_jpeg_encoder_swap` | Chroma subsampling 4:4:4 / 4:2:2 (§5.5.6) — deferred |
| Playwright E2E | Smoke tests; deferred from v1.0.0 |
| PWA / offline shell | Service worker; post-Tier 1 |
| Aggregate tool-usage metrics | Anonymous conversion counters; deferred until feedback window |

**Delivered post-MVP items (moved out of backlog):** quality/compression sliders (UI-3), background color (v0.5.6), metadata strip (v0.5.3), UI-9 header/footer (v1.6.0), locale/theme FOUC fix + Scrollbar Camaleón (v1.6.1).

---

## Versioning Policy

| Bump | When |
|------|------|
| `PATCH` | Bug fixes, docs-only, non-breaking internal refactors |
| `MINOR` | New transmutator module, new UI capability, backward-compatible |
| `MAJOR` | Breaking Wasm API, workspace restructure, privacy model change |

**Note:** App (`frontend/package.json`) and engine (`motor_transmutacion` workspace) versions may diverge during parallel UI/backend tracks. README documents both.

---

## Roadmap Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-06-11 | Chief Architect (Cursor) | **v2.3.1–2.3.4 merged to `main`:** Settings panel S1–S4 (drawer, transmutation defaults, performance overrides, notices/prepare); app v2.3.4; SPEC v2.3.4-settings |
| 2026-06-08 | Chief Architect (Cursor) | **Semantic Alpha Engine (v1.11 WIP on `dev`):** `core_utils::semantic_alpha`, Wasm assess exports, frontend prepare integration; TIFF opaque RGBA false-positive fixed; Phases 0/4/5 remain before `main` |
| 2026-06-08 | Chief Architect (Cursor) | **v1.10.2–1.10.4 merged to `main`:** ICO↔PNG (`transmutador_ico`), TGA→PNG (`transmutador_tga`); 15 active tools; Wave 2 tool-complete |
| 2026-06-08 | Chief Architect (Cursor) | **v1.10.0–1.10.1 on `dev`:** `transmutador_tiff`, TIFF→PNG + TIFF→JPEG, 12 active tools; spike doc + Wave 2 plan phases 7.0–7.2 complete |
| 2026-06-08 | Chief Architect (Cursor) | Release Comms shipped (folded v1.9.0); SPEC §7.10–7.11 release policy; Tier 2 Wave 2 planning doc started |
| 2026-06-08 | Chief Architect (Cursor) | Post-launch hotfixes: Cloudflare `importWasmGlue`, overlay scrollbar hydration |
| 2026-06-08 | Chief Architect (Cursor) | **v1.9.0 shipped on `main`:** Tier 2 Wave 1 complete (GIF/BMP premium, LimitContext, astro downscale, worker memory recycle); app version 1.9.0; Tier 2 Wave 2 deferred |
| 2026-06-08 | Chief Architect (Cursor) | v1.8.3 Tier 2 Wave 1: `transmutador_gif` + `transmutador_bmp`, 4 tools (GIF/BMP → PNG/JPG), 10 active tools |
| 2026-06-08 | Chief Architect (Cursor) | v1.7.9 launch-ready: hardening complete, Cloudflare deploy fixes, snapshot updated; Tier 2 gated on user feedback |
| 2026-06-07 | Chief Architect (Cursor) | Public repo prep: `main`/`dev`/`contrib` branches; internal docs removed from `main`; `CONTRIBUTING.md` + `docs/BRANCHING.md` |
| 2026-06-07 | Chief Architect (Cursor) | v1.7.8 shipped: legal pages EN+ES, footer redesign, public-launch baseline section |
| 2026-06-07 | Chief Architect (Cursor) | Phase 5 (Tier 1 WebP suite) planned; ROADMAP snapshot updated to v1.6.1; post-v1.7 horizon added |
| 2026-06-07 | Chief Architect (Cursor) | v1.6.1 shipped: locale/theme FOUC, Scrollbar Camaleón, landing layout stability |
| 2026-06-07 | Chief Architect (Cursor) | v1.6.0 shipped: UI-9 header/footer polish, metrics UX, result cache |
| 2026-06-03 | Chief Architect (Cursor) | v1.0.0 shipped: Phase 4 complete, UI-5 baseline + CI; post-1.0 backlog (Playwright, encoder swap) |
| 2026-06-03 | Chief Architect (Cursor) | MVP acceptance criteria marked met; Phase 3.5 engine hardening + UI track (UI-1..UI-4) documented; Phase 4 narrowed to UI-5 + sign-off; post-MVP backlog refreshed |
| 2026-06-02 | Chief Architect (Cursor) | Phase 3 marked complete after OpenCode delivery review |
| 2026-06-02 | Chief Architect (Cursor) | Phase 2 marked complete after OpenCode delivery review |
| 2026-06-02 | Chief Architect (Cursor) | Phase 1 marked complete after OpenCode delivery review |
| 2026-06-02 | Chief Architect (Cursor) | Initial roadmap; MVP = JPG↔PNG as dual modules |
