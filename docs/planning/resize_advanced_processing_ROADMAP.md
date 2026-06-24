# Resize Advanced Processing — Implementation ROADMAP

> **Date:** 2026-06-23 · **Author:** OpenCode  
> **Status:** Planning · **Target:** v3.7.0+  
> **Parent docs:** `tier4_plan.md` · `resize_premium_roadmap.md` (v3.6.0 delivered) · `resize_advanced_processing_investigation.md`  
> **SPEC anchor:** §12.5 Tier 4a  
> **Crate:** `motor_transmutacion/transmutador_optimize`  
> **UI:** `OptionsControls.tsx` + new `ProcessingPanel.tsx`

---

## 0. North Star

Extend Camaleon's Resize from a "percent + filter" tool into a **premium multi-parameter image processing workspace** — all local, all Wasm, all private — matching desktop-grade capabilities (Photopea, Photoshop) while preserving the 3-click simplicity of the current resize toolbar.

**Guiding principle:** Zero-cost operations first (imageops), spike-gated for external crates. Every feature must earn its place on the panel.

---

## 1. Versioning & milestone map

```
v3.6.0  ✅ Resize Premium (Phases A–E)
         ├── Filters (5), upscale (200%/400%), JPEG quality, dimensions, estimate parity
v3.6.1  ✅ UpdateEngine refactor

v3.7.0  🎯 Resize Processing — Phase A (imageops, zero crate cost)
         ├── unsharpen · brighten · contrast · grayscale
         ├── pre-resize blur (gaussian)
v3.7.1    Phase B — UI refinement
         ├── Collapsible "Fine-tuning" panel · mobile layout
         ├── Processing Notices
v3.8.0    Phase C — Denoiser (imageproc spike)
         ├── Median filter · Bilateral filter
v3.8.x    Phase D (backlog) — Extended filters + dither
         ├── fast_image_resize spike · Mitchell/Kaiser filters
         ├── quantette dithering
v4.0.0    Tier 4b — Image editing (crop, rotate, flip)
```

| Release | Scope | Type bump | Engine bump |
|---------|-------|-----------|-------------|
| **v3.7.0** | Phase A — imageops processing + PNG compression control | MINOR | 1.6.1 (new Wasm exports) |
| **v3.7.1** | Phase B — Fine-tuning UX panel | PATCH | — (no engine change) |
| **v3.8.0** | Phase C — Denoiser (imageproc) | MINOR | 1.7.0 (new dep) |
| **v3.8.x** | Phase D — Extended filters + dither (backlog) | MINOR | 1.7.x |

---

## 2. Phase A — imageops Processing (v3.7.0, MINOR)

**Goal:** Expose 5 `image::imageops` functions at zero bundle cost. Give users control over output PNG compression on resize.

### 2.1 Rust engine tasks

| # | Task | File | Lines | Priority |
|---|------|------|-------|----------|
| A1 | Add `resize_png_with_filter_and_compression(input, percent, filter_code, compression)` — expose PNG compression (currently hardcoded to 6) | `lib.rs` | ~15 | **P0** |
| A2 | Create unified `resize_png_with_processing(input, percent, filter_code, compression, pre_blur_sigma, post_sharpen_sigma, post_sharpen_threshold, post_brighten, post_contrast, post_grayscale)` | `lib.rs` | ~70 | **P0** |
| A3 | Create unified `resize_jpeg_with_processing(input, percent, filter_code, quality, pre_blur_sigma, post_sharpen_sigma, post_sharpen_threshold, post_brighten, post_contrast, post_grayscale)` | `lib.rs` | ~70 | **P0** |
| A4 | Add `estimate_resize_png_with_processing(...)` → u32 | `lib.rs` | ~25 | P1 |
| A5 | Add `estimate_resize_jpeg_with_processing(...)` → u32 | `lib.rs` | ~25 | P1 |
| A6 | Internal helper `apply_processing_ops(img, opts) -> DynamicImage` — single fn that chains pre-blur → resize → post-sharpen → brighten → contrast → grayscale | `lib.rs` | ~40 | **P0** |
| A7 | Validation: pre_blur_sigma ∈ [0.0, 10.0]; post_sharpen_sigma ∈ [0.0, 10.0]; post_sharpen_threshold ∈ [0, 255]; pre_brighten ∈ [-255, 255]; pre_contrast > 0.0 | `lib.rs` | ~15 | **P0** |
| A8 | Keep ALL existing exports for backward compatibility — new `_with_processing` is additive | `lib.rs` | — | Mandatory |
| A9 | Add unit tests: processing pipeline + estimate parity within 5% | `lib.rs` tests | ~50 | P0 |

