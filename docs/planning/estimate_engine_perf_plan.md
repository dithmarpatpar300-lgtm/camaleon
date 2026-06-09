# Pre²-Tier 3 — Estimation Engine Performance Plan

**Status:** Planning (branch `dev`)  
**Codename:** Pre²-Tier 3 (second pre-Tier 3 initiative — follows Pre-Tier 3 UI/UX)  
**Priority:** High — before Tier 3 format expansion and while file sizes grow  
**Last updated:** 2026-06-09  
**Related:** SPEC §6.4 (CountingWriter / estimate-first), `docs/planning/pre_tier3_ui_ux_plan.md`, `docs/planning/semantic_alpha_engine_plan.md`, `docs/planning/adaptive_limits_proposal.md`

---

## 1. Executive summary

After **v1.12.0–v1.12.1** (Visual Identity & Discovery Shell + brand mark), Camaleon is visually ready for Tier 3. The next bottleneck users perceive — especially on **files heavier than ~20 MB** — is **estimation latency**: the “Peso estimado” / “Calculate estimate” path feels slow even when transmutation itself would be acceptable.

This plan documents:

1. **What the estimation engine is today** — architecture, algorithms, low-level operations, and every hotspot identified in code review (2026-06-09).
2. **What was proposed** — AVX2/AVX-512, advanced floating-point SIMD, GPU offload — and **what is actually viable** inside a browser-local Wasm product.
3. **A phased roadmap** — ordered by return on investment, preserving Camaleon’s **estimate-first honesty doctrine** unless explicitly revised.

**Goal:** Make estimation feel instant on typical files and materially faster on large inputs (>20 MB), without breaking size accuracy, privacy, or single-worker Wasm constraints.

**Non-goal:** Rewrite all encoders in GPU shaders or ship a native desktop binary solely for AVX-512 (contradicts browser-only NFR unless product scope changes).

---

## 2. Problem statement (user-reported)

| Symptom | Context |
|---------|---------|
| Estimate feels “a bit slow” | General UX on transmute tool pages |
| Worse on **>20 MB** inputs | Large PNG/TIFF/BMP/WebP masters, multi-page TIFF, animated GIF |
| Desire for “low-level” speed | AVX2 / AVX-512, advanced FP SIMD, GPU |

**Important framing:** Slowness is not a single bug — it is the **inherent cost of shadow encoding** (full decode + full encode) on one Wasm thread, amplified by scalar hot loops and a few **algorithmic inefficiencies** (GIF frame decode, duplicate work with prepare).

---

## 3. Current architecture — full audit

### 3.1 Doctrine (SPEC — non-negotiable unless amended)

| Rule | Source | Implication |
|------|--------|-------------|
| **Estimate-first** | SPEC §6.4, engineering checklist | Every conversion ships `estimate_*_size` Wasm export |
| **CountingWriter pattern** | `core_utils::counting_writer` | Encoder writes to sink that **counts bytes, discards payload** — no output `Vec` allocation |
| **Exact estimate** | Integration tests, Tier 2 spikes | Estimate must match full transmute size (typically ±0% or documented ±5% on spikes) — **not a statistical guess** |
| **No `rayon`** | SPEC Wasm note | `image` crate `default-features = false`; threading breaks single-threaded Wasm |
| **Browser-only** | North Star, NFR-1 | All compute in Web Worker + Wasm; no server round-trip |

### 3.2 What “estimation” actually does

**There is no separate approximation engine.** Every `estimate_*_size` export runs:

```
validate_input → decode (full) → transforms → encode (full) → CountingWriter.bytes_written
```

The returned `u32` is the **exact byte count** the encoder would have produced. CPU time ≈ transmute time minus output buffer allocation/copy.

**Exception — cache-enabled path (frontend):** On `tier !== "low"` with `enableResultCache`, the worker may run **`runFullEncode`** instead of `estimate_*_size`, store bytes in `ResultCache`, and return `outputSize`. Transmute then hits cache (`cacheHit: true`). This trades RAM for speed on mid/high-tier devices.

### 3.3 End-to-end data flow

```
User drops file
  → prepare (probe dims, semantic alpha assess, optional resize)
  → useAdaptiveResourceProfile(fileSize, signals)
  → useFileMetrics (debounce, oversize consent, holdEstimate)
  → TransmutationWorkerProvider.estimate()
  → transmutation.worker.ts (serialized queue; transmute preempts estimate)
  → branch:
       (A) enableResultCache + fingerprint → runFullEncode → ResultCache
       (B) else → runSizeEstimate → estimate_*_size (CountingWriter)
  → MetricsPanel (estimated size, delta %, SWR animation)
```

