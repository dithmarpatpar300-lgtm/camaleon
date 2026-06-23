# Resize Premium Roadmap — Camaleon Tier 4a

> **Status:** Planning · **Target:** v3.6.0+ · **Author:** OpenCode  
> **Scope:** Scientific upgrade of `png-resize` and `jpg-resize` — downscale hardening, filter selection, upscale support, dimensions preview, and metrics-first UX.  
> **Parent doc:** `docs/planning/tier4_plan.md` · **SPEC anchor:** §12.5 Tier 4a · **Crate:** `motor_transmutacion/transmutador_optimize`  
> **Current filter:** Lanczos3 only (hardcoded at `lib.rs:82`)  
> **Based on:** `docs/planning/resize_investigation.md` + `docs/planning/resize_filters_investigation.md` (merged)

---

## 1. Problem statement

Camaleon's `png-resize` and `jpg-resize` were activated at **v3.3.0** as a functional baseline with minimal UX analysis. Six issues demand resolution:

| # | Problem | Impact |
|---|---------|--------|
| **P1** | Slider ends at 100% — a no-op that returns the input unchanged | User confusion: "Why did nothing happen?" |
| **P2** | No target dimensions shown — user sees only a percentage | User doesn't know resulting W×H |
| **P3** | No upscaling support | Cannot enlarge small images for compositing/printing |
| **P4** | Only Lanczos3 available — no filter choice | Pixel art destroyed by ringing; screenshots get halos; no fast preview |
| **P5** | Step size of 5% is too coarse | 5% of 4000px = 200px jump — imprecise |
| **P6** | No resize-specific notices | JPEG generational loss not warned; extreme downscale artifacts not explained |

---

## 2. Scientific foundations — What image resizing actually is

### 2.1 The resampling problem

```
Source raster (W × H pixels) → Resampling filter → Target raster (W' × H' pixels)
```

The core challenge is the **Nyquist-Shannon sampling theorem**: a discrete signal can only represent frequencies up to half the sampling rate. When **downscaling**, high frequencies must be attenuated to prevent aliasing (Moiré, jaggies). When **upscaling**, no new information exists — the filter interpolates plausible intermediate values.

### 2.2 Downscaling — the primary use case

Multiple source pixels collapse into fewer output pixels. **Information is permanently discarded.**

**File size behavior (empirical):**

| Scale | Pixels vs source | PNG bytes | JPEG bytes |
|-------|------------------|-----------|------------|
| 95% | 90% | ~88-92% | ~85-95% |
| 75% | 56% | ~55-60% | ~50-65% |
| 50% | 25% | ~22-28% | ~18-30% |
| 25% | 6.25% | ~5-8% | ~4-10% |
| 10% | 1% | ~0.8-2% | ~0.5-2% |

**Non-linearity:** Below 50%, compression metadata dominates, making further reductions marginal.

### 2.3 Upscaling — the controversial case

**For:** Users need to enlarge icons/screenshots. Lanczos3/CatmullRom upscaling is interpolation (not AI). Industry standard.

**Against:** No new detail created — "hallucinated" pixels. Violates science honesty if not disclosed. File size explosion (200% → 4× pixels → ~4× PNG size). JPEG double artifact compound.

**Decision:** Support upscaling to **200%** with **mandatory honesty notice**.

### 2.4 Format-specific implications

| Direction | Fidelity class | Generational damage |
|-----------|----------------|---------------------|
| **PNG → Resize → PNG** | `lossless` (dimensions only) | Pixels change but no compression loss. Detail loss from downscale is permanent. |
| **JPEG → Resize → JPEG** | `lossy` | **Three lossy generations:** (1) original JPEG encode, (2) decode artifacts baked into raster, (3) re-encode at Q85. Must warn. |

---

## 3. Interpolation filters — complete catalog

All 5 filters are provided by the `image` crate v0.25.10. **Zero bundle cost to expose them** — already compiled into the `.wasm`.

### 3.1 Filter comparison matrix

| Filter | Kernel | Radius | Taps/px | Speed | Sharpness | Aliasing | Ringing |
|--------|--------|--------|---------|-------|-----------|----------|---------|
| **Nearest** | Box | 0.0 | 1 | ⚡ Instant | Max | Severe | None |
| **Triangle** | Linear `1−\|x\|` | 1.0 | 4 | Fast | Low | Moderate | None |
| **CatmullRom** | Cubic spline B=0,C=0.5 | 2.0 | 16 | Good | Good | Low | Mild |
| **Gaussian** | `exp(-x²/2σ²)` σ=0.5 | 3.0 | 36 | Slow | Lowest | Lowest | None |
| **Lanczos3** | `sinc(x)·sinc(x/3)` | 3.0 | 36 | Slow | Max | Lowest | Strong |

