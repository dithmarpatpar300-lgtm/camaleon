# v1.7.x — Format Expansion Tier 1: WebP Suite

> **Author:** Chief Architect (Cursor)  
> **Date:** 2026-06-07  
> **Status:** Phase 5.1 ✅ complete — Phase 5.2 prompt ready for OpenCode  
> **Target release:** Frontend + Engine **v1.7.0** (four phases)  
> **Builds on:** v1.6.1 (FOUC fix, Scrollbar Camaleón, layout stability)  
> **SPEC reference:** §5.12 (WebP science), §6.4, §6.5, §12.2  
> **ROADMAP reference:** Phase 5.1–5.4

---

## 1. Context

Camaleon v1.6.1 completes the UI polish era. The engine has two active conversion crates (`transmutador_jpg`, `transmutador_png`) and a mature pipeline (StripAll, dimension guards, output integrity, result cache, real-time metrics).

The next era is **format expansion**. The WebP suite is Tier 1 because:

1. WebP is the dominant modern web image format — users regularly need to convert to/from it.
2. It uses the existing `image` crate (no new C dependencies for decode + lossless encode) — lowest risk.
3. `webp-to-png` is already a registry placeholder (`status: "soon"`) — visible to users.
4. Proving the third-crate pattern unblocks the Tier 2 raster classics cleanly.

---

## 2. Approach: One Direction at a Time

We do **not** implement all four WebP directions in one pass. Each direction is a separate OpenCode task, with a QA gate signed off by the Chief Architect before the next prompt is issued.

```
Phase 5.1: WebP → PNG           ← first prompt (ready)
     │ QA gate ✓
Phase 5.2: WebP → JPEG          ← second prompt (issued after 5.1 approved)
     │ QA gate ✓
Phase 5.3: PNG → WebP (spike)   ← third prompt (issued after 5.2 approved)
     │ QA gate ✓
Phase 5.4: JPEG → WebP          ← fourth prompt (issued after 5.3 approved)
     │ QA gate ✓
     └─ v1.7.0 tag
```

This mirrors exactly how we built JPG↔PNG: one direction per OpenCode session, QA every time, no shortcuts.

---

## 3. Shared Architecture for All Tier 1 Phases

### 3.1 Engine pattern (same as existing crates)

```
input bytes
  → core_utils::validate_input         (50 MB / 40 MP / magic guard)
  → image::ImageReader::new(Cursor::new(bytes)).with_guessed_format()?.decode()?
  → pixel manipulation (alpha flatten if needed)
  → encode to target format
  → core_utils::validate_output(bytes, OutputFormat::Target)
  → return bytes or String error
```

All new crates follow `transmutar_*_inner(input, &options)` wrapping the raw encode logic, with both Wasm exports delegating to `_inner`. Tests call `_inner` directly with in-memory fixtures.

### 3.2 Worker pattern (same as existing)

```typescript
// In transmutation.worker.ts — lazy init per module
let transmutarWebp: /* fn */ | null = null;
let initWebpPromise: Promise<void> | null = null;

async function initWebpWasm(): Promise<void> {
  const module = await import(/* webpackIgnore: true */ "/wasm/transmutador_webp/transmutador_webp.js");
  await module.default();
  transmutarWebp = module.transmutar_webp_a_png;
  // etc.
}
```

### 3.3 ToolRegistry pattern

```typescript
{
  id: "webp-to-png",
  slug: "webp-to-png",
  title: "WebP → PNG",
  fromFormat: "WEBP",
  toFormat: "PNG",
  module: "transmutador_webp",
  category: "image",
  fidelity: "lossless",
  status: "active",       // was "soon" — flipped when crate ships
  acceptExtensions: [".webp"],
  outputExtension: "png",
  optionSpecs: [{ kind: "slider", key: "compression", min: 1, max: 9, step: 1, defaultValue: 6, ... }],
}
```

### 3.4 `Cargo.toml` feature discipline

```toml
[dependencies]
wasm-bindgen = "0.2"
core_utils = { path = "../core_utils" }
image = { version = "0.25", default-features = false, features = ["webp", "png"] }
# Add "jpeg" for phases that encode JPEG
```

