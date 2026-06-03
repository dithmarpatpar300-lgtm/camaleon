# Technical Report: Harden transmutador_jpg — RGB Color-Type Policy, Configurable Compression

**Task ID:** refine_transmutador_jpg
**Status:** done
**Date:** 2026-06-02
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Pre-Execution Analysis

### SPEC Gaps Addressed (per §5.4.4)

| Gap | v0.5.4 state | v0.5.5 closure |
|-----|-------------|----------------|
| Color-type enforcement | `write_to(ImageFormat::Png)` — assumed RGB but not verified | Explicit `to_rgb8()` → `PngEncoder::write_image` with `ExtendedColorType::Rgb8`; IHDR color type 2 verified by test |
| Compression parameter | No configurable compression | `JpgToPngOptions { compression: 1..9 }`, default 6, `validate_compression` rejects 0 and >9 |
| Grayscale JPEG handling | Unspecified | Grayscale JPEG expands to RGB (L8→R=G=B=L) per color-type policy |
| Encoder API | Implicit `write_to(ImageFormat::Png)` | Explicit `PngEncoder::new_with_quality(CompressionType::Level(n), FilterType::Adaptive)` |

### Image Crate Default Behavior Audit

| Aspect | `image` v0.25 default | Camaleon v0.5.5 explicit |
|--------|----------------------|--------------------------|
| PNG color type from JPEG | `ImageReader` decode → `DynamicImage::ImageRgb8` → `write_to(Png)` → encoder uses input color type (RGB) | Explicit `to_rgb8()` + `ExtendedColorType::Rgb8` — guarantees IHDR type 2 |
| PNG compression | `CompressionType::Default` (≈6) | `CompressionType::Level(1..9)` configurable; default 6 |
| PNG filter | `FilterType::default()` (≈Adaptive) | `FilterType::Adaptive` explicit |
| Grayscale JPEG→PNG | Encoder may output grayscale PNG (type 0) | Explicit `to_rgb8()` expands to RGB (type 2) |

## 2. Work Performed

### Files Modified

| File | Change |
|------|--------|
| `motor_transmutacion/transmutador_jpg/src/lib.rs` | Full rewrite: `JpgToPngOptions`, `validate_compression`, `jpg_bytes_to_png_bytes(input, options)` using `PngEncoder::new_with_quality`, `png_ihdr_color_type` helper, `transmutar_jpg_a_png` (backward compat), `transmutar_jpg_a_png_with_compression` (new) |
| `motor_transmutacion/transmutador_jpg/tests/integration.rs` | 15 tests (was 5): +color type=2, +grayscale→RGB, +pixel preserved, +compression bounds, +compression size, +defaults, +IHDR reader, all adapted for `&JpgToPngOptions` |
| `frontend/src/types/wasm-modules.d.ts` | Added `transmutar_jpg_a_png_with_compression` ambient declaration |
| `motor_transmutacion/Cargo.toml` | Version `0.5.4` → `0.5.5` |
| `frontend/package.json` | Version `0.5.4` → `0.5.5` |
| `docs/SPEC.md` | Version `0.5.4` → `0.5.5`; §5.4.3 P2/P4 updated; §5.4.4 alignment; §5.8 ✅; §6.2 expanded; §11 entry |

### RGB Color-Type Enforcement (R2)

```rust
let rgb = img.to_rgb8(); // explicit RGB8 conversion

let encoder = PngEncoder::new_with_quality(
    &mut buf,
    CompressionType::Level(options.compression),
    FilterType::Adaptive,
);
encoder.write_image(
    rgb.as_raw(),
    rgb.width(),
    rgb.height(),
    ExtendedColorType::Rgb8, // guarantees IHDR color type 2
)?;
```

Key decisions:
- `to_rgb8()` converts any decoded `DynamicImage` variant (including grayscale) to RGB8
- `ExtendedColorType::Rgb8` explicitly sets PNG IHDR color type to **2 (RGB)**
- Grayscale JPEG (rare but valid) expands to RGB where R=G=B=L — preserves luminance, wastes no color channel (all channels carry same signal, DEFLATE compresses the redundancy)

### PNG Compression API (R3)

```rust
// Backward-compatible — Worker continues calling this
#[wasm_bindgen]
pub fn transmutar_jpg_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String>

// New — for future UI compression control
#[wasm_bindgen]
pub fn transmutar_jpg_a_png_with_compression(
    input_bytes: &[u8], compression: u8
) -> Result<Vec<u8>, String>
```

Both delegate to `transmutar_jpg_a_png_inner(input, &options)`. Default compression of **6** balances CPU time and file size per DEFLATE convention. `FilterType::Adaptive` selects the best per-scanline filter (None/Sub/Up/Average/Paeth) heuristically.

## 3. Architectural Decisions

