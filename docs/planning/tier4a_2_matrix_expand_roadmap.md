# Tier 4a.2 Matrix Expand Roadmap — Camaleon

> **Status: v3.9.1 SHIPPED 2026-06-24 ✅ (4a.2a WebP + Smart Notice)** · 4a.2b pending · **Author:** OpenCode
> **Scope:** WebP recompress (v3.9.0) + Smart Notice Recommendations (v3.9.1) + SVG minify (future) — extend Ladder C optimization to WebP and SVG formats, plus cross-cutting UX improvements
> **Parent doc:** `docs/planning/tier4_plan.md` §8 · **Investigation:** `docs/planning/tier4a_2_matrix_expand_investigation.md`
> **SPEC anchor:** §12.5 Tier 4a · §1.3 Ladder C · §5.12 WebP science · §5.10 StripAll
> **Crate targets:** `transmutador_optimize` (WebP) · `transmutador_svg` (SVG minify)
> **Decisions:** All 10 resolved — see investigation §8 (Product Owner sign-off 2026-06-24)

---

## 0. North Star

Extend Camaleon's optimization ladder (Ladder C) beyond PNG/JPEG to cover **WebP recompress** and **SVG minify** — two new tools that follow the same estimate-first, honesty-notice, privacy-first doctrine established by Compress Premium A–E and Resize Premium.

**Deliverables:**
- **v3.9.0** — `webp-compress` tool: lossless VP8L re-encode with honest lossy-source warnings **✅ SHIPPED**
- **v3.9.1** — Smart Notice Recommendations: actionable inline pills, 5-rule engine, cross-tool dedup **✅ SHIPPED**
- **Future** — `v3.9.2+` SVG minify · `4a.2c` oxvg_optimiser spike · `4a.2d` WebP resize

---

## 1. Versioning

| Phase | App version | Engine version | Type bump | Rationale |
|-------|-------------|----------------|-----------|-----------|
| **4a.2a** WebP compress | **v3.9.0 ✅** | **v1.8.0** | MINOR | New tool + new `image` feature (`webp`) + new `image-webp` direct dep |
| **Smart Notice** | **v3.9.1 ✅** | v1.8.0 | PATCH | Cross-cutting UX — 8 files, 0 Rust/Wasm, 0 new deps |
| **4a.2b** SVG minify | v3.9.2+ | v1.8.0 | PATCH | New tool, no new deps, no engine change |
| **4a.2c** oxvg spike (future) | TBD | TBD | TBD | Gated on Wasm size + API stability |
| **4a.2d** WebP resize (future) | TBD | TBD | PATCH | Reuses 4a.2a pipeline |

---

## 2. Phase 4a.2a — WebP recompress (v3.9.0)

**Goal:** Add `webp-compress` tool — decode any WebP → re-encode as lossless VP8L with color type optimization and predictor transform toggle. Honest warnings for lossy sources (entropy expansion).

### 2.1 Spike gate — `image` `webp` feature + `image-webp` direct dep

| # | Task | Gate | Result |
|---|------|------|--------|
| S1 | Add `"webp"` to `transmutador_optimize/Cargo.toml` `image` features; add `image-webp = "0.2"` direct dep | Dep added | ✅ PASS |
| S2 | `cargo check -p transmutador_optimize --target wasm32-unknown-unknown` | Compiles | ✅ PASS — no C deps |
| S3 | `cd frontend && npm run build:wasm` | Builds | ✅ PASS — 13/13 crates |
| S4 | Measure `transmutador_optimize` Wasm size delta | **Gate: < +200 KB** | ✅ **+27.8 KB** (actual: 842→869 KB) |
| S5 | Manual: decode + re-encode a lossless WebP → valid WebP output (RIFF magic) | Works | ✅ PASS |

**Gate decision:** All gates passed. Abort conditions not triggered.

**Actual Wasm delta:** +27.8 KB (far below the +50-150 KB estimate). `image-webp` was already compiled transitively; enabling it directly only linked minimal glue code.

### 2.2 Implementation tasks

#### 2.2.1 Rust — `core_utils` (WebP format probe)

| # | Task | File | Actual Lines |
|---|------|------|-------------|
| A1 | Add `WebpFormat` enum: `Lossy`, `Lossless`, `Extended` | `motor_transmutacion/core_utils/src/lib.rs` | ~15 |
| A2 | Implement `probe_webp_format(bytes: &[u8]) -> Result<WebpFormat, String>` — RIFF header check + chunk type scan. **Extra:** VP8X extended containers are recursively scanned for inner VP8/VP8L chunks instead of returning "Extended" directly (fix: most camera photos converted externally are VP8X with VP8 inside; without recursion, the lossy-source notice was not firing). | `motor_transmutacion/core_utils/src/lib.rs` | ~80 |
| A3 | Unit tests: 10 tests covering lossy, lossless, VP8X→lossy resolution, VP8X→lossless resolution, VP8X no-payload fallback, empty input, too-short, non-RIFF, non-WEBP brand, unknown chunk type | `motor_transmutacion/core_utils/src/lib.rs` | ~90 |

#### 2.2.2 Rust — `transmutador_optimize` (WebP recompress exports + EXIF orientation)