**Key files:**

| Layer | Path |
|-------|------|
| UI metrics | `frontend/src/hooks/useFileMetrics.ts` |
| Resource tiers | `frontend/src/lib/device/resource-profile.ts` |
| Worker routing | `frontend/src/workers/transmutation.worker.ts` → `runSizeEstimate()` |
| Peak RAM copy | `frontend/src/lib/transmutation/estimate-peak-ram.ts` |
| Input cache | `frontend/src/lib/transmutation/estimate-input-cache.ts` |
| CountingWriter | `motor_transmutacion/core_utils/src/counting_writer.rs` |
| Semantic alpha | `motor_transmutacion/core_utils/src/semantic_alpha/` |

### 3.4 Wasm surface — 15 estimate exports across 9 crates

| Crate | Exports | Notes |
|-------|---------|-------|
| `transmutador_jpg` | `estimate_jpg_to_png_size` | JPEG decode → PNG zlib encode |
| `transmutador_png` | `estimate_png_to_jpg_size` | PNG decode → flatten? → JPEG DCT |
| `transmutador_webp` | `estimate_webp_to_png_size`, `estimate_webp_to_jpg_size` | WebP decode; lossless WebP slow |
| `transmutador_encode` | `estimate_png_to_webp_size`, `estimate_jpg_to_webp_size` | VP8L lossless encode — **slowest encoder per pixel** |
| `transmutador_gif` | `estimate_gif_to_png_size`, `estimate_gif_to_jpg_size` | **Decodes all GIF frames** per call (see §3.6) |
| `transmutador_bmp` | `estimate_bmp_to_png_size`, `estimate_bmp_to_jpg_size` | BMP decode + flatten path |
| `transmutador_tiff` | `estimate_tiff_to_png_size`, `estimate_tiff_to_jpg_size` | Multi-IFD; page_index; u16 downshift |
| `transmutador_ico` | `estimate_ico_to_png_size`, `estimate_png_to_ico_size` | Entry decode; Lanczos downscale for PNG→ICO |
| `transmutador_tga` | `estimate_tga_to_png_size` | TGA decode + PNG encode |

**Engine workspace version:** `1.4.2` (`motor_transmutacion/Cargo.toml`).  
**Build:** `frontend/scripts/build-wasm.mjs` — `wasm-pack build --target web` per crate; **no `+simd128` flag today**.

### 3.5 Low-level operations today

| Operation | Implementation | Parallelism | SIMD |
|-----------|----------------|-------------|------|
| Image decode | `image` 0.25 (`ImageReader`, format codecs) | None | None (crate-internal may vary; not under our control in Wasm) |
| PNG encode | `PngEncoder` + DEFLATE + adaptive filters | None | None |
| JPEG encode | `JpegEncoder` + DCT | None | None |
| WebP encode | `image::write_to(WebP)` / VP8L | None | None |
| Alpha flatten | Per-pixel u32 loop in **5 duplicated copies** | None | None |
| Alpha scan (encode) | `rgba.pixels().any(\|p\| p[3] < 255)` full raster | None | None |
| Alpha probe (prepare) | Downscale to 512 px edge + 8192 sample grid | None | None |
| GIF composite | `GifDecoder::into_frames()` — all frames | None | None |
| ICO resize | Lanczos3 via `image::imageops` | None | None |
| TIFF downshift | Per-sample u16→u8 cast policy | None | None |

**Dependencies:** `wasm-bindgen`, `image = { version = "0.25", default-features = false, features = ["webp", "png", "jpeg", ...] }`, `core_utils`.

### 3.6 Critical hotspot — GIF decodes every frame for one frame

`estimate_gif_to_*` calls `decode_gif_frame` → `composite_to_dynamic_image` → `composite_gif_frame`:

```rust
// gif_decode.rs — composite_gif_frame
let (_width, _height, frames) = load_composited_frames(input)?;  // ALL frames
Ok(frames[frame_index as usize].clone())
```

`inspect_gif` (used before estimate for `frame_count` validation) **also** calls `load_composited_frames` — so a single GIF estimate can decode the animation **twice**.

`GifSession` / `open_gif_session` exists for O(1) scrub previews **after** session open, but **cold estimate** still pays full multi-frame decode.