**Never** `default-features = true` — that pulls `rayon` which panics in Wasm.

### 3.5 i18n coverage (both phases per EN + ES)

Each new tool needs in `en.ts` / `es.ts`:

```typescript
"webp-to-png": {
  actionTitle: "...",       // semantic verb phrase
  description: "...",       // one line, honest about size behavior
  fidelityHint: "...",      // §5.12 size expectation for this direction
  options: { compression: { ... } },   // if slider added
}
```

### 3.6 User-facing options matrix (Tier 1 + JPG/PNG pair)

Not every conversion exposes the same controls. Option surface is driven by **output format science** (lossless vs lossy) and **alpha handling**, not symmetry between directions.

| Route | Fidelity | UI controls (`optionSpecs`) | Engine auto-decisions (no UI) |
|-------|----------|------------------------------|-------------------------------|
| JPG → PNG | Lossless | **PNG compression** slider (1–9) | Always RGB; StripAll |
| PNG → JPG | Lossy | **JPEG quality** (1–100) + **background color** (alpha only in UI) | Chroma 4:2:0 fixed; flatten formula §5.5.2 |
| WebP → PNG | Lossless | **PNG compression** slider (1–9) | RGBA if alpha else RGB; StripAll |
| WebP → JPG | Lossy | **JPEG quality** + **background color** (parity with PNG→JPG) | Same as PNG→JPG; §5.12.2 two-generation lossy warning |
| PNG → WebP | Lossless | **None** (one-click) | VP8L lossless only in v1.7.x; alpha preserved |
| JPG → WebP | Lossless | **None** (one-click) | Lossless-of-lossy inflation warning only |

**Control families:**

| Key | Affects pixels? | Used when |
|-----|-----------------|-----------|
| `compression` | No — DEFLATE level only | Lossless PNG output |
| `quality` | Yes — irreversible | Lossy JPEG output |
| `background` | Yes — alpha flatten | Lossy JPEG output **and** source has transparency |

**Deferred (do NOT add in Tier 1 without Architect prompt):** chroma subsampling (`refine_jpeg_encoder_swap`), optimized Huffman, lossy WebP encode quality, indexed PNG palette, metadata preserve modes.

**UI parity rule:** Any tool with `fidelity: "lossy"` and a `background` optionSpec must reuse the existing `TransparencyNotice` + `OptionsControls` split already implemented for `png-to-jpg` (`TransmutationPanel` filters `background` out of `OptionsControls`; background picker appears only when alpha is detected).

---

## 4. Phase 5.1 — WebP → PNG

**Task slug:** `phase5_webp_to_png`  
**Target:** Engine v1.3.0 + Frontend v1.7.0-alpha.1  
**Prompt:** `docs/prompts/phase5_webp_to_png.md` ← **ready to pass to OpenCode**

### 4.1 Engine deliverables

| File | Content |
|------|---------|
| `motor_transmutacion/transmutador_webp/Cargo.toml` | workspace version, `cdylib + rlib`, `image` with `webp + png` features |
| `motor_transmutacion/transmutador_webp/src/lib.rs` | All Wasm exports + `_inner` pipeline |
| `motor_transmutacion/transmutador_webp/tests/integration_test.rs` | 11+ test cases (see §4.3) |
| `motor_transmutacion/Cargo.toml` | New workspace member |

### 4.2 Wasm API

```rust
pub fn transmutar_webp_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String>
pub fn transmutar_webp_a_png_with_compression(input_bytes: &[u8], compression: u8) -> Result<Vec<u8>, String>
pub fn estimate_webp_to_png_size(input_bytes: &[u8]) -> Result<u32, String>
```

Color-type policy: RGBA (color type 6) if source has alpha; RGB (color type 2) if not.  
Compression policy: same `validate_compression` from `core_utils` (1–9).

### 4.3 Required integration tests