### 3.2 Filter recommendations per scenario

| Scenario | Best filter | Why |
|----------|------------|-----|
| Photo → 50% scale | **Lanczos3** | Sharpest detail |
| Photo → 25% scale | **CatmullRom** | Less ringing at mid scales |
| Photo → 10% scale | **Gaussian** | Anti-alias prevents Moiré |
| Screenshot → 50% | **CatmullRom** | Readable text, minimal halos |
| Screenshot → 25% | **Triangle** | No ringing on text |
| Pixel art → 200% | **Nearest** | Preserves block edges |
| Logo flat colors | **CatmullRom** | Clean edges |
| JPEG→Resize→JPEG | **Gaussian** | Pre-blur minimizes re-encode artifacts |
| Social media quick | **Triangle** | Fast, "good enough" |
| ICO favicon | **Lanczos3** | Sharp at tiny sizes |

### 3.3 User-facing filter tiers

| Tier | Filters | Label (EN) | Description |
|------|---------|------------|-------------|
| **Default** | CatmullRom (recommended) | "Sharp" | Best balance. Industry-standard bicubic. |
| **Visible** | Lanczos3, Triangle | "Sharpest", "Smooth" | One click away — segmented control |
| **Advanced** | Nearest, Gaussian | "Pixel Perfect", "Anti-alias" | Behind expandable section |

### 3.4 Performance estimates in Wasm

For a 3.5 MB image → 300×225 (single-threaded):

| Filter | Est. Wasm time | UX badge |
|--------|----------------|----------|
| Nearest | 50–70 ms | — (invisible) |
| Triangle | 600–1000 ms | — |
| CatmullRom | 1.2–2.0 s | — |
| Lanczos3 | 1.8–3.0 s | "Slow" notice on >20 MP |
| Gaussian | 1.8–3.0 s | "Slow" notice on >20 MP |

---

## 4. Current implementation audit

### 4.1 Rust engine

```rust
// transmutador_optimize/src/lib.rs:70-83 — CURRENT
fn resize_by_percent(img: DynamicImage, percent: u8) -> Result<DynamicImage, String> {
    let (w, h) = img.dimensions();
    let nw = ((w as u64 * percent as u64) / 100).max(1) as u32;
    let nh = ((h as u64 * percent as u64) / 100).max(1) as u32;
    if nw == w && nh == h { return Ok(img); }  // 100% no-op
    Ok(img.resize_exact(nw, nh, ResizeFilter::Lanczos3))
}
```

| Aspect | Current | Target |
|--------|---------|--------|
| Filter | Lanczos3 only | User-selectable (5 options) |
| Range | 10–100% | 10–95% (downscale) / 10–200% (upscale) |
| Estimate | Full encode (no dedicated export) | `estimate_resize_*_size()` exports |
| Quality | Hardcoded Q85 (JPEG), L6 (PNG) | Configurable via options |

### 4.2 Frontend slider

```typescript
// tool-registry.ts — CURRENT
{ kind: "slider", key: "resizePercent", min: 10, max: 100, step: 5, defaultValue: 50 }
```

| Aspect | Current | Target |
|--------|---------|--------|
| Max | 100% (no-op) | 95% (downscale) |
| Step | 5 | 1 |
| Presets | 25%, 50%, 75% | 25%, 33%, 50%, 66%, 75% |
| Dims display | None | W×H live preview |
| Labels | "Smaller" / "Larger" | "Smaller" / "Original" (100% marker) / "Larger" (upscale) |

### 4.3 Missing notices

| Notice | Tool | Severity |
|--------|------|----------|
| JPEG generational loss | `jpg-resize` | `warn` |
| Downscale detail loss | `< 50%` | `info` |
| Upscale honesty | `> 100%` | `warn` |
| Size expectation | All | `info` |
| Slow filter (Lanczos3/Gaussian) | `> 20 MP` | `info` |

---

## 5. Product principles (resize)

| Principle | Implementation |
|-----------|----------------|
| **Honest science** | Upscale disclosed as interpolation, not detail creation. JPEG resize warns about generational loss. |
| **Local-only** | All resize in Wasm; zero upload. |
| **Estimate-first** | File size delta is primary affordance. User decides based on numbers. |
| **Dimensions visible** | Target W×H shown next to percentage at all times. |
| **Aspect ratio locked** | Always preserve; no anamorphic without opt-in. |
| **Filter choice** | 3 main + 2 advanced filters. CatmullRom default. |

