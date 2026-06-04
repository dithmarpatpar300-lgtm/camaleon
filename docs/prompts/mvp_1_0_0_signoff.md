SYSTEM DIRECTIVE: Act as a Senior Full-Stack Engineer for the Camaleon project (Rust/Wasm engine + Next.js frontend).
Read `docs/SPEC.md` (**§5.5.6**, **§5.11**, **§7.4–§7.8**, **§8** NFRs) and `docs/ROADMAP.md` before any action.
All source code, comments, and the technical report must be strictly in English.
Do not modify `docs/ROADMAP.md` (Chief Architect owns roadmap updates after validation).

> **PREREQUISITE:** App **v0.6.4** (UI-1..UI-4) and engine **v0.6.6** (`refine_output_integrity`) must be present. Confirm `TransmutationPanel`, i18n, `validate_output`, and both Wasm modules build before starting.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read ROADMAP Phase 4 exit gate and MVP acceptance criteria (all core items already met; this task **closes** the remaining engineering sign-off items for **v1.0.0**).
2. Inventory the six deliverable pillars below (Alta → Baja). Plan execution order: **(A)** backend encoder swap + options refactor + round-trip tests → **(B)** CI workflow → **(C)** UI-5 a11y/responsive → **(D)** Playwright E2E → **(E)** version bump + docs.
3. For `refine_jpeg_encoder_swap` (§5.5.6): confirm `jpeg-encoder` compiles to `wasm32-unknown-unknown` before committing to full migration; keep **default 4:2:0** behavior identical to today for unchanged call paths.
4. For Playwright: Wasm artifacts are **gitignored** — CI and local E2E must run `build:wasm` before tests. Use **tiny synthetic fixtures** (do not commit large photos).
5. Explicitly **defer** post-v1.0.0 work (document in report §6): transparency pre-notice UX, WebP module, batch queue, `[locale]` routing, PWA, new format crates.
6. State assumptions and trade-offs in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `mvp_1_0_0_signoff`
PHASE: MVP release — v1.0.0 engineering sign-off (code quality + UI-5 + CI + E2E)
OBJECTIVE: Deliver all remaining **code-quality** pillars required to tag **Camaleon v1.0.0**: accessibility/responsive sign-off (UI-5), JPEG encoder swap with chroma subsampling control (§5.5.6), Playwright E2E, GitHub Actions CI, round-trip output tests, and internal `Quality`/`Compression` types in options structs — then bump versions and update SPEC/README.

---

CONTEXT

- **Functional MVP** is already met (bidirectional JPEG ↔ PNG, options, i18n, privacy, speed). This task is **hardening + sign-off**, not new product features.
- **Post-v1.0.0 layer** (separate future prompts): UI/UX polish beyond a11y baseline (transparency notice, drag-over-page, toasts) and new capabilities (WebP, batch, locale metadata). **Do not implement those here.**

### The six pillars (all required)

| Priority | Pillar | Summary |
|----------|--------|---------|
| **Alta** | **UI-5 — Accessibility & responsive** | Keyboard, ARIA, focus-visible, `prefers-reduced-motion`, ToolCard affordance without hover-only, mobile layout |
| **Media** | **`refine_jpeg_encoder_swap`** | Replace JPEG encode path with `jpeg-encoder`; `ChromaSubsampling` enum; default `4:2:0` preserved |
| **Media** | **Playwright E2E** | Automated smoke: both tool routes, stage file, transmute, download |
| **Baja** | **Round-trip output validation** | Opt-in test helper: re-decode output, match dimensions (transmutator crates only) |
| **Baja** | **GitHub Actions CI** | `cargo test --workspace`, `npm run build:wasm`, `npm run build`, optional Playwright job |
| **Baja** | **Options struct newtypes** | `PngToJpgOptions.quality: Quality`, `JpgToPngOptions.compression: Compression` internally |

---

REQUIREMENTS

### R1 — UI-5: Accessibility & responsive sign-off (Alta)

Complete the UI track item deferred from UI-4. Touch **only** what is needed for sign-off; token-driven; preserve i18n.

**Accessibility (minimum bar):**

| Area | Requirement |
|------|-------------|
| **ToolCard** | "Transmutar" affordance **visible without hover** on active cards (e.g. always show at reduced opacity, or visible on `:focus-within` / keyboard focus). Must not rely solely on `group-hover:opacity-100`. |
| **Dropzone** | Retain `role="button"`, `tabIndex`, Enter/Space; localized `aria-label` via `t()`. |
| **OptionsControls** | Presets/sliders/swatches: `aria-pressed`, `aria-label`, visible `focus-visible` ring (already partial — audit and fix gaps). |
| **TransmutationPanel** | Error region: `role="alert"` or `aria-live="polite"` on error/success transitions. Preview `alt` already localized — verify. |
| **Header** | `LanguageSelector` + `ThemeToggle`: `aria-current`, descriptive `aria-label` (i18n). |
| **Landmarks** | `<main>` already present; ensure single logical `h1` per page. |
| **Motion** | Respect `prefers-reduced-motion: reduce` in `globals.css` — disable or shorten non-essential transitions (card hover shadow, opacity transitions). |