| Decision | Rationale | SPEC section affected |
|----------|-----------|----------------------|
| Explicit `to_rgb8()` + `ExtendedColorType::Rgb8` | Guarantees IHDR color type 2 regardless of `image` crate internal behavior changes. JPEG never has alpha; RGBA PNG wastes 33% raster for zero benefit. | §5.4.3 P2 |
| Grayscale JPEG → RGB expansion | PNG color type 2 policy applies uniformly. L8→R=G=B=L preserves luminance; DEFLATE compresses channel redundancy efficiently. | §5.4.3 P2 |
| `PngEncoder::new_with_quality` over `write_to` | Full control of compression level, filter type, and color type. `write_to` uses opaque defaults that could change across `image` crate versions. | §5.4.3 P4 |
| `FilterType::Adaptive` as explicit default | Documented encoder behavior; matches `image` crate default. Individual filter selection (None/Sub/Up/Avg/Paeth) deferred. | §5.4.3 P4 |
| `validate_compression` rejects 0 and >9 (not clamp) | Clamping hides configuration errors; explicit rejection surfaces invalid input. | §5.4.3 P4 |
| `png_ihdr_color_type` as public helper | Enables integration tests to verify output PNG color type without full decode. Avoids `image` crate dependency in test assertions. | §6.2 |

## 4. Verification Results

| Command | Result | Notes |
|---------|--------|-------|
| `cargo test --workspace` | PASS | 55/55 tests (26 core_utils + 15 transmutador_jpg + 14 transmutador_png) |
| `cargo check --workspace` | PASS | 0 errors, 0 warnings |
| `scripts/build-wasm.ps1` | PASS | Both Wasm modules rebuilt; new `transmutar_jpg_a_png_with_compression` export confirmed |
| `npm run build` | PASS | Next.js 15.5.19; frontend unchanged |

### Test Summary

| Crate | Tests | New in v0.5.5 |
|-------|-------|---------------|
| `core_utils` | 26 | — |
| `transmutador_jpg` | 15 | +10 (color type, grayscale, pixel preserved, compression ×3, size, defaults, IHDR reader ×2) |
| `transmutador_png` | 14 | — |
| **Total** | **55** | **+10** |

### Key Test Results

| Test | Assertion |
|------|-----------|
| `output_png_ihdr_is_rgb_not_rgba` | Color type byte at IHDR offset 25 → **2** (RGB), not 6 (RGBA) |
| `grayscale_jpeg_outputs_rgb_png` | Grayscale 1×1 JPEG → IHDR type 2; output 3-channel RGB with R=G=B≈128 |
| `pixel_values_preserved_after_rgb_conversion` | 16×16 gradient → pixel (8,8) ≈ (128,128,128) |
| `rejects_compression_zero` | `validate_compression(0)` → Err |
| `rejects_compression_over_nine` | `validate_compression(10)` → Err |
| `higher_compression_smaller_or_equal_output` | Level 9 bytes ≤ level 1 bytes |
| `source_jpeg_exif_not_in_output_png` | Metadata StripAll regression ✅ |

## 5. SPEC Amendments

**Version:** 0.5.4 → 0.5.5 (MINOR bump — new Wasm API export, new public types, documented encoder levers).

**Sections updated:**
- Header: version, status
- §5.4.3 P2: Explicit RGB enforcement documented with implementation detail
- §5.4.3 P4: Compression level 1–9, FilterType::Adaptive documented
- §5.4.4: Alignment table fully updated (P2 ✅, P4 ✅, P5 deferred) with v0.5.5 version
- §5.8: `refine_transmutador_jpg` marked v0.5.5 ✅
- §6.2: Dual Wasm API, options types, behavior steps, test count (15), color-type/compression behavior
- §11: Amendment log entry for v0.5.5

## 6. Known Gaps / Follow-ups

| Item | Phase | Notes |
|------|-------|-------|
| UI compression slider | Phase 4 or post-MVP | `transmutar_jpg_a_png_with_compression` ready for Worker/frontend wiring |
| Palette/indexed PNG (P5) | Post-MVP | Requires color quantization; significant scope |
| Individual PNG filter selection | Post-MVP | `FilterType::Sub`, `FilterType::Paeth`, etc. for specific content types |
| Lossy PNG modes | Post-MVP | pngquant-style quantization; changes module contract |
| All backend refinement tasks complete | — | Core utils, metadata, transmutador_png, transmutador_jpg all ✅ |

## 7. Deviations from Prompt

None. All requirements R1–R10 satisfied. Backward compatibility preserved. StripAll metadata policy verified by regression test. No UI changes. No Worker protocol changes.

---

### Self-Check (Exit Gate)

- [x] Output PNG IHDR color type is **2 (RGB)**, never **6 (RGBA)** (tested: `output_png_ihdr_is_rgb_not_rgba`)
- [x] Grayscale JPEG → RGB PNG (tested: `grayscale_jpeg_outputs_rgb_png`)
- [x] Compression 0 / invalid rejected; compression 6 default unchanged (tested: `rejects_compression_zero`, `rejects_compression_over_nine`, `default_options_compression_is_six`)
- [x] Metadata StripAll test still passes (tested: `source_jpeg_exif_not_in_output_png`)
- [x] Filter type and compression semantics documented in report and SPEC
- [x] `cargo test --workspace` all green (55/55)
- [x] SPEC v0.5.5 updated