| # | Task | File | Actual Lines |
|---|------|------|-------------|
| B1 | Add `recompress_webp(input_bytes: &[u8]) -> Result<Vec<u8>, String>` — standard VP8L re-encode with defaults (predictor on, opt_level=0) | `motor_transmutacion/transmutador_optimize/src/lib.rs` | ~5 |
| B2 | Add `recompress_webp_with_options(input_bytes: &[u8], use_predictor: bool, opt_level: u8) -> Result<Vec<u8>, String>` — signature expanded from investigation plan (added opt_level param). VP8L re-encode with predictor toggle + optimization level (0=standard, 1=color type reduce + both predictors tried, picks smallest). | `motor_transmutacion/transmutador_optimize/src/lib.rs` | ~55 |
| B3 | Add `estimate_webp_recompress_size(input_bytes: &[u8]) -> Result<u32, String>` — full encode for estimate | `motor_transmutacion/transmutador_optimize/src/lib.rs` | ~5 |
| B4 | Add `estimate_webp_recompress_with_options(input_bytes: &[u8], use_predictor: bool, opt_level: u8) -> Result<u32, String>` | `motor_transmutacion/transmutador_optimize/src/lib.rs` | ~15 |
| B5 | Implement `recompress_webp_inner(input, use_predictor, opt_level) -> Result<Vec<u8>, String>`: validate_input → ensure_webp → animated detection (hard reject) → decode_image (risk mode aware, **with EXIF orientation applied**) → color_type_reduce (when opt_level>=1) → `image_webp::WebPEncoder` with `EncoderParams` → try both predictors when opt_level>=1 → validate_output (OutputFormat::WebP) | `motor_transmutacion/transmutador_optimize/src/lib.rs` | ~60 |
| B6 | Animated WebP detection: `WebPDecoder::has_animation()` before decode; if true → "Animated WebP not supported for recompress" | `motor_transmutacion/transmutador_optimize/src/lib.rs` | ~8 |
| B7 | Integration tests: 9 tests — lossless→lossless roundtrip, optimized smaller or equal, RGBA alpha preserved, empty input, corrupt input, RIFF-not-WebP, static not animated (no false positive), predictor toggle produces valid output, opaque RGBA→RGB reduction | `motor_transmutacion/transmutador_optimize/src/lib.rs` | ~120 |
| B8 | **EXTRA: EXIF orientation in decode_image** — Added `JpegDecoder::orientation()` read + `DynamicImage::apply_orientation()` to the shared `decode_image` function (pre-existing, affects jpg-compress and jpg-resize too). Phone camera photos (Samsung S25 Ultra, iPhone) stored in landscape with EXIF Orientation tag; StripAll removed the tag, output appeared rotated. **Fix applied at the decode layer for ALL JPEG inputs** regardless of tool. | `motor_transmutacion/transmutador_optimize/src/lib.rs` | ~20 |

#### 2.2.3 Frontend — Types & registry

| # | Task | File | Lines |
|---|------|------|-------|
| C1 | Add `"svg"` to `OutputExtension` type (for svg-minify, prepare for 4a.2b) | `frontend/src/workers/types.ts:18` | +1 |
| C2 | Add `usePredictor?: number` to `TransmutationOptions` | `frontend/src/workers/types.ts:25` | +2 |
| C3 | Add `"usePredictor"` to `SliderOptionSpec.key` union | `frontend/src/lib/tools/types.ts:33` | +1 (add to union) |
| C4 | Add `webp-compress` tool definition to TOOLS array: `fromFormat: "WEBP"`, `toFormat: "WEBP"`, `module: "transmutador_optimize"`, `category: "optimize"`, `toolGroup: "webp"`, `fidelity: "lossless"`, `acceptExtensions: [".webp"]`, `outputExtension: "webp"`, optionSpecs: optimizationLevel (0-1) + usePredictor (0-1) | `frontend/src/lib/tools/tool-registry.ts` (after jpg-resize, ~line 914) | ~40 |

#### 2.2.4 Frontend — Worker dispatch

| # | Task | File | Lines |
|---|------|------|-------|
| D1 | Add `isOptimizeWebp: boolean` to `RouteFlags` interface | `frontend/src/workers/transmutation.worker.ts:774` | +1 |
| D2 | Add route detection: `const isOptimizeWebp = isOptimize && req.outputExtension === "webp"` | `frontend/src/workers/transmutation.worker.ts:818` | +1 |
| D3 | Add `isOptimizeWebp` to returned `RouteFlags` object | `frontend/src/workers/transmutation.worker.ts:841` | +1 |
| D4 | Add Wasm bindings: `recompressWebp`, `recompressWebpWithOptions`, `estimateWebpRecompressSize`, `estimateWebpRecompressWithOptions` — declare + lazy-assign in `ensureOptimizeWasmInitialized()` | `frontend/src/workers/transmutation.worker.ts:622` | ~20 |
| D5 | Add transmute dispatch for `isOptimizeWebp`: route to `recompressWebp` or `recompressWebpWithOptions` based on `options.usePredictor` and `options.optimizationLevel` | `frontend/src/workers/transmutation.worker.ts:1008` | ~15 |
| D6 | Add estimate dispatch for `isOptimizeWebp` (mirror of D5 with estimate functions) | `frontend/src/workers/transmutation.worker.ts:1250` | ~15 |
| D7 | Add mime/extension for WebP optimize output: `image/webp`, `.webp` | `frontend/src/workers/transmutation.worker.ts:1372` | ~5 |

#### 2.2.5 Frontend — Wasm type declarations

| # | Task | File | Lines |
|---|------|------|-------|
| E1 | Add `transmutador_optimize` export declarations for: `recompress_webp`, `recompress_webp_with_options`, `estimate_webp_recompress_size`, `estimate_webp_recompress_with_options` | `frontend/src/types/wasm-modules.d.ts` | ~10 |

#### 2.2.6 Frontend — Notices

| # | Task | File | Actual Lines |
|---|------|------|-------------|
| F1 | Extend `FidelityNoticeContext` with `webpSourceFormat?: "lossy" \| "lossless" \| "extended"` field | `frontend/src/lib/notices/compute-fidelity-notices.ts` | +3 |
| F2 | Add notice: `webpCompress.lossySource` — amber warning. Fires when `webpSourceFormat === "lossy"` **or `"extended"`** (extended fallback for unresolvable VP8X). Text: "Lossy WebP detected. Re-encoding as lossless VP8L will increase file size (entropy expansion — same as JPEG→PNG). Consider WebP → JPG for genuine size reduction instead." | `frontend/src/lib/notices/compute-fidelity-notices.ts` | ~15 |
| F3 | Add notice: `webpCompress.losslessSource` — info when source is lossless VP8L. Text: "Lossless WebP re-encoded with VP8L optimization. If the file was already encoded by Camaleon or another VP8L encoder, it may not shrink further — lossless compression has a ceiling." | `frontend/src/lib/notices/compute-fidelity-notices.ts` | ~15 |
| F4 | Add notice: `webpCompress.metadataStripped` — info: "Metadata (EXIF, XMP, ICC) stripped per privacy policy." Always shown for webp-compress. | `frontend/src/lib/notices/compute-fidelity-notices.ts` | ~10 |
| F5 | Add notice: `compressLarger` — extended to include `webp-compress` (same existing `warn` notice for all compress tools). | `frontend/src/lib/notices/compute-fidelity-notices.ts` | ~5 |
| F6 | **EXTRA: Add `webpCompressLosslessLimit`** — new conditional info notice. Fires when lossless WebP source yields ±2% delta (output same size as input). Text: "Lossless WebP already at compression limit. VP8L cannot reduce entropy further — pixels are stored exactly. For smaller files on photos, use WebP → JPG (lossy)." | `frontend/src/lib/notices/compute-fidelity-notices.ts` | ~10 |
| F7 | Wire `webpSourceFormat` into notice computation: passed from `noticeContext.webpSourceFormat` through `StagedNoticeContext` to `FidelityNoticeContext` | `frontend/src/lib/notices/compute-staged-notices.ts` | +1 |
| F8 | Add `webp-compress` to `tool-notice-profiles.ts` with cost profile (moderate estimate + transmute) | `frontend/src/lib/notices/tool-notice-profiles.ts` | ~5 |