**Responsive (minimum bar):**

| Breakpoint | Requirement |
|------------|-------------|
| **Mobile (`<640px`)** | Header: language + theme remain usable; nav does not overflow. ToolGrid: single column. `TransmutationPanel`: staged card, options, and action buttons usable at 320px width; no horizontal scroll on panel content. |
| **Touch** | Interactive targets ≥ 44×44px where feasible (buttons; color swatches may stay smaller if grouped has adequate spacing — document). |

**Verification:** Manual checklist in report + `npm run build` passes. Optional: document `npm run lint` if configured.

**Do NOT add in R1:** locale URL routing, transparency pre-notice banner, WebP, batch UI.

### R2 — JPEG encoder swap + chroma subsampling (Media — §5.5.6)

Replace the PNG→JPEG **encode** implementation in `transmutador_png` (decode may stay on `image` crate).

**Backend:**

1. Add dependency: **`jpeg-encoder`** (pure Rust — do **not** use `mozjpeg` unless `jpeg-encoder` fails Wasm build; document failure).
2. Introduce:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ChromaSubsampling {
    S444,  // 4:4:4 — max chroma fidelity (text/screenshots)
    S422,  // 4:2:2
    S420,  // 4:2:0 — default, photographic
}
```

3. Extend `PngToJpgOptions` with `subsampling: ChromaSubsampling` (default `S420`).
4. Replace `encode_rgb_to_jpeg` (currently `image::JpegEncoder`) with `jpeg-encoder` API; map enum → `set_sampling_factor` (or equivalent per crate docs).
5. **Preserve existing Wasm exports** — add **one** new export OR extend `_with_options`:

   - **Preferred:** extend `transmutar_png_a_jpg_with_options(bytes, quality, bg_r, bg_g, b, subsampling: u8)` where `subsampling` encodes `0=S420, 1=S422, 2=S444` (document mapping); validate invalid values → `Err`.
   - **Alternative:** new `transmutar_png_a_jpg_with_full_options(...)` if extending breaks JS glue — document choice.

6. Defaults unchanged for `transmutar_png_a_jpg` and `transmutar_png_a_jpg_with_quality`: **Q85, white background, S420**.
7. Run `wasm-pack build` for `transmutador_png`; update `frontend/src/types/wasm-modules.d.ts` if signatures change.
8. Integration tests:
   - Default path still produces valid JPEG (magic bytes + `validate_output`).
   - `S444` vs `S420` on a **synthetic** high-contrast PNG (e.g. red/blue edges) produces **different** output bytes at same quality (proves subsampling works).
   - All existing `transmutador_png` tests still pass.

**Worker (minimal wiring):**

- Extend `TransmutationOptions` with optional `subsampling?: 0 | 1 | 2` (or typed union).
- Route in `transmutation.worker.ts` when `options.subsampling != null` → call extended Wasm export.
- **Do NOT add UI slider for subsampling in this task** — worker/protocol only so post-v1.0 UI can expose it without another Wasm change.

**Bump `motor_transmutacion` workspace** to **1.0.0** (align with release).

### R3 — Playwright E2E smoke tests (Media)

Add automated browser tests for regression safety.

1. Add `@playwright/test` as **devDependency** in `frontend/package.json`.
2. Add `playwright.config.ts` (baseURL `http://localhost:3000` or use `webServer` to run `next start` after build).
3. Create `frontend/e2e/` with at least:

| Test | Flow |
|------|------|
| `landing.spec.ts` | `/` loads; both active tool cards visible; navigate to each slug |
| `jpg-to-png.spec.ts` | `/transmute/jpg-to-png` → attach small `.jpg` fixture → Transmutar → success state → download button present |
| `png-to-jpg.spec.ts` | `/transmute/png-to-jpg` → attach small `.png` fixture → Transmutar → success → download |

4. Add **tiny fixtures** under `frontend/e2e/fixtures/` (generate minimal valid JPEG/PNG in test setup OR commit <5KB files).
5. Scripts:

```json
"test:e2e": "playwright test",
"test:e2e:ci": "playwright test --reporter=line"
```

6. Document in README: E2E requires `npm run build:wasm` first.

**Scope limit:** Smoke tests only — no visual regression, no i18n matrix, no options permutation matrix.

### R4 — Round-trip output validation — tests only (Baja — §5.11.3)

Implement **opt-in** helper in **transmutador crates** (not `core_utils` — preserves decode-free boundary):

```rust
// transmutador_jpg/tests/ or src/test_utils.rs (cfg(test) or pub for integration)
fn assert_roundtrip_dimensions(input_bytes: &[u8], output_bytes: &[u8]) -> Result<(), String>
```

- Decode input dimensions (via `image::ImageReader` or `core_utils::probe_dimensions` on input).
- Decode output; assert width/height match input (post-transmutation raster dimensions).
- Call from integration tests on `converts_valid_jpg_to_png` and `converts_valid_png_to_jpg` (and alpha flatten case).

**Do not** enable round-trip in production `_inner` hot path (too expensive).

### R5 — GitHub Actions CI (Baja)

