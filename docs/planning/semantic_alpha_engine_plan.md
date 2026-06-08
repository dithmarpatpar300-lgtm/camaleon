# Semantic Alpha Engine — Implementation Plan

**Status:** **Implementation in progress on `dev`** — core engine shipped; release polish pending  
**Target release:** v1.11.0 (`main` when stable)  
**Branch:** `dev` only until QA + SPEC + release notes complete  
**Supersedes:** open questions in `transparency_engine_proposal.md`  
**Prerequisite doc:** [transparency_engine_proposal.md](./transparency_engine_proposal.md) (problem analysis)

---

## Implementation progress (2026-06-08)

### Done on `dev`

| Area | Deliverable | Status |
|------|-------------|--------|
| **Rust core** | `core_utils::semantic_alpha` — `AlphaAssessment`, `AlphaConfidence`, raster sample (8192 px), probe downscale (512 px), header gates (PNG/WebP/GIF), `AlphaAssessmentJs` (wasm feature) | ✅ |
| **Encode alignment** | All flatten paths use `dynamic_image_has_meaningful_alpha` — BMP, TIFF, PNG, WebP, GIF, ICO, TGA | ✅ |
| **Wasm assess** | `assess_alpha` — BMP, PNG, WebP, GIF · `assess_page_alpha` — TIFF | ✅ |
| **Rust tests** | `core_utils` unit tests; TIFF `rgba_opaque` + `real_rgba` assess tests; WebP fixture updated for meaningful alpha | ✅ |
| **Frontend** | `lib/semantic-alpha/` router; `run-prepare.ts` + `TransmutationPanel` (TIFF page change, resize re-assess); `PreparedFileContext.alphaAssessment` | ✅ |
| **Build** | `cargo test --workspace`, `npm run build:wasm`, `npm run build` pass | ✅ |
| **Manual QA** | `file_example_TIFF_10MB.tiff` on TIFF→JPG — **no false transparency notice** | ✅ verified |

### Not done yet (blocks v1.11.0 on `main`)

| Item | Phase |
|------|-------|
| `assess_entry_alpha` / `assess_alpha` for ICO/TGA (optional until lossy tools exist) | 2 |
| Full manual QA matrix (PNG/WebP/GIF/BMP opaque vs real alpha) | 4 |
| App version 1.11.0, What's New, GitHub release, merge `dev` → `main` | 5 |

---

## 1. Executive summary

Camaleon will introduce a **Semantic Alpha Engine**: a centralized policy and shared primitives that answer one question consistently across the stack:

> Does this image have **meaningful** transparency — pixels that would look different if alpha were ignored?

Only transmutators that **flatten alpha onto a background** (lossy → JPEG today) consume the engine at prepare time. Lossless tools and formats without alpha (JPEG sources) do not load semantic probes.

The TIFF false positive (`samples_per_pixel >= 4` vs real transparency) is the visible symptom. The same class of silent mismatch exists for PNG, WebP, GIF, ICO, and TGA. BMP is the reference implementation to generalize.

**No isolated TIFF hotfix.** The engine ships as one coordinated v1.11 initiative.

---