#### 2.2.7 Frontend — Prepare pipeline + client-side WebP probe

| # | Task | File | Actual Lines |
|---|------|------|-------------|
| G1 | Create `frontend/src/lib/format/probe-webp-format.ts` — client-side WebP RIFF probe with VP8X recursion (NOT a Wasm call). Returns `WebpSourceFormat \| null`. Used by StagedWorkspace to populate `noticeContext.webpSourceFormat`. | **`frontend/src/lib/format/probe-webp-format.ts` (NEW)** | ~30 |
| G2 | Wire `probeWebpFormat()` in `StagedWorkspace.tsx` `useMemo` for `noticeContext`. The `fileBytes` prop (already available) is probed client-side without any Wasm call. | `frontend/src/components/transmute/StagedWorkspace.tsx` | ~5 |

#### 2.2.8 Frontend — i18n

| # | Task | File | Lines |
|---|------|------|-------|
| H1 | Add i18n keys for `webp-compress` tool: `actionTitle`, `description`, `fidelityHint`, option labels (optimizationLevel, usePredictor), presets | `frontend/src/lib/i18n/dictionaries/en.ts` | ~20 |
| H2 | Add same keys in Spanish | `frontend/src/lib/i18n/dictionaries/es.ts` | ~20 |
| H3 | Add notice i18n keys: `webpCompress.lossySource`, `webpCompress.losslessSource`, `webpCompress.metadataStripped`, `webpCompress.sizeIncrease` | `frontend/src/lib/i18n/dictionaries/en.ts` | ~15 |
| H4 | Add same notice keys in Spanish | `frontend/src/lib/i18n/dictionaries/es.ts` | ~15 |

#### 2.2.9 Frontend — OptionsControls (UI)

| # | Task | File | Actual Lines |
|---|------|------|-------------|
| I1 | Add `usePredictor` value label mapping: 0→"Off", 1→"On" to OptionsControls ternary chain. **EXTRA:** Added `progressive` value label (0→"Off", 1→"On") — pre-existing oversight where jpg-compress progressive slider showed "0"/"1" instead of text labels. | `frontend/src/components/transmute/OptionsControls.tsx` | ~6 |

#### 2.2.10 Build & verification

| # | Task | Command |
|---|------|---------|
| V1 | Rust tests | `cd motor_transmutacion && cargo test -p transmutador_optimize 2>&1 \| Select-String "test result:\|FAILED\|error\["` |
| V2 | core_utils tests | `cd motor_transmutacion && cargo test -p core_utils 2>&1 \| Select-String "test result:\|FAILED"` |
| V3 | Wasm build | `cd frontend && npm run build:wasm 2>&1 \| Select-String "Done\|Error\|error"` |
| V4 | TypeScript check | `cd frontend && npx tsc --noEmit 2>&1 \| Select-String -NotMatch "\.test\.ts"` |
| V5 | Vitest | `cd frontend && npm test` |
| V6 | Next.js build | `cd frontend && npm run build 2>&1 \| Select-Object -Last 5` |
| V7 | Manual smoke: drop lossless WebP → estimate shows reduction → transmute → valid WebP download | Browser |
| V8 | Manual smoke: drop lossy WebP → amber warning appears → estimate shows increase → transmute → valid WebP | Browser |
| V9 | Manual smoke: drop animated WebP → error "Animated WebP not supported" | Browser |
| V10 | Wasm size gate: `transmutador_optimize` ≤ 1.1 MB (current 842 KB + 200 KB gate) | `Get-Item frontend/public/wasm/transmutador_optimize/*.wasm \| Select Length` |

### 2.3 Verification gate — 4a.2a (✅ All passed — shipped 2026-06-24)

- [x] `cargo test -p transmutador_optimize` — **23 tests** (14 existing + 9 new WebP recompress: recompress_webp_roundtrip, optimized_smaller_or_equal, rgba_preserved, empty_input, corrupt_input, riff_but_not_webp, static_not_animated, predictor_toggle, optimized_opaque_rgba_to_rgb)
- [x] `cargo test -p core_utils` — **70 tests** (60 existing + 10 new: probe_webp_lossy, probe_webp_lossless, probe_webp_extended_resolves_to_lossy, probe_webp_extended_resolves_to_lossless, probe_webp_extended_no_payload, probe_webp_empty_input, probe_webp_too_short, probe_webp_not_riff, probe_webp_not_webp_brand, probe_webp_unknown_chunk)
- [x] `npm run build:wasm` — **869 KB** (+**27.8 KB**, gate < +200 KB)
- [x] `npx tsc --noEmit` — 0 errors (non-test)
- [x] `npm test` — **183 Vitest tests** pass (tool-lanes test updated: 4→5 optimize tools)
- [x] `npm run build` — succeeds
- [x] Manual: lossless WebP → smaller or equal output (VP8L re-encode at or below source size)
- [x] Manual: lossy WebP → amber warning (`webpLossySource` fires) + larger output (entropy expansion)
- [x] Manual: animated WebP → rejected with error
- [x] Manual: StripAll — no EXIF/XMP propagation from source (VP8L format cannot carry metadata)
- [x] i18n EN + ES complete for tool keys, option labels, notice keys
- [x] Risk mode ON → WebP compress works within raised limits
- [x] **EXIF orientation fix** — `image::JpegDecoder::orientation()` read + `apply_orientation()` applied across 3 crates (transmutador_encode, transmutador_optimize, transmutador_jpg). Phone camera photos (S25 Ultra) no longer display rotated.
- [x] **VP8X probe fix** — `probe_webp_format` now recursively scans VP8X containers for VP8/VP8L inner chunks instead of returning "extended". Lossy-source notice now fires correctly for VP8X files.
- [x] **UI/UX clarity improvements** — webpCompressLosslessLimit notice fires when lossless WebP shows ±2% delta; fidelity hints updated for all 3 WebP tools with explicit size inflation warnings.

