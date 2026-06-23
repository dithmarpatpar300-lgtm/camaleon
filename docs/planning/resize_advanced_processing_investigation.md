# Resize Advanced Processing — Technical Investigation

> **Date:** 2026-06-23 · **Author:** OpenCode  
> **Status:** Investigation · **Phase:** 4a.0 expansion (current: v3.6.1)  
> **Scope:** Exhaustive technical survey of what image processing capabilities can be added to Camaleon's Resize toolchain beyond the current percent+filter paradigm.  
> **Parent docs:** `tier4_plan.md` · `resize_premium_roadmap.md` · `resize_competitive_analysis.md` (v3.6.0)  
> **SPEC anchor:** §12.5 Tier 4a  
> **Crate:** `motor_transmutacion/transmutador_optimize`

---

## 0. Executive summary

v3.6.0 shipped Resize Premium with 5 interpolation filters, upscale support, JPEG quality control, and dimensions display. However, professional image manipulation — even in a privacy-first browser tool — requires more than a resize slider and a filter picker. Users commonly need to **sharpen** results after downscaling, **reduce noise** before upscaling, **adjust brightness/contrast**, and apply **dithering** for indexed output.

The `image` crate (v0.25.10) — already compiled into every Wasm binary — exposes at least **8 additional `imageops` functions at zero bundle cost** that Camaleon does not yet expose. Additional pure-Rust crates (`imageproc`, `fast_image_resize`, `quantette`) are wasm-compatible and MIT-licensed. This investigation maps all available territory.

---

## 1. Current Resize baseline (v3.6.0) — what exists

### 1.1 Rust engine (`transmutador_optimize/src/lib.rs`)

| Export | Parameters | Filter? | Quality? |
|--------|-----------|---------|----------|
| `resize_png` | `percent: u16` | defaults CatmullRom(2) | hardcoded 6 |
| `resize_jpeg` | `percent: u16` | defaults CatmullRom(2) | hardcoded 85 |
| `resize_png_with_filter` | `percent: u16, filter_code: u8` | 0–4 | hardcoded 6 |
| `resize_jpeg_with_filter` | `percent: u16, filter_code: u8` | 0–4 | hardcoded 85 |
| `resize_jpeg_with_filter_and_quality` | `percent: u16, filter_code: u8, quality: u8` | 0–4 | 1–100 |

**Filters:** 0=Nearest, 1=Triangle, 2=CatmullRom (default), 3=Gaussian, 4=Lanczos3  
**Constants:** `MIN_RESIZE_PERCENT=1`, `MAX_RESIZE_PERCENT=400`, `DEFAULT_PNG_COMPRESSION=6`, `DEFAULT_JPEG_QUALITY=85`

### 1.2 UI (OptionsControls.tsx)

- Slider 1%–200% (400% behind Advanced toggle)
- 3 visible filters + 2 advanced (collapsible)
- Target dimensions display (W×H → W'×H')
- Amber upscale warning at >100%
- JPEG quality dual slider on `jpg-resize`

### 1.3 Notices (compute-fidelity-notices.ts)

| Trigger | Severity | Notice |
|---------|----------|--------|
| `jpg-resize` always | warn | Generational loss |
| `resizePercent < 25` on png/jpg-resize | info | Extreme downscale |
| `resizePercent > 100` | warn | Upscale honesty |
| `resizePercent > 200` + advanced | warn | Filter-specific tradeoffs |

### 1.4 Notable gaps (current)

| # | Gap | Severity |
|---|-----|----------|
| G1 | `resize_png_with_filter` hardcodes compression=6 — user cannot control PNG output size on resize | Medium |
| G2 | `wasm-modules.d.ts` missing `_with_filter` and `estimate_resize_*` declarations | Low (worker uses inline types) |
| G3 | No per-resize PNG compression slider in registry `optionSpecs` | Medium |
| G4 | Registry `max: 200` but Rust supports 400 (gated by "Advanced" toggle in UI only) | Low |

---

## 2. `image::imageops` — capabilities already compiled into Wasm (zero bundle cost)

The `image` crate is a dependency of `transmutador_optimize`. All `imageops` functions are **already in the compiled `.wasm` binary**. Exposing them requires only glue code (validation + encoding), not new crate dependencies.

