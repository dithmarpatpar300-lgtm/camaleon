# Compress Premium — Before vs After

> **Date:** 2026-06-23 · **Scope:** Complete evolution from v3.7.0 (Phase A) through v3.8.2 (Phase E)

---

## Feature comparison

| Capability | Before (v3.6.x) | After (v3.8.2) |
|---|---|---|
| **PNG compression** | DEFLATE level 1-9 slider only | DEFLATE + filter trial (5 filters) + color type reduction + bit depth reduction (L1/L2/L4) + alpha optimization + deflate strategy tuning (3 strategies) + Zopfli archival |
| **JPEG compression** | `image::JpegEncoder` baseline (standard Huffman, 4:2:0 only) | `jpeg-encoder` crate (optimized Huffman, 5-15% smaller) + chroma subsampling control (4:2:0/4:2:2/4:4:4) + progressive scan |
| **PNG lossy** | Not available | Palette quantization (Wu + FloydSteinberg), 2-256 colors, 60-80% reduction, mandatory warning |
| **Optimization candidates** | 1 encode path (Adaptive filter) | 36 candidates (level 1) + Zopfli (level 2) — 5 filters × 3 strategies × bit depths |
| **Honesty notices** | 0 compress-specific notices | 9: generational loss, fast/slow compression, size increase, subsampling 4:4:4, optimization, lossy warning, Zopfli archival |
| **Wasm binary** | ~654 KB | ~842 KB (+188 KB for jpeg-encoder + miniz_oxide + quantette + png + zopfli) |
| **Engine version** | 1.6.0 | 1.7.0 |
| **Rust tests** | 2 | 14 (+12 integration tests) |
| **Tool descriptions** | Basic one-liner | Rich multi-sentence descriptions reflecting all capabilities |

---

## Pipeline evolution

### Before: 1 encode path
```
Input → decode → re-encode at DEFLATE level/JPEG quality → output
```

### After: Multi-candidate optimization pipeline
```
Input → color_type_reduce → optimize_alpha_pixels
      → 6 PngEncoder trials (Adaptive + 5 filters)
      → 15 custom encoder trials (5 filters × 3 deflate strategies)
      → 15 bit depth trials (L1/L2/L4 × 5 filters)
      → Zopfli archival (opt_level=2)
      → Output = min(all candidates)
```

### Phase summary

| Phase | Version | Key deliverable | Wasm cost |
|-------|---------|-----------------|-----------|
| A | v3.7.0 | Honesty notices, color type fix, defaults | 0 KB |
| B | v3.7.1 | JPEG encoder swap + subsampling | +18 KB |
| C | v3.8.0 | Native PNG lossless optimization | +1 KB |
| D | v3.8.1 | Lossy PNG quantization | +52 KB |
| E | v3.8.2 | Zopfli archival + progressive JPEG | +102 KB |

---

## Suggestions for optimization & scalability

### Short-term (v3.9.x)

1. **Parallel Zopfli for multi-core** — Wasm threads (SharedArrayBuffer) could accelerate Zopfli 4-8× on desktop. Gate: browser support for COOP/COEP headers.

2. **Cache optimization results** — The 36-candidate pipeline re-encodes on every slider change. Cache intermediate rasters and filter results to avoid redundant work on parameter changes.

3. **Progressive encode for large images** — Currently sequential. For images >20 MP, show intermediate results or stream partial encodes.

### Medium-term (v4.x)

4. **WebP/AVIF compress** — Extend optimize tools to WebP and AVIF. Same pipeline but different codecs. AVIF encode is already available via `transmutador_avif_encode`.

5. **AI-driven quality detection** — Use SSIM/SSIMULACRA2 to automatically suggest optimal JPEG quality or PNG palette size based on perceptual thresholds.

6. **Batch compress** — Tier 4a.3 — same settings × N files. Reuse Tier 3.6 orchestration.

### Long-term (v4.x+)

7. **Hardware-accelerated DEFLATE** — WebAssembly SIMD (already enabled via RUSTFLAGS) could accelerate DEFLATE and Zopfli by 2-4×.

8. **Multi-worker pipeline** — Split optimization candidates across multiple Web Workers for parallel trial evaluation. Gate: coordination complexity, Wasm module sharing.

9. **Custom DEFLATE encoding** — Replace `miniz_oxide` with a hand-tuned PNG-specific DEFLATE encoder that exploits PNG's filter structure for better compression.

---

*Comparison document showing the evolution of Camaleon's Compress tool from a simple re-encode slider to a multi-strategy optimization pipeline with lossless and lossy paths.*