**Impact:** Animated GIFs with hundreds of frames × large canvas = worst-case estimate latency unrelated to selected `frame_index`.

### 3.7 Alpha flatten — duplicated scalar loop

Same logic in `transmutador_png`, `transmutador_gif`, `transmutador_bmp`, `transmutador_webp`, `transmutador_tiff`:

```rust
// Per pixel (x, y):
let a = pixel[3] as u32;
let inv_a = 255 - a;
out_r = ((a * r + inv_a * bg_r + 127) / 255) as u8;
// ... g, b
```

For 40M pixels (SPEC `MAX_PIXELS` ceiling): ~160M multiply-add-divide ops, sequential.

**Prepare vs encode duplication:** `assess_dynamic_image_probe` uses sampled scan (8192 px). **Encode/estimate** uses `dynamic_image_has_meaningful_alpha` → **full raster** `rgba_has_meaningful_alpha` — second full pass over all pixels when PNG→JPEG (or any lossy flatten route).

### 3.8 CountingWriter — what it saves and what it does not

**Saves:** Output `Vec<u8>` allocation and memcpy to JS.

**Does not save:** DEFLATE compression CPU, JPEG DCT, VP8L entropy coding, filter selection, or decode cost.

For a 20 MB PNG → JPEG on a 6000×4000 image, dominant cost remains **zlib/DCT**, not buffer allocation.

### 3.9 Frontend resource policy (adaptive limits)

`computeResourceProfile` (`resource-profile.ts`):

| Tier | debounceMs | maxAutoEstimateBytes | enableResultCache | cacheMaxOutputBytes |
|------|------------|----------------------|-------------------|---------------------|
| high | 400 | 40 MB | true | 25 MB |
| mid | 600 | 25 MB | true | 15 MB |
| low | 800 | 15 MB | false | 0 |

Files above `maxAutoEstimateBytes` require manual **“Calcular estimación”**. Files above `SOFT_LIMIT_BYTES` (50 MB default) need oversize consent; session limit can rise to 150 MB on desktop with consent.

**Peak RAM heuristic** (`estimate-peak-ram.ts`): `fileSize + width×height×4×2.2` — used for consent copy, not engine timing.

### 3.10 Worker concurrency model

- Single worker pipeline; jobs serialized.
- Estimate requests coalesced / cancelled via `estimateIdRef` when inputs change.
- **Transmute preempts estimate** (SPEC §estimate path).
- No `SharedArrayBuffer` threading pool.

### 3.11 Limits (core_utils)

| Constant | Value |
|----------|-------|
| `MAX_INPUT_BYTES` | 50 MB (soft) |
| `ABSOLUTE_MAX_INPUT_BYTES` | 150 MB (consented desktop) |
| `MAX_PIXELS` | 40,000,000 |
| `MAX_ALPHA_PROBE_SAMPLES` | 8,192 |
| `MAX_PROBE_EDGE` | 512 px |

---

## 4. Per-route cost model (qualitative)

| Route | Decode cost | Transform cost | Encode cost | >20 MB notes |
|-------|-------------|----------------|-------------|--------------|
| JPG→PNG | JPEG IDCT (moderate) | RGB extract | PNG zlib (**high**) | Large dimensions dominate |
| PNG→JPG | PNG inflate (**high**) | flatten + full alpha scan | JPEG DCT (moderate) | **Double raster pass** common |
| WebP→PNG | WebP (varies) | RGBA/RGB | PNG zlib |
| WebP→JPG | WebP | flatten + scan | JPEG DCT |
| PNG/JPG→WebP | decode | minimal | **VP8L (very high)** |
| GIF→PNG/JPG | **All frames (critical)** | flatten + scan | PNG or JPEG |
| BMP→* | BMP read (often fast) | flatten if 32-bit | PNG/JPEG |
| TIFF→* | TIFF strip/tile decode (**high**) | page IFD, downshift | PNG/JPEG |
| ICO→PNG | ICO entry | minimal | PNG |
| PNG→ICO | PNG | Lanczos resize | ICO container |
| TGA→PNG | TGA | orientation normalize | PNG |

**Slowest paths observed in code review:**

1. **GIF animated** — O(frames) full decode per estimate (§3.6).  
2. **WebP lossless encode** (PNG/JPG→WebP).  
3. **Large PNG encode** (JPG/BMP/TIFF→PNG) — DEFLATE at compression 6–9.  
4. **PNG→JPEG** — inflate + flatten + full alpha scan + DCT.

