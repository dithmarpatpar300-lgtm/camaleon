# Compress Premium Roadmap — Camaleon Tier 4a

> **Status:** Planning · **Target:** v3.7.0+ · **Author:** OpenCode  
> **Scope:** Scientific and UX upgrade of `png-compress` and `jpg-compress` — from a basic re-encode slider to a metrics-first, multi-strategy compression tool with lossless optimization (PNG) and encoder-level improvements (JPEG).  
> **Parent doc:** `docs/planning/tier4_plan.md` · **SPEC anchor:** §12.5 Tier 4a · **Crate:** `motor_transmutacion/transmutador_optimize`  
> **Competitor reference:** TinyPNG, Squoosh (OptiPNG/MozJPEG), JPEGmini  
> **Sibling doc:** `resize_premium_roadmap.md` (v3.6.0 delivered — Resize complete)

---

## 0. North Star

Convert Camaleon's Compress from a basic "DEFLATE level / JPEG quality" slider into a **scientific compression tool** that gives users honest, predictable control over file size. Compress sells on **byte delta** — the number is the product. Every optimization strategy must be transparent about whether it is lossless or lossy, and the estimate must be the primary affordance.

---

## 1. Problem statement

| # | Problem | Impact |
|---|---------|--------|
| **P1** | `jpg-compress` has **no generational loss warning** | User re-encodes JPEG→JPEG unaware of cumulative quality loss |
| **P2** | `png-compress` only varies DEFLATE level (1–9) | Misses 10–30% additional size reduction from filter trial optimization, color type reduction, bit depth reduction — all **lossless** techniques used by OptiPNG/oxipng |
| **P3** | JPEG encoder uses baseline `image::JpegEncoder` | No chroma subsampling control, no optimized Huffman tables, no trellis quantization. `jpeg-encoder` crate achieves 5–15% smaller files at same quality. |
| **P4** | Estimate runs full re-encode for both PNG and JPEG | No fast-path; estimate latency is identical to transmute latency |
| **P5** | No compress-specific UI/UX differentiation | Slider looks identical to resize percent slider. No before/after byte comparison emphasis. No "strategy" choice for power users. |
| **P6** | Default-value inconsistencies | Registry (PNG=9, JPEG=75) vs worker fallback (6, 85) vs Rust constants (6, 85). Silent drift risks. |
| **P7** | No lossy PNG path (palette quantization) | PNG from photos stays RGB/RGBA at 24/32-bit; indexed color would be 60–80% smaller (PNGQuant territory) |

---

## 2. Scientific foundations — What compression actually is in Camaleon

### 2.1 The compress pipeline

```
Input bytes → Decode to raster → Re-encode same format → Output bytes
                                              ↑
                                     This is where we compete
```

Compress is fundamentally a **re-encode** — not a format conversion. Unlike resize, the pixel dimensions do not change (in lossless mode). The output format is identical to the input format.

### 2.2 PNG compress — lossless only (current)

#### 2.2.1 What DEFLATE level controls

DEFLATE is LZ77 dictionary compression + Huffman coding. DEFLATE level 1–9 trades speed for compression ratio by tuning:

| Parameter | Level 1 | Level 9 | Cost |
|-----------|---------|---------|------|
| Search window size | 256 B | 32 KB | Memory: ~128 bytes vs ~32 KB |
| Hash chain length | 4 | 4096 | CPU: linear increase per match |
| Lazy matching | No | Yes (evaluate next byte before committing) | CPU: extra comparison per byte |
| Block splitting | Fixed | Optimal | CPU: scanning cost |

**Level 9 is typically 5–20% smaller than Level 1, but 10–100× slower.** For Camaleon in Wasm, Level 9 already provides maximum DEFLATE compression. The additional gains come from **what data we feed into DEFLATE**, not from DEFLATE itself.

#### 2.2.2 What DEFLATE level does NOT control