| # | Test name | Assertion |
|---|-----------|-----------|
| 1 | lossy_webp_produces_valid_png | PNG magic bytes, no error |
| 2 | lossless_webp_produces_valid_png | Same |
| 3 | webp_with_alpha_produces_rgba_png | IHDR color type = 6 |
| 4 | webp_without_alpha_produces_rgb_png | IHDR color type = 2 |
| 5 | empty_input_returns_error | `Err(...)`, not panic |
| 6 | corrupt_bytes_returns_error | `Err(...)` |
| 7 | truncated_riff_returns_error | `Err(...)` |
| 8 | strip_all_no_exif_in_output | output PNG has no eXIf chunk |
| 9 | compression_zero_rejected | `Err(...)` |
| 10 | compression_ten_rejected | `Err(...)` |
| 11 | estimate_within_5pct_of_full_encode | `|estimate - actual| / actual < 0.05` |
| 12 | dimensions_preserved | decode output PNG → same W×H as source WebP |
| 13 | large_webp_within_limit_passes | max-size fixture → OK |

### 4.4 Frontend deliverables

| File | Change |
|------|--------|
| `frontend/src/workers/transmutation.worker.ts` | Add `initWebpWasm`, `initWebpPromise`, lazy-init guard; route `transmutador_webp` module; call `transmutar_webp_a_png_with_compression` or defaults; call `estimate_webp_to_png_size` |
| `frontend/src/workers/types.ts` | `TransmutationModule` union extended with `"transmutador_webp"` |
| `frontend/src/types/wasm-modules.d.ts` | Declare `transmutador_webp` module shape |
| `frontend/src/lib/tools/tool-registry.ts` | `webp-to-png` `status: "soon"` → `"active"`; optionSpec for compression |
| `frontend/src/lib/i18n/dictionaries/en.ts` | `tools["webp-to-png"]` strings |
| `frontend/src/lib/i18n/dictionaries/es.ts` | same in Spanish |
| `frontend/src/hooks/useFileMetrics.ts` | Dispatch `estimate_webp_to_png_size` for `transmutador_webp` |
| `scripts/build-wasm.ps1` | Add `wasm-pack build transmutador_webp` |
| `scripts/build-wasm.sh` | Same for Unix |
| `frontend/package.json` | `build:wasm` script extended |

### 4.5 Acceptance criteria (QA gate — Chief Architect)

- [ ] `cargo test --workspace` passes in `motor_transmutacion/`
- [ ] All 13 integration tests green
- [ ] Wasm binary built: `transmutador_webp_bg.wasm` ≤ 3 MB uncompressed
- [ ] `npm run build` passes (no TS errors)
- [ ] Manual E2E: drop a real `.webp`, tool page renders, transmutation completes, `.png` downloads
- [ ] Estimated size shown in MetricsPanel before clicking Transmutar
- [ ] EN strings: `actionTitle`, `description`, `fidelityHint`, compression option labels
- [ ] ES strings: same in Spanish, copy reviewed for correctness
- [ ] StripAll: test #8 passes; no metadata in output
- [ ] ToolRegistry `webp-to-png` shows as active in landing grid and Command Palette

---

## 5. Phase 5.2 — WebP → JPEG

**Blocked on:** ~~Phase 5.1 QA gate~~ ✅ approved.  
**Task slug:** `phase5_webp_to_jpg`  
**Target:** Engine v1.3.1 + Frontend v1.7.2  
**Prompt:** `docs/prompts/phase5_webp_to_jpg.md` ← **ready to pass to OpenCode**

**Options doctrine (§3.6):** WebP→JPG is the **lossy-output twin** of PNG→JPG — same two user levers (quality + background). Do not invent new knobs; mirror registry/i18n/UX from `png-to-jpg`. Fidelity copy must add §5.12.2 two-generation lossy warning (WebP source may already be lossy).

### 5.1 Engine deliverables

Add to `transmutador_webp/src/lib.rs`:

```rust
pub fn transmutar_webp_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String>
pub fn transmutar_webp_a_jpg_with_options(input_bytes: &[u8], quality: u8, bg_r: u8, bg_g: u8, bg_b: u8) -> Result<Vec<u8>, String>
pub fn estimate_webp_to_jpg_size(input_bytes: &[u8], quality: u8) -> Result<u32, String>
```

