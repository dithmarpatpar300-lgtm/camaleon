# Technical Report: Harden transmutador_png — Alpha Flatten, Quality Parameter, Subsampling

**Task ID:** refine_transmutador_png
**Status:** done
**Date:** 2026-06-02
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Pre-Execution Analysis

### SPEC Gaps Addressed (per §5.5.5)

| Gap | v0.5.3 state | v0.5.4 closure |
|-----|-------------|----------------|
| Alpha flatten | Relied on `image` crate implicit RGBA→RGB behavior (discards alpha → effectively black background) | Explicit per-pixel compositing onto `BackgroundFill::WHITE` |
| Quality parameter | Fixed constant 85, not user-configurable | `validate_quality(1..100)`, dual Wasm exports |
| Chroma subsampling | Undocumented | Confirmed `4:2:0` via `image` crate `JpegEncoder` default; documented in code + SPEC |

### Image Crate Default Behavior Audit

| Conversion | `image` v0.25 default | Camaleon v0.5.4 explicit |
|-----------|----------------------|--------------------------|
| RGBA→RGB | Discards alpha (effectively black background) | Manual compositing: `(α·C_fg + (255-α)·C_bg + 127) / 255` onto white |
| JPEG subsampling | `4:2:0` (yv12) | Confirmed and documented; no override needed |
| JPEG quality | `JpegEncoder::new_with_quality(q)` | Configurable 1–100; default 85 preserved |

### Edge Cases

| Case | Handling |
|------|----------|
| Opaque RGB PNG → JPEG | Alpha check `img.color().has_alpha()` returns false → encode directly; no spurious flatten pass |
| RGBA with full opacity (α=255) | Compositing yields same pixel: `(255·C + 0·bg + 127) / 255 = C` (after rounding) |
| RGBA with zero opacity (α=0) | Output = `BackgroundFill` pixel (white by default) |
| Quality 0 | `validate_quality` rejects with "must be at least 1" |
| Quality >100 | Rejected with "exceeds maximum (100)" |
| Metadata StripAll | Verified by regression test; encoder creates fresh JFIF APP0 only |

## 2. Work Performed

### Files Modified

| File | Change |
|------|--------|
| `motor_transmutacion/transmutador_png/src/lib.rs` | Full rewrite: `BackgroundFill`, `PngToJpgOptions`, `validate_quality`, `flatten_rgba_on_background`, `png_bytes_to_jpg_bytes(input, options)`, `transmutar_png_a_jpg` (backward compat), `transmutar_png_a_jpg_with_quality` (new) |
| `motor_transmutacion/transmutador_png/tests/integration.rs` | 14 tests (was 5): +alpha flatten on white, +alpha flatten on black, +opaque RGB unchanged, +quality bounds, +quality size comparison, +options defaults, +background const |
| `frontend/src/types/wasm-modules.d.ts` | Added `transmutar_png_a_jpg_with_quality` ambient declaration |
| `motor_transmutacion/Cargo.toml` | Version `0.5.3` → `0.5.4` |
| `frontend/package.json` | Version `0.5.3` → `0.5.4` |
| `docs/SPEC.md` | Version `0.5.3` → `0.5.4`; §5.5.2–5.5.5 updated; §5.8 ✅; §6.3 expanded; §11 entry |

### Alpha Flatten Implementation (R2)

```rust
fn flatten_rgba_on_background(rgba: &RgbaImage, bg: BackgroundFill) -> RgbImage {
    for (x, y, pixel) in rgba.enumerate_pixels() {
        let a = pixel[3] as u32;
        let r = pixel[0] as u32;
        // ...
        let out_r = ((a * r + inv_a * bg_r + 127) / 255) as u8;
        // per-channel with +127 for rounding to nearest
    }
}
```

- Uses `+127` before division for correct rounding (not truncation)
- Processes RGBA pixels individually; writes to new `RgbImage`
- Triggered only when `img.color().has_alpha() == true`
- Opaque RGB sources skip the flatten pass entirely

### Quality API (R3)

```rust
// Backward-compatible — Worker continues calling this
#[wasm_bindgen]
pub fn transmutar_png_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String>

// New — for future UI quality slider
#[wasm_bindgen]
pub fn transmutar_png_a_jpg_with_quality(
    input_bytes: &[u8], quality: u8
) -> Result<Vec<u8>, String>
```

Both delegate to `transmutar_png_a_jpg_inner(input, &options)`. The default export preserves Q85 + white background behavior — fully backward-compatible.

### Chroma Subsampling (R4)

The `image` crate v0.25 `JpegEncoder::new_with_quality` uses the `jpeg-encoder` crate internally. The default `SamplingFactor` is `yv12` (4:2:0), confirmed by source inspection. This is optimal for photographic content where chroma detail is less perceptually important than luma. No API exists in `image` v0.25 to configure subsampling at the `JpegEncoder` level — `4:4:4` would require the lower-level `jpeg-encoder` crate directly (deferred post-MVP per SPEC §5.5.3).

## 3. Architectural Decisions