### 2.1 Available imageops functions (v0.25.10)

| Function | Signature | Use case in resize workflow |
|----------|-----------|----------------------------|
| `blur` | `(img, sigma: f32) -> DynamicImage` | Pre-downscale anti-aliasing; soften pixel art before upscale |
| `fast_blur` | `(img, sigma: f32) -> DynamicImage` | Faster blur approximation; real-time preview |
| `unsharpen` | `(img, sigma: f32, threshold: i32) -> DynamicImage` | Post-downscale detail recovery; compensate for soft filters |
| `brighten` | `(img, value: i32) -> DynamicImage` | Exposure correction; lighten dark images before resize |
| `contrast` | `(img, contrast: f32) -> DynamicImage` | Make flat images pop; recover washed-out JPEGs |
| `huerotate` | `(img, value: i32) -> DynamicImage` | Color correction; creative effects |
| `filter3x3` | `(img, kernel: &[f32; 9]) -> DynamicImage` | Custom convolution: sharpen, emboss, edge-detect, box-blur |
| `dither` | `(img, palette: &[Rgba<T>]) -> DynamicImage` | Ordered dithering for indexed-color output |
| `flip_horizontal` | `(img) -> DynamicImage` | Mirror |
| `flip_vertical` | `(img) -> DynamicImage` | Flip |
| `rotate90/180/270` | `(img) -> DynamicImage` | Orientation fix |
| `grayscale` / `grayscale_alpha` | `(img) -> DynamicImage` | Monochrome output |
| `invert` | `(img) -> DynamicImage` | Negative effect |

### 2.2 Recommended additions (priority-ordered)

| Priority | Operation | Rationale |
|----------|-----------|-----------|
| **P0** | `unsharpen` (post-resize) | Downscaling softens detail. Unsharp mask is the standard countermeasure. Photopea, Photoshop, GIMP all offer it post-resize. |
| **P0** | `brighten` + `contrast` | Essential for photo preparation. Users often resize for social media and want brightness/contrast in the same workflow. |
| **P1** | `blur` / `fast_blur` (pre-resize) | Gaussian pre-blur prevents Moiré on extreme downscale. Already discussed in Tier 4a filter catalog (§3.2). |
| **P1** | `filter3x3` | Expose sharpen/emboss/edge kernels as presets. Power users get custom matrix. |
| **P2** | `dither` | Crucial for PNG→PNG compress when targeting small palettes. Squoosh offers dither on OptiPNG. |
| **P2** | `huerotate` | Common creative adjustment; low implementation cost. |
| **P3** | `grayscale` | Simple checkbox; useful for print-ready output. |

---

## 3. External crate survey — wasm-compatible, MIT-licensed

### 3.1 `fast_image_resize` v6.0.0

| Aspect | Detail |
|--------|--------|
| **Downloads** | 15.4M total / 2.2M recent |
| **License** | MIT OR Apache-2.0 |
| **Wasm** | Pure Rust, WASM SIMD support, `no_std` compatible |
| **Size** | ~156 KB crate |
| **Value for Camaleon** | 18+ filter types (Lanczos2, Mitchell, Hamming, Blackman, CatmullRomB, etc.) with alpha premultiplication. Significantly better quality than `imageops::resize` for some edge cases. WASM SIMD would accelerate resize on Chrome 91+. |

**Verdict:** Worth a spike. Not a dependency today but offers filter types the `image` crate does not expose (Mitchell-Netravali, Hamming, Kaiser). Migration cost: moderate (different API, different image representation). Do not block Phase B on this.

### 3.2 `imageproc` v0.27.0

| Aspect | Detail |
|--------|--------|
| **Downloads** | 10.3M total / 2.6M recent |
| **License** | MIT |
| **Wasm** | Pure Rust (depends on `image` + optional `rayon`; disable `rayon` for Wasm) |
| **Size** | ~157 KB crate, ~17K LoC |
| **Value for Camaleon** | Gaussian blur (σ control), **median filter**, **bilateral filter**, morphology (dilate/erode), edge detection (Canny, Sobel), affine transforms, drawing primitives. |

**Key operations for Resize workflow:**