`Cargo.toml`: add `"jpeg"` to image features.

Alpha flatten policy: identical to `transmutador_png` §5.5.2 — composite each pixel onto background before JPEG encode.

**Additional integration tests (Phase 5.2):**

| # | Test |
|---|------|
| 14 | lossy_webp_to_jpg_produces_valid_jpeg |
| 15 | webp_with_alpha_flattened_on_white |
| 16 | webp_with_alpha_custom_background_red |
| 17 | quality_zero_rejected |
| 18 | quality_over_100_rejected |
| 19 | estimate_webp_to_jpg_within_5pct |

### 5.2 Frontend deliverables

- ToolRegistry: `webp-to-jpg` active; optionSpecs: quality + background
- Worker route: `transmutador_webp` + output `jpg` / `image/jpeg`
- UI hint: two-generation lossy warning if source WebP was lossy (fidelityHint)
- i18n: EN + ES for action title, description, fidelityHint, quality/background option labels

---

## 6. Phase 5.3 — PNG → WebP (lossless)

**Blocked on:** Phase 5.2 QA gate approval.  
**Task slug:** `phase5_png_to_webp`  
**Target:** Engine v1.4.0 + Frontend v1.7.0-alpha.3

### 6.1 Spike requirement (before full implementation)

Before scaffolding `transmutador_encode`, OpenCode must:

1. Create a minimal test binary (not a library) that encodes a 1024×768 PNG as lossless WebP using `image` 0.25.
2. Measure output `.wasm` file size.
3. Report: bundle size, output quality (compare with original PNG dimensions), any compile errors.
4. Chief Architect reviews spike report before issuing full implementation prompt.

**If spike fails NFR-7 (> 3 MB .wasm), do not proceed — escalate to Chief Architect for alternative encoding library evaluation.**

### 6.2 Engine deliverables (post-spike)

New crate: `motor_transmutacion/transmutador_encode/`

```rust
pub fn transmutar_png_a_webp(input_bytes: &[u8]) -> Result<Vec<u8>, String>
pub fn estimate_png_to_webp_size(input_bytes: &[u8]) -> Result<u32, String>
```

`core_utils::OutputFormat` extended with `WebP` variant; `validate_output` extended to check RIFF WEBP magic (`52 49 46 46 xx xx xx xx 57 45 42 50`).

**Integration tests:**

| # | Test |
|---|------|
| 20 | opaque_png_to_webp_produces_valid_riff |
| 21 | png_with_alpha_to_webp_rgba_preserved |
| 22 | dimensions_preserved_after_encode |
| 23 | strip_all_no_icc_in_output |
| 24 | estimate_png_to_webp_within_10pct (lossless estimates less stable) |
| 25 | empty_input_returns_error |
| 26 | corrupt_png_returns_error |

### 6.3 Frontend deliverables

- ToolRegistry: `png-to-webp` active; no quality slider (lossless only — v1.7.x); label must say "Lossless WebP"
- Worker: new `initEncodeWasm`; route `transmutador_encode`
- i18n: size inflation hint for photographic PNGs (§5.12.4)

---

## 7. Phase 5.4 — JPEG → WebP (lossless)

**Blocked on:** Phase 5.3 QA gate approval.  
**Task slug:** `phase5_jpg_to_webp`  
**Target:** Engine v1.4.1 + Frontend v1.7.0

### 7.1 Engine deliverables

Add to `transmutador_encode/src/lib.rs`:

```rust
pub fn transmutar_jpg_a_webp(input_bytes: &[u8]) -> Result<Vec<u8>, String>
pub fn estimate_jpg_to_webp_size(input_bytes: &[u8]) -> Result<u32, String>
```

`Cargo.toml`: add `"jpeg"` feature.

**Integration tests:**

| # | Test |
|---|------|
| 27 | jpeg_to_webp_produces_valid_riff |
| 28 | dimensions_preserved |
| 29 | strip_all_no_exif_in_output |
| 30 | estimate_jpg_to_webp_within_10pct |
| 31 | size_inflation_observed (assert output > input for typical photo) |

### 7.2 Frontend deliverables

