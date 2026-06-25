# Tier 4 — Image Optimization & Editing

> **Branch:** `dev` (implementation) → merge to `main` at release tags  
> **Status:** **v3.9.0 on `dev`** — Compress Premium A–E **✅ complete** · Resize Premium ✅ (v3.6.0) · UX-4a ✅ (v3.3.3) · 4a-pre ✅ (v3.3.3) · **4a.1** metrics UX merged into delivered functionality · **4a.2 Matrix Expand 🔄 in progress (4a.2a ✅ v3.9.0, 4a.2b ⏳ planned v3.9.1)** · **4b** editing planned  
> **Prerequisite:** Tier 3 **complete** (v3.0.1) · Tier 3.5 Universal ✅ · Tier 3.6.0–3.6.2 ✅ · Settings S1–S7 core ✅  
> **Doctrine:** Same pipeline as convert tools — decode → honest options → re-encode → StripAll → **estimate-first** (metrics are the product on Ladder C)  
> **SPEC anchor:** §1.3 Ladders C & D · §5.1 mental model · §12.5 Tier 4a · §12.6 Tier 4b · NFR-7 bundle · NFR-8 honesty · **`docs/LIMIT_PIPELINE.md`**  
> **UI anchor:** `docs/planning/pre_tier3_ui_ux_plan.md` §4.2 (category lanes)  
> **Settings:** `docs/planning/settings_panel_plan.md` (S5 offline toolkit must include new Wasm crates)

---

## 0. Tier 4 umbrella (what this milestone is)

Tier 4 is Camaleon's **second major capability line** after the 21-tool convert matrix (Ladders A & B). It adds **same-format optimization** (Ladder C) and **geometric editing** (Ladder D) without opening the document/PDF lane (Tier 5).

| Sub-phase | ID | User job | Crate(s) | Version | Status |
|-----------|-----|----------|----------|---------|--------|
| **4a.0** | Activation | Make PNG/JPEG compress & resize **actually run** | `transmutador_optimize` | **v3.3.0** | ✅ **Shipped** |
| **Resize Premium** | Premium | 5 resampling filters, upscale 200%, JPEG quality, estimate parity | `transmutador_optimize` | **v3.6.0** | ✅ **Shipped** |
| **Compress A** | Honesty | Generational loss notices, color-type fix, defaults alignment | `transmutador_optimize` | **v3.7.0** | ✅ **Shipped** |
| **Compress B** | JPEG swap | `jpeg-encoder` crate, subsampling 4:2:0/4:2:2/4:4:4, optimized Huffman | `transmutador_optimize` + `jpeg-encoder` | **v3.7.1** | ✅ **Shipped** |
| **Compress C** | Lossless opt | Filter trial, color/bit reduction, deflate strategy tuning, alpha opt | `transmutador_optimize` + `miniz_oxide` | **v3.8.0** | ✅ **Shipped** |
| **Compress D** | Lossy quant | Palette quantization (Wu + FloydSteinberg), indexed PNG, 2-256 colors | `transmutador_optimize` + `quantette` + `png` | **v3.8.1** | ✅ **Shipped** |
| **Compress E** | Archival | Zopfli DEFLATE (opt_level=2), progressive JPEG | `transmutador_optimize` + `zopfli` | **v3.8.2** | ✅ **Shipped** |
| **UX-4a** | Discovery | ToolBrowser **Convert vs Optimize** lanes (`category`) | — (frontend) | **v3.3.3** | ✅ **Shipped** |
| **4a-pre** | Mobile UX | Top offline notices + sticky ToolBrowser coexistence | — (frontend) | **v3.3.3** | ✅ **Shipped** |
| **4a.2 Matrix Expand** | **Umbrella** | **WebP recompress + SVG minify + WebP resize (4 sub-phases)** | **Multiple crates** | **v3.9.x** | **🔄 In progress** |
| **4a.2a** | WebP compress | WebP VP8L lossless re-encode, predictor toggle, color type opt, animated reject | `transmutador_optimize` (extended) | **v3.9.0** | ✅ **Shipped** |
| **4a.2b** | SVG minify | Lightweight text-optimization (zero deps), passes 1-6+10, .svgz input | `transmutador_svg` (extended) | v3.9.1 | 📋 Planned |
| **4a.2c** | SVG aggressive | oxvg_optimiser spike (passes 7-9 + CSS minify), Wasm size gate | `transmutador_svg` (or new) | TBD | 📋 Backlog |
| **4a.2d** | WebP resize | WebP resize reusing optimize pipeline + VP8L re-encode | `transmutador_optimize` | TBD | 📋 Backlog |
| **4a.3** | Batch optimize | Same settings × N files for compress/resize | orchestration only | v3.4.x | 📋 Backlog |
| **4b.1** | Crop | User-defined region → encode | `transmutador_edit` (proposed) | v4.0.x | 📋 Planned |
| **4b.2** | Rotate / flip | 90°/180°/270° + H/V flip | `transmutador_edit` | v4.0.x | 📋 Planned |
| **4b.3** | Favicon pack | Multi-size ICO emit (16/32/48/256) | extend `transmutador_ico` | v4.0.x | 📋 Backlog |