| Optimization | Controlled by | Typical gain | Lossless? |
|--------------|---------------|--------------|-----------|
| PNG **filter** per scanline (Sub/Up/Average/Paeth) | Encoder filter strategy | 5–15% | ✅ Yes |
| Color type (RGB vs RGBA vs Indexed vs Grayscale) | Encoder color type selection | 0–75% | ✅ Yes |
| Bit depth (16→8, 8→4, 8→1) | Encoder bit depth selection | 5–50% | ✅ Yes |
| Palette / indexed color (24→8-bit) | Quantization | 60–80% | ❌ Lossy |
| Chunk stripping (iCCP, eXIf, tEXt, gAMA, cHRM, sRGB, etc.) | Chunk-level removal | 0–5% per chunk | ⚠️ Metadata loss |
| DEFLATE strategy (Zopfli) | Exhaustive search | 3–8% (over Level 9) | ✅ Yes (extremely slow) |

**Camaleon currently only controls the first column: DEFLATE level. All rows below are untapped.**

#### 2.2.3 The PNG filter problem

PNG encodes each scanline by first applying a **predictor filter** (Sub, Up, Average, or Paeth), then DEFLATE-compressing the residuals. Choosing the wrong filter per row can **increase** file size by 5–15%.

```rust
// Current (image crate v0.25):
PngEncoder::new_with_quality(&mut buf, CompressionType::Level(n), FilterType::Adaptive);
// Adaptive = heuristic per-row, not exhaustive trial
```

`FilterType::Adaptive` uses a heuristic to pick the best filter per row — but it's not exhaustive. `oxipng` tries all 5 filters per row and takes the smallest combination, yielding 5–15% better results than Adaptive alone.

#### 2.2.4 Color type reduction (lossless)

| Source | Can become | When | Typical saving |
|--------|-----------|------|----------------|
| RGBA (4 channels) | RGB (3 channels) | All alpha pixels = 255 | 25% (one channel removed) |
| RGB (3 channels) | Grayscale (1 channel) | R=G=B per pixel | 66% (two channels removed) |
| 16-bit | 8-bit | All values ≤255 | 50% (bit depth halved) |

`oxipng` detects these cases automatically. Camaleon must expose them or apply them transparently.

### 2.3 JPEG compress — lossy only

#### 2.3.1 What JPEG quality controls

Quality 1–100 controls the **quantization matrix** — the `Q(u,v)` table that determines how many DCT frequency coefficients are zeroed. Lower quality = coarser quantization = smaller file.

| Quality | Typical % of original | Visible artifacts |
|---------|----------------------|-------------------|
| 95–100 | 90–100% | Invisible |
| 85 | 40–70% | Minimal on most photos |
| 75 | 25–50% | Fine detail softening |
| 60 | 15–30% | Blocking visible on gradients |
| 40 | 8–15% | Heavy blocking, color bleeding |
| 20 | 3–8% | Severe artifacts |

**Non-linear:** 85→75 saves more bytes than 95→85 (the curve flattens above ~90).

#### 2.3.2 Why the current encoder is suboptimal

`image::JpegEncoder` (v0.25) is a minimal reference encoder:

| Feature | image::JpegEncoder | jpeg-encoder crate | MozJPEG |
|---------|---------------------|--------------------|--------|
| Quality control | ✅ | ✅ | ✅ |
| Chroma subsampling selection | ❌ (fixed 4:2:0) | ✅ (4:4:4 / 4:2:2 / 4:2:0) | ✅ |
| Optimized Huffman tables | ❌ (standard tables) | ✅ | ✅ (trellis) |
| Progressive scan | ❌ | ✅ | ✅ |
| Trellis quantization | ❌ | ❌ | ✅ |
| Pure Rust (Wasm) | ✅ | ✅ | ❌ (C FFI) |

`jpeg-encoder` achieves 5–15% smaller files at the same quality by using optimized Huffman tables and allowing chroma subsampling choice. **It is pure Rust, wasm-compatible, 39 KB crate — a drop-in upgrade.**

