# Camaleon — Product Roadmap

> Living document. Updated by the **Chief Architect (Cursor)** when scope or priorities change.
> Implementation status is reflected here after **OpenCode** delivery and **Architect validation**.

---

## North Star

**Camaleon** is a browser-local, privacy-first file transmutation platform. All conversion logic runs on the user's device via Rust/WebAssembly. No file bytes leave the browser.

---

## MVP Definition (v1.0.0)

The Minimum Viable Product is **bidirectional JPEG ↔ PNG transmutation**, implemented as **two independent Rust crates** because each direction owns distinct encoding/decoding logic:

| Module | Crate | Direction | Wasm entry point (contract) |
|--------|-------|-----------|----------------------------|
| JPG transmutator | `transmutador_jpg` | `.jpg` / `.jpeg` → `.png` | `transmutar_jpg_a_png(input: &[u8]) -> Result<Vec<u8>, String>` |
| PNG transmutator | `transmutador_png` | `.png` → `.jpg` / `.jpeg` | `transmutar_png_a_jpg(input: &[u8]) -> Result<Vec<u8>, String>` |

**MVP acceptance criteria:**

- [ ] User drops a valid source file; invalid types are rejected with clear UI feedback.
- [ ] Conversion runs entirely in a Web Worker; main thread stays responsive.
- [ ] Output file is downloadable in the browser (no server upload).
- [ ] Both modules compile to Wasm via `wasm-pack` and are loadable from the frontend.
- [ ] Zero network requests carrying file payload.
- [ ] `cargo test` / `cargo check` and `npm run build` pass without errors.

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

### Phase 4 — MVP Polish `v1.0.0`

Goal: shippable MVP, not feature creep.

- [ ] Unified dropzone UX (auto-detect source format, route to module)
- [ ] Loading / success / error states
- [ ] Basic accessibility (keyboard, ARIA on dropzone)
- [ ] Document run/build instructions in README
- [ ] Architect sign-off on SPEC compliance

**Exit gate:** All MVP acceptance criteria met.

---

## Post-MVP Horizon (Not Scheduled)

Prioritized backlog — **do not implement until MVP is signed off**:

| Priority | Feature | Notes |
|----------|---------|-------|
| P1 | WebP read/write modules | New crates: `transmutador_webp` |
| P2 | Batch transmutation | Queue in Worker; UI list |
| P3 | Quality / compression sliders | JPEG quality, PNG compression level |
| P4 | Adaptive compression presets | User-facing presets, not auto-ML |
| P5 | PWA / offline shell | Service worker, installable app |
| P6 | Contribution guidelines | `CONTRIBUTING.md`, issue templates |

---

## Versioning Policy

| Bump | When |
|------|------|
| `PATCH` | Bug fixes, docs-only, non-breaking internal refactors |
| `MINOR` | New transmutator module, new UI capability, backward-compatible |
| `MAJOR` | Breaking Wasm API, workspace restructure, privacy model change |

---

## Roadmap Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-06-02 | Chief Architect (Cursor) | Phase 3 marked complete after OpenCode delivery review |
| 2026-06-02 | Chief Architect (Cursor) | Phase 2 marked complete after OpenCode delivery review |
| 2026-06-02 | Chief Architect (Cursor) | Phase 1 marked complete after OpenCode delivery review |
| 2026-06-02 | Chief Architect (Cursor) | Initial roadmap; MVP = JPG↔PNG as dual modules |