### 2.2 TypeScript tasks

| # | Task | File | Lines | Priority |
|---|------|------|-------|----------|
| A10 | Extend `TransmutationOptions` with processing fields | `workers/types.ts` | ~8 | **P0** |
| A11 | Add `ProcessingOptions` type (grouped for clarity) | `workers/types.ts` | ~6 | P1 |
| A12 | Declare new Wasm exports in `wasm-modules.d.ts` (also fix existing gaps: `_with_filter`, `estimate_resize_*`, session fns) | `wasm-modules.d.ts` | ~20 | **P0** |
| A13 | Worker dispatch: resolve `_with_processing` path when processing params present; fallback to existing `_with_filter` when absent | `transmutation.worker.ts` | ~30 | **P0** |
| A14 | Worker estimate: mirror dispatch for estimate functions | `transmutation.worker.ts` | ~25 | P1 |
| A15 | Add `compression` slider to `png-resize` optionSpecs in registry | `tool-registry.ts` | ~12 | **P0** |

### 2.3 UI tasks

| # | Task | File | Lines | Priority |
|---|------|------|-------|----------|
| A16 | Create `ProcessingPanel.tsx` — collapsible fine-tuning section (sharpen, brighten, contrast, grayscale, pre-blur). See `resize_advanced_ux_investigation.md` for layout. | New file | ~180 | **P0** |
| A17 | Wire `ProcessingPanel` into `OptionsControls.tsx` below `ResizeFilterControl` | `OptionsControls.tsx` | ~8 | **P0** |
| A18 | i18n EN+ES: processing labels, descriptions, presets, validation errors | `en.ts`, `es.ts` | ~30 keys | **P0** |
| A19 | Add new notice entries for processing params (high sharpen, pre-blur active, grayscale) | `compute-fidelity-notices.ts` | ~25 | P1 |

### 2.4 Verification gate

```bash
# Rust
cd motor_transmutacion && cargo test -p transmutador_optimize
cargo check --workspace

# Wasm
cd frontend && npm run build:wasm

# Frontend
cd frontend && npx tsc --noEmit && npm test && npm run build
```

- [ ] 183 Vitest tests pass
- [ ] `cargo test -p transmutador_optimize` — new processing tests pass
- [ ] Zero Wasm size increase from processing glue (verify with `npm run build:wasm`)
- [ ] Manual smoke: PNG resize 50% + sharpen 0.6 → visibly sharper output
- [ ] Manual smoke: JPEG resize 75% + contrast 1.2 + grayscale → correct B&W output
- [ ] Manual smoke: Processing params absent → existing resize behavior unchanged (backward compat)
- [ ] Risk mode ON → processing pipeline still respects limits
- [ ] Estimate re-runs on slider change for each processing param

### 2.5 Security checklist

| # | Concern | Mitigation |
|---|---------|------------|
| S1 | Processing params overflow/panic in Wasm | Bounded `f32`/`i32` validation in `apply_processing_ops` before calling imageops |
| S2 | Metadata propagation | StripAll verified — processing does not touch metadata; encode path unchanged |
| S3 | Valid output | `validate_output` called after processing → encode (existing guard) |
| S4 | Risk mode bypass | `set_risk_mode` respected; `reader.no_limits()` when risk ON (existing guard) |
| S5 | Input validation | `validate_input` runs before any processing (existing guard) |
| S6 | Large sigma DoS | `sigma >= 10.0` rejected; prevents unbounded computation |

---

## 3. Phase B — UI/UX Refinement (v3.7.1, PATCH)

**Goal:** Ship a premium, cohesive resize panel that doesn't overwhelm. Collapse processing options by default. Polish mobile layout.

| # | Task | File | Lines | Priority |
|---|------|------|-------|----------|
| B1 | Implement collapsible `ProcessingPanel` with chevron toggle (follow `TechnicalDisclosure` pattern) | `ProcessingPanel.tsx` | included in A16 | P0 |
| B2 | Add "Reset to defaults" link in processing panel header (resets all processing sliders to 0/1.0) | `ProcessingPanel.tsx` | ~8 | P1 |
| B3 | Mobile layout: processing params stack vertically (not horizontal), full-width sliders | `ProcessingPanel.tsx` | ~20 | P1 |
| B4 | Processing notices in NoticeRail (sharpen warning, blur active, grayscale) | `compute-fidelity-notices.ts` | included in A19 | P1 |
| B5 | i18n polish: EN/ES descriptions per processing control | `en.ts`, `es.ts` | ~10 keys | P1 |
| B6 | Add processing-related Vitest tests (ProcessingPanel rendering, options merging) | New test file | ~40 | P1 |

### 3.1 Verification gate