## 2. Decisions locked

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| **D1** | Expose structural + meaningful in UI? | **Meaningful only** in production UI (`TransparencyNotice`, background picker). Structural alpha stays internal (`AlphaAssessment.has_alpha_channel`) for tests, telemetry, and future dev tools. | Users care about visible transparency, not container metadata. |
| **D2** | Global sample budget? | **`MAX_ALPHA_PROBE_SAMPLES = 8192`** in `core_utils`, stratified grid over raster. Images with `width × height ≤ 8192` get a **full scan**. | Matches proven BMP constant; predictable cost. |
| **D3** | PNG opaque RGBA — same release? | **Yes — v1.11.0 includes all lossy-input tools together.** | One honesty pass; avoids partial fixes. |
| **D4** | Code naming? | **Semantic Alpha Engine** (product). Rust: `core_utils::semantic_alpha`. Types: `AlphaAssessment`, `AlphaConfidence`. Frontend: `lib/semantic-alpha/`. | User-approved name; avoids vague `TransparencyEngine`. |
| **D5** | Which tools opt in? | **Automatic:** any active tool with `optionSpecs` containing `kind: "color", key: "background"`. Today: `png-to-jpg`, `webp-to-jpg`, `gif-to-jpg`, `bmp-to-jpg`, `tiff-to-jpg`. Future tools (e.g. `tga-to-jpg`, `ico-to-jpg`) inherit by adding the same option spec. | No manual registry drift. |
| **D6** | JS vs Wasm source of truth? | **Wasm only** for semantic assessment at prepare time. Deprecate UI use of `detect-png-alpha`, `detect-webp-alpha`, `detect-gif-alpha`, and BMP JS sampling for `hasAlpha`. Keep header parsers only where needed for sniffer/meta, not for transparency notice. | Eliminates dual implementation bugs. |
| **D7** | Prepare vs encode strictness? | **Two-tier, aligned policy:** Prepare uses **probe decode** (see §5.3); encode uses **full decode + `rgba_has_meaningful_alpha`**. Encode must also skip flatten when meaningful alpha is false (PNG/WebP today still flatten on structural alpha — fix in Phase 1). | Prepare may be approximate; encode is authoritative. Probe decode minimizes false negatives. |
| **D8** | Premultiplied / associated alpha? | Any pixel with `α < 255` counts as meaningful. No premultiply unpremultiply in probe. | Matches existing BMP/TIFF encode behavior; simpler and conservative. |
| **D9** | GIF transparency? | Structural: GCE disposal + transparent color index. Semantic: decode up to **first 4 frames** (or all if fewer) at probe resolution; meaningful if any sampled pixel uses transparent index or non-opaque RGBA after composite. | Byte scan alone is insufficient for animated GIF. |
| **D10** | tRNS (PNG indexed/RGB)? | Structural: `tRNS` chunk or color types 4/6. Semantic: after probe decode, check decoded RGBA for `α < 255`. | Indexed PNG with tRNS but no visible transparency → no notice. |

---

## 3. Scope matrix

### 3.1 Tools that consume the engine (prepare + UI)

| Tool | Source format | Wasm crate | Index key | Current UI bug risk |
|------|---------------|------------|-----------|---------------------|
| `png-to-jpg` | PNG | `transmutador_png` | — | Structural RGBA / tRNS |
| `webp-to-jpg` | WebP | `transmutador_webp` | — | VP8X alpha bit |
| `gif-to-jpg` | GIF | `transmutador_gif` | `frameIndex` (future; today frame 0) | GCE byte heuristic |
| `bmp-to-jpg` | BMP | `transmutador_bmp` | — | ✅ Already semantic (migrate into engine) |
| `tiff-to-jpg` | TIFF | `transmutador_tiff` | `pageIndex` | ✅ Fixed — `assess_page_alpha` |

### 3.2 Tools that do NOT consume the engine

| Category | Examples | Why |
|----------|----------|-----|
| JPEG / no-alpha sources | `jpg-to-png`, `jpg-to-webp` | No alpha channel |
| Lossless alpha preservation | `png-to-webp`, `tiff-to-png`, `tga-to-png`, `ico-to-png`, `gif-to-png`, `bmp-to-png`, `webp-to-png` | Output keeps alpha; no flatten notice |
| Encode-only | `png-to-ico` | ICO composition uses alpha differently — **future adapter**, not v1.11 |
| Resize re-entry | PNG resize → JPG path in panel | Re-assess via engine on resized bytes |

### 3.3 Encode-path alignment (all `transmutador_*` with flatten)