| Operation | Function | Use case |
|-----------|----------|----------|
| Median filter | `median_filter(img, x_radius, y_radius)` | Remove salt-and-pepper noise before upscale |
| Bilateral filter | `bilateral_filter(img, spatial_sigma, luminance_sigma)` | Edge-preserving noise reduction — ideal for photos |
| Gaussian blur | `gaussian_blur_f32(img, sigma)` | Superior to `imageops::blur` — params exposed |
| Morphological dilate | `dilate(img, norm, kernel)` | Thicken lines before downscale of pixel art |
| Morphological erode | `erode(img, norm, kernel)` | Thin lines; remove edge artifacts |
| Canny edge detect | `canny(img, low_thresh, high_thresh)` | Extract edges; creative effect |

**Verdict:** **High value, medium risk.** `default-features = false` to strip `rayon`. The median and bilateral filters specifically address the denoiser requirement the user identified. This is the single most impactful crate for expanding resize processing.

### 3.3 `quantette` v0.6.0

| Aspect | Detail |
|--------|--------|
| **Downloads** | 330K total / 198K recent |
| **License** | MIT OR Apache-2.0 |
| **Wasm** | Pure Rust |
| **Size** | ~81 KB crate |
| **Value for Camaleon** | Floyd-Steinberg dithering (superior to ordered dither in `imageops`), color quantization (k-means, NeuQuant, median cut), palette generation. CIELAB/Oklab/sRGB aware. |

**Verdict:** **Medium value for resize.** Dithering is more relevant for compress/palette workflows. Add to backlog; not blocking.

### 3.4 `photon-rs` v0.3.3

| Aspect | Detail |
|--------|--------|
| **Downloads** | 80K total |
| **License** | Apache-2.0 |
| **Wasm** | Wasm-first design (`wasm-bindgen` feature) |
| **Size** | ~242 KB crate, 4K lines (small LoC but large binary) |
| **Capabilities** | 96 functions: blur, sharpen, noise reduction, edges, threshold, dither, monochrome, tint, gamma, contrast, hue-rotate, 30+ Instagram-style filters |

**Verdict:** **Low priority.** Overlaps substantially with `imageops` + `imageproc`. Adds binary weight (~240 KB) for convenience wrappers. Not recommended unless specific filters are demanded by users.

### 3.5 Summary — crate recommendation matrix

| Crate | Cost (wasm KB) | Value | Risk | Recommendation |
|-------|---------------|-------|------|----------------|
| `image::imageops` (existing) | **0** | High | None | **Expose immediately** |
| `imageproc` | ~160 | High | Medium (no_std + strip rayon) | **Spike for Phase 4a.4** |
| `fast_image_resize` | ~160 | Medium (better filters) | Medium (API migration) | **Backlog spike** |
| `quantette` | ~80 | Medium (dithering) | Low | **Backlog** |
| `photon-rs` | ~240 | Low (overlap) | Low | **Skip** |

---

## 4. Competitor capability map — what others expose during resize

| Tool | Sharpen | Brightness/Contrast | Denoise | Blur | Dither | Filter count |
|------|---------|---------------------|---------|------|--------|-------------|
| **Squoosh** | ❌ | ❌ | ❌ | ❌ | ✅ (OptiPNG) | 1 (Lanczos3) |
| **Photopea** | ✅ Unsharp | ✅ Levels/Curves | ✅ Despeckle | ✅ Gaussian | ✅ | 3 (Nearest/Bilinear/Bicubic) |
| **Photoshop** | ✅ Smart Sharpen | ✅ Full adjustment layers | ✅ Reduce Noise | ✅ Lens Blur | ✅ | 7 (Nearest/Bilinear/Bicubic/BicubicSm/Sm+Details/Preserve2.0/Automatic) |
| **GIMP** | ✅ Unsharp Mask | ✅ Full | ✅ NL-means | ✅ Gaussian | ✅ | 5 (None/Linear/Cubic/NoHalo/LoHalo) |
| **waifu2x** | ❌ | ❌ | ✅ (AI noise reduction levels 0-3) | ❌ | ❌ | N/A (AI model) |
| **photon-rs (wasm)** | ✅ | ✅ (7 adjs) | ✅ | ✅ | ✅ | 1 (Lanczos3) |
| **Camaleon** | ❌ | ❌ | ❌ | ❌ | ❌ | **5** (best in browser) |