**Normative:** Tier 4 does **not** add PDF, HEIC, or new **convert** directions. Optimization and editing are **orthogonal ladders**.

**End state (4a.2a shipped):** **26 active tools** with **Convert · Optimize** discovery surfaces; **13 Wasm crates** (~870 KB optimize + 1.63 MB svg + others).

---

## 1. v3.2.9 baseline (historical reference)

> The original baseline for Tier 4a.0 is documented in `docs/planning/tier4_plan.md` versions prior to v3.7.0. All phase 4a.0 gaps (G1–G5) have been resolved.

The `transmutador_optimize` crate was first scaffolded at v3.2.9 with 4 tool definitions and a basic Rust implementation, but **did not function** due to integration gaps (`warmup-wasm.ts` missing `transmutador_optimize` case). All gaps were resolved by v3.3.0 (4a.0 activation).

---

## 2. Tier 4a — optimization science (Ladder C)

### 2.1 What "optimize" means in Camaleon

**Optimize ≠ convert.** Input and output share the **same interchange format** (PNG→PNG, JPEG→JPEG). The user job is **byte size** and/or **dimensions**.

```
Input bytes → Decode to raster → Transform (re-encode and/or resample) → Output bytes
                     ↑
              Estimate runs full encode path (metrics-first)
```

| Tool class | Pixel fidelity | What changes | Current state |
|------------|---------------|--------------|---------------|
| **PNG compress** | `lossless` (default) | DEFLATE level + filter trial + color/bit reduction + deflate strategy tuning | ✅ 36 candidates (opt=1) |
| **PNG compress** | `lossy` (opt-in) | Palette quantization (2-256 colors) via Wu + FloydSteinberg | ✅ 60-80% smaller |
| **PNG compress** | `lossless` archival | Zopfli DEFLATE (3-8% more, extremely slow) | ✅ opt_level=2 |
| **JPEG compress** | `lossy` | Quality + optimized Huffman tables + subsampling | ✅ 5-15% smaller baseline |
| **JPEG compress** | `lossy` | Progressive scan | ✅ Toggle |
| **PNG resize** | `lossless` (dimensions) | 5 resampling filters, upscale to 200% (400% advanced) | ✅ v3.6.0 |
| **JPEG resize** | `lossy` | Filters + quality slider + downsample/upsample | ✅ v3.6.0 |

### 2.2 Compress pipeline (current)