---

## 5. Proposed optimizations — feasibility matrix

User-requested directions from planning discussion (2026-06-09):

### 5.1 AVX2 / AVX-512 (x86 native SIMD)

| Aspect | Assessment |
|--------|------------|
| **Viability in Camaleon today** | ❌ **Not applicable** to browser Wasm deployment |
| **Why** | Production path is `wasm32-unknown-unknown` in Web Worker, not native x86 binary |
| **AVX2/512** | CPU ISA extensions on Intel/AMD — **not exposed to Wasm** in browsers |
| **When it would matter** | Hypothetical native CLI, server-side sidecar, or Electron with bundled native module — **out of current product scope** |

### 5.2 WebAssembly SIMD128 (`v128`)

| Aspect | Assessment |
|--------|------------|
| **Viability** | ✅ **High** — correct browser-native SIMD path |
| **Width** | 128-bit lanes (not 256/512 AVX) |
| **Browser support** | Chrome, Firefox, Safari (modern); needs feature detect + scalar fallback |
| **Build change** | `RUSTFLAGS='-C target-feature=+simd128'` or `rustflags` in `.cargo/config`; document in `build-wasm.mjs` |
| **Best targets** | `flatten_rgba_on_background`, `rgba_has_meaningful_alpha`, BMP BGRA sample scan, TIFF u16 downshift rows |
| **Expected gain** | ~2–4× on those loops; **not** on DEFLATE/DCT inside `image` |

### 5.3 Advanced floating-point / “spread” SIMD

| Aspect | Assessment |
|--------|------------|
| **Viability** | ⚠️ **Low–medium** for estimate path |
| **Why** | Hot paths are **integer u8/u32** (alpha composite, byte scan), not FP matrix math |
| **FP SIMD** | Relevant if we add perceptual resize, blur, or ML-based size predictors — not current pipeline |
| **Recommendation** | Prefer **integer Wasm SIMD** first; defer FP unless Phase 2 analytical models need it |

### 5.4 GPU / WebGPU offload

| Aspect | Assessment |
|--------|------------|
| **Move all computation to GPU** | ❌ **Not viable** as full replacement |
| **Why** | PNG DEFLATE, JPEG DCT, WebP VP8, GIF LZW are sequential entropy coders — industry standard stacks run on CPU |
| **Partial GPU** | ✅ **Selective** for embarrassingly parallel pre/post processing |

| Operation | GPU fit | Notes |
|-----------|---------|-------|
| RGBA flatten onto background | ✅ High | Trivial compute shader; 1 thread/pixel |
| Meaningful-alpha reduction | ✅ High | Parallel min/compare + block reduction |
| Colorspace convert / pack | ⚠️ Medium | Upload/download cost matters |
| Lanczos resize | ⚠️ Medium | Quality parity with honest resize policy |
| PNG/JPEG/WebP **encode** | ❌ Low | No mature browser pipeline; rewrite = multi-month project |
| Format **decode** | ❌ Low | Would replace `image` crate — huge scope |

**WebGPU costs:** buffer upload, pipeline creation, device availability, battery on mobile, fallback when `navigator.gpu` missing.

**Recommendation:** Phase 3 **spike only** — measure end-to-end win including PCIe-equivalent JS↔GPU copy for 5 / 20 / 50 MB fixtures. Adopt only if **>30% net improvement** vs Wasm SIMD on median hardware.

### 5.5 Parallelism (`rayon`, Worker pools)

| Aspect | Assessment |
|--------|------------|
| **rayon in Wasm** | ❌ Forbidden (SPEC) |
| **Multiple Web Workers** | ⚠️ Possible but complex — duplicate Wasm instances, 9 modules × memory, job routing |
| **Recommendation** | Defer; fix algorithmic issues (GIF) and SIMD first |

---

## 6. Phased implementation roadmap

### Phase E0 — Quick wins (algorithmic, no SIMD/GPU)

**Target:** 1–2 weeks · **Highest ROI**