---

## 3. Phase 4a.2b — SVG minify (v3.9.1)

**Goal:** Add `svg-minify` tool — text-level SVG optimization (no rasterization). Parse XML → optimize tree → serialize XML. Zero new dependencies. Accepts `.svg` and `.svgz` input, outputs uncompressed `.svg`.

### 3.1 Implementation tasks

#### 3.1.1 Rust — `transmutador_svg` (SVG minify engine)

| # | Task | File | Lines |
|---|------|------|-------|
| J1 | Create `minify` submodule: `motor_transmutacion/transmutador_svg/src/minify.rs` — SVG minification engine | `transmutador_svg/src/minify.rs` | ~300 |
| J2 | Implement **Pass 1** — `strip_comments(svg: &str) -> String`: remove `<!-- ... -->` (non-greedy, handle CDATA edge case) | `minify.rs` | ~15 |
| J3 | Implement **Pass 2** — `strip_metadata(svg: &str) -> String`: remove `<metadata>...</metadata>`, editor XML namespaces (`xmlns:inkscape`, `xmlns:sodipodi`, `xmlns:x="..."`, `xmlns:Illustrator`), `<!-- Generator: ... -->` | `minify.rs` | ~40 |
| J4 | Implement **Pass 3** — `collapse_whitespace(svg: &str) -> String`: remove indentation, newlines between tags, collapse multiple spaces to single space (preserve whitespace inside `<text>`, `<tspan>` content) | `minify.rs` | ~50 |
| J5 | Implement **Pass 4** — `strip_xml_decl(svg: &str) -> String`: remove `<?xml version="1.0" ... ?>` | `minify.rs` | ~10 |
| J6 | Implement **Pass 5** — `remove_default_attrs(svg: &str) -> String`: remove attributes matching SVG defaults (`stroke="none"`, `fill="black"`, `visibility="visible"`, `overflow="hidden"` on `<svg>`, `clip="auto"`, `enable-background="accumulate"`). Needs attribute default table. | `minify.rs` | ~60 |
| J7 | Implement **Pass 6** — `remove_empty_elements(svg: &str) -> String`: remove `<g></g>`, `<defs></defs>` (empty), `<symbol></symbol>` (empty), unused `<path d=""/>` | `minify.rs` | ~40 |
| J8 | Implement **Pass 10** — `strip_doctype(svg: &str) -> String`: remove `<!DOCTYPE svg ...>` | `minify.rs` | ~10 |
| J9 | Implement `minify_svg_inner(input: &[u8], options: &MinifyOptions) -> Result<Vec<u8>, String>`: validate_svg_input → parse as UTF-8 (handle .svgz gzip via usvg::Tree::from_data or manual gzip) → run enabled passes in order → round-trip validate (re-parse output) → return UTF-8 bytes | `minify.rs` | ~40 |
| J10 | Define `MinifyOptions` struct: `strip_comments: bool`, `strip_metadata: bool`, `collapse_whitespace: bool`, `strip_xml_decl: bool`, `remove_defaults: bool`, `remove_empty: bool`, `shorten_numbers: bool` (Phase 2 — stub as no-op for 4a.2b), `compact_paths: bool` (Phase 2 — stub as no-op for 4a.2b), `remove_unused_ids: bool` (Phase 2 — stub as no-op for 4a.2b) | `minify.rs` | ~15 |
| J11 | Implement `MinifyOptions::standard()` preset: passes 1-6 + 10 enabled, passes 7-9 disabled | `minify.rs` | ~15 |
| J12 | Implement `MinifyOptions::conservative()` preset: passes 1-2 + 4 + 10 only (comments, metadata, XML decl, DOCTYPE) | `minify.rs` | ~15 |
| J13 | Implement `MinifyOptions::aggressive()` preset: all passes enabled (including 7-9 stubs for 4a.2b) | `minify.rs` | ~15 |
| J14 | Add `mod minify;` to `transmutador_svg/src/lib.rs` | `transmutador_svg/src/lib.rs` | +1 |

#### 3.1.2 Rust — `transmutador_svg` (Wasm exports)

| # | Task | File | Lines |
|---|------|------|-------|
| K1 | Add `minify_svg(input_bytes: &[u8]) -> Result<Vec<u8>, String>` — standard preset (Balanced) | `transmutador_svg/src/lib.rs` | ~5 |
| K2 | Add `minify_svg_with_options(input_bytes: &[u8], strip_comments: bool, strip_metadata: bool, collapse_whitespace: bool, strip_xml_decl: bool, remove_defaults: bool, remove_empty: bool, shorten_numbers: bool, compact_paths: bool, remove_unused_ids: bool) -> Result<Vec<u8>, String>` — full control | `transmutador_svg/src/lib.rs` | ~10 |
| K3 | Add `estimate_svg_minify_size(input_bytes: &[u8]) -> Result<u32, String>` — runs minify and returns output length (trivial — text processing is instant) | `transmutador_svg/src/lib.rs` | ~5 |
| K4 | Add `inspect_svg_for_minify(input_bytes: &[u8]) -> Result<SvgMinifyMetaJs, String>` — returns: `has_embedded_rasters`, `has_external_refs`, `has_text`, `has_animation`, `is_svgz`. Reuses existing `inspect_svg_meta` + adds minify-specific fields. | `transmutador_svg/src/lib.rs` | ~25 |
| K5 | Integration tests: simple_icon (metadata + whitespace stripped), gradient_logo (gradients preserved), text_latin (text content whitespace preserved), embedded_png (raster data preserved), external_href (rejected), corrupt_xml (error), gzip_svgz (accepted, output uncompressed), round-trip validation (output re-parses successfully) | `transmutador_svg/src/minify.rs` | ~120 |

#### 3.1.3 Frontend — Types & registry