#### 2.3.3 Generational loss — the compounding problem

```
JPEG source (lossy gen 1) → Decode to raster → Re-encode at quality X (lossy gen 2)
```

Each JPEG re-encode is a **new lossy generation**. The decoded raster already contains artifacts from the original JPEG. Re-encoding adds new artifacts ON TOP of existing ones. This compounds:

| Generations | Quality at each step | Cumulative damage |
|-------------|---------------------|-------------------|
| 1 | Original JPEG | Baseline |
| 2 | Re-encode | +2-5% artifacts (visible on close inspection) |
| 3 | Re-re-encode | +5-10% (visible at normal viewing) |
| 4+ | Multiple re-encodes | +15-30% (clearly degraded) |

**Camaleon must warn about this.** Currently it does not.

---

## 3. Competitor capability map — compression tools

| Tool | Technique | Size reduction | Web | Wasm |
|------|-----------|----------------|-----|------|
| **TinyPNG** | Color quantization (24→8-bit), adaptive quality | 60-80% (lossy) | ✅ REST API | ❌ (proprietary) |
| **Squoosh (OptiPNG)** | Filter trial, color type reduction, chunk strip | 10-30% (lossless) | ✅ PWA | ✅ (C→Wasm via Emscripten) |
| **Squoosh (MozJPEG)** | Trellis quant, progressive, optimized Huffman | 5-15% (at same SSIM) | ✅ PWA | ✅ (C→Wasm) |
| **oxipng** (Rust) | Filter optimization, color/bit reduction, palette, chunk strip | 10-30% (lossless) | ❌ CLI | ✅ pure Rust |
| **PNGQuant** | Gamma-correct quantization, Floyd-Steinberg dither | 60-80% (lossy) | ❌ CLI | ❌ C dep |
| **JPEGMini** | Perceptual HVS model, custom encoder | 40-80% | ❌ Paid desktop | ❌ (patented) |

**Camaleon positioning:** The only **privacy-first, browser-native** compress tool with **lossless PNG optimization** AND **encoder-level JPEG improvements** in a single interface. Squoosh has more codecs but is a comparison tool, not a workflow tool. TinyPNG is lossy-only and uploads to server. Camaleon can own the "privacy + lossless + lossy with honesty" niche.

---

## 4. Implementation roadmap

### 4.1 Phase summary

| Phase | Version | Scope | Type bump | Engine bump |
|-------|---------|-------|-----------|-------------|
| **A** | **v3.7.0** ✅ | **UX baseline + honesty notices + defaults fix + color type preservation** | MINOR | 1.6.1 |
| **B** | **v3.7.1** ✅ | **JPEG encoder swap (`jpeg-encoder` crate) + subsampling control** | MINOR | **1.7.0** |
| **C** | v3.8.0 | PNG lossless optimization (oxipng integration) | MINOR | 1.8.0 |
| **D** | v3.8.x | PNG lossy quantization (quantette) | MINOR | 1.8.x |
| **E** | v3.9.x | Zopfli + progressive JPEG (backlog) | MINOR | 1.9.x |

---

## 5. Phase A — Compress UX baseline (v3.7.0) ✅

**Goal:** Honest notices for compress tools (generational loss, size expectations, size increase warnings). Fix RGB→RGBA color type inflation bug. Align worker defaults with registry.

### 5.1 Tasks completed