**Done on `dev`:** every flatten branch uses `core_utils::semantic_alpha::dynamic_image_has_meaningful_alpha` (full raster at encode time). UI prepare uses probe downscale + sample via `assess_*` Wasm exports.

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     frontend prepare pipeline                    │
│  needsSemanticAlpha(tool) ──► assessSemanticAlpha(tool, bytes)  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              lib/semantic-alpha/assess.ts (router)               │
│   dispatches to per-crate wasm client by tool.fromFormat         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 transmutador_png      transmutador_tiff       transmutador_bmp
 .assess_alpha()        .assess_page_alpha(i)   .assess_alpha()
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  core_utils::semantic_alpha                      │
│  AlphaAssessment · rgba_has_meaningful_alpha · probe helpers     │
│  MAX_ALPHA_PROBE_SAMPLES · flatten_rgba_on_background (future)  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              TransmutationPanel / StagedWorkspace                │
│  TransparencyNotice iff assessment.has_meaningful_alpha          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.1 Rust module layout (`core_utils`)

```
core_utils/src/
  semantic_alpha/
    mod.rs           # re-exports
    assessment.rs    # AlphaAssessment, AlphaConfidence
    raster.rs        # rgba_has_meaningful_alpha, sampled scan
    probe.rs         # downscale + decode helpers shared by crates
```

### 4.2 Shared types (Rust)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AlphaConfidence {
    /// No alpha channel possible (RGB JPEG, grayscale TIFF, etc.)
    None,
    /// Header/tags only; no pixel data examined
    Structural,
    /// Pixel sample or downscaled decode
    Sampled,
    /// Full raster (encode path only)
    Full,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AlphaAssessment {
    pub has_alpha_channel: bool,
    pub has_meaningful_alpha: bool,
    pub confidence: AlphaConfidence,
}

impl AlphaAssessment {
    pub const OPAQUE: Self = Self {
        has_alpha_channel: false,
        has_meaningful_alpha: false,
        confidence: AlphaConfidence::None,
    };
}
```

### 4.3 Wasm export convention (per crate)

Each alpha-capable `transmutador_*` adds:

```rust
#[wasm_bindgen]
pub fn assess_alpha(input: &[u8]) -> Result<JsAlphaAssessment, JsValue>

// TIFF, GIF (future frame), ICO (future entry):
#[wasm_bindgen]
pub fn assess_page_alpha(input: &[u8], index: u32) -> Result<JsAlphaAssessment, JsValue>
```

`JsAlphaAssessment` mirrors the struct for TypeScript.

### 4.4 TypeScript surface

```ts
// frontend/src/lib/semantic-alpha/types.ts
export type AlphaConfidence = "none" | "structural" | "sampled" | "full";

export type AlphaAssessment = {
  hasAlphaChannel: boolean;
  hasMeaningfulAlpha: boolean;
  confidence: AlphaConfidence;
};

// frontend/src/lib/semantic-alpha/assess.ts
export async function assessSemanticAlpha(
  tool: ToolDefinition,
  bytes: ArrayBuffer,
  ctx?: { pageIndex?: number; entryIndex?: number; frameIndex?: number }
): Promise<AlphaAssessment>;
```

### 4.5 Prepare context migration

```ts
// PreparedFileContext (types.ts)
alphaAssessment: AlphaAssessment | null;  // null when tool doesn't need engine