| # | Task | File | Lines |
|---|------|------|-------|
| L1 | Add `"svg"` to `OutputExtension` type (already done in 4a.2a C1) | `frontend/src/workers/types.ts:18` | 0 |
| L2 | Add `svgMinifyLevel?: number` and `svgMinifyStripComments?: number`, `svgMinifyStripMetadata?: number`, `svgMinifyCollapseWhitespace?: number`, `svgMinifyCompactPaths?: number` to `TransmutationOptions` | `frontend/src/workers/types.ts:25` | +10 |
| L3 | Add `"svgMinifyLevel"`, `"svgMinifyStripComments"`, `"svgMinifyStripMetadata"`, `"svgMinifyCollapseWhitespace"`, `"svgMinifyCompactPaths"` to `SliderOptionSpec.key` union | `frontend/src/lib/tools/types.ts:33` | +5 |
| L4 | Add `svg-minify` tool definition: `fromFormat: "SVG"`, `toFormat: "SVG"`, `module: "transmutador_svg"`, `category: "optimize"`, `toolGroup: "svg"`, `fidelity: "lossless"`, `acceptExtensions: [".svg", ".svgz"]`, `outputExtension: "svg"`, optionSpecs: svgMinifyLevel (0-2) + advanced toggles | `frontend/src/lib/tools/tool-registry.ts` (after webp-compress) | ~50 |

#### 3.1.4 Frontend — Worker dispatch

| # | Task | File | Lines |
|---|------|------|-------|
| M1 | Add `isSvgMinify: boolean` to `RouteFlags` interface | `frontend/src/workers/transmutation.worker.ts:774` | +1 |
| M2 | Add route detection: `const isSvgMinify = req.module === "transmutador_svg" && req.outputExtension === "svg" && req.options?.svgMinifyLevel != null` | `frontend/src/workers/transmutation.worker.ts:815` | +1 |
| M3 | Add `isSvgMinify` to returned `RouteFlags` object | `frontend/src/workers/transmutation.worker.ts:841` | +1 |
| M4 | Add Wasm bindings for SVG minify exports: `minifySvg`, `minifySvgWithOptions`, `estimateSvgMinifySize` — declare + lazy-assign in `ensureSvgWasmInitialized()` (or existing SVG init function) | `frontend/src/workers/transmutation.worker.ts` | ~20 |
| M5 | Add transmute dispatch for `isSvgMinify`: route to `minifySvg` or `minifySvgWithOptions` based on `options.svgMinifyLevel` and advanced toggles | `frontend/src/workers/transmutation.worker.ts:1008` | ~20 |
| M6 | Add estimate dispatch for `isSvgMinify` | `frontend/src/workers/transmutation.worker.ts:1250` | ~15 |
| M7 | Add mime/extension for SVG minify output: `image/svg+xml`, `.svg` | `frontend/src/workers/transmutation.worker.ts:1372` | ~5 |

#### 3.1.5 Frontend — Wasm type declarations

| # | Task | File | Lines |
|---|------|------|-------|
| N1 | Add `transmutador_svg` export declarations for: `minify_svg`, `minify_svg_with_options`, `estimate_svg_minify_size`, `inspect_svg_for_minify` | `frontend/src/types/wasm-modules.d.ts` | ~15 |

#### 3.1.6 Frontend — Notices

| # | Task | File | Lines |
|---|------|------|-------|
| O1 | Add notice: `svgMinify.vectorOptimized` — "SVG minify optimizes the vector source. No pixels are generated. The file remains scalable to any resolution." Severity: `info`. Always shown. | `frontend/src/lib/notices/compute-fidelity-notices.ts` | ~10 |
| O2 | Add notice: `svgMinify.metadataStripped` — "Metadata and editor namespaces removed (privacy)." Severity: `info`. Shown when `svgMinifyStripMetadata` is on. | `frontend/src/lib/notices/compute-fidelity-notices.ts` | ~10 |
| O3 | Add notice: `svgMinify.editabilityWarning` — "Aggressive optimization (compact paths) makes the SVG harder to edit manually." Severity: `warn`. Shown when `svgMinifyLevel === 2` or `svgMinifyCompactPaths === 1`. | `frontend/src/lib/notices/compute-fidelity-notices.ts` | ~10 |
| O4 | Add notice: `svgMinify.embeddedRaster` — "SVG contains embedded raster images. Minify optimizes vector data only." Severity: `info`. Shown when `inspect_svg_for_minify.has_embedded_rasters === true`. | `frontend/src/lib/notices/compute-fidelity-notices.ts` | ~10 |
| O5 | Add `svg-minify` to `tool-notice-profiles.ts` with cost profile (fast — text processing) | `frontend/src/lib/notices/tool-notice-profiles.ts` | ~5 |

#### 3.1.7 Frontend — Prepare pipeline

| # | Task | File | Lines |
|---|------|------|-------|
| P1 | Add `svg-minify` to prepare: `warmupTransmutatorModule("transmutador_svg")` already handles it. No format-specific inspect needed beyond existing `inspect_svg_meta`. | `frontend/src/lib/transmutation/prepare/run-prepare.ts` | ~5 |
| P2 | Skip `MAX_PIXELS` check for svg-minify (no rasterization). Skip `assessSemanticAlpha` (no alpha flatten). Add early return in prepare for svg-minify route. | `frontend/src/lib/transmutation/prepare/run-prepare.ts` | ~10 |

#### 3.1.8 Frontend — i18n

| # | Task | File | Lines |
|---|------|------|-------|
| Q1 | Add i18n keys for `svg-minify` tool: `actionTitle`, `description`, `fidelityHint`, option labels (svgMinifyLevel, advanced toggles), presets (Conservative, Balanced, Aggressive) | `frontend/src/lib/i18n/dictionaries/en.ts` | ~25 |
| Q2 | Add same keys in Spanish | `frontend/src/lib/i18n/dictionaries/es.ts` | ~25 |
| Q3 | Add notice i18n keys: `svgMinify.vectorOptimized`, `svgMinify.metadataStripped`, `svgMinify.editabilityWarning`, `svgMinify.embeddedRaster` | `frontend/src/lib/i18n/dictionaries/en.ts` | ~15 |
| Q4 | Add same notice keys in Spanish | `frontend/src/lib/i18n/dictionaries/es.ts` | ~15 |

#### 3.1.9 Frontend — OptionsControls (UI)