```
Input (PNG/JPEG)
  → color_type_reduce(img)  — RGBA→RGB (all opaque), RGB→Luma (R=G=B)
  → optimize_alpha_pixels() — zero transparent RGB for better DEFLATE
  → if lossy mode: quantize_to_png() — Wu + FloydSteinberg → indexed PNG
  → if opt_level=0: standard encode (Adaptive filter)
  → if opt_level=1 (Full):
      6 PngEncoder encodes (Adaptive + 5 filter trial)
    + 15 custom encoder encodes (5 filters × 3 deflate strategies)
    + 15 bit depth encodes (L1/L2/L4 × 5 filters)
    = 36 candidates → pick smallest
  → if opt_level=2 (Archival):
      36 candidates + Zopfli DEFLATE pass
  → return smallest output
```

### 2.3 Resize pipeline (current)

```
Input (PNG/JPEG)
  → validate + decode
  → resize_by_percent (1-200%, up to 400% advanced)
  → 5 filters: Nearest, Triangle, CatmullRom (default), Gaussian, Lanczos3
  → re-encode at user quality/compression
  → output
```

---

## 3. Wasm API contract (`transmutador_optimize` — current)

**Wasm size:** 842 KB (well within NFR-7 3 MB limit)
**Engine:** v1.7.0
**Dependencies:** `image` 0.25, `jpeg-encoder` 0.7, `miniz_oxide` 0.8, `quantette` 0.6, `png` 0.18, `zopfli` 0.8

### Compress exports (PNG)

| Export | Parameters | Description |
|--------|-----------|-------------|
| `recompress_png` | `(bytes, compression)` | Standard re-encode (delegates to optimized w/ opt=0) |
| `recompress_png_optimized` | `(bytes, compression, opt_level)` | 36-candidate pipeline (opt=1) or Zopfli (opt=2) |
| `recompress_png_lossy` | `(bytes, colors: u16, dither)` | Wu quantization + indexed PNG (2-256 colors) |
| `estimate_png_recompress_size` | `(bytes, compression)` | Standard estimate |
| `estimate_png_recompress_optimized` | `(bytes, compression, opt_level)` | Optimized estimate |
| `estimate_png_recompress_lossy` | `(bytes, colors, dither)` | Lossy estimate |

### Compress exports (JPEG)

| Export | Parameters | Description |
|--------|-----------|-------------|
| `recompress_jpeg` | `(bytes, quality)` | Standard (delegates to options w/ 4:2:0) |
| `recompress_jpeg_with_options` | `(bytes, quality, chroma_code)` | Subsampling control (0=4:2:0, 1=4:2:2, 2=4:4:4) |
| `recompress_jpeg_progressive` | `(bytes, quality, chroma_code)` | Progressive scan |

### Resize exports

| Export | Parameters | Description |
|--------|-----------|-------------|
| `resize_png/jpeg` | `(bytes, percent)` | CatmullRom default |
| `resize_*_with_filter` | `(bytes, percent, filter_code)` | 0-4 filter selection |
| `resize_jpeg_with_filter_and_quality` | `(bytes, percent, filter_code, quality)` | Full control |

### Session controles

| Export | Description |
|--------|-------------|
| `set_session_input_limit`, `reset_session_input_limit` | Byte ceiling control |
| `set_risk_mode` | Bypass 40 MP / 150 MB limits |

---

## 4. Phase 4a.0 — Activation ✅ (v3.3.0)

**Goal:** Four optimize tools transmute end-to-end.

- Resolved G1 (warmup-wasm) ✅
- Resolved G2 (wasm-modules.d.ts) ✅
- All 4 tools functional and active since v3.3.0

---

## 5. Resize Premium ✅ (v3.6.0)

**Shipped:** 5 resampling filters, upscale to 200% (400% advanced), JPEG quality control, target dimensions display, estimate parity, advanced scaling toggle, filter-specific notices.

**Detail:** `docs/planning/resize_premium_roadmap.md`

---

## 6. Compress Premium — complete pipeline A–E ✅