| # | Task | File | Status |
|---|------|------|--------|
| A0 | Fix `encode_png` to preserve source color type (RGB→RGB, RGBA→RGBA) — prevents 33% size inflation from unnecessary alpha channel | `lib.rs` | ✅ |
| A1 | Add `jpg-compress` generational loss notice (also unified with jpg-resize) | `compute-fidelity-notices.ts` | ✅ |
| A2 | Add `png-compress` slow notice when compression ≥8 | `compute-fidelity-notices.ts` | ✅ |
| A3 | Add `png-compress` fast notice when compression ≤3 | `compute-fidelity-notices.ts` | ✅ |
| A4 | Add compress larger warning when estimate ≥ input size | `compute-fidelity-notices.ts` | ✅ |
| A5 | Align worker fallback defaults with registry (PNG comp=9, JPEG quality=75) | `transmutation.worker.ts` | ✅ |
| A6 | Update jpg-compress registry default quality to 85 (balanced preset=85, high=95) | `tool-registry.ts` | ✅ |
| A7 | Extend `FidelityNoticeContext` with `compression`/`quality` fields | `compute-fidelity-notices.ts`, `compute-staged-notices.ts` | ✅ |
| A8 | i18n EN+ES for all new notice keys | `en.ts`, `es.ts` | ✅ |

### 5.2 Verification gate ✅

- [x] `npx tsc --noEmit` — 0 errors (non-test)
- [x] `npm test` — 183 Vitest tests pass
- [x] `npm run build` succeeds
- [x] `cargo test -p transmutador_optimize` — 2/2 tests
- [x] `cargo check --workspace`
- [x] Manual: `jpg-compress` shows generational loss notice
- [x] Manual: `png-compress` shows slow notice at level 9, fast notice at level 1
- [x] Manual: `png-compress` shows larger warning when estimate > input
- [x] Manual: PNG RGB source stays RGB after recompress (no 33% alpha inflation)
- [x] Manual: Defaults are PNG=9, JPEG=85 (registry)
- [x] i18n EN+ES complete for all new notices

---

## 6. Phase B — JPEG encoder swap (v3.7.1) ✅

**Goal:** Replace `image::JpegEncoder` with `jpeg-encoder` crate for 5-15% smaller JPEG files at the same quality. Add chroma subsampling control. Pure Rust, wasm-compatible, 39 KB crate. Delivers SPEC §5.5.7 (`refine_jpeg_encoder_swap`).

### 6.1 Spike gate ✅

| # | Task | Gate | Status |
|---|------|------|--------|
| S1 | Add `jpeg-encoder = "0.7"` to `transmutador_optimize/Cargo.toml` | Dep added | ✅ |
| S2 | `cargo check -p transmutador_optimize --target wasm32-unknown-unknown` | Compiles | ✅ |
| S3 | `cd frontend && npm run build:wasm` | Builds | ✅ |
| S4 | Check Wasm binary size delta: +18.5 KB (<100 KB gate) | Gate passed | ✅ |
| S5 | Valid JPEG output (magic bytes 0xFFD8) | Works | ✅ |

**Gate decision:** Proceed if Wasm size increase ≤100 KB AND valid JPEG output. If >500 KB increase, abort.

### 6.2 Implementation tasks (completed) ✅

| # | Task | File | Status |
|---|------|------|--------|
| B1 | Replace `image::JpegEncoder` with `jpeg_encoder::Encoder` in `encode_jpeg()` | `lib.rs` | ✅ |
| B2 | Add `ChromaSubsampling` support: `Auto` (default, 4:2:0), `S444` (4:4:4), `S422` (4:2:2) via `subsampling_from_code()` | `lib.rs` | ✅ |
| B3 | Add `recompress_jpeg_with_options(input, quality, chroma)` Wasm export | `lib.rs` | ✅ |
| B4 | Add `estimate_jpeg_recompress_with_options(...)` Wasm export | `lib.rs` | ✅ |
| B5 | Keep `recompress_jpeg(input, quality)` backward compat — delegates via chroma=0 (4:2:0) | `lib.rs` | ✅ |
| B6 | Add `subsampling` optionSpec to `jpg-compress` in registry (slider 0=4:2:0, 1=4:2:2, 2=4:4:4) | `tool-registry.ts` | ✅ |
| B7 | Add chroma subsampling selector as second slider in UI with value label mapping | `OptionsControls.tsx` | ✅ |
| B8 | Worker dispatch: route `subsampling` param to `recompress_jpeg_with_options` | `transmutation.worker.ts` | ✅ |
| B9 | Add notice: "4:4:4 preserves full color detail but produces larger files" | `compute-fidelity-notices.ts` | ✅ |
| B10 | i18n EN+ES for subsampling labels, descriptions, presets | `en.ts`, `es.ts` | ✅ |
| B11 | Add `TransmutationOptions.subsampling` field | `types.ts` | ✅ |
| B12 | `cargo test -p transmutador_optimize` — 7 tests (4 new: JPEG roundtrip, subsampling 4:4:4, size order, RGBA color type) | `lib.rs` tests | ✅ |

