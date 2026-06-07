# Camaleon — Product Roadmap

> Living document. Updated by the **Chief Architect (Cursor)** when scope or priorities change.
> Implementation status is reflected here after **OpenCode** delivery and **Architect validation**.

---

## North Star

**Camaleon** is a browser-local, privacy-first file transmutation platform. All conversion logic runs on the user's device via Rust/WebAssembly. No file bytes leave the browser.

---

## Current Snapshot (2026-06-07)

| Layer | Version | Status |
|-------|---------|--------|
| **Frontend (app)** | v1.7.0 | WebP→PNG tool active; full UI polish stack from v1.6.x |
| **Engine (Rust workspace)** | v1.3.0 | JPG↔PNG + WebP→PNG; StripAll, output integrity, CountingWriter, result cache |
| **SPEC** | v1.7.0 | WebP science + Tier 1 Phase 5.1 implemented |

**v1.7.0 shipped** (2026-06-07). Next: Phase 5.2 WebP→JPEG (`phase5_webp_to_jpg`).

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
- [x] Report: `docs/reports/phase5_webp_to_png_done.md`

### Phase 5.2 — WebP → JPEG `v1.7.0-alpha.2`

Goal: second WebP conversion; alpha-flatten reuse from `transmutador_png` pattern.

- [ ] Add `transmutar_webp_a_jpg_with_options`, `estimate_webp_to_jpg_size` to `transmutador_webp`
- [ ] Alpha flatten policy identical to §5.5.2
- [ ] UI two-generation lossy warning
- [ ] ToolRegistry `webp-to-jpg` → `active`

### Phase 5.3 — PNG → WebP `v1.7.0-alpha.3`

- [ ] Spike: validate `image` crate WebP lossless encode bundle size and quality
- [ ] Scaffold `motor_transmutacion/transmutador_encode/` only if spike passes NFR-7
- [ ] `transmutar_png_a_webp`, `estimate_png_to_webp_size`
- [ ] `OutputFormat::WebP` added to `core_utils`; magic bytes validator
- [ ] ToolRegistry `png-to-webp` → `active`

### Phase 5.4 — JPEG → WebP `v1.7.0`

- [ ] Add `transmutar_jpg_a_webp` to `transmutador_encode`
- [ ] UI hint: lossless-of-lossy size inflation (§5.12.4)
- [ ] ToolRegistry `jpg-to-webp` → `active`
- [ ] v1.7.0 tag on completion of all four phases

---

## Post-v1.7 Horizon

| Tier | Target | Features | Notes |
|------|--------|----------|-------|
| **Tier 2** | v1.8.x | GIF, BMP, TIFF, ICO, TGA | Classic raster; same pipeline pattern |
| **Tier 3** | v2.0.x | AVIF, SVG, HEIC | Bundle-size spikes required |
| **Tier 4** | v2.x | Resize, Compress, Crop, Favicon, PDF | New ToolDefinition categories |

| Backlog item | Notes |
|-------------|-------|
| `refine_jpeg_encoder_swap` | Chroma subsampling 4:4:4 / 4:2:2 (§5.5.6) — deferred |
| Playwright E2E | Smoke tests; deferred from v1.0.0 |
| PWA / offline shell | Service worker; post-Tier 1 |
| `CONTRIBUTING.md` + issue templates | Community onboarding |

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
| 2026-06-07 | Chief Architect (Cursor) | Phase 5 (Tier 1 WebP suite) planned; ROADMAP snapshot updated to v1.6.1; post-v1.7 horizon added |
| 2026-06-07 | Chief Architect (Cursor) | v1.6.1 shipped: locale/theme FOUC, Scrollbar Camaleón, landing layout stability |
| 2026-06-07 | Chief Architect (Cursor) | v1.6.0 shipped: UI-9 header/footer polish, metrics UX, result cache |
| 2026-06-03 | Chief Architect (Cursor) | v1.0.0 shipped: Phase 4 complete, UI-5 baseline + CI; post-1.0 backlog (Playwright, encoder swap) |
| 2026-06-03 | Chief Architect (Cursor) | MVP acceptance criteria marked met; Phase 3.5 engine hardening + UI track (UI-1..UI-4) documented; Phase 4 narrowed to UI-5 + sign-off; post-MVP backlog refreshed |
| 2026-06-02 | Chief Architect (Cursor) | Phase 3 marked complete after OpenCode delivery review |
| 2026-06-02 | Chief Architect (Cursor) | Phase 2 marked complete after OpenCode delivery review |
| 2026-06-02 | Chief Architect (Cursor) | Phase 1 marked complete after OpenCode delivery review |
| 2026-06-02 | Chief Architect (Cursor) | Initial roadmap; MVP = JPG↔PNG as dual modules |