- ToolRegistry: `jpg-to-webp` active; fidelityHint must warn lossless-of-lossy inflation
- i18n: "Lossless WebP from JPEG — output file will be significantly larger" message
- v1.7.0 version bump in `package.json` on completion

---

## 8. Summary Checklist per Phase

| Item | 5.1 | 5.2 | 5.3 | 5.4 |
|------|-----|-----|-----|-----|
| Rust crate scaffolded | new | extend | new | extend |
| Wasm exports | 3 | 3 | 2 | 2 |
| Integration tests | 13 | 6 | 8 | 5 |
| `cargo test --workspace` | ✓ | ✓ | ✓ | ✓ |
| Worker lazy-load | new | extend | new | extend |
| ToolRegistry `active` | 1 | 1 | 1 | 1 |
| i18n EN + ES | ✓ | ✓ | ✓ | ✓ |
| MetricsPanel estimate | ✓ | ✓ | ✓ | ✓ |
| Build scripts updated | ✓ | — | ✓ | — |
| NFR-7 reported | ✓ | ✓ | ✓ | ✓ |
| StripAll test | ✓ | — | ✓ | ✓ |
| Chief Architect QA gate | ✓ | ✓ | ✓ | ✓ |

---

## 9. Files Modified per Phase (quick reference)

### Phase 5.1 (new files)
- `motor_transmutacion/transmutador_webp/Cargo.toml`
- `motor_transmutacion/transmutador_webp/src/lib.rs`
- `motor_transmutacion/transmutador_webp/tests/integration_test.rs`
- `motor_transmutacion/Cargo.toml` (workspace member)
- `frontend/src/workers/transmutation.worker.ts`
- `frontend/src/workers/types.ts`
- `frontend/src/types/wasm-modules.d.ts`
- `frontend/src/lib/tools/tool-registry.ts`
- `frontend/src/lib/i18n/dictionaries/en.ts`
- `frontend/src/lib/i18n/dictionaries/es.ts`
- `frontend/src/hooks/useFileMetrics.ts`
- `scripts/build-wasm.ps1`
- `scripts/build-wasm.sh`
- `frontend/package.json`

### Phase 5.2 (modifications to existing)
- `motor_transmutacion/transmutador_webp/src/lib.rs` (add exports)
- `motor_transmutacion/transmutador_webp/Cargo.toml` (add jpeg feature)
- `motor_transmutacion/transmutador_webp/tests/integration_test.rs` (add tests)
- `frontend/src/workers/transmutation.worker.ts` (extend routing)
- `frontend/src/lib/tools/tool-registry.ts` (webp-to-jpg active)
- `frontend/src/lib/i18n/dictionaries/{en,es}.ts`
- `frontend/src/hooks/useFileMetrics.ts`

### Phase 5.3 (new crate + core_utils extension)
- `motor_transmutacion/core_utils/src/lib.rs` (`OutputFormat::WebP`)
- `motor_transmutacion/transmutador_encode/Cargo.toml`
- `motor_transmutacion/transmutador_encode/src/lib.rs`
- `motor_transmutacion/transmutador_encode/tests/integration_test.rs`
- `motor_transmutacion/Cargo.toml` (workspace member)
- Frontend: same pattern as Phase 5.1 but for `transmutador_encode`

### Phase 5.4 (modifications)
- `motor_transmutacion/transmutador_encode/src/lib.rs`
- `motor_transmutacion/transmutador_encode/Cargo.toml` (add jpeg feature)
- `motor_transmutacion/transmutador_encode/tests/integration_test.rs`
- Frontend: extend routing + new registry entry
- `frontend/package.json`: bump to 1.7.0

---

## 10. Governance reminders

- Prompts live in `docs/prompts/phase5_*.md` — Architect writes, user passes to OpenCode.
- Reports live in `docs/reports/phase5_*_done.md` — OpenCode writes, user passes to Architect.
- SPEC §6.4 and §6.5 are pre-written contracts; OpenCode must follow them exactly.
- No scope creep into Tier 2 during Tier 1 execution.
- Chief Architect may issue correction prompts if OpenCode deviates from §5.12, §6.4, or §6.5.