| # | Task | File | Lines |
|---|------|------|-------|
| R1 | Add `svgMinifyLevel` value label mapping: 0→"Conservative", 1→"Balanced", 2→"Aggressive" | `frontend/src/components/transmute/OptionsControls.tsx` | ~5 |
| R2 | Add advanced collapsible section for svg-minify: individual toggles for strip comments, strip metadata, collapse whitespace, compact paths. Use existing `Advanced ▾` pattern from resize filter selector. | `frontend/src/components/transmute/OptionsControls.tsx` | ~40 |

#### 3.1.10 Build & verification

| # | Task | Command |
|---|------|---------|
| V11 | Rust tests | `cd motor_transmutacion && cargo test -p transmutador_svg 2>&1 \| Select-String "test result:\|FAILED\|error\["` |
| V12 | Wasm build | `cd frontend && npm run build:wasm 2>&1 \| Select-String "Done\|Error\|error"` |
| V13 | TypeScript check | `cd frontend && npx tsc --noEmit 2>&1 \| Select-String -NotMatch "\.test\.ts"` |
| V14 | Vitest | `cd frontend && npm test` |
| V15 | Next.js build | `cd frontend && npm run build 2>&1 \| Select-Object -Last 5` |
| V16 | Manual smoke: drop simple SVG → Balanced preset → estimate shows reduction → transmute → valid SVG download | Browser |
| V17 | Manual smoke: drop Illustrator SVG → metadata stripped, 50-80% reduction | Browser |
| V18 | Manual smoke: drop .svgz → accepted, output uncompressed .svg | Browser |
| V19 | Manual smoke: Aggressive preset → compact paths → editability warning shown | Browser |
| V20 | Manual smoke: SVG with embedded raster → embedded raster info notice shown | Browser |
| V21 | Wasm size gate: `transmutador_svg` ≤ 1.7 MB (current 1.63 MB + ~20 KB minifier) | `Get-Item frontend/public/wasm/transmutador_svg/*.wasm \| Select Length` |
| V22 | Round-trip validation: minified SVG re-parses without error | `cargo test -p transmutador_svg` |

### 3.2 Verification gate — 4a.2b

- [ ] `cargo test -p transmutador_svg` — all existing tests + new minify tests pass
- [ ] `npm run build:wasm` — builds, Wasm size delta < +30 KB
- [ ] `npx tsc --noEmit` — 0 errors (non-test)
- [ ] `npm test` — all Vitest tests pass
- [ ] `npm run build` — succeeds
- [ ] Manual: simple SVG → smaller output, valid XML
- [ ] Manual: Illustrator SVG → metadata + editor namespaces stripped
- [ ] Manual: .svgz input → accepted, uncompressed output
- [ ] Manual: Aggressive mode → compact paths + editability warning
- [ ] Manual: Round-trip — minified SVG re-parses and renders identically
- [ ] Manual: SVG with `<text>` content → text whitespace preserved
- [ ] i18n EN + ES complete for tool + options + notices
- [ ] StripAll: no `<metadata>`, editor namespaces, author info in output

---

## 4. Future phases (backlog)

### 4.1 Phase 4a.2c — SVG minify aggressive (Option A spike)

| # | Task | Gate |
|---|------|------|
| S1 | Add `oxvg_optimiser = { version = "0.0.5", default-features = false }` to `transmutador_svg/Cargo.toml` | Dep added |
| S2 | `cargo check -p transmutador_svg --target wasm32-unknown-unknown` | Compiles (lightningcss rayon/jemalloc features disabled) |
| S3 | `npm run build:wasm` | Builds |
| S4 | Measure `transmutador_svg` Wasm size | **Gate: < 3 MB** (NFR-7) |
| S5 | If S4 passes: implement passes 7-9 (shorten numbers, compact paths, remove unused IDs) + CSS minification via oxvg_optimiser `Jobs::default()` | Integration |
| S6 | If S4 fails: implement passes 7-9 manually in `minify.rs` (no oxvg) | Fallback |

### 4.2 Phase 4a.2d — WebP resize

| # | Task | Notes |
|---|------|-------|
| T1 | Add `webp-resize` tool definition | `fromFormat: "WEBP"`, `toFormat: "WEBP"`, `module: "transmutador_optimize"` |
| T2 | Add `resize_webp_with_filter` Wasm export | Reuses `resize_by_percent` + VP8L re-encode |
| T3 | Worker dispatch for `isOptimizeWebp && isOptimizeResize` | New route flag combination |
| T4 | Notices: lossy WebP + resize = "Lossy WebP re-encoded as lossless after resize. File may be larger than source." | Honesty notice |

---

## 5. Cross-cutting requirements (every phase)

| # | Requirement | 4a.2a | 4a.2b |
|---|-------------|-------|-------|
| 1 | `cargo test --workspace` passes | ✅ | ✅ |
| 2 | `npm run build:wasm` succeeds | ✅ | ✅ |
| 3 | `npx tsc --noEmit` 0 errors (non-test) | ✅ | ✅ |
| 4 | `npm test` all Vitest tests pass | ✅ | ✅ |
| 5 | `npm run build` succeeds | ✅ | ✅ |
| 6 | Backward compat: existing Wasm exports unchanged | ✅ | ✅ |
| 7 | StripAll metadata policy | ✅ | ✅ |
| 8 | Risk mode respected | ✅ | ✅ (byte limit only, no MAX_PIXELS) |
| 9 | i18n EN + ES complete | ✅ | ✅ |
| 10 | Release checklist (vX.Y.Z.md, manifest, i18n, docs) | ✅ | ✅ |
| 11 | NFR-7: Wasm ≤ 3 MB per module | ✅ (optimize < 1.1 MB) | ✅ (svg < 1.7 MB) |
| 12 | `wasm-crates.ts` in sync (no new crate, just new features) | ✅ | ✅ |
| 13 | `warmup-wasm.ts` handles new tool modules | ✅ (existing) | ✅ (existing) |

---

## 6. Risk matrix