---

## 6. Architecture — target state

### 6.1 Rust (`transmutador_optimize`)

```rust
// --- New exports (additive, backward-compatible) ---

// Filter code: 0=Nearest, 1=Triangle, 2=CatmullRom, 3=Gaussian, 4=Lanczos3

resize_png_with_filter(input: &[u8], percent: u8, filter_code: u8) -> Vec<u8>
resize_jpeg_with_filter(input: &[u8], percent: u8, filter_code: u8) -> Vec<u8>
resize_jpeg_with_filter_and_quality(input: &[u8], percent: u8, quality: u8, filter_code: u8) -> Vec<u8>

estimate_resize_png_size(input: &[u8], percent: u8, filter_code: u8) -> u32
estimate_resize_jpeg_size(input: &[u8], percent: u8, quality: u8, filter_code: u8) -> u32

// --- Constants ---
pub const MIN_RESIZE_PERCENT: u8 = 1;    // Changed from 10
pub const MAX_DOWNSCALE_PERCENT: u8 = 95;
pub const MAX_RESIZE_PERCENT: u8 = 200;  // Upscale ceiling
```

### 6.2 Frontend data flow

```
OptionsControls          TransmutationOptions        Worker              Wasm
──────────────          ────────────────────        ──────              ────
resizePercent slider →  resizePercent: number   →                      resize_*_with_filter(%, code)
filter selector     →  resizeFilter: number     →  engineLoadHints?    filter_code
                                                        ↓
                                              ensureOptimizeWasmInitialized
                                                        ↓
                                              applyRiskMode + applySessionLimit
                                                        ↓
                                              runFullEncode / runSizeEstimate
```

### 6.3 New `TransmutationOptions` field

```typescript
// workers/types.ts
export type TransmutationOptions = {
  // ... existing fields
  resizeFilter?: number;  // 0-4, defaults to 2 (CatmullRom)
};
```

### 6.4 Tool registry changes

```typescript
// tool-registry.ts — png-resize and jpg-resize
optionSpecs: [
  {
    kind: "slider",
    key: "resizePercent",
    min: 10,
    max: 95,       // Changed from 100
    step: 1,        // Changed from 5
    defaultValue: 50,
    presets: [25, 33, 50, 66, 75],  // New
  },
  {
    kind: "filter",  // NEW option kind
    key: "resizeFilter",
    defaultValue: 2,  // CatmullRom
    options: [
      { value: 2, label: "Sharp", labelKey: "resize.filterSharp" },
      { value: 4, label: "Sharpest", labelKey: "resize.filterSharpest" },
      { value: 1, label: "Smooth", labelKey: "resize.filterSmooth" },
    ],
    advanced: [
      { value: 0, label: "Pixel Perfect", labelKey: "resize.filterNearest" },
      { value: 3, label: "Anti-alias", labelKey: "resize.filterGaussian" },
    ],
  },
]
```

---

## 7. Implementation roadmap

### Phase A — Downscale hardening (v3.6.0)

**Goal:** Fix the 6 problems in §1. Make downscale tools production-quality.

| # | Task | Layer | Effort |
|---|------|-------|--------|
| A1 | Cap slider max at 95% (remove 100% no-op) | Registry | 2 lines |
| A2 | Add target dimensions display (W × H → W' × H') | OptionsControls | New component ~80 lines |
| A3 | Change step from 5 to 1 | Registry | 1 line |
| A4 | Add presets: 25%, 33%, 50%, 66%, 75% | Registry | 5 values |
| A5 | Add resize-specific notice rail entries (JPEG loss, downscale detail) | Notices | ~60 lines |
| A6 | Lower slider min from 10 to 1 (allow extreme downscale) | Rust + Registry | 2 lines |
| A7 | Lower label "Smaller" → 1%, upper label → 95% | i18n | 2 keys |
| A8 | i18n EN+ES for all new strings | i18n | ~20 keys |

**Exit gate:** Slider shows 1-95%, step 1, presets work, dimensions preview live, notices fire correctly. 100% gone.

### Phase B — Filter selection (v3.6.x)

**Goal:** Expose filter choice. CatmullRom as new default.