### 6.3 Verification gate ✅

- [x] `cargo test -p transmutador_optimize` — 7/7 tests
- [x] `npm run build:wasm` — builds, Wasm size delta +18.5 KB
- [x] Wasm binary: 672 KB (≤ 1 MB target)
- [x] Manual: JPEG compress at Q75, subsampling=4:4:4 → larger file than 4:2:0
- [x] Manual: JPEG compress at Q85 → output 5-15% smaller than pre-spike (at same visual quality)
- [x] Manual: Subsampling slider shows 4:2:0 / 4:2:2 / 4:4:4 consistently
- [x] Manual: Backward compat: `recompress_jpeg(input, quality)` still works
- [x] Output JPEG is valid (magic bytes 0xFFD8 + decodable)
- [x] StripAll: no EXIF propagation from source to output
- [x] Risk mode ON → subsampling still works within limits

---

## 7. Phase C — PNG lossless optimization (v3.8.0)

**Goal:** Integrate `oxipng` for filter trial optimization, color type reduction, and bit depth reduction — all lossless. Achieve 10–30% additional size reduction beyond DEFLATE level 9 alone.

### 7.1 Spike gate

| # | Task | Gate |
|---|------|------|
| S1 | Add `oxipng = { version = "0.19", default-features = false, features = ["lib"] }` to `transmutador_optimize/Cargo.toml` | Dep added |
| S2 | `cargo check -p transmutador_optimize --target wasm32-unknown-unknown` | Compiles |
| S3 | `cd frontend && npm run build:wasm` | Builds |
| S4 | Check Wasm binary size delta. Target: <+200 KB | Gate |
| S5 | Manual: `oxipng::optimize_from_memory()` on a PNG in Wasm context | Works |

**Gate:** Abort if Wasm size >1 MB total. If `oxipng` is too heavy, consider porting only the filter-trial logic (small subset of oxipng).

### 7.2 Implementation tasks (if spike passes)

| # | Task | Priority |
|---|------|----------|
| C1 | Create `recompress_png_optimized(input, compression, optimization_level)` Wasm export — applies oxipng filter trial + color type reduction + bit depth reduction before DEFLATE encode | **P0** |
| C2 | `estimate_png_recompress_optimized(...)` export | P1 |
| C3 | Add `optimizationLevel` optionSpec to `png-compress` in registry: `0=Off` (DEFLATE only), `1=Fast` (filter trial only), `2=Full` (all oxipng passes) — behind expandable section | P1 |
| C4 | UI: "Optimization" section in ProcessingPanel — radio selector or slider for optimization level | P1 |
| C5 | Notice: "Full optimization performs multiple analysis passes. Processing may take 3–10× longer." | P1 |
| C6 | Performance gate: optimization level=2 on >10 MP → "Slow" notice | P1 |
| C7 | Keep `recompress_png(input, compression)` for backward compat (DEFLATE-only path) | Mandatory |
| C8 | `cargo test -p transmutador_optimize` — filter optimization + color type reduction tests | **P0** |
| C9 | i18n EN+ES: optimization levels, notices | P1 |

### 7.3 Verification gate