- [ ] Mobile viewport (375px): all controls fit without horizontal scroll
- [ ] Collapse/expand animation smooth (CSS transition, no JS animation)
- [ ] "Reset to defaults" clears all processing params to 0/1.0
- [ ] Processing panel remembers state across file drops (session-level, per-tool)

---

## 4. Phase C — Denoiser (v3.8.0, MINOR)

**Goal:** Add median and bilateral filter denoising via `imageproc` crate. Spike-gated — must not exceed NFR-7 (3 MB Wasm).

### 4.0 Spike gate (run first — do not proceed if gate fails)

| # | Task | Outcome |
|---|------|---------|
| S1 | Add `imageproc = { version = "0.27", default-features = false }` to `transmutador_optimize/Cargo.toml` | Dependency added |
| S2 | `cd motor_transmutacion && cargo check -p transmutador_optimize` | Compiles to `wasm32-unknown-unknown` |
| S3 | `cd frontend && npm run build:wasm` | Wasm builds |
| S4 | Check Wasm binary size: `Get-ChildItem frontend/public/wasm/transmutador_optimize/ -Recurse *.wasm | Measure-Object -Property Length` | If <= 750 KB, proceed. If >1 MB, abort and use imageops-only path. |
| S5 | Manual: `median_filter` + `bilateral_filter` function calls compile in Wasm without runtime errors | Functions loadable |

**Gate decision:** If Wasm size >1 MB after `imageproc`, fall back to Phase A `imageops::blur` as pseudo-denoise. The median/bilateral path is valuable but not at the cost of bloating the binary.

### 4.1 Implementation tasks (if spike passes)

| # | Task | File | Lines | Priority |
|---|------|------|-------|----------|
| C1 | Add `post_median_radius: u8` (0=off, 1=3x3, 2=5x5) to processing pipeline | `lib.rs` | ~15 | P0 |
| C2 | Add `post_bilateral_spatial_sigma: f32`, `post_bilateral_luminance_sigma: f32` (0.0=off) | `lib.rs` | ~15 | P1 |
| C3 | Validate: median_radius ∈ [0,3]; bilateral_sigma ∈ [0.0, 5.0] | `lib.rs` | ~5 | P0 |
| C4 | Extend `TransmutationOptions` with denoiser fields | `types.ts` | ~6 | P0 |
| C5 | UI: "Denoise" section inside ProcessingPanel with radio: None / Median / Bilateral + slider for radius/sigma | `ProcessingPanel.tsx` | ~60 | P0 |
| C6 | i18n EN+ES for denoiser labels | `en.ts`, `es.ts` | ~10 keys | P0 |
| C7 | Performance gate: bilateral filter on >10 MP → "Slow" notice | `compute-performance-notices.ts` | ~10 | P1 |

### 4.2 Verification gate

- [ ] Spike gate passed (Wasm <1 MB with imageproc)
- [ ] `cargo test -p transmutador_optimize` — median/bilateral tests
- [ ] Manual: noisy JPEG → median 3×3 → visibly cleaner
- [ ] Manual: photo → bilateral σ=2.0/0.1 → edges preserved, noise reduced
- [ ] Manual: 12 MP image → bilateral filter completes in <15 seconds
- [ ] NFR-7: optimize crate Wasm ≤ 1 MB (target) / ≤ 3 MB (hard)

---

## 5. Phase D — Extended Filters + Dither (v3.8.x, MINOR, backlog)

**Goal:** Expose Mitchell-Netravali and Kaiser filters via `fast_image_resize`, plus Floyd-Steinberg dither via `quantette`. Both spike-gated.

### 5.0 Spike gates

| Crate | Spike question | Gate |
|-------|----------------|------|
| `fast_image_resize` | Migration cost vs quality gain for Mitchell/Blackman/other filters not in imageops | If Mitchell visibly better than CatmullRom for text-in-image, proceed |
| `quantette` | Floyd-Steinberg dither quality vs `imageops::dither` | If perceptibly better for indexed PNG output, proceed |

### 5.1 Implementation (if both spikes pass)

| # | Task | Priority |
|---|------|----------|
| D1 | Add `Mitchell`, `Kaiser`, `Blackman`, `Hamming` filter codes (5-8) to filter enum / mapping | P2 |
| D2 | UI: add new filters to "Advanced" dropdown in ResizeFilterControl | P2 |
| D3 | `quantette` Floyd-Steinberg dither on PNG compress (separate from resize) | P2 |
| D4 | i18n for new filter names and dither label | P2 |

---

## 6. Implementation order summary