| # | Task | Layer | Effort |
|---|------|-------|--------|
| B1 | Add `resize_png/jpeg_with_filter` Wasm exports | Rust | ~40 lines |
| B2 | Add `filter_from_code()` helper | Rust | 12 lines |
| B3 | Keep existing `resize_png/jpeg` as backward-compat (default to CatmullRom) | Rust | 2 line change |
| B4 | Add `resizeFilter` to `TransmutationOptions` | Types | 1 field |
| B5 | Add filter `optionSpec` to resize tools | Registry | ~30 lines |
| B6 | Build `FilterSelector` component (segmented control + advanced dropdown) | Components | ~120 lines |
| B7 | Wire filter to worker dispatch | Worker | ~10 lines |
| B8 | Include `resizeFilter` in estimate fingerprint | useFileMetrics | 1 field |
| B9 | Add filter description line that changes per selection | FilterSelector | ~30 lines |
| B10 | Add filter-related notices (Lanczos ringing, Nearest jaggies, Gaussian blur) | Notices | ~40 lines |
| B11 | i18n EN+ES for filter labels, descriptions, notices | i18n | ~25 keys |

**Exit gate:** Filter selector visible. Changing filter re-estimates. Transmutation uses selected filter. Visual results match filter expectations.

### Phase C — Upscale support (v3.6.x)

**Goal:** Allow upscaling to 200% with honesty guardrails.

| # | Task | Layer | Effort |
|---|------|-------|--------|
| C1 | Raise `MAX_RESIZE_PERCENT` from 100 to 200 | Rust | 1 line |
| C2 | When percent > 100, slider shows "Original" marker at 100% | OptionsControls | ~15 lines |
| C3 | Upscale honesty notice: "No new detail is created — pixels are interpolated. File size will increase significantly." | Notices | ~10 lines |
| C4 | Warning-styled label for >100% values (amber color) | OptionsControls | ~10 lines |
| C5 | File size delta turns amber/red when output > input (upscale + PNG) | MetricsPanel | ~10 lines |
| C6 | i18n EN+ES for upscale honesty notice | i18n | 2 keys |

**Exit gate:** Slider goes to 200%. Honesty notice fires at >100%. "Original" marker at 100%. User understands upscaling limitations.

### Phase D — JPEG quality control (v3.6.x)

**Goal:** JPEG resize quality becomes user-configurable (not hardcoded Q85).

| # | Task | Layer | Effort |
|---|------|-------|--------|
| D1 | Add `resize_jpeg_with_filter_and_quality` export | Rust | 15 lines |
| D2 | Expose JPEG quality slider on `jpg-resize` | Registry | ~20 lines |
| D3 | Worker dispatch: `resize_jpeg_with_filter_and_quality` | Worker | ~10 lines |
| D4 | Dual sliders: resize % + JPEG quality | OptionsControls | ~20 lines |

**Exit gate:** User can set JPEG quality independently of resize scale. Both sliders affect estimate.

### Phase E — Estimate parity (v3.6.x)

**Goal:** Dedicated estimate exports for resize — parity with compress tools.

| # | Task | Layer | Effort |
|---|------|-------|--------|
| E1 | Add `estimate_resize_png/jpg_size` exports | Rust | 8 lines each |
| E2 | Worker routes estimates to dedicated functions | Worker | ~15 lines |
| E3 | Faster estimate feedback on slider drag | useFileMetrics | — |

**Exit gate:** Estimate updates in <500 ms on typical images. Dedicated estimate path used (not full encode).

---

## 8. UI/UX design — target layout