**Gap:** Camaleon leads on filter count for browser tools but has zero image adjustment capabilities. Photopea (Photoshop clone, all JS) is the reference for "what a web tool can offer" — though its 50+ functions are mostly JS/Canvas-based, not Wasm.

---

## 5. Proposed target architecture — Resize with Processing Pipeline

### 5.1 Conceptual pipeline

```
Input Bytes
  │
  ├─► validate_input (core_utils)
  │
  ├─► decode_image (image::ImageReader)
  │
  ├─► [PRE-RESIZE PROCESSING]           ← NEW
  │   ├─ blur / fast_blur (noise reduction)
  │   ├─ brighten (brightness)
  │   └─ contrast
  │
  ├─► resize_by_percent (filter=X)       ← existing
  │
  ├─► [POST-RESIZE PROCESSING]          ← NEW
  │   ├─ unsharpen (sigma, threshold)
  │   ├─ median_filter / bilateral_filter (imageproc)
  │   ├─ hue_rotate
  │   ├─ grayscale
  │   └─ dither (optional)
  │
  ├─► encode_png / encode_jpeg           ← existing
  │
  └─► validate_output → Vec<u8>
```

### 5.2 Processing order rationale

Pre-resize operations apply to the **full-resolution** raster. Post-resize operations apply to the **already-downscaled** raster (fewer pixels = faster).

| Phase | Operations | Why here |
|-------|-----------|----------|
| **Pre-resize** | blur, brighten, contrast | Noise reduction before downscale preserves signal; exposure/correction on original data |
| **Post-resize** | unsharpen, median, hue, grayscale, dither | Sharpen on final size; creative effects on target dimensions; dither on palette output |

### 5.3 New WASM API surface (additive to existing)

```rust
// ── New unified resize entry (replaces calling individual ops) ──

#[wasm_bindgen]
pub fn resize_png_with_processing(
    input_bytes: &[u8],
    resize_percent: u16,
    filter_code: u8,           // 0-4 (existing)
    compression: u8,           // 1-9 (NEW — was hardcoded)
    pre_blur_sigma: f32,       // 0.0 = skip (NEW)
    pre_brighten: i32,         // 0 = skip (NEW)
    pre_contrast: f32,         // 1.0 = no change (NEW)
    post_sharpen_sigma: f32,   // 0.0 = skip (NEW)
    post_sharpen_threshold: i32, // (NEW)
    post_grayscale: bool,      // (NEW)
) -> Result<Vec<u8>, String>;

// ── JPEG variant adds quality ──

#[wasm_bindgen]
pub fn resize_jpeg_with_processing(
    input_bytes: &[u8],
    resize_percent: u16,
    filter_code: u8,
    quality: u8,
    pre_blur_sigma: f32,
    pre_brighten: i32,
    pre_contrast: f32,
    post_sharpen_sigma: f32,
    post_sharpen_threshold: i32,
    post_grayscale: bool,
) -> Result<Vec<u8>, String>;

// ── Dedicated estimates ──

#[wasm_bindgen]
pub fn estimate_resize_png_with_processing(...) -> Result<u32, String>;

#[wasm_bindgen]
pub fn estimate_resize_jpeg_with_processing(...) -> Result<u32, String>;
```

**Design decision:** A single unified function rather than 8 separate `apply_sharpen`, `apply_blur`, etc. Also keep existing `resize_png` / `resize_png_with_filter` for backward compatibility.

**Alternative (not recommended):** Builder pattern with `ProcessingPipeline` struct — elegant in Rust but painful across `wasm-bindgen` (no generics, no lifetimes on exported fns).

### 5.4 New TransmutationOptions fields

```typescript
// workers/types.ts
export interface TransmutationOptions {
  // ... existing fields (resizePercent, resizeFilter, quality...)

  /** Pre-resize processing */
  preBlurSigma?: number;          // 0.0 to 4.0, default 0 = off
  preBrighten?: number;           // -255 to 255, default 0 = off
  preContrast?: number;           // 0.01 to 100.0, default 1.0 = no change

  /** Post-resize processing */
  postSharpenSigma?: number;      // 0.0 to 4.0, default 0 = off
  postSharpenThreshold?: number;  // 0 to 255, default 0 = all pixels
  postGrayscale?: boolean;
}
```

### 5.5 UI layout proposal