| Phase | Versión | Key Deliverable | Wasm delta |
|-------|---------|----------------|------------|
| **A** | v3.7.0 | Honesty notices, color-type fix (RGB→RGBA), worker defaults alignment | 0 KB |
| **B** | v3.7.1 | JPEG encoder swap (`image::JpegEncoder` → `jpeg-encoder`), subsampling (4:4:4/4:2:2/4:2:0) | +18 KB |
| **C** | v3.8.0 | Native PNG lossless optimization: filter trial, color/bit reduction, deflate strategy, alpha opt | +1 KB |
| **D** | v3.8.1 | Lossy PNG quantization: Wu + FloydSteinberg, indexed PNG, 2-256 colors | +52 KB |
| **E** | v3.8.2 | Zopfli archival (opt_level=2), progressive JPEG toggle | +102 KB |

**Current Wasm:** 842 KB. **Engine:** v1.7.0. **Tool descriptions:** updated for both png-compress and jpg-compress.

**Detail:** `docs/planning/compress_premium_roadmap.md`

---

## 7. Phase UX-4a — ToolBrowser Convert vs Optimize lanes ✅ (v3.3.3)

| Deliverable | Detail | Status |
|-------------|--------|--------|
| **Landing tabs** | Transmutar (convert) · Optimizar · Editar (edit tab hidden until 4b) | ✅ v3.3.3 |
| **`ToolDefinition.category`** | Filter `image` vs `optimize` vs `edit` | ✅ |
| **Command palette** | Category chips at top | ✅ v3.3.3 |
| **Universal entry** | Stays convert-first | ✅ unchanged |
| **i18n** | EN/ES tab labels | ✅ |

---

## 8. Phase 4a.2 — Expand optimize matrix (umbrella)

Phase 4a.2 "Matrix Expand" was split into 4 sub-phases due to scope. Only **4a.2a (WebP compress)** is shipped; 4a.2b–d remain in progress or backlog.

### 8.1 4a.2a — WebP compress ✅ (v3.9.0)

**Shipped.** Extended `transmutador_optimize` with `image` `webp` feature + `image-webp` 0.2 (pure Rust VP8L). New exports: `recompress_webp`, `recompress_webp_with_options`, `estimate_webp_recompress_*`. `core_utils` gained `WebpFormat` enum + `probe_webp_format()`. Animated WebP rejected. Lossy sources accepted with entropy expansion warning. +27.8 KB Wasm (869 KB total). Engine v1.8.0.

**Detail:** `docs/planning/tier4a_2_matrix_expand_investigation.md`, `docs/planning/tier4a_2_matrix_expand_roadmap.md`

### 8.2 4a.2b — SVG minify (v3.9.1, planned)

| Candidate | Spike question | Priority |
|-----------|----------------|----------|
| **SVG minify** | Lightweight custom minifier (Option B, zero deps) — passes 1-6+10 | High (next) |
| **4a.2c SVG aggressive** | oxvg_optimiser spike (Wasm size + lightningcss MPL-2.0 pre-approved) | Low (future) |
| **4a.2d WebP resize** | Reuse optimize resize pipeline + VP8L re-encode | Low (future) |
| **AVIF recompress** | Encode cost in Wasm (AVIF already slow) | Low |
| **Batch compress** (4a.3) | Add optimize slugs to `batch-tool-allowlist.ts` | Medium |

---

## 9. Tier 4b — Image editing (Ladder D) — future

| Phase | Version | Deliverable |
|-------|---------|-------------|
| **4b.0** | — | Spike: `transmutador_edit` skeleton |
| **4b.1** | v4.0.0 | Crop PNG/JPEG + canvas UX |
| **4b.2** | v4.0.x | Flip + rotate JPEG |
| **4b.3** | v4.0.x | Favicon multi-size pack |

**Investigations in stand-by:** `docs/planning/resize_advanced_processing_investigation.md`, `resize_advanced_ux_investigation.md` (prep for image editor workspace).

---

## 10. QA gate (current)