```
┌─────────────────────────────────────────────────────────────┐
│  Output scale                                                 │
│  ──────────────────────────●──────────────  75%              │
│  1%                    [100%]              200%               │
│                                                               │
│  4000 × 3000  →  3000 × 2250                                │
│  Source            Target                                     │
│                                                               │
│  Resampling filter                                            │
│  ┌─────────┐ ┌──────────┐ ┌────────┐  [Advanced ▾]          │
│  │  Sharp  │ │ Sharpest │ │ Smooth │                         │
│  │   ◉    │ │          │ │        │                          │
│  └─────────┘ └──────────┘ └────────┘                          │
│                                                               │
│  Sharp (CatmullRom) — Recommended. Good balance of            │
│  sharpness and speed with minimal edge artifacts.             │
│                                                               │
│  ─────────────────────────────────────────                    │
│  ⚠ Re-encoding a JPEG adds another lossy generation.          │
│  ℹ At 75%, the pixel area is ~56% of the original.            │
│                                                               │
│  Estimated output: 1.2 MB (−34%)                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Original: 1.8 MB  ──▶  Resized: ~1.2 MB            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  [Transmutar]                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Test plan

| # | Test | Phase |
|---|------|-------|
| 1 | `cargo test -p transmutador_optimize` — all existing + filter validation | All |
| 2 | `npm run build:wasm && npm run build` — no type errors | All |
| 3 | Resize 4000×3000 PNG → 50% → output 2000×1500, sharp | A |
| 4 | Slider shows target dimensions (W×H) updating live | A |
| 5 | Presets work: 25%, 33%, 50%, 66%, 75% | A |
| 6 | JPEG resize → generational loss notice fires | A |
| 7 | Switch filter to Nearest → output pixelated (no blur) | B |
| 8 | Switch filter to Gaussian → output smooth, no aliasing | B |
| 9 | Filter changes → estimate re-runs | B |
| 10 | Upscale to 200% → honesty notice fires | C |
| 11 | Upscale 200% → file size > original (PNG ~4×) | C |
| 12 | JPEG quality slider + resize slider → both affect output | D |
| 13 | Step 1% → granular control works | A |
| 14 | Extreme 1% scale → output at least 1×1 px | A |
| 15 | Backward compat: `resize_png()` (no filter arg) still works | B |
| 16 | Filter "Advanced" dropdown reveals Nearest + Gaussian | B |

---

## 10. Bundle size impact

| Change | Wasm delta | JS delta |
|--------|-----------|----------|
| Filter exports (5 new functions) | ~2 KB | — |
| Filter selector component | — | ~3 KB |
| Notices + i18n | — | ~1 KB |
| Dimensions display | — | ~1 KB |
| **Total estimated** | **~2 KB** | **~5 KB** |

**Zero net Wasm cost for filters** — all 5 `FilterType` variants are already compiled into the `image` crate. The only Wasm addition is the glue code dispatching to them.

---

## 11. Out of scope

- **AI upscaling** (Waifu2x, ESRGAN) — violates science honesty
- **Anamorphic resize** (independent W/H scale) — complexity without clear user demand
- **Batch resize** — Tier 4a.3, separate planning
- **WebP/AVIF resize** — Tier 4a.2 matrix expand
- **`fast_image_resize` crate migration** — spike deferred; `image` crate sufficient for now
- **Custom kernel support** — user-defined filter coefficients; overengineering

---

## 12. Open decisions

| # | Question | Proposal | 
|---|----------|----------|
| Q1 | CatmullRom or keep Lanczos3 as default? | **CatmullRom** — industry standard, better general-purpose |
| Q2 | Max upscale: 150% or 200%? | **200%** — industry standard, Lanczos handles it |
| Q3 | Expose all 5 filters or just 3? | **3 visible + 2 advanced** — avoid overwhelming users |
| Q4 | Step size: 1% or keep 5%? | **1%** — precision matters for large images |
| Q5 | Backward-compat for existing `resize_png/jpeg`? | **Keep** — defaults to CatmullRom |
| Q6 | Dedicated estimate exports now or later? | **Phase E** — lower priority than filter + upscale |

---

## 13. Recommended execution order

```
Phase A — Downscale hardening (v3.6.0)
  ├── Slider 1-95%, step 1, presets
  ├── Target dimensions display
  └── Resize notices

Phase B — Filter selection (v3.6.x)
  ├── CatmullRom default
  ├── Filter selector UI
  └── Filter-specific notices

Phase C — Upscale support (v3.6.x)
  ├── 200% ceiling
  ├── Honesty notice
  └── "Original" marker at 100%

Phase D — JPEG quality (v3.6.x)
  ├── Dual sliders
  └── Configurable Q on resize

Phase E — Estimate parity (v3.6.x)
  ├── Dedicated estimate exports
  └── Faster slider feedback
```

---

## 14. References

| Doc | Role |
|-----|------|
| `docs/planning/tier4_plan.md` | Parent Tier 4a plan |
| `docs/planning/resize_investigation.md` | Scientific resize analysis (merged) |
| `docs/planning/resize_filters_investigation.md` | Filter catalog (merged) |
| `docs/SPEC.md` §12.5 | Normative Tier 4a spec |
| `motor_transmutacion/transmutador_optimize/src/lib.rs` | Current Rust implementation |
| `frontend/src/lib/tools/tool-registry.ts:776-832` | Tool definitions |
| `frontend/src/workers/transmutation.worker.ts` | Worker dispatch |
| `image` crate v0.25.10 | `FilterType` enum + kernel implementations |

---

*Unified resize premium roadmap merging scientific investigation, filter analysis, and implementation planning. Phases A through E deliver downscale hardening, filter selection, upscale support, JPEG quality control, and estimate parity — in that priority order.*