```
┌─────────────────────────────────────────────────────────────┐
│  Output scale                                                 │
│  ──────────────────────●───────────────  75%                  │
│  4000 × 3000  →  3000 × 2250                                │
│                                                               │
│  Resampling filter                            [Advanced ▾]          │
│  ┌─────────┐ ┌──────────┐ ┌────────┐                          │
│  │  Sharp  │ │ Sharpest │ │ Smooth │                          │
│  └─────────┘ └──────────┘ └────────┘                          │
│                                                               │
│  ─── Fine-tuning ───                          [Expand ▾]     │
│  ┌──────────────────────────────────────┐                     │
│  │  Sharpness     ──────●────── 0.8     │                     │
│  │  Brightness    ────●──────── +15     │                     │
│  │  Contrast      ──────●────── 1.15    │                     │
│  │  ☐ Grayscale                        │                     │
│  │  ☐ Denoise (median, best for photos) │                     │
│  └──────────────────────────────────────┘                     │
│                                                               │
│  Estimated output: 1.2 MB (−34%)                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Original: 1.8 MB  ──▶  Resized: ~1.2 MB            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  [Transmutar]                                                 │
└─────────────────────────────────────────────────────────────┘
```

**UX principle:** Processing options are collapsed by default (collapsible "Fine-tuning" panel). 95% of users only need % + filter. Advanced users expand for sharpness/contrast. Avoid overwhelming the initial view.

### 5.6 New notice entries

| Trigger | Severity | Message |
|---------|----------|---------|
| `postSharpenSigma > 2.0` | info | "High sharpen values may create halos" |
| `preBlurSigma > 0` | info | "Pre-blur applied to reduce aliasing" |
| `postGrayscale + input is color` | info | "Color will be discarded" |
| `postSharpen > 0 && filter == Nearest` | info | "Sharpening has no visual effect on Nearest Neighbor" |

---

## 6. The Denoiser question — what's available in Rust/Wasm

The user specifically asked about denoising. Here's the state of the art:

### 6.1 Pure-Rust denoising (no C libs, wasm-compatible)

| Technique | Location | Quality | Speed (Wasm) | Notes |
|-----------|----------|---------|---------------|-------|
| **Median filter** | `imageproc::filter::median_filter` | Good for salt & pepper | Fast (O(w·h·k²)) | Preserves edges better than gaussian |
| **Bilateral filter** | `imageproc::filter::bilateral_filter` | Best for photos | Slow (O(w·h·k²)) | Edge-preserving; sigma on spatial + luminance |
| **Gaussian blur** | `imageops::blur` / `imageproc::gaussian_blur_f32` | Smooth but loses edges | Medium | Good as pre-resize step |
| **Non-Local Means** | No pure-Rust crate found | Excellent | Very slow | Requires FFT or patch-based; no wasm crate exists |
| **BM3D** | No pure-Rust crate | State of art | Extremely slow | Patent-encumbered; not suitable |
| **AI denoise (CNN)** | No wasm-friendly crate | Best | Requires GPU | waifu2x territory; violates honesty doctrine |

### 6.2 Recommendation for Camaleon

| Tier | Technique | Rationale |
|------|-----------|-----------|
| **Default** | Median filter (3×3 kernel) | Low cost, good results, preserves edges. Enable via `imageproc`. |
| **Advanced** | Bilateral filter | Best quality photo denoising. Higher cost but worth exposing. |
| **No** | AI denoising (waifu2x-style) | Violates honesty doctrine. Separate product if ever. |

### 6.3 Rust implementation sketch (median filter)

```rust
// Using imageproc — NOT available in imageops alone
use imageproc::filter::median_filter;

fn apply_median_denoise(img: &DynamicImage, radius: u32) -> DynamicImage {
    // Radius 1 = 3×3 kernel, 2 = 5×5
    DynamicImage::ImageRgba8(median_filter(&img.to_rgba8(), radius, radius))
}
```

**Alternative using only `imageops` (no new crate):** Pre-resize Gaussian blur as a cheap pseudo-denoise. Not the same quality but zero additional binary weight.

---

## 7. Implementation roadmap proposal

### Phase 4a.4 — Image processing expansion (v3.6.x+)

