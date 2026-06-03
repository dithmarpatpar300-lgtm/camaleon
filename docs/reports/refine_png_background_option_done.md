# Technical Report: Background-Color Wasm Export for PNG→JPG

**Task ID:** refine_png_background_option
**Status:** done
**Date:** 2026-06-03
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Pre-Execution Analysis

### Gap Identified

The Rust core (`transmutador_png` v0.5.4) fully supports arbitrary `BackgroundFill` through `PngToJpgOptions { quality, background }`, `flatten_rgba_on_background`, and `png_bytes_to_jpg_bytes(input, &options)`. However, no Wasm export exposed a custom background color to the frontend:

| Export | Quality | Background |
|--------|---------|------------|
| `transmutar_png_a_jpg` | Fixed 85 | Fixed WHITE |
| `transmutar_png_a_jpg_with_quality` | Configurable | Fixed WHITE |
| _(missing)_ | Configurable | Configurable |

### Solution

Add `transmutar_png_a_jpg_with_options(bytes, quality, bg_r, bg_g, bg_b)` — delegates to existing `_inner` with a `PngToJpgOptions { quality, background: BackgroundFill { r, g, b } }`. Zero new compositing code; `r`, `g`, `b` are `u8` (inherently 0–255, no extra validation needed).

## 2. Work Performed

### Files Modified

| File | Change |
|------|--------|
| `motor_transmutacion/transmutador_png/src/lib.rs` | Added `transmutar_png_a_jpg_with_options` Wasm export; updated module docs with background selection section |
| `motor_transmutacion/transmutador_png/tests/integration.rs` | +3 tests: custom background red, opaque unchanged with custom bg, quality-zero rejection via options path (17 total) |
| `frontend/src/types/wasm-modules.d.ts` | Added `transmutar_png_a_jpg_with_options` ambient declaration |
| `frontend/src/components/layout/Footer.tsx` | Version `0.6.2` → `0.6.3` |
| `motor_transmutacion/Cargo.toml` | Version `0.5.5` → `0.5.6` |
| `frontend/package.json` | Version `0.6.2` → `0.6.3` |
| `docs/SPEC.md` | Version `0.6.2` → `0.6.3`; §6.3 updated with new export, test count 14→17; §11 amendment |

### New Wasm Export
```rust
#[wasm_bindgen]
pub fn transmutar_png_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String>
```

## 3. Verification Results

| Command | Result | Notes |
|---------|--------|-------|
| `cargo test --workspace` | PASS | 58/58 tests (26 + 15 + 17) |
| `scripts/build-wasm.ps1` | PASS | Both modules rebuilt |
| `npm run build` | PASS | Next.js 15.5.19 |

### New Integration Tests
| Test | Assertion |
|------|-----------|
| `custom_background_red_flattens_correctly` | Transparent red (255,0,0,128) on blue bg → R≈128, B≈128 |
| `custom_background_opaque_image_unaffected` | Opaque PNG + green bg → pixels unchanged |
| `with_options_quality_zero_rejected` | Quality 0 → Err |

## 4. Deviations from Prompt

None. All requirements R1–R7 satisfied. Existing exports untouched. No new compositing code. StripAll metadata policy intact. No UI changes.

---

### Self-Check (Exit Gate)
- [x] New export delegates to `_inner` with custom `BackgroundFill`; existing exports untouched
- [x] Custom (non-white) background composites correctly; opaque images unaffected
- [x] Quality still validated (0/>100 rejected)
- [x] Ambient types updated; `npm run build` compiles
- [x] StripAll intact
- [x] `cargo test --workspace` green (58/58)
- [x] SPEC v0.6.3 updated
