# Category 4 — Implementation ROADMAP

> **Project:** Picture-VP8
> **Purpose:** Phased delivery plan for the first pure-Rust VP8 intra-frame lossy encoder. Every phase has a test gate, a deliverable, and an exit criterion. No phase begins until the previous phase's exit criterion is met.
> **Principle:** Analiza 3 veces, piensa 2 veces, ejecuta 1 vez. This is a new engine, not a module — every detail matters.
> **Prerequisite:** Categories 1, 2, and 3.

---

## Table of contents

1. [Project structure](#1-project-structure)
2. [Phase 0 — Spike: BAC + FDCT validation](#2-phase-0--spike-bac--fdct-validation)
3. [Phase 1 — MVP: DC_PRED encoder](#3-phase-1--mvp-dc_pred-encoder)
4. [Phase 2 — Full prediction: 14 modes + mode decision](#4-phase-2--full-prediction-14-modes--mode-decision)
5. [Phase 3 — Quality parameter + rate control](#5-phase-3--quality-parameter--rate-control)
6. [Phase 4 — Camaleon integration](#6-phase-4--camaleon-integration)
7. [Phase 5 — Upstream + community](#7-phase-5--upstream--community)
8. [Test strategy](#8-test-strategy)
9. [Conventions and coding rules](#9-conventions-and-coding-rules)
10. [Risk gates and kill switches](#10-risk-gates-and-kill-switches)

---

## 1. Project structure

### 1.1 Crate location

```
motor_transmutacion/
├── core_utils/              ← existing (shared validation, limits)
├── transmutador_jpg/        ← existing
├── transmutador_png/        ← existing
├── ...
└── transmutador_webp_encode/  ← NEW — Picture-VP8 crate
    ├── Cargo.toml
    ├── src/
    │   ├── lib.rs              ← wasm-bindgen exports + Camaleon API
    │   ├── yuv.rs              ← RGB→YUV 4:2:0 forward conversion
    │   ├── macroblock.rs       ← MB partitioning + padding
    │   ├── prediction.rs       ← 4 MB modes + 10 sub-block modes
    │   ├── fdct.rs             ← Forward DCT 4×4 + WHT 4×4
    │   ├── quantize.rs         ← Quantization tables + deadzone + dequant
    │   ├── zigzag.rs           ← Zig-zag scan order + EOB detection
    │   ├── bac.rs              ← Boolean arithmetic encoder
    │   ├── probabilities.rs    ← RFC 6386 §19 constant tables
    │   ├── bitstream.rs        ← Frame header + first/second partition writer
    │   ├── loop_filter.rs      ← Deblocking filter (adapted from image-webp)
    │   ├── rate_control.rs     ← Mode decision (SAD + RD-cost) + quality mapping
    │   ├── riff.rs             ← RIFF container assembly (VP8 chunk)
    │   └── error.rs            ← Error types
    └── tests/
        ├── bac_roundtrip.rs      ← BAC encode→decode round-trip
        ├── fdct_accuracy.rs      ← FDCT vs. IDCT inverse property
        ├── quantize_dequant.rs   ← Quantize→dequantize error bounds
        ├── single_block.rs       ← Encode a single 16×16 block
        ├── single_mb.rs          ← Encode a single macroblock
        ├── full_image.rs         ← Encode full 4000×3000 sample
        ├── chrome_validation.rs  ← Output decodable by Chrome (manual)
        └── corpus_comparison.rs  ← PSNR/SSIM vs. libwebp on 4 samples
```

### 1.2 Cargo.toml

```toml
[package]
name = "transmutador_webp_encode"
version = "0.1.0"
edition = "2021"
license = "MIT"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
core_utils = { path = "../core_utils" }

[profile.release]
opt-level = 3
lto = "thin"
codegen-units = 1
panic = "abort"
```

**Zero external dependencies** beyond `wasm-bindgen` and `core_utils`. No `image` crate, no `image-webp`, no C bindings.

### 1.3 Build integration

Add to `frontend/scripts/build-wasm.mjs` crate list:

```javascript
"transmutador_webp_encode",
```

Add to `frontend/src/lib/wasm/wasm-crates.ts`:

```typescript
"transmutador_webp_encode",
```

### 1.4 Naming convention

| Internal name | Public name | Description |
|---------------|-------------|-------------|
| `transmutador_webp_encode` | Picture-VP8 | Crate name (Cargo) |
| `picture-vp8` | Picture-VP8 | Standalone crate (if published) |
| `encode_webp_lossy` | — | Wasm export function name |

---

## 2. Phase 0 — Spike: BAC + FDCT validation

> **Duration:** 1-2 weeks
> **Goal:** Prove that the two hardest components (BAC encoder + FDCT) produce correct output before investing in the full pipeline.
> **Kill switch:** If BAC round-trip fails after 2 weeks of debugging, halt the project. The BAC is the foundation — if it doesn't work, nothing works.

### 2.0.1 Sub-phase 0.1 — Probability tables

**Deliverable:** `src/probabilities.rs` with all RFC 6386 §19 constant tables.

| Table | Source | Elements | Verification |
|-------|--------|----------|--------------|
| `kf_y_mode_probs` | RFC 6386 §19.1 | 4×3 = 12 | Compare with `image-webp` decoder's expected values |
| `kf_uv_mode_probs` | RFC 6386 §19.1 | 4×3 = 12 | Same |
| `kf_b_mode_probs` | RFC 6386 §19.1 | 10×9 = 90 | Same |
| `kf_coeff_probs` | RFC 6386 §19.3 | 4×8×3×11×3 = 3,168 | Same |
| `dc_qlookup` | RFC 6386 §19.2 | 128 | Compare with `libwebp` source |
| `ac_qlookup` | RFC 6386 §19.2 | 128 | Same |

**Test gate:** Tables compile. Unit test asserts first/last/middle values match RFC.

**Lines:** ~300

### 2.0.2 Sub-phase 0.2 — Boolean arithmetic encoder

**Deliverable:** `src/bac.rs` with `BoolEncoder` struct.

**Components:**
- `BoolEncoder::new()` — initialize state (range=255, bottom=0, count=0)
- `BoolEncoder::encode_bool(value: bool, prob: u8)` — encode single boolean
- `BoolEncoder::encode_value(value: u32, bits: u32, prob: u8)` — encode N-bit integer
- `BoolEncoder::flush()` — finalize and output remaining bytes
- Carry propagation logic (deferred buffer byte)

**Test gate:**
1. Encode a known sequence of booleans with known probabilities
2. Feed the output bytes into `image-webp`'s `BoolDecoder` (from `vp8_arithmetic_decoder.rs`)
3. Assert decoded values match encoded values — **round-trip must be exact**

**Lines:** ~200 core + ~100 test

### 2.0.3 Sub-phase 0.3 — Forward DCT 4×4 + WHT 4×4

**Deliverable:** `src/fdct.rs` with `forward_dct_4x4()` and `forward_wht_4x4()`.

**Components:**
- `forward_dct_4x4(input: [i16; 16]) -> [i16; 16]` — two-pass integer DCT
- `forward_wht_4x4(input: [i16; 16]) -> [i16; 16]` — two-pass WHT for luma DC

**Test gate:**
1. Forward DCT a known 4×4 block → verify output matches hand-computed expected values
2. Forward DCT then inverse DCT (using `image-webp`'s `transform.rs` IDCT) → assert input is recovered within ±1 (rounding tolerance)
3. Same for WHT: forward WHT → inverse WHT → assert recovery

**Lines:** ~120 core + ~80 test

### 2.0.4 Sub-phase 0.4 — Single-block round-trip

**Deliverable:** Integration test that encodes a single 4×4 block through the full micro-pipeline:

```
4×4 residual → FDCT → quantize → zig-zag → BAC encode → BAC decode → 
dequantize → IDCT → reconstruct residual (within tolerance)
```

**Test gate:** Round-trip error ≤ 2 per coefficient (quantization + rounding).

**Exit criterion for Phase 0:**
- ✅ BAC encode→decode round-trip is bit-exact
- ✅ FDCT→IDCT round-trip is within ±1
- ✅ WHT→IWHT round-trip is within ±1
- ✅ Single 4×4 block round-trip through full micro-pipeline succeeds

**If any criterion fails:** Debug until fixed. Do not proceed to Phase 1.

---

## 3. Phase 1 — MVP: DC_PRED encoder

> **Duration:** 3-4 weeks
> **Goal:** Produce a valid WebP lossy file that can be decoded by Chrome and `image-webp`'s VP8 decoder. Uses only DC_PRED (no other prediction modes). Quality fixed at 75.
> **Kill switch:** If Chrome cannot decode the output after 4 weeks, halt and investigate bitstream conformity.

### 3.1 Sub-phase 1.1 — RGB→YUV + macroblock partitioning

**Deliverable:** `src/yuv.rs` + `src/macroblock.rs`

**Components:**
- `rgb_to_yuv_420(rgb: &[u8], width, height) -> (Vec<u8>, Vec<u8>, Vec<u8>)` — Y, U, V planes
- `MacroblockGrid::new(width, height)` — calculate MB cols/rows
- Edge padding (replicate last row/column to fill partial MBs)

**Test gate:**
- YUV conversion: verify Y[0][0] for a pure red pixel (255,0,0) matches expected BT.601 value
- Subsampling: verify U[0][0] for a 2×2 block of uniform color equals that color's U value
- Padding: verify a 17×17 image produces 2×2 = 4 MBs with correct padding

**Lines:** ~100 core + ~50 test

### 3.1.2 Sub-phase 1.2 — DC_PRED intra prediction

**Deliverable:** `src/prediction.rs` (DC_PRED only — other modes stubbed)

**Components:**
- `predict_dc(above: &[u8; 16], left: &[u8; 16], has_above: bool, has_left: bool) -> [u8; 256]`
- Chroma DC prediction (8×8 variant)
- Boundary handling (first row/column → default 128)

**Test gate:**
- DC_PRED with full neighbors: output = average of above + left
- DC_PRED with no neighbors: output = 128
- DC_PRED with only above: output = average of above

**Lines:** ~50 core + ~40 test

### 3.1.3 Sub-phase 1.3 — Quantization + zig-zag

**Deliverable:** `src/quantize.rs` + `src/zigzag.rs`

**Components:**
- `quantize(coeff: i16, q_table_value: u8, is_dc: bool) -> i16`
- `dequantize(quantized: i16, q_table_value: u8, is_dc: bool) -> i16`
- `zigzag_scan(coeffs: [i16; 16]) -> [i16; 16]`
- `find_eob(scan: &[i16]) -> usize` — index of last non-zero coefficient

**Test gate:**
- Quantize(100, Q=42, DC) → verify against hand-computed round()
- Quantize with deadzone: small AC coefficient → 0
- Zig-zag: position 0 → DC, position 15 → last AC

**Lines:** ~100 core + ~50 test

### 3.1.4 Sub-phase 1.4 — Bitstream writer (first partition)

**Deliverable:** `src/bitstream.rs` (frame header + first partition)

**Components:**
- `write_frame_header(width, height, first_part_size) -> Vec<u8>` — 10-byte uncompressed header
- `write_first_partition(modes: &[MbMode], probabilities: &ProbTables) -> Vec<u8>` — arithmetic-coded MB modes
- Color space + clamping bits
- Loop filter parameters
- Quantizer parameters (y_ac_qi, deltas)

**Test gate:**
- Frame header: verify start code 0x9D 0x01 0x2A is present
- Frame header: verify width/height fields encode correctly for 4000×3000
- First partition: encode 1 MB with DC_PRED → decode with `image-webp` VP8 decoder → mode matches

**Lines:** ~200 core + ~100 test

### 3.1.5 Sub-phase 1.5 — Bitstream writer (second partition)

**Deliverable:** Second partition writer (DCT coefficient encoding)

**Components:**
- `write_second_partition(residuals: &[ResidualBlock], probabilities: &ProbTables) -> Vec<u8>`
- Token tree encoding (0-11 token types)
- Extra bits encoding (for tokens 5-11)
- Sign bit encoding
- EOB encoding

**Test gate:**
- Encode a single 4×4 block with known coefficients → decode → verify coefficients match
- Encode a zero block → verify only EOB token is emitted
- Encode a block with 16 non-zero coefficients → verify all tokens emitted correctly

**Lines:** ~200 core + ~100 test

### 3.1.6 Sub-phase 1.6 — Reconstruction + deblocking filter

**Deliverable:** `src/loop_filter.rs` (adapted from `image-webp`)

**Components:**
- `reconstruct_mb(pred: &[u8], residuals: &[i16], q_index) -> [u8; 256]` — dequant + IDCT + add to prediction
- `apply_loop_filter(yuv: &mut YuvImage, filter_level, sharpness)` — deblock
- Reuse `image-webp` `loop_filter.rs` filter math (adapt for encode direction)

**Test gate:**
- Reconstruct: pred=128 (DC), residual=0 → output=128
- Reconstruct: pred=100, residual=+20 → output=120
- Loop filter: verify smooth boundary after filtering a synthetic blocky image

**Lines:** ~100 core + ~50 test

### 3.1.7 Sub-phase 1.7 — RIFF container + full pipeline

**Deliverable:** `src/riff.rs` + `lib.rs` integration

**Components:**
- `assemble_webp(vp8_bitstream: &[u8]) -> Vec<u8>` — RIFF + VP8 chunk
- `encode_webp_lossy(rgb: &[u8], width, height, quality: u8) -> Result<Vec<u8>, String>` — full pipeline

**Full pipeline:**
```
RGB → YUV 4:2:0 → MB partition → DC_PRED → residual → FDCT → WHT → 
quantize → zig-zag → BAC encode (first + second partition) → 
frame header + partitions → RIFF assembly → output
```

**Test gate — THE CRITICAL ONE:**
1. Encode a 16×16 solid-color image → output is valid WebP
2. Decode output with `image-webp` `WebPDecoder` → dimensions and pixels match
3. **Decode output with Chrome** (manual: open file in browser) → image displays
4. Encode sample_007.jpg (4000×3000) → output is valid WebP
5. Decode sample output with Chrome → image displays correctly (not corrupted)
6. File size is within 30% of Google's `libwebp` output for the same image

**Exit criterion for Phase 1:**
- ✅ Output decodes correctly in `image-webp` VP8 decoder
- ✅ Output displays in Chrome
- ✅ 4000×3000 sample image produces a valid WebP file
- ✅ PSNR ≥ 35 dB on sample corpus (DC_PRED only — quality will be poor but valid)
- ✅ File size within 30% of `libwebp` (expecting ~20-30% worse due to DC_PRED-only)

---

## 4. Phase 2 — Full prediction: 14 modes + mode decision

> **Duration:** 4-5 weeks
> **Goal:** Implement all 14 intra prediction modes (4 MB + 10 sub-block) with SAD-based mode decision. Quality should approach `libwebp` default.
> **Kill switch:** If PSNR does not reach 38 dB after 5 weeks, accept Phase 1 quality and move to Phase 3 with a wider quality range.

### 4.1 Sub-phase 2.1 — MB-level prediction modes (V, H, TM)

**Deliverable:** Complete `src/prediction.rs` macroblock modes

**Components:**
- `predict_v(above: &[u8; 16]) -> [u8; 256]`
- `predict_h(left: &[u8; 16]) -> [u8; 256]`
- `predict_tm(above, left, top_left) -> [u8; 256]`
- Chroma variants (8×8)

**Test gate:** Each mode produces correct output for known inputs (compare with `image-webp` decoder's prediction reconstruction).

**Lines:** ~80 core + ~40 test

### 4.2 Sub-phase 2.2 — Sub-block prediction modes (10 modes)

**Deliverable:** All 10 B_PRED sub-block modes

**Components:**
- `predict_b_dc`, `predict_b_tm`, `predict_b_ve`, `predict_b_he` (simple — same as MB modes but 4×4)
- `predict_b_ld`, `predict_b_rd` (diagonal — pixel-by-pixel formulas from Category 2 §4.2)
- `predict_b_vr`, `predict_b_vl`, `predict_b_hd`, `predict_b_hu` (angular — pixel-by-pixel formulas)
- Boundary handling for edge sub-blocks (missing neighbors → default 128)

**Test gate:**
- Each mode: verify output for a known 4×4 input with known neighbors
- Compare prediction output with `image-webp` decoder's reconstruction for the same mode + neighbors

**Lines:** ~300 core + ~150 test

### 4.3 Sub-phase 2.3 — SAD computation + mode decision

**Deliverable:** `src/rate_control.rs` (mode decision engine)

**Components:**
- `sad_16x16(a: &[u8], b: &[u8]) -> u32` — Sum of Absolute Differences for 16×16
- `sad_4x4(a: &[u8], b: &[u8]) -> u32` — SAD for 4×4
- `choose_mb_mode(original: &[u8], predictions: &[[u8; 256]; 4]) -> MbMode` — pick lowest SAD
- `choose_sub_mode(original: &[u8; 16], predictions: &[[u8; 16]; 10]) -> SubMode` — pick lowest SAD
- Lambda calculation: `λ = q_index² × 0.21`
- RD-cost: `cost = SAD + λ × estimated_rate`

**Test gate:**
- SAD of identical blocks = 0
- SAD of a block vs. its shifted version > 0
- Mode decision: for a smooth gradient image, TM_PRED should win over DC_PRED

**Lines:** ~150 core + ~80 test

### 4.4 Sub-phase 2.4 — B_PRED macroblock mode + bitstream integration

**Deliverable:** Update bitstream writer to support B_PRED (16 sub-block modes per MB)

**Components:**
- When MB mode = B_PRED, encode 16 sub-block mode decisions in first partition
- Use `kf_b_mode_probs` probability table for sub-block modes
- Update second partition to handle per-sub-block residuals

**Test gate:**
- Encode an image with complex textures → B_PRED should be selected for some MBs
- Decode output with Chrome → verify no corruption
- PSNR should improve vs. Phase 1 (DC_PRED only)

**Lines:** ~100 core + ~50 test

### 4.5 Sub-phase 2.5 — Full pipeline integration + corpus benchmark

**Deliverable:** Run full encoder on all 4 sample images, measure PSNR and file size

**Benchmark protocol:**
```
For each sample (007, 008, 009, 011):
  1. Decode original JPEG to raw RGB
  2. Encode RGB → WebP lossy via Picture-VP8 at quality 75
  3. Decode WebP back to RGB via image-webp decoder
  4. Compute PSNR(original, decoded)
  5. Compare file size to Google's libwebp output (sample_output_google)
  6. Compute SSIM(original, decoded)
```

**Exit criterion for Phase 2:**
- ✅ All 4 samples produce valid WebP files decodable by Chrome
- ✅ Average PSNR ≥ 38 dB
- ✅ Average file size within 10% of `libwebp` output (6,245,474 bytes average VP8 payload)
- ✅ No visible artifacts at 100% crop inspection
- ✅ B_PRED is selected for ≥ 20% of macroblocks on textured images

---

## 5. Phase 3 — Quality parameter + rate control

> **Duration:** 2-3 weeks
> **Goal:** Expose quality parameter (0-100) to the user. Implement quality→q_index mapping and verify linear PSNR response.
> **Kill switch:** If quality 100 does not produce PSNR ≥ 42 dB, investigate quantizer table mapping.

### 5.1 Sub-phase 3.1 — Quality → q_index mapping

**Deliverable:** `src/rate_control.rs` quality mapping function

**Components:**
- `quality_to_q_index(quality: u8) -> u8` — maps 0-100 to 0-127
- Follows `libwebp`'s non-linear curve (cubic interpolation between anchor points)
- Quality 100 → q_index 0; quality 0 → q_index 127

**Test gate:**
- quality 100 → q_index 0
- quality 75 → q_index ≈ 20
- quality 50 → q_index ≈ 42
- quality 0 → q_index 127

**Lines:** ~30 core + ~20 test

### 5.2 Sub-phase 3.2 — Quality sweep + PSNR curve

**Deliverable:** Test that encodes each sample at quality 10, 25, 50, 75, 90, 100 and measures PSNR

**Test gate:**
- PSNR increases monotonically with quality
- Quality 100 → PSNR ≥ 42 dB
- Quality 75 → PSNR ≥ 38 dB (consistent with Phase 2)
- Quality 25 → PSNR ≥ 28 dB

**Lines:** ~60 test

### 5.3 Sub-phase 3.3 — Optional: size-target mode

**Deliverable:** Binary search rate controller for target file size

**Components:**
- `encode_for_target_size(rgb, width, height, target_bytes) -> Vec<u8>`
- Binary search on q_index: encode → check size → adjust
- Converges in 3-5 iterations

**Test gate:** Target 3 MB for sample 007 → output is 3 MB ± 5%

**Lines:** ~60 core + ~30 test
**Priority:** Optional — only if time permits after Phase 4

---

## 6. Phase 4 — Camaleon integration

> **Duration:** 2-3 weeks
> **Goal:** Integrate Picture-VP8 into Camaleon as a new tool, with full UI, i18n, worker route, and settings.
> **Exit criterion:** `npm run build` succeeds, all tests pass, tool is usable in the app.

### 6.1 Sub-phase 4.1 — Crate registration + build

**Deliverable:** Crate added to build pipeline

**Components:**
1. Add `transmutador_webp_encode` to `frontend/scripts/build-wasm.mjs` crate list
2. Add to `frontend/src/lib/wasm/wasm-crates.ts`
3. Add to `frontend/src/types/wasm-modules.d.ts`
4. Verify `npm run build:wasm` produces `frontend/public/wasm/transmutador_webp_encode/`

**Test gate:** `npm run build:wasm` succeeds; Wasm binary exists and is < 100 KB

### 6.2 Sub-phase 4.2 — Wasm exports + worker route

**Deliverable:** `lib.rs` public API + worker dispatch

**Wasm exports:**
```rust
#[wasm_bindgen]
pub fn encode_webp_lossy(rgb: &[u8], width: u32, height: u32, quality: u8) -> Result<Vec<u8>, String>;

#[wasm_bindgen]
pub fn estimate_webp_lossy_size(rgb: &[u8], width: u32, height: u32, quality: u8) -> Result<u32, String>;

#[wasm_bindgen]
pub fn set_session_input_limit(max_bytes: u32);

#[wasm_bindgen]
pub fn reset_session_input_limit();

#[wasm_bindgen]
pub fn set_risk_mode(enabled: bool);
```

**Worker route:** Add `TransmutationModule::WebpEncode` to `transmutation.worker.ts` `resolveRoute()`

**Test gate:** Worker can load the new Wasm module and call `encode_webp_lossy` on a test image

### 6.3 Sub-phase 4.3 — Tool registry entry

**Deliverable:** New tool entries in `tool-registry.ts`

**New tools:**
| Slug | Direction | Category | Batch |
|------|-----------|----------|-------|
| `png-to-webp-lossy` | PNG → WebP (lossy) | image | ✅ |
| `jpg-to-webp-lossy` | JPEG → WebP (lossy) | image | ✅ |

**Option specs:**
- `quality` slider (1-100, default 75) — same as JPEG quality
- `background` color — for PNG with alpha (flatten before encode)

**Note:** These are **new tools**, not replacements for existing `png-to-webp` / `jpg-to-webp` (which are lossless). The lossy variants are separate slugs.

### 6.4 Sub-phase 4.4 — i18n EN + ES

**Deliverable:** All UI strings in both languages

**Keys to add:**
- Tool names and descriptions
- Option labels (quality slider)
- Fidelity notices (lossy→lossless warning, generational loss)
- Notice Rail recommendation (suggest `webp-lossy` for size reduction)

### 6.5 Sub-phase 4.5 — Notices + fidelity

**Deliverable:** Honest notices for the new tools

**Notices:**
- "PNG → WebP lossy: quality loss is irreversible. Alpha will be flattened."
- "JPEG → WebP lossy: two-generation lossy compression. Some quality loss may occur."
- "WebP lossy at quality 75 typically saves 25-35% vs. JPEG at quality 85."

### 6.6 Sub-phase 4.6 — Full verification

**Deliverable:** All Camaleon verification gates pass

**Verification:**
```bash
cd motor_transmutacion && cargo check --workspace && cargo test --workspace
cd frontend && npm run build:wasm
cd frontend && npx tsc --noEmit
cd frontend && npm test
cd frontend && npm run build
```

**Exit criterion for Phase 4:**
- ✅ `cargo test --workspace` passes (including new crate tests)
- ✅ `npm run build:wasm` produces valid Wasm
- ✅ `tsc --noEmit` — 0 errors
- ✅ `npm test` — all tests pass (existing + new)
- ✅ `npm run build` — Next.js build succeeds
- ✅ Manual: `png-to-webp-lossy` tool works in browser
- ✅ Manual: output WebP displays in Chrome, Firefox, Safari
- ✅ Wasm binary size < 100 KB

---

## 7. Phase 5 — Upstream + community

> **Duration:** 1-2 weeks
> **Goal:** Contribute the VP8 lossy encoder back to the Rust ecosystem.
> **Exit criterion:** PR submitted or standalone crate published.

### 7.1 Sub-phase 5.1 — Extract standalone module

**Deliverable:** `picture-vp8` as a standalone crate (separate from Camaleon)

**Structure:**
```
picture-vp8/
├── Cargo.toml          (no Camaleon deps, only wasm-bindgen optional)
├── src/
│   ├── lib.rs
│   ├── yuv.rs
│   ├── ... (all modules from transmutador_webp_encode)
└── tests/
```

### 7.2 Sub-phase 5.2 — PR to `image-webp`

**Deliverable:** Pull request adding VP8 lossy encode to `image-webp`

**PR contents:**
- `vp8_encoder.rs` — the full encoder
- `forward_transform.rs` — FDCT + WHT
- `bac_encoder.rs` — Boolean arithmetic encoder
- `probability_tables.rs` — RFC 6386 constants
- Tests demonstrating round-trip and Chrome compatibility

### 7.3 Sub-phase 5.3 — Documentation + blog post

**Deliverable:**
- Crate documentation (rustdoc)
- Blog post / announcement: "First pure-Rust VP8 lossy encoder for WebP"
- README for standalone crate

---

## 8. Test strategy

### 8.1 Test pyramid

```
                    ┌──────────────────┐
                    │  Browser smoke   │  ← Manual: Chrome, Firefox, Safari
                    │  (3 tests)       │
                    ├──────────────────┤
                    │  Corpus PSNR     │  ← 4 samples × 6 quality levels
                    │  (24 tests)      │
                    ├──────────────────┤
                    │  Integration     │  ← Full image encode→decode
                    │  (10 tests)      │
                    ├──────────────────┤
                    │  Component       │  ← BAC, FDCT, quantize, prediction
                    │  (40 tests)      │
                    ├──────────────────┤
                    │  Unit            │  ← Table values, formulas, edge cases
                    │  (30 tests)      │
                    └──────────────────┘
```

### 8.2 Golden file testing

For each sample image at each quality level, store a "golden" WebP file. Future test runs compare encoder output against the golden file:
- **Bit-exact comparison:** output bytes must match golden file exactly (catches regressions)
- **If intentional change:** update golden file with documented reason

**Golden files stored at:** `docs/planning/_private/sample_output_picture/`

### 8.3 Cross-decoder validation

Every output must be validated against **three independent decoders**:

| Decoder | How | What it catches |
|---------|-----|-----------------|
| `image-webp` `WebPDecoder` | Rust unit test | Bitstream conformity (strict) |
| Chrome | Manual open | Real-world browser compatibility |
| Firefox | Manual open | Alternative decoder implementation |

### 8.4 PSNR/SSIM validation

For each corpus sample at each quality level:

```
PSNR(original_rgb, decoded_rgb) must be ≥ target for that quality level
SSIM(original_rgb, decoded_rgb) must be ≥ 0.90 at quality 75
```

---

## 9. Conventions and coding rules

### 9.1 Rust conventions

| Rule | Detail |
|------|--------|
| **No `unsafe`** | Pure safe Rust. No `unsafe` blocks. |
| **No `std::os`** | `wasm32-unknown-unknown` has no OS. No file I/O, no threads. |
| **No `rayon`** | Single-threaded Wasm. No parallel iterators. |
| **Integer arithmetic** | All DCT/quantize/BAC math uses `i16`, `i32`, `u32`. No `f64` in the codec path. |
| **Checked arithmetic** | Use `checked_add`, `checked_mul` for dimension calculations to prevent overflow. |
| **Error handling** | Return `Result<T, String>` at Wasm boundary (consistent with other Camaleon crates). |
| **No panics** | All array access via checked indexing or explicit bounds. No `[i]` without bounds check on user input. |

### 9.2 SIMD128 usage

The Wasm target supports SIMD128 (`RUSTFLAGS: -C target-feature=+simd128,+bulk-memory`). Use `std::arch::wasm32` intrinsics for:

| Operation | SIMD benefit |
|-----------|-------------|
| RGB→YUV conversion | 4 pixels in parallel (12 ops → 3 SIMD ops) |
| SAD computation | 16 pixels in parallel |
| Forward DCT | 4 rows in parallel (horizontal pass) |
| Deblocking filter | 4 pixels in parallel |

**Rule:** SIMD optimizations are **Phase 2+** only. Phase 0 and Phase 1 use scalar code for correctness. SIMD is applied only after the scalar version passes all tests.

### 9.3 Validation pipeline

Every code change must pass:

```
1. cargo check -p transmutador_webp_encode
2. cargo test -p transmutador_webp_encode
3. Round-trip test: encode → image-webp decode → PSNR ≥ target
4. (If Wasm change) npm run build:wasm
5. (If frontend change) npx tsc --noEmit && npm test && npm run build
```

### 9.4 Commit message format

```
feat(vp8-encode): <description>          ← new feature
fix(vp8-encode): <description>           ← bug fix
test(vp8-encode): <description>          ← test-only change
refactor(vp8-encode): <description>      ← internal refactor
docs(vp8-encode): <description>          ← documentation

App vX.Y.Z / engine vX.Y.Z.
```

---

## 10. Risk gates and kill switches

### 10.1 Phase gates

| Gate | When | Criterion | If fail |
|------|------|-----------|---------|
| **Gate 0** | End of Phase 0 | BAC round-trip + FDCT round-trip | **Halt project.** BAC is non-negotiable foundation. |
| **Gate 1** | End of Phase 1 | Chrome decodes output + PSNR ≥ 35 dB | Debug bitstream conformity. Extend by 1 week. |
| **Gate 2** | End of Phase 2 | PSNR ≥ 38 dB + within 10% of libwebp size | Accept lower quality. Document gap. Proceed to Phase 3. |
| **Gate 3** | End of Phase 3 | Quality 100 → PSNR ≥ 42 dB | Investigate quantizer mapping. Extend by 1 week. |
| **Gate 4** | End of Phase 4 | All Camaleon tests pass + browser validation | Fix integration issues. Block release until passing. |

### 10.2 Kill switches

| Condition | Action |
|-----------|--------|
| BAC cannot produce conformant bitstream after 2 weeks | **Project halted.** The BAC is the atomic unit — if it fails, the entire approach fails. |
| Chrome cannot decode output after 4 weeks | **Project halted.** A bitstream that no browser reads is useless. |
| PSNR stuck below 35 dB after 6 weeks | **Accept reduced scope.** Ship as "experimental" with honest quality notice. |
| Wasm binary size exceeds 500 KB | **Investigate.** Expected ~42 KB; 500 KB indicates a problem (debug code, unused deps). |
| Performance > 10 seconds for 12 MP | **Optimize with SIMD.** If still > 10 sec after SIMD, accept with "slow encoder" notice. |

### 10.3 Decision authority

| Decision | Authority |
|----------|-----------|
| Phase gate pass/fail | Chief Architect (Cursor) |
| Kill switch activation | Chief Architect (Cursor) |
| Quality target adjustment | Chief Architect (Cursor) after OpenCode data review |
| Upstream PR submission | Chief Architect (Cursor) |
| Camaleon release with Picture-VP8 | Chief Architect (Cursor) after full QA |

---

## Timeline summary

| Phase | Duration | Cumulative | Deliverable | Key gate |
|-------|----------|------------|-------------|----------|
| **Phase 0** | 1-2 weeks | 2 weeks | BAC + FDCT validated | Round-trip exact |
| **Phase 1** | 3-4 weeks | 6 weeks | MVP: DC_PRED encoder | Chrome decodes output |
| **Phase 2** | 4-5 weeks | 11 weeks | Full 14-mode encoder | PSNR ≥ 38 dB |
| **Phase 3** | 2-3 weeks | 14 weeks | Quality parameter | PSNR ≥ 42 dB at Q100 |
| **Phase 4** | 2-3 weeks | 17 weeks | Camaleon integration | All tests pass |
| **Phase 5** | 1-2 weeks | 19 weeks | Upstream PR | PR submitted |

**Total estimated: 13-19 weeks** (3-5 months part-time, 2-3 months full-time).

---

## Sample corpus tracking

| Sample | Original | Google WebP | Picture-VP8 (Phase 1) | Picture-VP8 (Phase 2) | Picture-VP8 (Phase 3, Q75) |
|--------|----------|-------------|----------------------|----------------------|---------------------------|
| 007 | 7,402,052 | 6,326,740 | _pending_ | _pending_ | _pending_ |
| 008 | 7,399,936 | 6,316,196 | _pending_ | _pending_ | _pending_ |
| 009 | 7,401,646 | 6,319,984 | _pending_ | _pending_ | _pending_ |
| 011 | 7,398,070 | 6,215,788 | _pending_ | _pending_ | _pending_ |

This table will be updated with actual Picture-VP8 output sizes and PSNR values as each phase completes.

---

*Category 4 complete. Picture-VP8 ROADMAP is ready for execution.*

*Last updated: 2026-06-28 · Picture-VP8 · Camaleon v3.9.3 · 4-phase delivery · 13-19 weeks*
