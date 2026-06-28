# Category 3 — Composition Paper

> **Project:** Picture-VP8
> **Purpose:** Synthesize the findings from Category 1 (Scientific Study) and Category 2 (Algorithmic Understanding) into a quantified analysis. This paper establishes the complexity baseline, risk profile, reusability assessment, and competitive benchmark against Google's `libwebp` — using real sample images as validation targets.
> **Prerequisite:** Categories 1 and 2.
> **Convention:** All file sizes are in bytes. All compression ratios are expressed as `output / input × 100` (lower is better). "Savings" = `1 - output / input` (higher is better).

---

## Table of contents

1. [Sample corpus analysis](#1-sample-corpus-analysis)
2. [Google libwebp benchmark (convertio.co)](#2-google-libwebp-benchmark-convertioco)
3. [Complexity quantification](#3-complexity-quantification)
4. [Component reuse assessment](#4-component-reuse-assessment)
5. [Risk analysis](#5-risk-analysis)
6. [Quality target definition](#6-quality-target-definition)
7. [Camaleon StripAll advantage](#7-camaleon-stripall-advantage)
8. [Wasm binary size projection](#8-wasm-binary-size-projection)
9. [Performance projection](#9-performance-projection)
10. [Reusability for the Rust ecosystem](#10-reusability-for-the-rust-ecosystem)
11. [Go/no-go recommendation](#11-gono-go-recommendation)

---

## 1. Sample corpus analysis

### 1.1 Original images

Four JPEG photographs stored at `docs/planning/_private/sample_original/`:

| Sample | Filename | Resolution | Size (bytes) | Megapixels | Bytes/pixel |
|--------|----------|-----------|-------------|------------|-------------|
| 007 | `20250827_164417_007.jpg` | 4000×3000 | 7,402,052 | 12.00 MP | 0.617 |
| 008 | `20250827_164417_008.jpg` | 4000×3000 | 7,399,936 | 12.00 MP | 0.617 |
| 009 | `20250827_164417_009.jpg` | 4000×3000 | 7,401,646 | 12.00 MP | 0.617 |
| 011 | `20250827_164417_011.jpg` | 4000×3000 | 7,398,070 | 12.00 MP | 0.616 |
| **Average** | | **4000×3000** | **7,400,426** | **12.00 MP** | **0.617** |

### 1.2 Corpus characteristics

| Property | Value |
|----------|-------|
| Format | JPEG (baseline, 3-channel YCbCr) |
| Resolution | 4000×3000 (uniform across corpus) |
| Megapixels | 12.00 MP |
| Bit depth | 8-bit per channel |
| Color space | sRGB (embedded ICC profile in source JPEGs) |
| Compression ratio | ~0.617 bytes/pixel (moderate JPEG quality) |
| Content type | Real photographs (camera output, EXIF present) |

### 1.3 Why this corpus

| Selection criterion | Justification |
|---------------------|---------------|
| **Uniform resolution** | All 4000×3000 — eliminates resolution as a variable |
| **Real photographs** | Tests the hardest case for lossy compression (high entropy, natural textures) |
| **12 MP size** | Large enough to stress memory management and macroblock edge cases; within Camaleon's 40 MP limit |
| **EXIF present** | Allows testing StripAll metadata policy vs. Google's metadata-preserving output |
| **4 samples** | Enough for statistical significance of compression ratios; different scenes at same resolution |

---

## 2. Google libwebp benchmark (convertio.co)

### 2.1 Output analysis

The four originals were converted to WebP lossy via convertio.co (which uses Google's `libwebp` with default quality settings). Outputs stored at `docs/planning/_private/sample_output_google/`:

| Sample | JPG size | WebP size | VP8 payload | ICCP | EXIF | Ratio | Savings |
|--------|----------|-----------|-------------|------|------|-------|---------|
| 007 | 7,402,052 | 6,326,740 | 6,277,530 | 632 | 48,524 | 85.5% | 14.5% |
| 008 | 7,399,936 | 6,316,196 | 6,266,990 | 632 | 48,520 | 85.4% | 14.6% |
| 009 | 7,401,646 | 6,319,984 | 6,270,810 | 632 | 48,487 | 85.4% | 14.6% |
| 011 | 7,398,070 | 6,215,788 | 6,166,564 | 632 | 48,537 | 84.0% | 16.0% |
| **Average** | **7,400,426** | **6,294,677** | **6,245,474** | **632** | **48,517** | **85.1%** | **14.9%** |

### 2.2 RIFF structure of Google outputs

All four outputs use the **VP8X extended profile**:

```
RIFF <size> WEBP
  VP8X  10 bytes   flags=0x28 (ICC + EXIF, no alpha/anim/XMP)
  ICCP  632 bytes  sRGB ICC profile
  VP8   ~6.25 MB   lossy bitstream (3000×4000, keyframe)
  EXIF  ~48.5 KB   camera metadata (GPS, timestamps, orientation, etc.)
```

### 2.3 Key observations

1. **Google preserves metadata.** Each output contains ~49 KB of ICCP + EXIF chunks. Camaleon's StripAll policy would strip these, saving ~49 KB per file.

2. **VP8 payload is the dominant cost.** The actual VP8 bitstream averages 6,245,474 bytes (99.2% of file). Metadata is only 0.8%.

3. **Savings are modest at default quality.** 14.9% average savings (JPG→WebP lossy) at convertio.co's default quality setting. This is below the 25-35% typically cited for WebP — likely because the source JPEGs are already moderately compressed (~0.617 bytes/pixel), leaving less room for improvement.

4. **Sample 011 is the outlier.** 16.0% savings vs. 14.5% for others — likely a less detailed scene that VP8 handles more efficiently.

5. **Dimensions preserved.** All outputs are 3000×4000 (portrait orientation, matching the original JPEGs).

---

## 3. Complexity quantification

### 3.1 Line count by component

From the Category 2 analysis, the core encoder requires:

| Component | Core lines | Test lines | Glue lines | Total |
|-----------|-----------|------------|------------|-------|
| 1. RGB→YUV + 4:2:0 | 60 | 30 | 10 | 100 |
| 2. Macroblock partitioning | 40 | 20 | 5 | 65 |
| 3. Intra prediction (4 MB modes) | 120 | 60 | 10 | 190 |
| 4. Intra prediction (10 sub-block modes) | 300 | 150 | 20 | 470 |
| 5. Forward DCT 4×4 | 80 | 80 | 10 | 170 |
| 6. WHT 4×4 | 40 | 40 | 5 | 85 |
| 7. Quantization | 80 | 40 | 10 | 130 |
| 8. Zig-zag scan | 20 | 10 | 0 | 30 |
| 9. Boolean arithmetic encoder | 200 | 100 | 20 | 320 |
| 10. Probability model (tables) | 300 | 0 | 10 | 310 |
| 11. Bitstream writer | 400 | 200 | 30 | 630 |
| 12. Deblocking filter | 50 | 30 | 50 (glue to existing) | 130 |
| 13. Rate control + mode decision | 150 | 80 | 20 | 250 |
| 14. RIFF container | 40 | 20 | 10 | 70 |
| **Subtotal (core)** | **1,880** | **860** | **210** | **2,950** |
| 15. Error handling + validation | 100 | 50 | — | 150 |
| 16. wasm-bindgen exports | 80 | 0 | 80 | 160 |
| 17. Camaleon integration (tool registry, worker route, i18n) | 200 | 0 | 200 | 400 |
| 18. Test corpus harness + PSNR/SSIM | 300 | 300 | — | 600 |
| **Total** | **2,560** | **1,210** | **490** | **4,260** |

### 3.2 Complexity by difficulty rating

| Difficulty | Components | Total lines | % of effort |
|------------|-----------|------------|-------------|
| ⭐ (trivial) | Partition, zig-zag, RIFF | 100 | 5% |
| ⭐⭐ (moderate) | YUV, quantization, WHT, prediction (4 modes), probability tables, deblocking | 970 | 25% |
| ⭐⭐⭐ (hard) | FDCT, prediction (10 modes), rate control | 530 | 14% |
| ⭐⭐⭐⭐ (very hard) | BAC encoder, bitstream writer | 600 | 16% |
| ⭐⭐⭐⭐⭐ (extreme) | Mode decision (RD-cost optimization) | included in rate control | — |
| Tests + glue + integration | | 2,060 | 40% |

### 3.3 Comparison to existing Camaleon crates

| Crate | Lines | Complexity |
|-------|-------|------------|
| `transmutador_jpg` (JPEG→PNG) | ~350 | Simple (decode + re-encode) |
| `transmutador_png` (PNG→JPEG) | ~400 | Simple (decode + flatten + encode) |
| `transmutador_optimize` | ~900 | Moderate (compress + resize + PNG optimization) |
| **Picture-VP8** (projected) | **~4,260** | **High (full codec implementation)** |

Picture-VP8 would be approximately **4.7× larger** than the most complex existing Camaleon crate.

---

## 4. Component reuse assessment

### 4.1 What can be reused from `image-webp` v0.2.4

| File | Lines | Reuse? | How |
|------|-------|--------|-----|
| `loop_filter.rs` | 369 | ✅ Yes | Deblocking filter is bidirectional — same math for encode and decode |
| `yuv.rs` | 402 | ✅ Partial | YUV→RGB conversion reusable for reconstruction; RGB→YUV (forward) needs writing (~60 lines) |
| `vp8.rs` | 2,897 | ⚠️ Reference only | Prediction mode logic and data structures are useful as reference; cannot import directly (decoder-specific) |
| `vp8_arithmetic_decoder.rs` | 541 | ⚠️ Reference only | Architecture mirrors the encoder; useful for validating encoder output |
| `transform.rs` | 67 | ❌ No | Only IDCT (inverse); encoder needs FDCT (forward) — different math |
| `encoder.rs` | 855 | ✅ Partial | `write_chunk()` and RIFF container logic reusable (~40 lines) |
| `extended.rs` | ~200 | ✅ Partial | VP8X chunk structure reference for alpha support (Phase 2) |
| `huffman.rs`, `lossless.rs` | ~700 | ❌ No | VP8L-specific, not used in VP8 lossy |

### 4.2 Net reuse

| Category | Lines | % of core |
|----------|-------|-----------|
| Directly reusable | ~450 | 24% of core 1,880 |
| Reference material | ~3,500 | Not counted (read-only, not imported) |
| Must build from scratch | ~1,430 | 76% of core 1,880 |

### 4.3 External dependencies

| Dependency | Required? | Wasm compatible? |
|------------|-----------|-----------------|
| `wasm-bindgen` | Yes | ✅ |
| `core_utils` (Camaleon) | Yes | ✅ |
| `image` crate | No — Picture-VP8 operates on raw RGB bytes | N/A |
| `image-webp` | No — Picture-VP8 is standalone | N/A |

**Zero external codec dependencies.** Picture-VP8 is a self-contained crate with only `wasm-bindgen` and `core_utils`.

---

## 5. Risk analysis

### 5.1 Technical risks

| # | Risk | Probability | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | BAC encoder produces non-conformant bitstream | Medium | Critical — decoders reject the file | Test against `image-webp` decoder + Chrome + Firefox + Safari; compare bit-by-bit with `libwebp` output |
| R2 | Rate controller produces worse quality/size than `libwebp` | High | Moderate — functional but suboptimal | Start with DC_PRED-only (MVP), iterate mode decision. Accept 5-10% worse than `libwebp` as Phase 1 target |
| R3 | Edge macroblock artifacts (non-multiples of 16) | Medium | Visible — artifacts at right/bottom edges | Pad image to macroblock boundary; clip during prediction; test with 4001×3001 images |
| R4 | Arithmetic coder carry propagation bug | Low | Critical — corrupt bitstream | Extensive unit tests on carry edge cases; verify output length matches expected |
| R5 | Probability table transcription error | Low | High — decoder produces garbage | Copy tables from RFC 6386 verbatim; validate via decode round-trip |
| R6 | Wasm binary size exceeds NFR-7 (3 MB) | Very Low | Low — NFR gate | VP8 encoder is ~50-100 KB Wasm; total crate well under 3 MB |
| R7 | Performance too slow for interactive use | Medium | Moderate — UI feels sluggish | SIMD128 for DCT; process in Web Worker (already architected); 12 MP image should encode in <3 seconds |
| R8 | Color space conversion drift (YUV rounding) | Low | Mild — slight color shift vs. original | Use integer arithmetic exactly as specified; validate via PSNR >40 dB at quality 100 |

### 5.2 Project risks

| # | Risk | Probability | Impact | Mitigation |
|---|------|------------|--------|------------|
| P1 | Development takes longer than estimated | High | Moderate | Phase-based delivery; MVP (DC_PRED only) in 4-5 weeks; full encoder in 12-15 |
| P2 | Quality tuning takes unbounded time | Medium | Moderate | Define quality target (§6); stop when target is met |
| P3 | `image-webp` upstream rejects PR | Medium | Low — Camaleon uses fork | Keep fork maintained; publish as `picture-vp8` crate if needed |
| P4 | RFC 6386 spec ambiguity leads to implementation errors | Medium | High | Cross-reference `libwebp` C source for ambiguous cases |

### 5.3 Risk mitigation priority

```
Critical path: R1 (BAC conformity) → R4 (carry bug) → R5 (table error)
                                    ↓
Quality path:   R2 (rate control) → R3 (edge artifacts) → R8 (color drift)
                                    ↓
Performance:    R7 (speed) → P1 (timeline)
```

**Highest risk:** R1 — a non-conformant bitstream means the encoder is useless. This must be validated first, before any quality optimization.

---

## 6. Quality target definition

### 6.1 Benchmark: Google `libwebp` at default quality

From §2, the Google benchmark produces:
- Average savings: 14.9% (JPG→WebP)
- VP8 payload average: 6,245,474 bytes
- Quality: convertio.co default (estimated quality 75, the `libwebp` default)

### 6.2 Picture-VP8 quality targets

| Phase | Target | Quality metric | Size metric |
|-------|--------|---------------|-------------|
| **MVP** (Phase 1) | Functional + valid bitstream | PSNR > 35 dB vs. original | Within 20% of `libwebp` size |
| **Phase 2** | Competitive with `libwebp` default | PSNR > 38 dB vs. original | Within 10% of `libwebp` size |
| **Phase 3** | Match or beat `libwebp` | PSNR > 40 dB vs. original | ≤ `libwebp` size at equivalent quality |
| **Phase 4** | Quality-tunable | PSNR tracks quality parameter linearly | 25-35% savings vs. JPEG at quality 75 |

### 6.3 Validation methodology

```
For each sample image (007, 008, 009, 011):
  1. Decode original JPEG to raw RGB
  2. Encode RGB → WebP lossy via Picture-VP8 at quality Q
  3. Encode RGB → WebP lossy via libwebp at quality Q
  4. Decode both WebP outputs back to RGB
  5. Compute PSNR(original, picture_vp8) and PSNR(original, libwebp)
  6. Compare file sizes
  7. Compute SSIM(original, picture_vp8) for perceptual quality
```

**PSNR formula:**

```
MSE = (1 / (W × H × 3)) × Σ (original[i] - decoded[i])²
PSNR = 10 × log₁₀(255² / MSE)
```

**SSIM** (Structural Similarity Index) — computed per 8×8 window, averaged across image.

**Acceptance gate:** PSNR ≥ 38 dB at quality 75 (Phase 2 exit criterion).

### 6.4 Quality parameter mapping

```
quality (user-facing 0-100) → q_index (0-127) → quantizer tables

Target mapping (matching libwebp behavior):
  quality 100 → q_index 0   (near-lossless)
  quality  75 → q_index ~20 (good quality, libwebp default)
  quality  50 → q_index ~42 (moderate)
  quality  25 → q_index ~72 (aggressive)
  quality   0 → q_index 127 (maximum loss)
```

---

## 7. Camaleon StripAll advantage

### 7.1 Metadata in Google outputs vs. Camaleon outputs

| Chunk | Google (convertio.co) | Camaleon (Picture-VP8) | Savings |
|-------|----------------------|----------------------|---------|
| ICCP (ICC profile) | 632 bytes | ❌ Stripped | 632 bytes |
| EXIF (camera metadata) | ~48,517 bytes avg | ❌ Stripped | ~48,517 bytes |
| XMP | 0 bytes (not present) | ❌ Stripped | 0 bytes |
| **Total metadata** | **~49,149 bytes** | **0 bytes** | **~49 KB/file** |

### 7.2 Adjusted compression comparison

When comparing Camaleon's StripAll output against Google's metadata-preserving output:

| Sample | Google WebP (with metadata) | Camaleon WebP (StripAll, projected) | Camaleon savings vs. Google |
|--------|---------------------------|-------------------------------------|---------------------------|
| 007 | 6,326,740 | ~6,277,530 (VP8 payload only) | 49,210 bytes (0.78%) |
| 008 | 6,316,196 | ~6,266,990 | 49,206 bytes (0.78%) |
| 009 | 6,319,984 | ~6,270,810 | 49,174 bytes (0.78%) |
| 011 | 6,215,788 | ~6,166,564 | 49,224 bytes (0.79%) |

**StripAll advantage:** ~49 KB per file — small in percentage terms (0.78%) but consistent and privacy-preserving. At scale (batch processing 100 images), this saves ~4.9 MB of metadata that would otherwise leak EXIF/GPS data.

### 7.3 Privacy-first compression

Camaleon's value proposition for WebP lossy is not just size reduction — it's **size reduction + privacy**:

| Feature | Google (convertio.co) | Camaleon (Picture-VP8) |
|---------|----------------------|----------------------|
| Compression | VP8 lossy (libwebp) | VP8 lossy (Picture-VP8) |
| EXIF preserved | ✅ (GPS, camera, timestamps) | ❌ StripAll (SPEC §5.10) |
| ICC preserved | ✅ | ❌ StripAll |
| Upload required | ✅ (server-side conversion) | ❌ 100% browser-local |
| Privacy | ❌ File leaves device | ✅ Zero bytes uploaded |

---

## 8. Wasm binary size projection

### 8.1 Component size estimates

| Component | Estimated Wasm size | Justification |
|-----------|--------------------|---------------| 
| Probability tables (constants) | ~8 KB | 4,112 probability values × 1 byte each |
| DCT + WHT transforms | ~3 KB | Integer arithmetic, ~120 lines |
| Quantization tables | ~1 KB | 2 × 128 entries × 1 byte |
| BAC encoder | ~5 KB | State machine + carry propagation |
| Bitstream writer | ~8 KB | Frame header + partition writers |
| Prediction modes | ~6 KB | 14 modes × pixel-level formulas |
| Mode decision | ~3 KB | SAD + RD-cost |
| Deblocking filter | ~4 KB | Reused from loop_filter.rs |
| YUV conversion | ~1 KB | Integer arithmetic |
| RIFF container | ~0.5 KB | Trivial chunk writer |
| wasm-bindgen glue | ~2 KB | Export wrappers |
| **Total** | **~41.5 KB** | |

### 8.2 Comparison to existing crates

| Crate | Wasm size |
|-------|----------|
| `transmutador_jpg` | 1,385 KB |
| `transmutador_png` | 1,371 KB |
| `transmutador_avif` | 1,991 KB |
| `transmutador_avif_encode` | 1,751 KB |
| `transmutador_svg` | 1,712 KB |
| `transmutador_optimize` | 912 KB |
| **Picture-VP8** (projected) | **~42 KB** (+ `core_utils` overhead ~50 KB) |

**Picture-VP8 would be the smallest Wasm crate in Camaleon** — the codec logic is compact because VP8 intra-frame is mathematically simpler than AVIF (AV1) or even JPEG (which includes a full Huffman codec in the `image` crate).

### 8.3 NFR-7 compliance

NFR-7 limit: 3 MB per crate. Picture-VP8 at ~42 KB + `core_utils` overhead is **0.03 MB** — 98.6% under the limit. No concern.

---

## 9. Performance projection

### 9.1 Operation count for a 12 MP image (4000×3000)

| Operation | Count | Per-pixel ops | Total ops |
|-----------|-------|--------------|-----------|
| RGB→YUV conversion | 12,000,000 pixels | 9 (3 multiply + 3 add + 3 shift) | 108 M |
| 4:2:0 subsampling | 3,000,000 chroma blocks | 4 (avg 4 pixels) | 12 M |
| Intra prediction (16×16 MB) | 187,500 MBs | ~256 (4 modes × 16×16 pixels) | 48 M |
| Forward DCT (4×4 blocks) | 750,000 blocks (16 Y + 4 U + 4 V per MB) | ~128 (2-pass × 4×4) | 96 M |
| WHT (luma DC) | 46,875 blocks | ~64 | 3 M |
| Quantization | 750,000 blocks × 16 coeffs | 1 (divide) | 12 M |
| BAC encoding | ~10 M boolean decisions | ~5 (compare + update + shift) | 50 M |
| Deblocking filter | 187,500 MBs × 4 edges | ~64 (4-tap filter) | 48 M |
| **Total** | | | **~377 M ops** |

### 9.2 Wasm performance estimate

| Metric | Value | Justification |
|--------|-------|---------------|
| Wasm throughput | ~500 M ops/sec | SIMD128 + bulk-memory, typical for compute-heavy Wasm |
| Estimated encode time (12 MP) | ~0.75 seconds | 377 M / 500 M |
| With overhead (memory alloc, prediction, I/O) | ~1.5–3 seconds | 2-4× overhead factor |
| Web Worker overhead | +100 ms | Worker initialization + postMessage |

**Target: 12 MP image encodes in <3 seconds on a modern device.**

### 9.3 Comparison to libwebp

| Encoder | 12 MP encode time | Environment |
|---------|-------------------|-------------|
| `libwebp` (cwebp, native) | ~0.5–1.0 seconds | C, optimized, x86_64 |
| `libwebp` (Wasm via Emscripten) | ~1.5–2.5 seconds | Wasm, SIMD128 |
| **Picture-VP8** (projected) | **~1.5–3.0 seconds** | Wasm, SIMD128, pure Rust |

Picture-VP8 will be 1.5-3× slower than native `libwebp` due to:
- Wasm overhead vs. native code (~1.5×)
- Less optimized mode decision (no trellis quantization, no RD-optimized mode search)
- Pure Rust vs. hand-tuned C SIMD intrinsics

This is **acceptable for an interactive web tool** — the encode happens in a Web Worker and the UI shows a progress indicator.

---

## 10. Reusability for the Rust ecosystem

### 10.1 Upstream contribution to `image-webp`

| What | How | Impact |
|------|-----|--------|
| VP8 lossy encoder module | PR to `image-webp` adding `vp8_encoder.rs` | Completes the crate: decode + lossless encode + **lossy encode** |
| Forward DCT + WHT | New `forward_transform.rs` module | Fills the transform gap (only IDCT exists today) |
| Boolean arithmetic encoder | New `bac_encoder.rs` module | First public Rust BAC encoder for VP8 |
| Probability tables | New `probability_tables.rs` module | RFC 6386 §19 constants in Rust |

### 10.2 Standalone crate potential

If `image-webp` upstream does not accept the PR, Picture-VP8 can be published as a standalone crate:

```
crate name: picture-vp8
description: Pure Rust VP8 intra-frame lossy encoder for WebP
features:
  - encode(input: &[u8], width, height, quality) -> Vec<u8>
  - No C dependencies
  - wasm32-unknown-unknown compatible
  - MIT licensed
```

### 10.3 Ecosystem benefit map

| Consumer | Benefit |
|----------|---------|
| **`image` crate** | WebP lossy encode without C dependency (if `image-webp` accepts PR) |
| **Cloudflare Workers** | WebP lossy generation at the edge (no `cc` toolchain) |
| **Deno / Bun** | Server-side WebP generation in JS + Wasm |
| **`rav1e` community** | Reference for pure-Rust codec architecture patterns |
| **Academic research** | Readable, commented VP8 intra-frame implementation |
| **Embedded Rust** | WebP encoding on `no_std` targets (microcontrollers with camera modules) |

---

## 11. Go/no-go recommendation

### 11.1 Decision matrix

| Factor | Assessment | Score (1-5) |
|--------|-----------|-------------|
| **Technical feasibility** | Proven by `rav1e` precedent; VP8 intra is simpler than AV1 | 4 |
| **Architectural compatibility** | Pure Rust, single `wasm-pack build`, no C deps — perfect fit | 5 |
| **Wasm binary size** | ~42 KB — smallest crate in Camaleon | 5 |
| **Performance** | 1.5-3 sec for 12 MP — acceptable for interactive tool | 4 |
| **Quality risk** | Rate control tuning needed; MVP achievable in 4-5 weeks | 3 |
| **Conformity risk** | BAC + bitstream writer must be bit-exact; testable via round-trip | 3 |
| **Community value** | First pure-Rust VP8 lossy encoder — high ecosystem impact | 5 |
| **Development effort** | ~4,260 lines, 12-15 weeks full-time | 2 |
| **Maintenance burden** | Codec code requires long-term maintenance | 2 |
| **ROI for Camaleon** | Adds WebP lossy encode; currently blocked entirely | 4 |

**Weighted score: 3.7 / 5.0** → **GO** with phased delivery.

### 11.2 Conditions for go

1. **Phase 1 MVP must validate BAC conformity** before investing in quality tuning
2. **Quality target defined** — PSNR ≥ 35 dB at Phase 1, ≥ 38 dB at Phase 2
3. **Timeline accepted** — 12-15 weeks is a significant investment; no other major features should compete during this period
4. **Test corpus established** — 4 sample images (007, 008, 009, 011) serve as regression baseline
5. **StripAll policy enforced** — Picture-VP8 never emits EXIF/ICCP/XMP chunks

### 11.3 Phased delivery summary

| Phase | Duration | Deliverable | Exit criterion |
|-------|----------|-------------|----------------|
| **Phase 0** | 1-2 weeks | Spike: BAC encoder + FDCT + probability tables | Round-trip encode→decode of a 16×16 block |
| **Phase 1** | 3-4 weeks | MVP: DC_PRED only, quality 75 fixed, no rate control | Valid WebP file decodable by Chrome + image-webp decoder |
| **Phase 2** | 4-5 weeks | Full encoder: 14 prediction modes + mode decision | PSNR ≥ 38 dB on sample corpus, within 10% of libwebp size |
| **Phase 3** | 2-3 weeks | Quality parameter + rate control | Quality 0-100 produces linear PSNR range |
| **Phase 4** | 2-3 weeks | Camaleon integration + i18n + UI + tests | `transmutador_webp_encode` crate, `webp-lossy` tool, worker route |
| **Phase 5** | 1-2 weeks | Upstream PR to `image-webp` + documentation | PR submitted or standalone crate published |
| **Total** | **13-19 weeks** | | |

### 11.4 Alternatives if Picture-VP8 is delayed or quality is insufficient

| Fallback | When to invoke | Impact |
|----------|---------------|--------|
| Ship VP8L lossless only (current state) | If Phase 0 spike fails | No change — WebP lossy remains unsupported |
| Accept 10-20% worse quality than libwebp | If Phase 2 rate control tuning exceeds budget | Functional but not competitive; honest notice in UI |
| Emscripten hybrid (Approach 2 from investigation) | If pure-Rust quality is unacceptable | Architectural change; dual build pipeline; last resort |

---

## Summary

The sample corpus (4 × 12 MP JPEG photographs at 4000×3000) shows that Google's `libwebp` via convertio.co achieves 14.9% average size reduction while preserving ~49 KB of metadata per file. Camaleon's StripAll policy would eliminate this metadata, adding a privacy advantage on top of compression.

Picture-VP8 requires approximately 4,260 lines of pure Rust (1,880 core + 1,210 tests + 490 glue + 780 integration). The encoder would be ~42 KB in Wasm — the smallest crate in Camaleon — and encode a 12 MP image in 1.5-3 seconds via Web Worker. The primary risks are BAC bitstream conformity (R1) and rate control quality (R2), both mitigated by phased delivery with a quality-target exit gate.

The project is viable, architecturally compatible, and would produce the first pure-Rust VP8 lossy encoder — a significant contribution to the Rust/Wasm ecosystem.

---

*Category 3 complete. Next: [Category 4 — Implementation ROADMAP](04_roadmap.md)*

*Last updated: 2026-06-28 · Picture-VP8 · Camaleon v3.9.3 · Sample corpus: 4 × 12 MP JPEG (4000×3000)*