| ID | Task | Detail | Files (primary) |
|----|------|--------|-----------------|
| E0.1 | **Incremental GIF composite** | Composite only frames `0..=frame_index` instead of `load_composited_frames` for estimate/transmute cold path; cache disposal state | `transmutador_gif/src/gif_decode.rs`, `lib.rs` |
| E0.2 | **GIF inspect without full decode** | Read frame count / dims from header where possible; avoid double full decode (inspect + estimate) | `gif_decode.rs` |
| E0.3 | **Centralize `flatten_rgba`** | Single `core_utils::flatten_rgba_on_background` — remove 5 crate duplicates | `core_utils`, all transmutadores lossy |
| E0.4 | **Reuse alpha assessment in estimate** | If prepare already computed `AlphaAssessment` with full confidence, pass flag to skip `dynamic_image_has_meaningful_alpha` full scan when safe | `frontend` prepare context + Wasm API review |
| E0.5 | **Benchmark harness** | Rust `criterion` or scripted timings: decode / transform / encode breakdown per crate; fixtures 1 / 5 / 20 / 50 MB | `motor_transmutacion/benches/` or `scripts/bench-estimate.mjs` |
| E0.6 | **Document baseline** | Record p50/p95 ms per route on reference device matrix | This doc §9 |

**Exit criteria E0:** GIF estimate for frame N on 100-frame file no longer scales linearly with N; baseline table published.

---

### Phase E1 — Wasm SIMD128

**Target:** 2–3 weeks · **Depends on E0.3**

| ID | Task | Detail |
|----|------|--------|
| E1.1 | Enable `+simd128` build | Update `build-wasm.mjs`, CI, feature detect in worker init |
| E1.2 | SIMD `flatten_rgba` | Process 16 pixels/lane (u8×16); scalar tail |
| E1.3 | SIMD `rgba_has_meaningful_alpha` | `i8x16` compare against 255; early exit |
| E1.4 | SIMD BMP BGRA probe | Accelerate `sample_bgra_bytes_meaningful_alpha` |
| E1.5 | Scalar fallback | Identical results — bit-exact RGB output required |
| E1.6 | Tests | Unit tests + integration parity with existing estimate tests |

**Exit criteria E1:** ≥2× speedup on flatten+scan microbenchmarks at 40M px; no estimate size regression.

---

### Phase E2 — Encode-path intelligence (doctrine-sensitive)

**Target:** 3–4 weeks · **Requires product decision**

Options that preserve *user-visible honesty*:

| ID | Strategy | Speedup | Accuracy trade-off |
|----|----------|---------|------------------|
| E2.1 | **Tiered compression for estimate UI** | Large — PNG level 1 for estimate, user level for transmute | Size delta small if documented; UI shows “~” badge? |
| E2.2 | **JPEG analytical bound** | Skip DCT for estimate; model from quality×pixels×entropy proxy | Requires ±3% validation suite |
| E2.3 | **Cache warm from prepare decode** | Hold decoded `DynamicImage` in worker session for repeat estimates (quality slider) | RAM cost; session lifecycle rules |
| E2.4 | **Fast estimate mode (>20 MB)** | Auto-enable tiered path when `fileSize > 20MB` and user consented | SPEC amendment + i18n |

**Default recommendation:** Keep CountingWriter exact as canonical; optional `estimateMode: "fast" | "exact"` in worker request for large files.

**Exit criteria E2:** >20 MB PNG→JPG estimate p95 under agreed budget (TBD in E0 benchmarks) with documented accuracy bounds.

---

### Phase E3 — WebGPU spike (optional)

**Target:** 4–6 weeks spike · **Go/no-go gate**

| ID | Task |
|----|------|
| E3.1 | Prototype WGSL flatten + alpha reduction |
| E3.2 | A/B vs E1 SIMD on 20 MB RGBA PNG |
| E3.3 | Fallback path + feature flag `enableGpuPreprocess` |
| E3.4 | Mobile battery / memory profiling |

**Go criteria:** Net wall-clock win >30% including upload/download on mid-tier laptop **and** one mobile device.

**No-go:** Ship SIMD-only; document GPU deferral in ROADMAP.

---

### Phase E4 — Native AVX2/512 (out of scope)

Documented for completeness per user request:

- Would apply only to a **future native** encoder binary (CLI, cloud worker, desktop shell).
- **Not** part of Pre²-Tier 3 delivery on `camaleon.app` browser product.
- If pursued later: `std::arch::x86_64`, runtime CPUID detect, separate artifact from Wasm.

---

## 7. What we explicitly do not do (Pre²-Tier 3)

| Item | Why |
|------|-----|
| Replace `image` encoders with GPU DEFLATE/JPEG | Multi-quarter rewrite; brittle in browsers |
| Enable `rayon` in Wasm | SPEC violation; threading unsupported |
| Ship statistical-only estimates without user disclosure | Breaks estimate-first trust doctrine |
| AVX-512 in production browser path | Technically impossible in Wasm32 |
| Block Tier 3 format work on full E3 GPU | E0–E1 sufficient to proceed with Tier 3 engine in parallel |