| # | Task | Layer | Effort | Priority |
|---|------|-------|--------|----------|
| A4.1 | Add `pre_blur` (gaussian) to resize pipeline | Rust | 8 lines | Medium |
| A4.2 | Add `post_unsharpen` to resize pipeline | Rust | 8 lines | **High** |
| A4.3 | Add `post_brighten` and `post_contrast` | Rust | 6 lines each | **High** |
| A4.4 | Add `post_grayscale` flag | Rust | 4 lines | Low |
| A4.5 | Create unified `resize_*_with_processing` Wasm fn | Rust | ~60 lines | **High** |
| A4.6 | Add dedicated estimate exports for processing variants | Rust | ~30 lines | High |
| A4.7 | Add new `TransmutationOptions` fields to types | TS | ~10 lines | High |
| A4.8 | Build collapsible "Fine-tuning" panel in OptionsControls | UI | ~120 lines | High |
| A4.9 | Wire processing params to worker dispatch | Worker | ~30 lines | High |
| A4.10 | Add processing-related notices | Notices | ~30 lines | Medium |
| A4.11 | i18n EN+ES for all new labels, presets, descriptions | i18n | ~25 keys | High |
| A4.12 | `cargo test -p transmutador_optimize` — new test cases | Rust | ~40 lines | High |
| A4.13 | Smoke test: resize PNG 50% + sharpen 0.8 → sharper output | QA | Manual | High |
| A4.14 | Smoke test: resize JPEG + contrast + grayscale → correct | QA | Manual | Medium |

### Phase 4a.5 — imageproc integration (spike-gated)

| # | Task | Layer | Effort | Priority |
|---|------|-------|--------|----------|
| A5.1 | Spike: add `imageproc` to `Cargo.toml` (no-rayon); measure Wasm size increase | Rust | Spike | High |
| A5.2 | Implement `median_filter` denoiser option | Rust | ~20 lines | Medium |
| A5.3 | Implement `bilateral_filter` denoiser option | Rust | ~20 lines | Low |
| A5.4 | Expose in UI as "Denoise" checkbox or slider | UI | ~40 lines | Medium |
| A5.5 | Gate: Wasm <3 MB after imageproc add; if >3 MB, fall back to imageops-only | All | Gate | High |

### Phase 4a.6 — fast_image_resize spike (backlog)

| # | Task | Layer | Effort | Priority |
|---|------|-------|--------|----------|
| A6.1 | Spike: integrate `fast_image_resize`; benchmark vs `imageops::resize` for 5 filters + 18 additional filters | Rust | Spike | Low |
| A6.2 | If quality/usefulness proven, add Mitchell/Kaiser/Hamming filters | Rust + UI | ~60 lines | Low |

---

## 8. Bundle size projection

All operations from `imageops` exist in the current Wasm binary already. The only bundle cost is the **glue code** (~200 lines Rust = ~2 KB Wasm) + **UI components** (~200 lines TSX = ~3 KB JS gzipped).

| Addition | Wasm delta | JS delta |
|----------|------------|----------|
| `unsharpen`, `brighten`, `contrast`, `grayscale`, `blur` glue | ~2 KB | — |
| Unified `_with_processing` functions | ~3 KB | — |
| "Fine-tuning" collapsible panel (OptionsControls) | — | ~3 KB |
| New TransmutationOptions fields (types.ts) | — | ~0.1 KB |
| Worker dispatch for processing params | — | ~0.5 KB |
| Processing notices | — | ~0.5 KB |
| i18n keys | — | ~1 KB |
| **Total (imageops-only)** | **~5 KB** | **~5 KB** |
| `imageproc` median/bilateral (if added in A5) | **+~160 KB** | — |

---

## 9. Open decisions

| # | Question | Proposal |
|---|----------|----------|
| **Q1** | One unified `_with_processing` fn or individual `apply_sharpen`/`apply_blur` fns? | **Unified** — avoids N Wasm round-trips, matches current pattern |
| **Q2** | Pre-resize blur or post-resize sharpen first? | **Both** — different use cases. Sharpen is P0, blur is P1. |
| **Q3** | `imageproc` now or later? | **Later** — spike-gated (A5.1). imageops-only path covers 80% of use cases at zero binary cost. |
| **Q4** | Denoiser: median (imageproc) or gaussian (imageops)? | **Gaussian for free now (imageops `blur`), median in 4a.5** |
| **Q5** | Collapse processing panel or show always? | **Collapse (default closed)** — prevents overwhelm; matches "Advanced" toggle pattern |
| **Q6** | Backward compat: keep existing `resize_png` exports? | **Yes** — existing exports unchanged. New `_with_processing` is additive. |