1. `cargo test -p transmutador_optimize` — **14 tests** must pass
2. `cd frontend && npm run build:wasm && npx tsc --noEmit && npm test && npm run build`
3. Manual smoke: drop → options → estimate → transmute → download
4. Estimate tracks slider changes within one session
5. i18n EN + ES complete for tool + errors
6. Wasm module ≤ **3 MB** (current: 842 KB)
7. StripAll on output (no EXIF growth)
8. NFR-8: no false "lossless" on JPEG paths

---

## 11. Risk matrix (current)

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Zopfli too slow for large images** | 60+ second encode | opt_level=2 is opt-in; notice warns "minutes for large images" |
| **Lossy mode confuses users** | Trust damage | Default **Off**; mandatory `warn` notice when enabled |
| **Wasm growth from 5 phases** | NFR-7 violation | Each phase size-gated. 842 KB total — 28% of 3 MB budget |
| **Batch optimize RAM (4a.3)** | Tab OOM | Cap batch size; reuse 3.6.3 aggregate warnings |
| **Edit canvas + Wasm duplication** | Bugs at crop edges | Wasm is source of truth; canvas is view only |

---

## 12. Recommended execution order (current vs plan)

```
─────── Past (delivered) ───────
v3.3.0  4a.0 Activation
v3.3.3  UX-4a lanes + 4a-pre mobile notices
v3.3.4  Settings+toast · storage seed · lane SSR
v3.4.0  Legal pages refresh
v3.5.0  Offline reliability
v3.5.1  Batch drop & download UX
v3.6.0  Resize Premium (5 filters, upscale, quality)
v3.7.0  Compress A — honesty notices, color-type fix
v3.7.1  Compress B — JPEG encoder swap, subsampling
v3.8.0  Compress C — native lossless optimization
v3.8.1  Compress D — lossy quantization
v3.8.2  Compress E — Zopfli archival, progressive JPEG
─── 4a.2 Matrix Expand (umbrella) ───
v3.9.0  4a.2a WebP compress — VP8L lossless re-encode ✅
─────── next ─────────────────────
4a.2b   SVG minify (v3.9.1)
4a.3    Batch optimize allowlist
─────── future ───────────────────
4a.2c   SVG aggressive (oxvg spike)
4a.2d   WebP resize
4b.0    Image editor spike
4b.1    Crop
4b.2    Rotate / flip
4b.3    Favicon pack
```

---

## 13. Related documents

| Doc | Role |
|-----|------|
| `docs/SPEC.md` §1.3, §12.5–§12.6 | Normative ladders C & D |
| `docs/ROADMAP.md` | Milestone tracking |
| `docs/planning/compress_premium_roadmap.md` | Compress A–E implementation plan |
| `docs/planning/resize_premium_roadmap.md` | Resize Premium implementation plan (v3.6.0) |
| `docs/planning/resize_advanced_processing_investigation.md` | Advanced resize processing (stand-by for Tier 4b) |
| `docs/planning/resize_advanced_ux_investigation.md` | Image editor UX (stand-by for Tier 4b) |
| `docs/planning/compress_before_vs_after.md` | Compress evolution A–E evaluation |
| `docs/planning/tier3_plan.md` | Prior tier pattern reference |
| `docs/planning/tier3_6_multi_file_plan.md` | Batch orchestration reuse |
| `docs/planning/pre_tier3_ui_ux_plan.md` §4.2 | UX-4a category lanes |
| `docs/planning/settings_panel_plan.md` | S5 offline toolkit |
| `motor_transmutacion/transmutador_optimize/src/lib.rs` | Current Rust implementation (full pipeline) |

---

*Planning doc for Tier 4 — Image Optimization & Editing. **v3.3.0** activated Ladder C (4a.0). **v3.6.0** delivered Resize Premium. **v3.7.0–v3.8.2** delivered Compress Premium A–E. Next: **4a.3** batch, **4b** image editor.*