| Decision | Rationale | SPEC section affected |
|----------|-----------|----------------------|
| Manual alpha compositing (not `image` crate default) | `image` v0.25 `to_rgb8()` on RGBA discards alpha without compositing (effectively black). Explicit `(α·C_fg + (255-α)·C_bg + 127) / 255` guarantees white background per P3. | §5.5.2 |
| `BackgroundFill` as `Copy` struct with `WHITE` constant | Enables future per-module background configuration; no heap allocation; `Default` gives white. | §5.5.2 |
| `PngToJpgOptions` with `Default` impl | All callers get sensible defaults (Q85 + white). `transmutar_png_a_jpg` (original Wasm export) unchanged signature = no Worker changes needed. | §5.5.3, §6.3 |
| `validate_quality` rejects 0 and >100 (not clamp) | Clamping hides configuration errors; explicit rejection surfaces invalid input to UI/developer. | §5.5.3 |
| `has_alpha()` check before flatten | Avoids unnecessary pixel iteration on opaque RGB sources (common case for photos). | §5.5.2 |
| No chroma subsampling override | `4:2:0` is appropriate default for photographic JPEG; `image` crate v0.25 `JpegEncoder` API doesn't expose subsampling toggle — requires lower-level `jpeg-encoder` crate (post-MVP). | §5.5.3 |

## 4. Verification Results

| Command | Result | Notes |
|---------|--------|-------|
| `cargo test --workspace` | PASS | 45/45 tests (26 core_utils + 5 transmutador_jpg + 14 transmutador_png) |
| `cargo check --workspace` | PASS | 0 errors, 0 warnings |
| `scripts/build-wasm.ps1` | PASS | Both Wasm modules rebuilt; new `transmutar_png_a_jpg_with_quality` export confirmed in `.d.ts` |
| `npm run build` | PASS | Next.js 15.5.19; frontend unchanged |

### Test Summary

| Crate | Tests | New in v0.5.4 |
|-------|-------|---------------|
| `core_utils` | 26 | — |
| `transmutador_jpg` | 5 | — |
| `transmutador_png` | 14 | +9 (alpha flatten ×3, quality bounds ×3, quality size, options defaults, background const) |
| **Total** | **45** | **+9** |

### Key Test Results

| Test | Assertion |
|------|-----------|
| `flatten_transparent_pixel_on_white` | Transparent red (255,0,0,128) on white → decoded JPEG pixel red >200, green/blue >100 |
| `flatten_transparent_pixel_on_black` | Same source on black → red ~128, green/blue <30 |
| `opaque_rgb_not_altered_by_flatten_pass` | Opaque PNG → pixel values within JPEG loss tolerance of ~128 |
| `rejects_quality_zero` | `validate_quality(0)` → Err |
| `rejects_quality_over_100` | `validate_quality(101)` → Err |
| `lower_quality_produces_smaller_or_equal_output` | Q50 bytes ≤ Q95 bytes |
| `source_png_text_not_in_output_jpeg` | Metadata StripAll regression ✅ |

## 5. SPEC Amendments

**Version:** 0.5.3 → 0.5.4 (MINOR bump — new Wasm API export, new public types, documented subsampling).

**Sections updated:**
- Header: version, status
- §5.5.2: `BackgroundFill::WHITE` marked implemented with compositing formula
- §5.5.3: Quality parameter documented; chroma subsampling 4:2:0 confirmed
- §5.5.5: Alignment table fully updated (P1/P2 ✅, P3 ✅, P4 ✅ documented, P5 deferred)
- §5.8: `refine_transmutador_png` marked v0.5.4 ✅
- §6.3: Dual Wasm API, options types, behavior steps, test count (14), alpha/quality behavior
- §11: Amendment log entry for v0.5.4

## 6. Known Gaps / Follow-ups

| Item | Phase | Notes |
|------|-------|-------|
| UI quality slider | Phase 4 or post-MVP | `transmutar_png_a_jpg_with_quality` ready for Worker/frontend wiring |
| `4:4:4` chroma subsampling toggle | Post-MVP | Requires `jpeg-encoder` crate directly or `image` crate API addition |
| Progressive JPEG | Post-MVP | Not supported by `JpegEncoder` |
| Optimized Huffman tables | Post-MVP | Mozjpeg-style; `image` uses standard tables |
| Alpha-detected UI warning | Phase 4 | SPEC §5.5.2 recommends user notification |
| `refine_transmutador_jpg` | v0.5.x | Color-type policy, PNG compression effort (per §5.8) |

## 7. Deviations from Prompt

None. All requirements R1–R10 satisfied. Backward compatibility preserved: `transmutar_png_a_jpg` unchanged. StripAll metadata policy verified by regression test. No UI changes. No Worker protocol changes.

---

### Self-Check (Exit Gate)

- [x] Transparent PNG pixel composites onto white, not black (tested: `flatten_transparent_pixel_on_white`)
- [x] Opaque PNG transmutation still works (tested: `opaque_rgb_not_altered_by_flatten_pass`)
- [x] Quality 0 / invalid rejected; quality 85 default unchanged on original Wasm export (tested: `rejects_quality_zero`, `rejects_quality_over_100`, `default_options_quality_is_85`)
- [x] Metadata StripAll test still passes (tested: `source_png_text_not_in_output_jpeg`)
- [x] Chroma subsampling documented in report and SPEC (§5.5.3)
- [x] `cargo test --workspace` all green (45/45)
- [x] SPEC v0.5.4 updated