---

## 10. Risk matrix

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Processing params make estimate too slow** | UX jank | Debounce slider; cache intermediate results |
| **Too many options overwhelm users** | Drop-off | Collapse "Fine-tuning" panel; sensible defaults |
| **`imageproc` adds >200 KB to Wasm** | Violates NFR-7 (3 MB) | Pre-compute size gate in spike; fall back to imageops-only |
| **`sharpen` on already-sharp JPEG creates artifacts** | Bad output | Honesty notice; recommend sigma < 1.0 for JPEG sources |
| **Bilateral filter too slow on >10 MP in Wasm** | 30+ second processing | Gate: disable on images > 10 MP; show "Slow" notice |

---

## 11. References

| Doc | Role |
|-----|------|
| `motor_transmutacion/transmutador_optimize/src/lib.rs` | Current Rust implementation (242 lines) |
| `frontend/src/components/transmute/OptionsControls.tsx` | Current resize UI (lines 80-338) |
| `frontend/src/workers/transmutation.worker.ts` | Worker resolve + dispatch (lines 960-1010, 1190-1240) |
| `frontend/src/types/wasm-modules.d.ts:315-326` | Incomplete type declarations |
| `frontend/src/lib/notices/compute-fidelity-notices.ts` | Resize-specific notices |
| `frontend/src/lib/tools/tool-registry.ts:776-850` | png/jpg-resize tool definitions |
| `docs/planning/tier4_plan.md` | Parent Tier 4a plan |
| `docs/planning/resize_premium_roadmap.md` | Phases A-E delivered in v3.6.0 |
| `docs/planning/resize_competitive_analysis.md` | Competitor deep-dive (v3.6.0) |
| `image` crate v0.25.10 | `imageops` API, `FilterType` variants |
| `imageproc` v0.27.0 | Median/bilateral/morphology/edge (crates.io) |
| `fast_image_resize` v6.0.0 | Filter catalog (crates.io) |
| `quantette` v0.6.0 | Dithering + palette (crates.io) |

---

*Comprehensive investigation of advanced image processing capabilities for Camaleon's Resize pipeline. Covers current baseline, zero-cost imageops exposure, external crate survey, denoiser analysis, competitor mapping, architecture proposal, and phased implementation roadmap. Phase 4a.4 (imageops processing) recommended as first implementation step — zero bundle cost, maximum user value.*

---

## Appendix A — Full `imageops` inventory (image v0.25.10)

```
blur(img, sigma) -> DynamicImage
fast_blur(img, sigma) -> DynamicImage
unsharpen(img, sigma, threshold) -> DynamicImage
brighten(img, value) -> DynamicImage
contrast(img, contrast) -> DynamicImage
huerotate(img, value) -> DynamicImage
filter3x3(img, kernel) -> DynamicImage
dither(img, palette) -> DynamicImage
flip_horizontal(img) -> DynamicImage
flip_vertical(img) -> DynamicImage
rotate90(img) -> DynamicImage
rotate180(img) -> DynamicImage
rotate270(img) -> DynamicImage
grayscale(img) -> DynamicImage
grayscale_alpha(img) -> DynamicImage
grayscale_with_type(img, color_type) -> DynamicImage
grayscale_with_type_alpha(img, color_type) -> DynamicImage
invert(img) -> DynamicImage
resize(img, nwidth, nheight, filter) -> DynamicImage
resize_exact(img, nwidth, nheight, filter) -> DynamicImage
resize_to_fill(img, nwidth, nheight, filter) -> DynamicImage
thumbnail(img, nwidth, nheight) -> DynamicImage
crop_imm(img, x, y, nwidth, nheight) -> SubImage
replace(img, replacement) -> DynamicImage
colorops::BiLevel(dither_coeff) -> ColorMap
colorops::dither(img, color_map) -> DynamicImage
colorops::index_colors(img, color_map) -> DynamicImage
```

**Camaleon already uses:** `resize_exact`. **Zero cost to add:** all others.