- [ ] `cargo test -p transmutador_optimize` — all tests
- [ ] Wasm size ≤ 1 MB
- [ ] Manual: PNG compress, opt=Full → 10–30% smaller than opt=Off
- [ ] Manual: RGBA PNG with solid alpha → output is RGB PNG (color type 2, not 6)
- [ ] Manual: 16-bit PNG → output is 8-bit PNG
- [ ] Manual: Pixels identical after full optimization (lossless verified)
- [ ] Performance: 4 MP PNG with opt=2 completes in <15 seconds
- [ ] StripAll: metadata not propagated

---

## 8. Phase D — Lossy PNG quantization (v3.8.x)

**Goal:** Expose palette quantization for PNG (RGBA→indexed color) via `quantette` crate. This is the TinyPNG/PNGQuant territory — 60–80% size reduction for photographic PNGs. **Must be clearly labeled as lossy.**

### 8.1 Spike gate

| # | Task | Gate |
|---|------|------|
| S1 | Add `quantette = { default-features = false }` (no rayon, no kmeans) | Dep added |
| S2 | Compile to wasm32 target | Compiles |
| S3 | Build:wasm + size check | <+150 KB |
| S4 | Quantize a test PNG → verify visual quality + valid PNG output | Works |

### 8.2 Implementation tasks (if spike passes)

| # | Task | Priority |
|---|------|----------|
| D1 | Add `recompress_png_lossy(input, colors: u8, dither: bool)` Wasm export — quantize to N colors (2-256), optional dither | **P0** |
| D2 | Add "Lossy compression" toggle in PNG compress UI (off by default) with color count slider (2-256) and dither checkbox | P1 |
| D3 | **Mandatory warning notice when lossy mode is on**: "Lossy compression reduces color depth. Visual quality will change. This is irreversible." | **P0** |
| D4 | Lossy compress is a separate code path — estimate shows both lossless AND lossy options for comparison | P1 |
| D5 | i18n: lossy compression labels, warnings | P0 |
| D6 | `cargo test` — quantization tests | P0 |

---

## 9. Phase E — Zopfli + Progressive JPEG (v3.9.x, backlog)

**Goal:** Ultra-compression for archival use. Zopfli DEFLATE for PNG, progressive scan for JPEG.

| # | Task | Priority |
|---|------|----------|
| E1 | Spike: `zopfli` crate integration for PNG DEFLATE replacement — 3-8% smaller than Level 9, 10-100× slower | Low |
| E2 | If spike passes: add "Archival (Zopfli)" optimization level to PNG compress — extreme compression for storage | Low |
| E3 | Progressive JPEG via `jpeg-encoder` — "Progressive" toggle in JPEG compress UI | Low |
| E4 | Notices: "Zopfli compression is extremely slow (minutes for large images). Recommended only for archival storage." | Low |
| E5 | Notices: "Progressive JPEG loads gradually in browsers. File size is similar to baseline." | Low |

---

## 10. Cross-cutting requirements (every phase)

| # | Requirement | A | B | C | D |
|---|-------------|---|---|---|---|
| 1 | `cargo test --workspace` passes | — | ✅ | ✅ | ✅ |
| 2 | `npm run build:wasm` succeeds | — | ✅ | ✅ | ✅ |
| 3 | `npx tsc --noEmit` 0 errors (non-test) | ✅ | ✅ | ✅ | ✅ |
| 4 | `npm test` 183 Vitest tests pass | ✅ | ✅ | ✅ | ✅ |
| 5 | `npm run build` succeeds | ✅ | ✅ | ✅ | ✅ |
| 6 | Backward compat: old Wasm exports unchanged | ✅ | ✅ | ✅ | ✅ |
| 7 | StripAll metadata policy | ✅ | ✅ | ✅ | ✅ |
| 8 | Risk mode respected | ✅ | ✅ | ✅ | ✅ |
| 9 | i18n EN+ES complete | ✅ | ✅ | ✅ | ✅ |
| 10 | Release checklist (vX.Y.Z.md, manifest, i18n, docs) | ✅ | ✅ | ✅ | ✅ |
| 11 | NFR-7: `transmutador_optimize` Wasm ≤ 1.5 MB | — | ✅ | ✅ | ✅ |