---

## 8. Success criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| 1 | GIF animated estimate scales with **selected frame index**, not total frames | Benchmark E0.1 |
| 2 | PNG→JPG flatten+alpha scan ≥2× faster at max pixels (SIMD) | Microbench E1 |
| 3 | No estimate size regression on integration test suite | `cargo test --workspace` + existing ±5% spike tests |
| 4 | >20 MB file estimate p95 improves ≥40% vs baseline (E0+E1 minimum) | E0.5 harness |
| 5 | Low-tier devices (`enableResultCache: false`) still benefit | Manual QA matrix |
| 6 | SPEC updated if fast-estimate tier ships | §6.4 amendment |
| 7 | What's New + release notes for engine perf milestone | e.g. v1.13.0 |

---

## 9. Benchmark matrix (to fill in Phase E0)

**Reference fixtures needed:**

| Fixture | Format | ~Size | ~Dimensions | Purpose |
|---------|--------|-------|-------------|---------|
| small-photo | JPEG | 2 MB | 3K×2K | Baseline |
| large-png | PNG RGBA | 25 MB | 6K×4K | Flatten + zlib |
| large-tiff | TIFF | 10–40 MB | multi-IFD | Page index path |
| animated-gif | GIF | 5 MB | 100+ frames | GIF hotspot |
| webp-lossless | WebP | 15 MB | 4K | VP8L encode |
| bmp-32 | BMP | 20 MB | 4K×3K | BGRA flatten |

**Device tiers:** desktop 8 GB / 8 cores; mid laptop 8 GB / 4 cores; mobile 4 GB (or throttled 6× CPU).

**Metrics per run:** `t_decode`, `t_transform`, `t_encode`, `t_total`, `bytes_estimated`, `peak_heap` (if available).

---

## 10. Relation to other initiatives

| Initiative | Relationship |
|------------|--------------|
| **Pre-Tier 3 UI/UX** (v1.12.0) | Shipped — MetricsPanel UX already shows estimate state; perf plan improves backend |
| **Semantic Alpha Engine** (v1.11.0) | Probe uses sampling; encode still full raster — E0.4 bridges gap |
| **Tier 3 formats** | More tools → more estimate calls → E0/E1 reduce per-call cost |
| **Adaptive limits** | `resource-profile.ts` already gates auto-estimate; may tune thresholds after E0 benchmarks |
| **Result cache** | Complementary — cache helps repeat/slider; E-phases help cold estimate |

**Suggested release packaging:** Engine perf milestone as **v1.13.0** (or v1.12.2 if E0 only) on `dev` before Tier 3 format wave.

---

## 11. File map (implementation index)

```
motor_transmutacion/
  core_utils/src/counting_writer.rs      # Estimate sink
  core_utils/src/semantic_alpha/
    raster.rs                            # flatten scan, sample grid
    probe.rs                             # prepare-time downscale assess
  transmutador_*/src/lib.rs              # estimate_*_size per crate
  transmutador_gif/src/gif_decode.rs     # GIF hotspot — priority E0

frontend/
  src/workers/transmutation.worker.ts    # runSizeEstimate, cache branch
  src/hooks/useFileMetrics.ts            # estimate orchestration
  src/lib/device/resource-profile.ts     # tier gating
  scripts/build-wasm.mjs                 # SIMD flags (E1)

docs/
  SPEC.md §6.4, §estimate path            # Doctrine — amend if E2 ships
  planning/estimate_engine_perf_plan.md  # This document
```

---

## 12. Open questions (for Architect / product)

1. **Fast estimate tier:** Accept PNG compression 1 for UI estimate on files >20 MB with “±X%” disclosure?
2. **GIF inspect:** Is header-only frame count acceptable for all GIF variants we support, or keep full decode fallback?
3. **Worker memory:** Hold decoded bitmap between slider moves — max session RAM cap?
4. **WebGPU:** Worth E3 spike before Tier 3, or strictly post-Tier 3?
5. **Version target:** v1.13.0 for full E0+E1, or split releases?

---

## 13. Revision log

| Date | Change |
|------|--------|
| 2026-06-09 | Initial plan — audit from code review + user planning session (AVX/GPU feasibility, >20 MB latency, Pre²-Tier 3 scope) |