Create `.github/workflows/ci.yml`:

| Job | Steps |
|-----|--------|
| **rust** | `actions/checkout`, install stable Rust, `cargo test --workspace` from `motor_transmutacion/` |
| **frontend** | checkout, Node LTS, `cd frontend && npm ci`, install `wasm-pack` (or use `cargo install` / prebuilt), `npm run build:wasm`, `npm run build` |
| **e2e** (optional second job or merged) | After frontend build: `npx playwright install --with-deps chromium`, `npm run test:e2e:ci` with `webServer` |

- Fail fast on any step failure.
- Cache `target/` and `npm` where practical.
- Do **not** commit `frontend/public/wasm/` — CI must build Wasm every run.

### R6 — Options structs use newtypes internally (Baja — §5.11.4)

Harden type safety beyond Wasm boundary:

- Change `PngToJpgOptions.quality` from `u8` to `Quality` (private field; construct via `Quality::try_new` or `Quality::DEFAULT`).
- Change `JpgToPngOptions.compression` from `u8` to `Compression`.
- Update `png_bytes_to_jpg_bytes` / `jpg_bytes_to_png_bytes` to use `.value()` only after options are constructed.
- Wasm exports: parse `u8` → `try_new` → build options struct with newtypes.
- Fix all tests and call sites.

### R7 — Version bump & documentation (release v1.0.0)

Align release identifiers:

| File | New version |
|------|-------------|
| `frontend/package.json` | `1.0.0` |
| `frontend/src/components/layout/Footer.tsx` | `1.0.0` |
| `motor_transmutacion/Cargo.toml` `[workspace.package]` | `1.0.0` |
| `README.md` | App **v1.0.0** / Engine **v1.0.0** |
| `docs/SPEC.md` | **1.0.0**; status = MVP signed off; UI-5 ✅; §5.8 `refine_jpeg_encoder_swap` ✅; Phase 4 complete |

Update `docs/SPEC.md`:

- §5.5.6: encoder swap implemented; note `jpeg-encoder` choice.
- §7.8: UI-5 ✅ v1.0.0.
- §7.4: UI-5 complete note.
- §11: Amendment log → `mvp_1_0_0_signoff_done.md`.

**Do not** modify `docs/ROADMAP.md`.

### R8 — Report follow-ups (post-v1.0.0 backlog)

In `docs/reports/mvp_1_0_0_signoff_done.md` §6, list explicitly for **next prompts**:

- UI/UX layer: transparency pre-notice, drag-over-page, locale `generateMetadata`, toasts.
- Features layer: WebP, batch, subsampling **UI control**, PWA.
- Optional: size-coherence heuristic, `CONTRIBUTING.md`, benchmarks table.

---

CONSTRAINTS

- **Preserve privacy model** (NFR-1): no network upload of file bytes in app code or tests (fixtures local only).
- **Preserve StripAll** and existing defaults when options omitted.
- **Backward compatible** where possible: existing Wasm export names should keep working; new parameters only on extended export.
- **No** WebP implementation, **no** batch queue, **no** `[locale]` routes, **no** transparency UX banner in this task.
- English for code/comments/report.
- Run full verification before report (see R9).

---

### R9 — Verification matrix

| Command | Must pass |
|---------|-----------|
| `cargo test --workspace` | All Rust tests (including new round-trip + subsampling) |
| `npm run build:wasm` | Both modules build after encoder swap |
| `npm run build` | Next.js production build |
| `npm run test:e2e` | Playwright smoke (local; document if skipped in CI due to env) |
| Manual | UI-5 checklist: keyboard nav landing → tool → transmute; mobile 375px |

---

DELIVERABLES

1. UI-5 a11y + responsive fixes (R1).
2. `jpeg-encoder` swap + `ChromaSubsampling` + Wasm/worker extension (R2).
3. Playwright E2E + fixtures + npm scripts (R3).
4. Round-trip test helpers + integration test calls (R4).
5. `.github/workflows/ci.yml` (R5).
6. Options struct newtype refactor (R6).
7. Version **1.0.0** + `docs/SPEC.md` + README (R7).
8. `docs/reports/mvp_1_0_0_signoff_done.md` (R8).

---

EXIT GATE (self-check before report)

- [ ] ToolCard affordance and interactive controls work with keyboard; focus visible; reduced motion respected.
- [ ] Layout usable at 320px width on tool pages.
- [ ] PNG→JPEG uses `jpeg-encoder`; `S420` default; `S444` provably changes output vs `S420` on test fixture.
- [ ] Wasm builds; `wasm-modules.d.ts` accurate; worker routes subsampling when provided.
- [ ] Playwright: 3+ smoke tests pass after `build:wasm`.
- [ ] CI workflow runs rust + frontend (+ e2e if included).
- [ ] Round-trip dimension tests pass on both transmutators.
- [ ] `PngToJpgOptions` / `JpgToPngOptions` use `Quality` / `Compression` internally.
- [ ] All versions show **1.0.0**; SPEC UI-5 + §5.5.6 marked delivered.
- [ ] Post-v1.0.0 items listed in report, not implemented.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