| # | Risk | Impact | Phase | Mitigation |
|---|------|--------|-------|------------|
| R1 | `image` `webp` feature pulls C dependency | Spike failure | 4a.2a | Spike gate S2 — abort if C deps (same as oxipng). `image-webp` is pure Rust; `webp` crate (libwebp-sys) is NOT added. |
| R2 | Wasm size exceeds +200 KB gate | NFR-7 pressure | 4a.2a | Spike gate S4. If exceeded, investigate `image-webp` feature flags or manual VP8L encoder. |
| R3 | Lossy WebP → lossless inflation confuses users | Trust damage | 4a.2a | Mandatory amber warning + deep-link to webp-to-jpg. Estimate-first shows byte delta before transmute. |
| R4 | Animated WebP silently drops frames | Data loss | 4a.2a | Hard reject with error (Q8 decision). Detect via `has_animation()`. |
| R5 | SVG minify breaks complex SVGs (gradients, filters, masks) | Visual corruption | 4a.2b | Round-trip validation (re-parse output). Fixture matrix from tier3_3_svg_analysis.md §7.4. Manual QA on Illustrator + Inkscape exports. |
| R6 | SVG minify aggressive mode alters rendering | Visual regression | 4a.2b | Pass 8 (compact paths) is OFF by default. When enabled, `warn` notice. Path compaction preserves exact geometry (whitespace/decimal only, no command substitution). |
| R7 | SVG XML bomb / billion laughs | DoS / OOM | 4a.2b | Existing `validate_svg_input` byte cap. roxmltree `ParserOptions` entity expansion limit. |
| R8 | SVG with embedded rasters grows after minify | Size increase | 4a.2b | Detect embedded rasters via `inspect_svg_for_minify`. `info` notice "SVG contains embedded raster images. Minify optimizes vector data only." |
| R9 | `transmutador_svg` Wasm exceeds 3 MB with minify code | NFR-7 violation | 4a.2b | Custom minifier is ~300 lines Rust, ~5-20 KB Wasm. Current svg Wasm: 1.63 MB. Headroom: 1.35 MB. No risk. |
| R10 | `usePredictor` slider key not in existing union type | TypeScript error | 4a.2a | Task C3 adds it to `SliderOptionSpec.key` union. |

---

## 7. Bundle size projections

| Phase | Crate change | Wasm delta (actual) | JS delta |
|-------|-------------|---------------------|----------|
| 4a.2a WebP | `image` `webp` feature + `image-webp` direct | **+27.8 KB** (est: +50-150 KB) | ~8 KB (registry + notices + i18n + worker dispatch) |
| 4a.2b SVG | None (custom minifier code only) | +5-20 KB | ~12 KB (registry + UI toggles + notices + i18n) |
| **Total** | | **+55-170 KB** | **~20 KB** |

**Post-4a.2a Wasm sizes (actual):**
- `transmutador_optimize`: **869 KB** (actual, not projected)
- `transmutador_svg`: 1.63 MB (unchanged — no SVG minify shipped yet)

Both well within NFR-7 (3 MB per module).

---

## 8. Release checklist — per phase

### 8.1 v3.9.0 (4a.2a — WebP compress)

1. Bump `frontend/package.json` version → 3.9.0
2. Bump `motor_transmutacion/Cargo.toml` workspace version → 1.8.0
3. Create `docs/releases/v3.9.0.md` with: date, branch, tag, summary, highlights, QA exit gate
4. Create `frontend/src/lib/releases/entries/v3.9.0.ts` with `ReleaseEntry`
5. Add import + prepend entry in `frontend/src/lib/releases/manifest.ts`
6. Add i18n keys under `releaseComms.entries.v390.*` in BOTH `en.ts` and `es.ts`
7. Update `SPEC.md`: §6.13 (add WebP exports), §12.5 (add webp-compress row), new §5.12.5 (WebP recompress constraints)
8. Update `ROADMAP.md`: add v3.9.0 changelog entry, update current snapshot
9. Update `README.md`: version badge, "Latest" section, capability table
10. Update `ARCHITECTURE.md`: §8 tool registry (26 tools), §9 optimize crate (add WebP exports), §27 optimization engine
11. Update `docs/planning/tier4_plan.md`: §8 (4a.2 status → ✅ for WebP), tool count (26)
12. Stage to `dev`: `release: v3.9.0 -- WebP recompress (Tier 4a.2a)`

### 8.2 v3.9.1 (4a.2b — SVG minify)

1. Bump `frontend/package.json` version → 3.9.1
2. Create `docs/releases/v3.9.1.md`
3. Create `frontend/src/lib/releases/entries/v3.9.1.ts`
4. Add import + prepend entry in `manifest.ts`
5. Add i18n keys under `releaseComms.entries.v391.*` in BOTH `en.ts` and `es.ts`
6. Update `SPEC.md`: §6.12 (add minify exports), §12.5 (add svg-minify row), new §5.13 (SVG optimization science)
7. Update `ROADMAP.md`: add v3.9.1 changelog entry
8. Update `README.md`: version badge, "Latest" section
9. Update `ARCHITECTURE.md`: §8 tool registry (27 tools), §6 frontend (svg minify), §9 svg crate (add minify exports)
10. Update `docs/planning/tier4_plan.md`: §8 (4a.2 status → ✅ complete), tool count (27)
11. Stage to `dev`: `release: v3.9.1 -- SVG minify (Tier 4a.2b)`

---

## 9. Tool count evolution

| Milestone | Tools | Crates | Wasm modules |
|-----------|-------|--------|--------------|
| v3.8.2 | 25 | 14 (incl. core_utils) | 13 |
| v3.9.0 (4a.2a) | **26** (+webp-compress) | 14 | 13 (no new crate) |
| v3.9.1 (Smart Notice) | 26 (no new tool) | 14 | 13 (frontend only) |
| v3.9.2+ (4a.2b) | **27** (+svg-minify) | 14 | 13 (no new crate) |

---

## 10. File impact map

### 10.1 Phase 4a.2a — files modified (+ created)