// Transitional alias (remove in v1.12):
// hasAlpha → alphaAssessment?.hasMeaningfulAlpha ?? false
```

---

## 5. Per-format adapter specification

### 5.1 Probe pipeline (all formats)

Every adapter follows the same three steps:

1. **Structural gate** — Can this format/page even have alpha? If no → `AlphaAssessment::OPAQUE`.
2. **Probe raster** — Obtain RGBA at ≤512 px max edge (preserve aspect) without full-quality decode when possible.
3. **Semantic scan** — `rgba_has_meaningful_alpha_sampled(rgba, MAX_ALPHA_PROBE_SAMPLES)`.

### 5.2 Format-specific structural gates

| Format | `has_alpha_channel = true` when | Notes |
|--------|----------------------------------|-------|
| **PNG** | IHDR color type 4 or 6, or `tRNS` present | |
| **WebP** | VP8X alpha bit, or lossless decode reports alpha | |
| **GIF** | GCE transparent color flag in any frame header region | Cheap pre-scan before decode |
| **BMP** | bit count 32 (BI_RGB/RLE) | |
| **TIFF** | Decoder color type GrayA/RGBA **or** `samples_per_pixel >= 4` with ExtraSamples | Structural only; never short-circuit to meaningful |
| **ICO** | Entry is PNG or BMP ≥32 bpp | Decode selected entry |
| **TGA** | Image type with alpha (15, 16, etc.) | From `tga_probe` |

### 5.3 Probe raster strategy

| Format | Strategy |
|--------|----------|
| PNG, WebP, BMP, TGA, ICO | Decode via existing crate decoder; resize with `image::imageops::resize` to max 512 px before semantic scan |
| TIFF | `decode_tiff_page` → resize → semantic scan (page index from context) |
| GIF | Decode frames 0..min(3, n-1) composited on checkerboard or explicit RGBA; any meaningful → true |

**Cost budget:** Probe decode at 512 px on a 10 MB TIFF is acceptable during prepare (wasm module already loaded). Document in SPEC as allowed prepare work.

### 5.4 Encode path (full raster)

All crates replace:

```rust
if img.color().has_alpha() { flatten... }
```

with:

```rust
if semantic_alpha::rgba_has_meaningful_alpha(&img.to_rgba8()) { flatten... }
```

Shared `flatten_rgba_on_background` may move to `core_utils` in Phase 2 (optional DRY; not blocking).

---

## 6. Implementation phases

### Phase 0 — Spec & fixtures — **✅ complete on `dev`**

- [x] Add SPEC §5.5.3 **Semantic Alpha Engine** (definitions, probe vs encode, honesty rule).
- [x] Add `docs/fixtures/semantic-alpha/README.md` describing fixture naming.
- [ ] Create or document fixtures:
  - [x] `opaque-rgba.tiff` — synthetic in `transmutador_tiff/tests/spike_fixtures.rs` (`rgba_opaque`)
  - [x] `opaque-rgba.png`, `real-alpha.png` (committed fixtures)
  - [x] `opaque-rgba.bmp` — exists in `transmutador_bmp` tests
  - [x] `real-alpha.webp`, `opaque-rgba.webp`
  - [x] `transparent-gif.gif`, `opaque-gif.gif`, `rgb-no-alpha.gif`
  - [x] `opaque-rgba.tiff`, `real-alpha.tiff`
  - [x] External regression: `file_example_TIFF_10MB.tiff` (manual QA verified)

### Phase 1 — `core_utils::semantic_alpha` — **✅ complete on `dev`**

- [x] Implement `AlphaAssessment`, `rgba_has_meaningful_alpha`, `rgba_has_meaningful_alpha_sampled`.
- [x] Unit tests: all opaque, single transparent pixel, full small image.
- [x] Migrate BMP `bmp_probe` sampling to call shared sampled function.
- [x] Update `transmutador_bmp`, `transmutador_tiff`, `transmutador_ico`, `transmutador_tga` encode paths to use `core_utils`.
- [x] Fix `transmutador_png` and `transmutador_webp` encode to meaningful alpha.

### Phase 2 — Wasm assess exports — **✅ complete on `dev`**

| Crate | Export | Test |
|-------|--------|------|
| `transmutador_bmp` | `assess_alpha` | ✅ export + contract test |
| `transmutador_tiff` | `assess_page_alpha` | ✅ export + contract test |
| `transmutador_png` | `assess_alpha` | ✅ export + contract test |
| `transmutador_webp` | `assess_alpha` | ✅ export + contract test |
| `transmutador_gif` | `assess_alpha` | ✅ export + contract test |
| `transmutador_ico` | `assess_entry_alpha` | deferred (no lossy tool) |
| `transmutador_tga` | `assess_alpha` | deferred (no lossy tool) |

- [x] Regenerate wasm packs / CI wasm build.
- [x] Contract test per crate: `assess_*` meaningful === encode flatten decision.

### Phase 3 — Frontend integration — **✅ complete on `dev`**

- [x] Create `lib/semantic-alpha/` (`types.ts`, `assess.ts`, `needs-semantic-alpha.ts`).
- [x] `run-prepare.ts`: replace `detectAlphaForTool` / `pageHasAlpha` with `assessSemanticAlpha`.
- [x] `TransmutationPanel`: TIFF page change calls `assess_page_alpha`; store `alphaAssessment`.
- [x] `TransparencyNotice` via `hasAlpha` prop (fed by `hasMeaningfulAlpha` from engine).
- [x] Resize-to-JPG re-assess path uses engine.
- [x] Removed format-specific alpha detectors from prepare (files retained for other uses).

### Phase 4 — Cleanup & parity — **mostly complete on `dev`**

- [x] Deprecate `TiffMeta.pageHasAlpha` in TS bindings (Rust retained for diagnostics).
- [x] Align `source-image-meta` `hasMeaningfulAlpha` with engine assessment only.
- [x] Re-assess alpha when user reverts astro resize (`handleAdjustAndRetry`).
- [x] i18n: no copy change required (strings already say "transparency").
- [x] Manual smoke: TIFF opaque file → no blue banner (user verified).
- [ ] Full manual QA matrix (§8.4) for PNG, WebP, GIF, BMP.
- [x] Frontend check: `npm run test:semantic-alpha` (`needsSemanticAlpha` registry parity).

### Phase 5 — Release v1.11.0 — **blocked on Phases 0 + 4**

- [ ] `frontend/package.json` → 1.11.0
- [ ] Release entry `v1.11.0` + What's New highlight: "Honest transparency detection"
- [ ] README + ROADMAP: mark Semantic Alpha Engine shipped on `main`
- [ ] Merge `dev` → `main` after stability sign-off

**Remaining work:** Phase 4 manual QA matrix, Phase 5 release — then merge to `main`.

---

## 7. File change checklist

### New files

| Path | Purpose |
|------|---------|
| `motor_transmutacion/core_utils/src/semantic_alpha/mod.rs` | Module root |
| `motor_transmutacion/core_utils/src/semantic_alpha/assessment.rs` | Types |
| `motor_transmutacion/core_utils/src/semantic_alpha/raster.rs` | Pixel semantics |
| `frontend/src/lib/semantic-alpha/types.ts` | TS types |
| `frontend/src/lib/semantic-alpha/assess.ts` | Router |
| `frontend/src/lib/semantic-alpha/needs-semantic-alpha.ts` | Tool predicate |

### Modified (high touch)

| Path | Change |
|------|--------|
| `frontend/src/lib/transmutation/prepare/run-prepare.ts` | Engine integration |
| `frontend/src/lib/transmutation/prepare/types.ts` | `alphaAssessment` |
| `frontend/src/components/transmute/TransmutationPanel.tsx` | Page/entry reassessment |
| `frontend/src/components/transmute/StagedWorkspace.tsx` | Notice gate |
| `motor_transmutacion/transmutador_tiff/src/tiff_decode.rs` | Remove UI reliance on `page_likely_has_alpha` for meaningful |
| `motor_transmutacion/transmutador_tiff/src/lib.rs` | `assess_page_alpha` export |
| `motor_transmutacion/transmutador_png/src/lib.rs` | Meaningful encode + assess |
| `motor_transmutacion/transmutador_webp/src/lib.rs` | Meaningful encode + assess |
| `motor_transmutacion/transmutador_gif/src/lib.rs` | assess + meaningful encode check |
| `docs/SPEC.md` | §5.5.3 |

### Deprecated (post-migration)

| Path | Fate |
|------|------|
| `frontend/src/lib/format/detect-png-alpha.ts` | Keep for sniffer; remove from prepare |
| `frontend/src/lib/format/detect-webp-alpha.ts` | Same |
| `frontend/src/lib/format/detect-gif-alpha.ts` | Same |
| `frontend/src/lib/format/detect-bmp-alpha.ts` | Keep `inspectBmpMeta`; remove `bmpHasMeaningfulAlpha` from prepare |

---

## 8. Testing strategy

### 8.1 Rust unit tests (`core_utils`)

- Empty RGBA → false
- All α=255 → false
- One α=0 → true
- Sampled scan finds rare transparent pixel in large image

### 8.2 Per-crate contract tests

```text
assess_*(fixture_opaque_rgba) → has_meaningful_alpha == false
transmute_*_to_jpg(fixture_opaque_rgba) → output identical regardless of background
assess_*(fixture_real_alpha) → has_meaningful_alpha == true
transmute with bg white vs black → different output bytes
```

### 8.3 Frontend

- Unit test `needsSemanticAlpha` against `TOOLS` registry
- Mock wasm: prepare returns assessment; panel shows/hides notice

### 8.4 Manual QA matrix

| File | Tool | Expect notice |
|------|------|---------------|
| `file_example_TIFF_10MB.tiff` | TIFF→JPG | **No** |
| PNG RGBA all opaque | PNG→JPG | **No** |
| PNG with checkerboard alpha | PNG→JPG | **Yes** |
| BMP 32-bit opaque | BMP→JPG | **No** |
| GIF with transparent index | GIF→JPG | **Yes** |
| WebP lossless + alpha | WebP→JPG | **Yes** |

---

## 9. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Prepare latency | 512 px cap; reuse loaded wasm module; progress UI already exists |
| WASM bundle size | Assess functions are thin wrappers; no new crate |
| GIF animated edge cases | Document frame-0 default for JPG; probe first N frames |
| Rare false negative (miss tiny transparent corner) | Acceptable: encode still correct; user may not see notice until transmute — mitigate with stratified sampling grid, not random |
| Breaking change for API consumers of `hasAlpha` | Keep deprecated alias one release |

---

## 10. Success criteria (v1.11.0 done when)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | All five lossy-input tools use **one** assessment API at prepare | ✅ on `dev` |
| 2 | `file_example_TIFF_10MB.tiff` does **not** show transparency notice on TIFF→JPG | ✅ verified |
| 3 | Contract tests: assess meaningful === encode flatten decision per format | ✅ on `dev` |
| 4 | No duplicate meaningful-alpha logic in individual crates (`core_utils`) | ✅ on `dev` |
| 5 | SPEC documents semantic vs structural alpha | ✅ on `dev` |

---

## 11. Future extensions (out of v1.11 scope)

- `png-to-ico` / ICO build: assess alpha for icon layer selection
- `tga-to-jpg`, `ico-to-jpg` tools: inherit via `background` option spec
- Move `flatten_rgba_on_background` into `core_utils` (5 copies today)
- Dev-only UI: "Alpha channel present but fully opaque" diagnostic
- Worker offload for assess on 150 MB session files

---

## 12. What continues next (recommended order)

1. **SPEC §5.5.3** — formalize semantic vs structural alpha, probe vs encode tiers.  
2. **Contract tests** — per lossy format: `assess_*` agrees with flatten decision on encode.  
3. **Fixture catalog** — commit opaque/real-alpha files under `docs/fixtures/semantic-alpha/`.  
4. **Cleanup** — deprecate `pageHasAlpha` in UI paths; `source-image-meta` parity; resize revert re-assess.  
5. **Full QA matrix** (§8.4) — PNG, WebP, GIF, BMP manual pass.  
6. **Release v1.11.0** — version bump, What's New, GitHub release, merge `dev` → `main`.

---

*Authoritative plan for v1.11 Semantic Alpha Engine. Last updated: 2026-06-08 (Phases 0–4 core complete on `dev`; release pending).*