```
Phase A ─── v3.7.0 (MINOR) ───
  ├── A1-A9   Rust: unified processing pipeline (imageops)
  ├── A10-A15 TS: types, worker, registry
  ├── A16-A19 UI: ProcessingPanel + i18n
  └── Verify + Security + Commit

Phase B ─── v3.7.1 (PATCH) ───
  ├── B1-B6   UI polish: collapsible, mobile, notices
  └── Verify + Commit

─────── optional spike gate ───────

Phase C ─── v3.8.0 (MINOR, if spike passes) ───
  ├── S1-S5   imageproc spike + size gate
  ├── C1-C7   Median + bilateral implementation
  └── Verify + Commit

Phase D ─── v3.8.x (MINOR, backlog) ───
  ├── fast_image_resize spike
  ├── quantette spike
  └── Implementation if spikes pass
```

---

## 7. Cross-cutting requirements (every phase)

| # | Requirement | Phase A | Phase B | Phase C |
|---|-------------|---------|---------|---------|
| 1 | `cargo test --workspace` passes | ✅ | ✅ | ✅ |
| 2 | `npm run build:wasm` succeeds | ✅ | — | ✅ |
| 3 | `npx tsc --noEmit` 0 errors (non-test) | ✅ | ✅ | ✅ |
| 4 | `npm test` 183 Vitest tests pass | ✅ | ✅ | ✅ |
| 5 | `npm run build` succeeds | ✅ | ✅ | ✅ |
| 6 | Backward compat: old exports unchanged | ✅ | ✅ | ✅ |
| 7 | StripAll metadata policy verified | ✅ | — | ✅ |
| 8 | Risk mode respected | ✅ | — | ✅ |
| 9 | i18n EN+ES complete for all new strings | ✅ | ✅ | ✅ |
| 10 | Release checklist (vX.Y.Z.md, manifest, i18n, docs) | ✅ | ✅ | ✅ |
| 11 | `wasm-modules.d.ts` synced with Rust exports | ✅ | — | ✅ |

---

## 8. Commit strategy

All work on `dev`. One commit per phase. Message format:

```
feat: Resize Processing Phase A — sharpen, contrast, brighten, grayscale via imageops

- New resize_*_with_processing Wasm exports (unified pipeline)
- ProcessingPanel UI with sharpen/brighten/contrast/grayscale/pre-blur
- PNG compression slider on png-resize
- Estimate parity for processing variants
- Zero Wasm size increase (imageops already compiled)
- Backward compat: existing resize exports unchanged

App v3.7.0 / engine v1.6.1.
```

---

## 9. Risk matrix (all phases)

| # | Risk | Impact | Phase | Mitigation |
|---|------|--------|-------|------------|
| R1 | Processing params cause NaN/overflow in imageops | Corrupt output / panic | A | Bounded validation before imageops call |
| R2 | `imageproc` bloats Wasm >3 MB | NFR-7 violation | C | Spike gate BEFORE implementation. Abort and fallback to imageops blur if >1 MB. |
| R3 | Too many sliders overwhelm users | Drop-off / complaints | A | Collapse "Fine-tuning" by default. Phase B polishes UX. |
| R4 | Estimate with processing params becomes slow | UX jank | A | Debounce estimate. Cache intermediate raster for repeated estimates within one session. |
| R5 | Mobile layout breaks with new controls | Broken mobile UX | A | ProcessingPanel vertical stack on mobile; single-column layout. Tested in Phase B. |
| R6 | New imageops functions panic on edge cases (0-dim, 1-pixel images) | Wasm crash | A | Guard: skip processing on <4px dimensions. Test with 1×1 and 2×2 inputs. |

---

## 10. References

| Doc | Role |
|-----|------|
| `resize_advanced_processing_investigation.md` | Technical foundation — imageops inventory, crate survey, competitor analysis |
| `resize_advanced_ux_investigation.md` | UI/UX design — panel layout, collapsible pattern, mobile adaptation |
| `resize_premium_roadmap.md` | Phases A–E delivered in v3.6.0 |
| `tier4_plan.md` | Parent Tier 4a plan |
| `docs/SPEC.md` §12.5 | Normative Tier 4a spec |
| `docs/LIMIT_PIPELINE.md` | Limit pipeline — must be respected |
| `SKILL.md` | Agent working protocol (Section 2: task execution workflow) |
| `SKILLS_TOOLING.md` | Tool call efficiency rules |
| `SKILLS_AGENTIC.md` | Subagent delegation protocol |

---

*Implementation roadmap for Resize Advanced Processing. Phases A through D deliver imageops processing, UI refinement, denoiser, and extended filters — in that priority order. Phase A (v3.7.0) is the immediate target with zero bundle cost. All phases follow the Camaleon working protocol defined in SKILL.md.*