| File | Changes |
|------|---------|
| `motor_transmutacion/core_utils/src/lib.rs` | +`WebpFormat` enum, +`probe_webp_format()` with VP8X recursion, +10 tests |
| `motor_transmutacion/transmutador_optimize/Cargo.toml` | +`"webp"` feature on `image`, +`image-webp = "0.2"` |
| `motor_transmutacion/transmutador_optimize/src/lib.rs` | +`recompress_webp*`, +`estimate_webp_recompress*`, +`encode_webp`, +EXIF orientation in shared `decode_image`, +9 tests |
| `motor_transmutacion/transmutador_encode/src/lib.rs` | +`read_jpeg_orientation()`, +`apply_orientation()` in `jpg_bytes_to_webp_bytes` — **EXTRA: not in original plan** |
| `motor_transmutacion/transmutador_jpg/src/lib.rs` | +`read_jpeg_orientation()`, +`apply_orientation()` in `jpg_bytes_to_png_bytes` — **EXTRA: not in original plan** |
| `frontend/src/workers/types.ts` | +`usePredictor?` in `TransmutationOptions`, +`"svg"` in `OutputExtension` |
| `frontend/src/lib/tools/types.ts` | +`"usePredictor"` in `SliderOptionSpec.key` |
| `frontend/src/lib/tools/tool-registry.ts` | +`webp-compress` tool definition (tool #26) |
| `frontend/src/workers/transmutation.worker.ts` | +`isOptimizeWebp` route flag, +4 Wasm bindings, +transmute dispatch, +estimate dispatch, +mime resolution |
| `frontend/src/types/wasm-modules.d.ts` | +4 WebP optimize export declarations |
| `frontend/src/lib/notices/compute-fidelity-notices.ts` | +4 WebP notices (lossy source, lossless source, metadata stripped, lossless limit) + compressLarger extension |
| `frontend/src/lib/notices/compute-staged-notices.ts` | +`webpSourceFormat` wiring from noticeContext |
| `frontend/src/lib/notices/tool-notice-profiles.ts` | +`webp-compress` profile, +`webpSourceFormat` field in `ToolNoticeContext` |
| `frontend/src/lib/format/probe-webp-format.ts` | **NEW: client-side WebP RIFF probe with VP8X recursion** |
| `frontend/src/components/transmute/StagedWorkspace.tsx` | +`probeWebpFormat()` call in noticeContext useMemo |
| `frontend/src/components/transmute/OptionsControls.tsx` | +`usePredictor` + `progressive` value label mappings |
| `frontend/src/lib/i18n/dictionaries/en.ts` | +tool keys, +4 notice keys, +improved fidelity hints |
| `frontend/src/lib/i18n/dictionaries/es.ts` | +tool keys, +4 notice keys, +improved fidelity hints |
| `frontend/src/lib/tools/tool-lanes.test.ts` | Updated optimize tool count from 4→5 |

### 10.2 Phase 4a.2b — files modified

| File | Changes |
|------|---------|
| `motor_transmutacion/transmutador_svg/src/minify.rs` | **New file** — minification engine (~300 lines) |
| `motor_transmutacion/transmutador_svg/src/lib.rs` | +`mod minify;`, +`minify_svg*` Wasm exports, +`inspect_svg_for_minify`, +tests |
| `frontend/src/workers/types.ts` | +`svgMinifyLevel?`, +advanced toggle options |
| `frontend/src/lib/tools/types.ts` | +svg minify keys in `SliderOptionSpec.key` |
| `frontend/src/lib/tools/tool-registry.ts` | +`svg-minify` tool definition |
| `frontend/src/workers/transmutation.worker.ts` | +`isSvgMinify` route, +Wasm bindings, +dispatch |
| `frontend/src/types/wasm-modules.d.ts` | +SVG minify export declarations |
| `frontend/src/lib/notices/compute-fidelity-notices.ts` | +SVG minify notices |
| `frontend/src/lib/notices/tool-notice-profiles.ts` | +`svg-minify` profile |
| `frontend/src/lib/transmutation/prepare/run-prepare.ts` | +svg-minify prepare (skip MAX_PIXELS, skip alpha) |
| `frontend/src/components/transmute/OptionsControls.tsx` | +svgMinifyLevel labels, +advanced collapsible toggles |
| `frontend/src/lib/i18n/dictionaries/en.ts` | +tool keys, +notice keys |
| `frontend/src/lib/i18n/dictionaries/es.ts` | +tool keys, +notice keys |

---

## 11. References

| Doc | Role |
|-----|------|
| `docs/planning/tier4a_2_matrix_expand_investigation.md` | Full technical investigation + resolved decisions |
| `docs/planning/tier4_plan.md` §8 | 4a.2 backlog definition |
| `docs/planning/compress_premium_roadmap.md` | Compress A-E prior art (spike gate pattern) |
| `docs/planning/resize_premium_roadmap.md` | Resize Premium prior art (UI patterns) |
| `docs/planning/tier3_3_svg_analysis.md` | SVG format science |
| `docs/planning/tier3_3_svg_spike_results.md` | resvg/usvg Wasm viability |
| `docs/SPEC.md` §5.12 | WebP format science |
| `docs/SPEC.md` §5.10 | StripAll metadata policy |
| `docs/SPEC.md` §12.5 | Tier 4a normative spec |
| `docs/SPEC.md` §7.4 | Verde Camaleón design system |
| `docs/LIMIT_PIPELINE.md` | Limit pipeline (MAX_PIXELS, risk mode, zones) |
| `motor_transmutacion/transmutador_optimize/src/lib.rs` | Current optimize crate (842 KB Wasm, 22 exports) |
| `motor_transmutacion/transmutador_svg/src/lib.rs` | Current SVG crate (1.63 MB Wasm) |
| `frontend/src/lib/tools/tool-registry.ts:717-914` | Current optimize tool definitions |
| `frontend/src/workers/transmutation.worker.ts:770-1063` | Worker route flags + optimize dispatch |
| `frontend/src/lib/transmutation/prepare/warmup-wasm.ts` | Wasm warmup module registry |
| `image-webp` crate 0.2.4 | Pure-Rust WebP codec (VP8L lossless encode) |
| `roxmltree` crate | XML parser (transitively available via usvg) |

---

*Implementation roadmap for Tier 4a.2 Matrix Expand. **Phase 4a.2a SHIPPED v3.9.0:** `transmutador_optimize` extended with VP8L lossless re-encode (4 Wasm exports, 9 tests). Wasm: **869 KB (+27.8 KB)**. EXIF orientation across 3 crates. VP8X recursive probe fix. 31 files, +2149 lines. **Smart Notice Recommendations SHIPPED v3.9.1:** Actionable inline pills, 5-rule engine, cross-tool navigation, dedup pipeline. 8 TypeScript files, 0 Rust. **Next: 4a.2b SVG minify (v3.9.2+)** followed by 4a.2c oxvg spike and 4a.2d WebP resize.*