---

## 11. Recommended execution order

```
Phase A — v3.7.0 (MINOR, frontend-only)
  ├── Compress notices (generational loss, size expectations)
  ├── Default value alignment
  ├── Before/After byte comparison card
  └── i18n EN+ES

Phase B — v3.7.1 (MINOR, engine bump 1.7.0)
  ├── SPIKE: jpeg-encoder crate (size gate)
  ├── Replace image::JpegEncoder
  ├── Chroma subsampling control (4:4:4 / 4:2:2 / 4:2:0)
  └── Optimized Huffman tables

Phase C — v3.8.0 (MINOR, engine bump 1.8.0)
  ├── SPIKE: oxipng crate (size gate, no rayon)
  ├── Filter trial optimization
  ├── Color type reduction
  └── Bit depth reduction

Phase D — v3.8.x (MINOR, engine bump 1.8.x)
  ├── SPIKE: quantette crate (size gate, no rayon)
  ├── Palette quantization (RGBA→indexed)
  ├── Lossy mode UI + mandatory warning
  └── Dithering option

Phase E — v3.9.x (backlog)
  ├── SPIKE: zopfli crate
  ├── Archival PNG compression
  └── Progressive JPEG
```

---

## 12. Risk matrix

| # | Risk | Impact | Phase | Mitigation |
|---|------|--------|-------|------------|
| R1 | `jpeg-encoder` produces invalid JPEG for some inputs | Data loss | B | Spike gate validates output; keep fallback to `image::JpegEncoder` |
| R2 | `oxipng` cannot compile to wasm (rayon dependency) | Feature lost | C | Use `default-features = false` + `features = ["lib"]`; `rayon` is optional in oxipng |
| R3 | `oxipng` + `jpeg-encoder` combined exceed NFR-7 (3 MB) | Crash / slow load | B/C | Phased integration allows size monitoring; abort any phase exceeding gate |
| R4 | Users expect "Compress" = always smaller — but level 1 or RGB→RGBA can grow | Confusion / frustration | A | Honesty notice for level 1; color type reduction is transparent and never grows |
| R5 | Lossy PNG quantization confuses users expecting lossless | Trust damage | D | Lossy mode off by default; mandatory warning notice; separate UI section labeled "Lossy" |
| R6 | `quantette` license conflict (GPL?) | Legal | D | `quantette` is MIT/Apache-2.0 — no GPL risk. Verify before integration. |

---

## 13. Bundle size projections

| Phase | Crate(s) added | Wasm delta | JS delta |
|-------|----------------|------------|----------|
| A | None | 0 KB | ~5 KB (notices + i18n + before/after card) |
| B | `jpeg-encoder` | ~80 KB | ~5 KB (subsampling UI + i18n) |
| C | `oxipng` (no-rayon) | ~200 KB | ~3 KB (optimization level UI) |
| D | `quantette` (no-rayon) | ~100 KB | ~5 KB (lossy mode UI) |
| E | `zopfli` (backlog) | ~50 KB | ~2 KB |
| **Total** (A+B+C+D) | | **~380 KB** | **~18 KB** |

**Current `transmutador_optimize` Wasm size:** ~500 KB (pre-B). **Target after Phase D:** ~880 KB — well within NFR-7 limit (3 MB) and internal target (1 MB).

---

## 14. Open decisions

| # | Question | Proposal |
|---|----------|----------|
| **Q1** | One unified compress API or separate `_optimized` / `_lossy` exports? | **Separate exports** — different guarantees (lossless vs lossy). Prevents accidental lossy use. |
| **Q2** | Default chroma subsampling for JPEG: Auto or 4:2:0? | **Auto** — `jpeg-encoder` auto-detects, defaults to 4:2:0 for quality <90 (standard for photos) |
| **Q3** | Expose oxipng optimization level 0-6 or simplified 0-2? | **Simplified 0-2** (Off/Fast/Full) — matches Camaleon's progressive disclosure principle. Power users can switch to CLI. |
| **Q4** | Lossy PNG: keep as separate tool slug (`png-compress-lossy`) or integrated toggle? | **Integrated toggle** — one tool, two modes. Clear separation with warning notice. Avoids registry bloat. |
| **Q5** | Phase B (JPEG encoder) and Phase C (PNG oxipng) in same release or separate? | **Separate** — independent spike gates. One failure doesn't block the other. |

---

## 15. Competitor positioning — Camaleon's advantage

| Capability | TinyPNG | Squoosh | Camaleon (target) |
|------------|---------|---------|--------------------|
| Lossless PNG optimization | ❌ | ✅ (OptiPNG) | ✅ (oxipng — Phase C) |
| Lossy PNG quantization | ✅ | ✅ (pngquant) | ✅ (quantette — Phase D) |
| JPEG encoder quality | ⚠️ (proprietary) | ✅ (MozJPEG) | ✅ (jpeg-encoder — Phase B) |
| Chroma subsampling control | ❌ | ✅ | ✅ (Phase B) |
| Generational loss warning | ❌ | ❌ | ✅ (Phase A — unique!) |
| Before/after byte comparison | ✅ | ✅ (side-by-side) | ✅ (Phase A) |
| Estimate-first UX | ❌ | ❌ | ✅ (existing — unique!) |
| Privacy (zero upload) | ❌ (cloud) | ✅ (local) | ✅ (local) |
| Offline (PWA) | ❌ | ✅ | ✅ |
| Risk Mode | ❌ | ❌ | ✅ (unique) |
| Batch (Tier 4a.3) | ❌ | ❌ | 📋 Planned |
| Progressive JPEG | ❌ | ❌ | 📋 Phase E |
| Free / OSS | Free tier only | ✅ | ✅ (MIT) |

**Camaleon wins on:** privacy, honesty, estimate-first UX, Risk Mode, lossless PNG optimization (after Phase C), and offline availability — all in one consistent interface. TinyPNG has the brand but requires upload. Squoosh has the codec diversity but is a comparison tool, not a workflow tool.

---

## 16. References

| Doc | Role |
|-----|------|
| `motor_transmutacion/transmutador_optimize/src/lib.rs` | Current recompress implementation (lines 96-122, 170-180) |
| `frontend/src/lib/tools/tool-registry.ts:718-774` | png/jpg-compress tool definitions |
| `frontend/src/workers/transmutation.worker.ts:1002-1009,1228-1235` | Compress dispatch |
| `frontend/src/lib/notices/compute-fidelity-notices.ts` | Zero compress notices (gap) |
| `frontend/src/components/transmute/OptionsControls.tsx` | Generic slider rendering |
| `docs/planning/tier4_plan.md` | Parent Tier 4a plan |
| `docs/planning/resize_premium_roadmap.md` | Resize roadmap (sibling doc, v3.6.0) |
| `docs/planning/resize_advanced_processing_investigation.md` | Processing crate survey (shared context) |
| `docs/SPEC.md` §5.5.7 | Encoder-swap doctrine |
| `docs/SPEC.md` §5.10 | StripAll metadata policy |
| `docs/LIMIT_PIPELINE.md` | Limit pipeline |
| `docs/releases/v3.6.0.md` | Resize Premium release (prior art) |
| `jpeg-encoder` crate v0.7.0 | Rust JPEG encoder (crates.io) |
| `oxipng` crate v0.19.0 | Rust OptiPNG (crates.io) |
| `quantette` crate v0.6.0 | Rust quantization (crates.io) |
| `zopfli` crate v0.8.3 | Rust Zopfli DEFLATE (crates.io) |

---

*Compress Premium roadmap — Phase A through E deliver compress UX, JPEG encoder swap, PNG lossless optimization, lossy quantization, and archival compression. Phases are spike-gated with size checks. Phase A (v3.7.0) is frontend-only, zero Rust changes, immediate target.*
