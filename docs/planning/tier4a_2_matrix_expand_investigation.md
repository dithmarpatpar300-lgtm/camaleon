# Tier 4a.2 — Matrix Expand: Technical Investigation

> **Date:** 2026-06-24 · **Author:** OpenCode (Senior Engineer)
> **Status:** Research phase — no code changes
> **Scope:** WebP recompress + SVG minify spike — full technical, scientific, and UX investigation
> **Parent doc:** `docs/planning/tier4_plan.md` §8 · **SPEC anchor:** §12.5 Tier 4a · §1.3 Ladder C
> **Prerequisite reads:** `tier4_plan.md`, `compress_premium_roadmap.md`, `resize_premium_roadmap.md`, `tier3_3_svg_analysis.md`, `SPEC.md` §5.12 (WebP science)

---

## 0. Executive summary

Tier 4a.2 ("Matrix Expand") introduces two new optimization tools that extend Camaleon's Ladder C beyond PNG/JPEG:

| Tool | Slug | Class | Crate target | Fidelity | Viability |
|------|------|-------|-------------|----------|-----------|
| **WebP recompress** | `webp-compress` | Compress (same-format re-encode) | `transmutador_optimize` (extend) | Lossless (VP8L) | ✅ Viable — pure Rust, limited gains on lossy sources |
| **SVG minify** | `svg-minify` | Text optimization (NO rasterization) | `transmutador_svg` (extend) or new crate | Lossless (visual identical) | ✅ Viable — pure Rust, architecturally novel |

**Key findings:**

1. **WebP lossy recompress is BLOCKED in pure-Rust/Wasm.** The `webp` crate wraps `libwebp-sys` (C, same spike-fail pattern as oxipng/libdeflate). The `image-webp` crate (pure Rust) only exposes VP8L lossless encode — no quality knob, no lossy VP8 encoder through the high-level API. Camaleon's WebP recompress is therefore **lossless-only re-encode**, with honest notices for lossy WebP sources (entropy expansion doctrine, same as JPG→PNG §5.4.2).

2. **SVG minify is architecturally unique.** Every existing Camaleon tool decodes to raster and re-encodes. SVG minify is a **text-to-text transformation** — parse XML → optimize tree → serialize XML. No rasterization, no `MAX_PIXELS`, no 40 MP cap, no risk mode. This is a new operation class that requires careful SPEC handling.

3. **`oxvg_optimiser` (0.0.5)** is a full svgo-equivalent in pure Rust with 40+ optimization jobs and `wasm-bindgen` support. However, it depends on `lightningcss` (**MPL-2.0 license** — file-level copyleft, requires legal review against Camaleon's MIT license) and has a heavy dependency tree (`parcel_selectors`, `cssparser`, `dashmap`, `regex`, etc.). A spike is required to verify Wasm compilation and measure binary size impact.

4. **Lightweight alternative for SVG minify:** A custom minifier using `roxmltree` (already in the project tree) or `quick-xml` with manual optimization passes (whitespace removal, comment stripping, metadata removal, editor namespace cleanup, default attribute removal, path data rounding). Zero new dependencies, zero license concerns, 10-40% reduction on verbose SVGs (vs 20-50% for full svgo-style optimization).

---

## 1. Historical context: How 4a.0 became "Premium"

### 1.1 The evolution arc

The `transmutador_optimize` crate began as a **minimal scaffold** at v3.2.9 with 4 tool definitions and a basic Rust implementation that **did not function** (missing `warmup-wasm.ts` integration). The journey from scaffold to premium:

| Phase | Version | What was basic | What became premium |
|-------|---------|----------------|---------------------|
| **4a.0 Activation** | v3.3.0 | 4 tools finally ran (PNG/JPEG compress + resize) | Functional baseline — 1 encode path per tool |
| **Resize Premium** | v3.6.0 | Lanczos3 only, 10-100%, step 5%, no dimensions | 5 filters, 1-200% (400% advanced), step 1%, live W×H display, JPEG quality control, estimate parity, filter-specific notices |
| **Compress A** | v3.7.0 | No honesty notices, RGB→RGBA inflation bug | 9 fidelity notices, color-type preservation, defaults alignment |
| **Compress B** | v3.7.1 | `image::JpegEncoder` (standard Huffman, fixed 4:2:0) | `jpeg-encoder` crate (optimized Huffman, 5-15% smaller), chroma subsampling 4:2:0/4:2:2/4:4:4 |
| **Compress C** | v3.8.0 | DEFLATE level only (1 candidate) | 36-candidate pipeline: 5 filter trials × 3 deflate strategies × bit depth reduction + color type reduction + alpha optimization |
| **Compress D** | v3.8.1 | No lossy PNG path | `quantette` Wu quantization + FloydSteinberg dither, 2-256 colors, indexed PNG, 60-80% reduction |
| **Compress E** | v3.8.2 | Baseline JPEG only, DEFLATE only | Zopfli archival DEFLATE (3-8% more), progressive JPEG scan |

### 1.2 What "Premium" means in Camaleon's doctrine

A tool is "premium" when it satisfies ALL of these:

1. **Multi-strategy optimization** — not one encode path, but a search across candidates (PNG: 36 candidates; JPEG: quality × subsampling × progressive × Huffman).
2. **Honesty-first UX** — every lossy/lossless distinction surfaced via Notice Rail; no false "lossless" claims; generational loss warned.
3. **Metrics-first interaction** — estimate runs before transmute; user decides based on byte delta, not blind faith.
4. **Filter/encoder-level control** — expose the encoder's internal levers (subsampling, filter type, deflate strategy, optimization level) not just a single "quality" slider.
5. **Scientific transparency** — UI copy reflects the information-theoretic reality (entropy expansion, generational loss, lossless vs lossy semantics).

### 1.3 Current `transmutador_optimize` state (v3.8.2)

**Wasm size:** 842 KB (28% of 3 MB NFR-7 budget)
**Engine:** v1.7.0
**Dependencies:** `image` 0.25 (png, jpeg), `jpeg-encoder` 0.7, `miniz_oxide` 0.8, `png` 0.18, `quantette` 0.6, `zopfli` 0.8
**Exports:** 22 `#[wasm_bindgen]` functions (compress PNG/JPEG × standard/optimized/lossy/progressive + resize PNG/JPEG × standard/with_filter/with_quality + estimates + session controls)
**Tests:** 14 Rust integration tests
**Custom PNG encoder:** `encode_png_custom_with_strategy` (lib.rs:358) + `build_png_container` (lib.rs:392) — manual IHDR + chunked IDAT + IEND + CRC32 via miniz_oxide. The only PNG-from-scratch path in Camaleon.

---

## 2. WebP recompress — Technical investigation

### 2.1 What "WebP recompress" means

**WebP recompress** is a same-format optimization tool (Ladder C): input is `.webp`, output is `.webp`, and the user's job is **byte size reduction** without format change.

```
WebP bytes → Decode to raster (VP8 or VP8L) → Re-encode WebP → Output bytes
```

This is directly analogous to `png-compress` and `jpg-compress` — same pipeline class, different codec.

### 2.2 WebP format science (recap from SPEC §5.12)

WebP is a **dual-mode** raster format (Google, 2010) based on VP8/VP8L codecs:

| Mode | Codec | Encoding | Alpha | Typical use |
|------|-------|----------|-------|-------------|
| **Lossy** | VP8 | Intra-frame DCT (similar to JPEG) | Separate alpha plane (extended) | Photos, web images |
| **Lossless** | VP8L | Spatial prediction + entropy (Huffman) | Native RGBA | Graphics, screenshots, sprites |
| **Extended** | VP8/VP8L + alpha + metadata | Either | Yes | General purpose |

**Container:** RIFF with `WEBP` FourCC; chunk-based (`VP8 `, `VP8L`, `VP8X`, `EXIF`, `XMP `).

### 2.3 The critical constraint: lossy WebP encode in pure Rust/Wasm

This is the most important technical finding of this investigation.

| Crate | Lossy encode? | Lossless encode? | Pure Rust? | Wasm-viable? | License |
|-------|---------------|------------------|------------|--------------|---------|
| **`webp`** 0.3.1 | ✅ (via libwebp) | ✅ | ❌ (wraps `libwebp-sys` C) | ❌ (same as oxipng/libdeflate) | MIT/Apache |
| **`image-webp`** 0.2.4 | ❌ (VP8L only via `WebPEncoder::new`) | ✅ (VP8L with predictor transform) | ✅ | ✅ | MIT/Apache |
| **`image`** 0.25 (`webp` feature) | ❌ (uses `image-webp` internally) | ✅ (VP8L only) | ✅ | ✅ | MIT/Apache |

**Finding:** `image-webp`'s `WebPEncoder::new()` documentation explicitly states: *"Only supports 'VP8L' lossless encoding."* The `EncoderParams` struct has a single field: `use_predictor_transform: bool`. There is **no quality parameter, no lossy VP8 encoder exposed through the public API**.

The `image-webp` crate does contain a `vp8` module ("An implementation of the VP8 Video Codec"), but this is the **decode** path only. VP8 lossy **encoding** is not exposed.

**Squoosh comparison:** Squoosh uses libwebp compiled to Wasm via Emscripten for lossy WebP encode. This is a pre-compiled C→Wasm module loaded as a side binary — architecturally incompatible with Camaleon's "one Cargo workspace, one `wasm-pack build`" pattern. The same approach was explicitly rejected for oxipng (SPEC §5.5.7, compress_premium_roadmap.md §7.1).

### 2.4 What WebP recompress CAN do (pure Rust, Wasm-viable)

Given the constraint, Camaleon's WebP recompress operates as follows:

```
Input WebP (lossy OR lossless)
  → Decode to raster (image::WebPDecoder — supports both VP8 and VP8L)
  → Color type analysis (RGB vs RGBA — same as PNG compress Phase A)
  → Re-encode as lossless WebP (VP8L via image::ImageFormat::WebP)
  → Output WebP (lossless)
```

**Two scenarios with very different outcomes:**

| Source WebP | Recompress result | Size delta | Honesty class |
|-------------|-------------------|------------|---------------|
| **Lossless VP8L** | Re-encoded VP8L with `use_predictor_transform` toggle + color type optimization | **-5% to -15%** (genuine recompress) | `lossless` — pixels preserved, re-optimized compression |
| **Lossy VP8** | Decoded raster re-encoded as VP8L lossless | **+2× to +10×** (entropy expansion — same doctrine as JPG→PNG §5.4.2) | `lossy → lossless` — MUST warn about size inflation |

### 2.5 Detection: lossy vs lossless WebP

The `image-webp` crate exposes `BitstreamFormat` (Lossy, Lossless, Other) via `BitstreamFeatures`. The `image` crate's `WebPDecoder` does not directly expose this, but we can detect it at the byte level:

**RIFF chunk inspection (pure byte parsing, no decode):**
- `VP8 ` chunk (offset 12+4) → lossy VP8
- `VP8L` chunk → lossless VP8L
- `VP8X` chunk → extended format (may contain either)

This is a `core_utils`-level probe — same pattern as `probe_dimensions` for PNG/JPEG. Add `probe_webp_format(bytes) -> WebpFormat { Lossy, Lossless, Extended }` to `core_utils`.

### 2.6 VP8L optimization levers (what we can control)

The `image-webp` crate's `WebPEncoder` exposes:

| Lever | API | Effect |
|-------|-----|--------|
| **Predictor transform** | `EncoderParams { use_predictor_transform: bool }` | VP8L spatial predictor — enabled by default. Disabling may produce smaller files on some content (rare) or faster encode. |
| **Color type input** | `ColorType::Rgb8` vs `Rgba8` vs `L8` vs `La8` | Feeding RGB (3 channels) instead of RGBA (4 channels) when alpha is absent saves ~25% on the encode input. Same color-type-reduce logic as PNG compress Phase C. |
| **DEFLATE/entropy** | Not exposed | VP8L's entropy coding is internal to image-webp; no tuning available. |

**Honest assessment:** VP8L optimization levers are **far more limited** than PNG's (which has 5 filters × 3 deflate strategies × bit depth × color type = 36+ candidates). WebP recompress has essentially **2 levers**: predictor transform on/off + color type (RGB vs RGBA). Expected gains on already-lossless WebP: **5-15%**. Compare to PNG compress opt_level=1: 10-30%.

### 2.7 WebP resize (adjacent capability)

If we add the `webp` feature to `transmutador_optimize`'s `image` dependency, we also unlock **WebP resize** with minimal additional code:

```
Input WebP → Decode → resample (5 filters, same as PNG/JPEG resize) → re-encode VP8L → Output WebP
```

This would add `webp-resize` as a 6th optimize tool. The same lossless-only constraint applies to the re-encode step. For lossy WebP sources, resize + lossless re-encode = size inflation + resolution change. The honesty notice would be: "Lossy WebP re-encoded as lossless after resize. File may be larger than source."

**Decision point:** WebP resize is a natural extension but adds complexity. Recommend deferring to a sub-phase (4a.2b) after WebP compress (4a.2a) validates the pipeline.

### 2.8 Implementation path — WebP recompress

**Crate:** Extend `transmutador_optimize` (NOT a new crate — same module, same Wasm binary).

**Cargo.toml change:**
```toml
image = { version = "0.25", default-features = false, features = ["png", "jpeg", "webp"] }
```
Adding `"webp"` enables decode + lossless encode. Expected Wasm size delta: **+50-150 KB** (image-webp is already a transitive dependency of the `image` crate; enabling the feature links the VP8L encoder code). **Spike required to measure exact delta.**

**New Wasm exports:**
```rust
// WebP recompress — lossless VP8L re-encode
recompress_webp(input_bytes: &[u8]) -> Result<Vec<u8>, String>
recompress_webp_with_options(input_bytes: &[u8], use_predictor: bool) -> Result<Vec<u8>, String>
estimate_webp_recompress_size(input_bytes: &[u8]) -> Result<u32, String>
estimate_webp_recompress_with_options(input_bytes: &[u8], use_predictor: bool) -> Result<u32, String>
```

**New `core_utils` probe:**
```rust
pub enum WebpFormat { Lossy, Lossless, Extended }
pub fn probe_webp_format(bytes: &[u8]) -> Result<WebpFormat, String>
```

**Pipeline:**
```rust
fn recompress_webp_inner(input: &[u8], use_predictor: bool) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    let format = core_utils::probe_webp_format(input)?;  // lossy/lossless/extended
    let mut reader = ImageReader::new(Cursor::new(input))
        .with_guessed_format()?;
    if core_utils::risk_mode_enabled() { reader.no_limits(); }
    let img = reader.decode()?;
    
    // Color type optimization (same as PNG compress Phase C)
    let color_type = if img.color().has_alpha() {
        image_webp::ColorType::Rgba8
    } else {
        image_webp::ColorType::Rgb8
    };
    
    // VP8L re-encode with predictor transform
    let mut buf = Cursor::new(Vec::new());
    let mut encoder = image_webp::WebPEncoder::new(&mut buf);
    let mut params = image_webp::EncoderParams::default();
    params.use_predictor_transform = use_predictor;
    encoder.set_params(params);
    encoder.encode(&img.to_rgba8(), w, h, color_type)?;
    
    let output = buf.into_inner();
    core_utils::validate_output(&output, core_utils::OutputFormat::WebP)?;
    Ok(output)
}
```

### 2.9 Options gamma — WebP recompress

| Option | Type | Range | Default | UI control | Notes |
|--------|------|-------|---------|------------|-------|
| **Predictor transform** | `bool` | on/off | on | Toggle (slider 0/1) | VP8L spatial predictor. Off = simpler encode, may be smaller on noise-heavy images. |
| **Optimization level** | `u8` | 0-1 | 0 | Slider (0=Standard, 1=Optimized) | Level 1 = try both predictor settings + color type reduce, pick smallest. Analogous to PNG compress opt_level. |

**Conditional notices (auto-detected, not user options):**

| Source format | Notice | Severity |
|---------------|--------|----------|
| Lossy VP8 | "This is a lossy WebP. Re-encoding as lossless will increase file size (entropy expansion). Consider WebP→JPG for size reduction." | `warn` |
| Lossless VP8L | "Lossless WebP re-encoded with VP8L optimization." | `info` |
| Extended (VP8X) | "Extended WebP — metadata (EXIF, XMP, ICC) stripped per privacy policy." | `info` |
| Animated WebP | "Animated WebP not supported for recompress. First frame only." | `warn` |
| Size increase (estimate > input) | "Output is larger than source. This is expected for lossy→lossless re-encode." | `warn` |

### 2.10 User benefits — WebP recompress

| User job | How WebP recompress helps |
|----------|---------------------------|
| **"I have a lossless WebP that's bloated"** | Genuine 5-15% reduction via VP8L re-optimization + color type analysis |
| **"My CMS gave me a WebP and I want it smaller"** | If lossless → real savings. If lossy → honest notice + redirect to WebP→JPG |
| **"I want to strip metadata from a WebP"** | StripAll applies — EXIF/XMP/ICC chunks removed (privacy, §5.10) |
| **"I want to verify my WebP is optimally encoded"** | Estimate-first UX shows before/after bytes before committing |
| **"My WebP has unnecessary alpha"** | Color type detection → RGB encode when alpha is opaque (25% input reduction) |

**What we DO NOT promise:**
- Smaller files for lossy WebP sources (entropy expansion is information-theoretic, not a bug)
- Lossy WebP re-encode (blocked by pure-Rust constraint — libwebp is C)
- Animated WebP optimization (single-frame only)

---

## 3. SVG minify — Technical investigation

### 3.1 What "SVG minify" means

**SVG minify** is a same-format optimization tool for SVG files: input is `.svg`, output is `.svg`, and the user's job is **byte size reduction** while preserving the visual rendering identically.

**Critical architectural distinction:** SVG minify is **NOT a raster operation**. It does NOT decode to pixels. It is a **text-to-text transformation**:

```
SVG bytes (UTF-8 XML) → Parse to DOM/tree → Optimize tree → Serialize XML → Output SVG bytes
```

No rasterization, no pixmap, no `MAX_PIXELS`, no 40 MP cap, no astro downscale, no risk mode decoder limits. This is a fundamentally new operation class in Camaleon.

### 3.2 SVG format science (from tier3_3_svg_analysis.md)

SVG is an **XML scene description** — paths, shapes, text, gradients, filters, embedded rasters. Unlike all other Camaleon inputs, SVG is **resolution-independent** and **human-readable text**.

**What makes SVG files large (optimization targets):**

| Source of bloat | Example | Optimization | Lossless? |
|-----------------|---------|--------------|-----------|
| **Editor metadata** | `<metadata>`, Illustrator namespaces, Inkscape namespaced | Remove | ✅ Visual identical |
| **XML comments** | `<!-- Created with Illustrator -->` | Remove | ✅ |
| **Redundant whitespace** | Indentation, newlines between elements | Collapse | ✅ |
| **Default attribute values** | `stroke="none"`, `fill="black"`, `visibility="visible"` | Remove defaults | ✅ |
| **Unused definitions** | `<defs>` with unreferenced gradients/symbols | Remove unused | ✅ |
| **Empty elements** | `<g></g>`, `<rect/>` with zero dimensions | Remove | ✅ |
| **Verbose numeric values** | `12.000000` → `12`, `0.3333333` → `.33` | Round/truncate | ✅ (within precision) |
| **Verbose path data** | `M 10 10 L 20 20 L 30 30` → `M10 10L20 20 30 30` | Compact syntax | ✅ |
| **Duplicate patterns** | Same `<path>` repeated → `<use>` reference | Deduplicate | ✅ |
| **Inline CSS → attributes** | `<style>.x{fill:red}</style>` → `fill="red"` | Convert | ✅ |
| **CSS minification** | `background-color: #ff0000;` → `background-color:red` | Minify CSS | ✅ |
| **Color conversion** | `#ff0000` → `red`, `rgb(255,0,0)` → `red` | Shortest form | ✅ |
| **Transform merging** | `transform="translate(10,0) translate(0,5)"` → `transform="translate(10,5)"` | Merge | ✅ |
| **Shape conversion** | `<rect x="0" y="0" width="10" height="10"/>` → `<path d="M0 0H10V10H0Z"/>` (when shorter) | Convert | ✅ |

### 3.3 Implementation options — SVG minify

#### Option A: `oxvg_optimiser` crate (full-featured)

**What it is:** A pure-Rust SVG optimization library implementing 40+ svgo-equivalent jobs: `RemoveComments`, `CleanupIds`, `ConvertPathData`, `MinifyStyles` (via lightningcss), `MergePaths`, `CollapseGroups`, `RemoveMetadata`, `RemoveEditorsNSData`, `RemoveUnknownsAndDefaults`, `ConvertColors`, `CleanupNumericValues`, `ConvertTransform`, and many more.

**Pros:**
- Full svgo-equivalent optimization (20-50% reduction on typical SVGs)
- Pure Rust with `wasm-bindgen` optional feature
- MIT license (the crate itself)
- `Jobs::default()` runs a sensible preset; configurable per-job

**Cons:**
- **`lightningcss` dependency is MPL-2.0** — file-level copyleft. While compatible with MIT, it requires the MPL-2.0 source to remain available and modifications to MPL-2.0 files must be disclosed. **Requires Chief Architect legal review** before adoption.
- Heavy dependency tree: `parcel_selectors`, `cssparser`, `dashmap`, `regex`, `lightningcss`, `phf`, `bitflags`, `derive_more`, `itertools`, `lazy_static`, `urlencoding`, `typed-arena`, `oxvg_ast`, `oxvg_collections`, `oxvg_path`, `oxvg_serialize`
- Version 0.0.5 — very early, API may be unstable, breaking changes likely
- Unknown Wasm compilation status — `lightningcss` has `getrandom` (needs `wasm-bindgen` feature), `rayon` (must disable), `jemallocator` (must disable). **Spike required.**
- Estimated Wasm size: +500 KB to +2 MB (lightningcss + parcel_selectors + cssparser are heavy). This could push `transmutador_svg` over the 3 MB NFR-7 limit (currently 1.63 MB).

**Spike gates (must all pass):**
1. `cargo check -p oxvg_optimiser --target wasm32-unknown-unknown` — compiles?
2. `wasm-pack build` with oxvg_optimiser — builds?
3. Wasm size delta < +1.5 MB (to stay under 3 MB for transmutador_svg)
4. `lightningcss` license review (MPL-2.0 compatibility)
5. Valid SVG output on fixture matrix (tier3_3_svg_analysis.md §7.4)

#### Option B: Lightweight custom minifier (zero new deps)

**What it is:** A custom SVG minifier built on `roxmltree` (already in the project as a dev-dependency of image-webp) or `quick-xml` for parsing, with manual optimization passes.

**Optimization passes (ordered by impact/cost ratio):**

| Pass | Technique | Typical savings | Complexity |
|------|-----------|-----------------|------------|
| 1. **Strip comments** | Remove `<!-- ... -->` | 2-10% | Trivial |
| 2. **Strip editor metadata** | Remove `<metadata>`, `xmlns:inkscape`, `xmlns:sodipodi`, `xmlns: Illustrator`, `xmlns: xmp` | 5-30% (Illustrator SVGs) | Simple |
| 3. **Collapse whitespace** | Remove indentation, newlines between tags; collapse multiple spaces | 10-40% (human-readable SVGs) | Simple |
| 4. **Remove XML declaration** | Strip `<?xml version="1.0"?>` (browsers don't need it) | ~50 bytes | Trivial |
| 5. **Remove default attributes** | Strip `stroke="none"`, `fill="black"`, `visibility="visible"`, `overflow="hidden"` when they match defaults | 2-5% | Medium (needs attribute default table) |
| 6. **Remove empty elements** | Strip `<g></g>`, empty `<defs>`, unused `<symbol>` | 1-5% | Medium |
| 7. **Shorten numeric values** | `12.000000` → `12`, `0.333333` → `.33`, `-0.5` → `-.5` | 5-15% (path-heavy SVGs) | Medium |
| 8. **Compact path data** | `M 10 10 L 20 20` → `M10 10L20 20`; remove unnecessary decimals | 5-20% (path-heavy) | Hard (needs path parser) |
| 9. **Remove unused IDs** | Strip `id="Layer_1"` when not referenced by `url(#...)` | 1-3% | Medium |
| 10. **Strip DOCTYPE** | Remove `<!DOCTYPE svg ...>` | Variable | Trivial |

**Expected total savings:** 10-40% on typical SVGs (vs 20-50% for oxvg_optimiser with full CSS minification + path optimization).

**Pros:**
- Zero new dependencies (roxmltree is already available; or use usvg's parser)
- Zero license concerns
- Tiny Wasm size delta (~5-20 KB for the minifier code)
- Full control over optimization behavior
- No alpha-version crate dependency (oxvg is 0.0.5)

**Cons:**
- Less aggressive optimization (no CSS minification, no path command optimization, no transform merging)
- More maintenance burden (we own the code)
- Need to build an SVG attribute default table

**Recommended parsing approach:** Use `roxmltree` for parsing (zero allocation, read-only DOM) + manual XML serialization. This avoids the `usvg` tree (which is designed for rendering, not round-tripping — it normalizes attributes in ways that may change the SVG's editability).

Alternatively, a regex-based approach for passes 1-4, 10 (comment/whitespace/metadata/declaration stripping) which require no tree structure, plus a tree-based approach for passes 5-9. The regex passes alone yield 10-25% on most SVGs.

#### Option C: Hybrid (recommended)

**Phase 1 (4a.2):** Option B (lightweight custom minifier) with passes 1-6 + 10. Targets the highest-impact, lowest-complexity optimizations. Zero new dependencies. 10-30% typical savings.

**Phase 2 (future, 4a.2+):** Spike `oxvg_optimiser` for full optimization (passes 7-9 + CSS minification + path optimization). Gate on: Wasm size < 3 MB, lightningcss license review, API stability (wait for 0.1.0+).

This approach ships value immediately with zero risk, and preserves the option to upgrade later.

### 3.4 Architecture — where SVG minify lives

**Option 1: Extend `transmutador_svg`** (recommended for Phase 1)
- Already has `usvg`/`resvg` for parsing
- Add `minify_svg` export alongside existing `transmutar_svg_a_png` / `transmutar_svg_a_jpg_with_options`
- Wasm binary: +5-20 KB (custom minifier code only)
- No new crate, no build script changes

**Option 2: New crate `transmutador_svg_minify`**
- Cleaner separation (minify ≠ rasterize)
- But violates the "minimize crate count" principle — one more Wasm binary to load
- Only justified if SVG minify needs heavy dependencies (oxvg_optimiser) that would bloat `transmutador_svg` beyond 3 MB

**Recommendation:** Option 1 for Phase 1 (lightweight minifier). Re-evaluate if oxvg_optimiser adoption requires Option 2.

### 3.5 SVG minify — Wasm exports

```rust
/// SVG minify — lossless text optimization (no rasterization).
/// Returns optimized SVG bytes (UTF-8 XML).
minify_svg(input_bytes: &[u8]) -> Result<Vec<u8>, String>

/// SVG minify with options — control which optimization passes run.
minify_svg_with_options(
    input_bytes: &[u8],
    strip_comments: bool,        // Pass 1
    strip_metadata: bool,        // Pass 2
    collapse_whitespace: bool,   // Pass 3
    strip_xml_decl: bool,        // Pass 4
    remove_defaults: bool,       // Pass 5
    remove_empty: bool,          // Pass 6
    shorten_numbers: bool,       // Pass 7
    compact_paths: bool,         // Pass 8
    remove_unused_ids: bool,     // Pass 9
) -> Result<Vec<u8>, String>

/// Estimate = output length (trivial — no rasterization needed).
estimate_svg_minify_size(input_bytes: &[u8]) -> Result<u32, String>

/// SVG metadata inspect (already exists: inspect_svg_meta)
/// Reuse for prepare — intrinsic size, has_text, has_filters, etc.
```

**No `MAX_PIXELS` check needed** — SVG minify doesn't rasterize. The byte limit (`MAX_INPUT_BYTES` 50 MB soft / 150 MB hard) still applies to prevent XML bomb / billion laughs attacks. The existing `validate_svg_input` in `transmutador_svg/src/svg_validate.rs` already handles this.

### 3.6 Options gamma — SVG minify

| Option | Type | Range | Default | UI control | Notes |
|--------|------|-------|---------|------------|-------|
| **Optimization level** | `u8` | 0-2 | 1 | Slider (0=Off, 1=Standard, 2=Aggressive) | 0 = no change. 1 = passes 1-6 (safe). 2 = passes 1-10 (aggressive number/path shortening, may affect editability). |
| **Strip comments** | `bool` | on/off | on | Toggle | Pass 1 — always safe for web use |
| **Strip metadata** | `bool` | on/off | on | Toggle | Pass 2 — removes `<metadata>`, editor namespaces (StripAll alignment) |
| **Collapse whitespace** | `bool` | on/off | on | Toggle | Pass 3 — makes output unreadable but smallest |
| **Compact paths** | `bool` | on/off | off | Toggle (advanced) | Pass 8 — path data optimization; off by default for editability preservation |

**Preset mapping:**
| Preset | Optimization level | Strips | Compacts | Target |
|--------|-------------------|--------|----------|--------|
| **Web** | 2 | All on | On | Smallest possible — for production web assets |
| **Balanced** | 1 | All on | Off | Good reduction, preserves editability |
| **Conservative** | 1 | Comments + metadata only | Off | Only removes non-functional bloat |

### 3.7 SVG minify — honesty doctrine

| Aspect | Policy |
|--------|--------|
| **Fidelity label** | `lossless` — visual rendering is byte-for-byte identical at any resolution |
| **Editability** | Optimization level 2 may reduce human editability (compacted paths, shortened numbers). Notice: "Aggressive optimization makes the SVG harder to edit manually." |
| **StripAll** | SVG `<metadata>`, editor comments, editor XML namespaces removed per §5.10. This is a privacy feature — Illustrator/Inkscape namespaces can contain author info, file paths, software versions. |
| **No rasterization** | Notice: "SVG minify optimizes the vector source. No pixels are generated. The file remains scalable to any resolution." |
| **Animated SVG** | SMIL/CSS animation elements preserved (unlike SVG→PNG which captures only first frame). |
| **External refs** | External `href` (http/file) are still blocked per security policy. `data:` URIs preserved. |

### 3.8 User benefits — SVG minify

| User job | How SVG minify helps |
|----------|---------------------|
| **"My Illustrator SVG is 500 KB but the logo is simple"** | Strip editor metadata + collapse whitespace → 50-100 KB (80% reduction) |
| **"I need the smallest SVG for my website"** | Optimization level 2: aggressive path compaction + number shortening → 20-50% reduction |
| **"My SVG has metadata I don't want to share"** | StripAll removes `<metadata>`, author info, editor namespaces (privacy, §5.10) |
| **"I want to clean up a designer's SVG for production"** | Balanced preset: remove bloat, preserve editability |
| **"I have a .svgz (gzipped SVG)"** | Accepted as input; output is uncompressed .svg (or optionally .svgz if we add gzip output) |
| **"My SVG has unused defs and empty groups"** | Remove empty elements + unused IDs → cleaner, smaller file |

**What we DO NOT promise:**
- SVG validation/repair (if the input is broken XML, we return an error)
- SVG → SVG rasterization (that's SVG→PNG/JPEG, already shipped)
- SVG animation export (SMIL preserved as-is, not optimized)
- SVG font subsetting (out of scope — font optimization is a separate problem)

---

## 4. UI/UX integration — Verde Camaleón design system

### 4.1 Design system recap (SPEC §7.4)

**Verde Camaleón:** dark-first minimalism, near-black neutrals (`#0E0F11` base) with a single chameleon-green accent (`#22C55E`) used sparingly. Swiss/Scandinavian restraint, generous whitespace. Theme toggle is brand narrative.

**Key tokens:**
- `--lossless` `#22C55E` (green) — lossless badge
- `--lossy` `#9BA1A8` (grey) — lossy badge
- `--warning` `#F59E0B` (amber) — warnings
- `--info` `#38BDF8` (blue) — info
- `--accent-subtle` `rgba(34,197,94,.12)` — lossless badge background

**Brand voice:** alchemical transmutation lexicon ("Transmutar", "Transmutaciones"). Tool identifiers stay technical (`WebP → WebP`, `SVG → SVG`); action labels use transmutation voice.

### 4.2 Tool card design — new optimize tools

Both new tools live in the **Optimize** lane (ToolBrowser category `"optimize"`).

| Tool | Slug | Card title | Fidelity badge | Category | Extension |
|------|------|------------|----------------|----------|-----------|
| WebP recompress | `webp-compress` | "WebP Compress" | `lossless` (green) — with amber conditional for lossy sources | optimize | `.webp` → `.webp` |
| SVG minify | `svg-minify` | "SVG Minify" | `lossless` (green) — always | optimize | `.svg` → `.svg` |

### 4.3 OptionsControls layout — WebP recompress

```
┌─────────────────────────────────────────────────────────────┐
│  WebP Compress                                               │
│                                                              │
│  Optimization level                                          │
│  ──────────●──────────────────────────  Standard             │
│  Off        Standard    Optimized                             │
│                                                              │
│  Predictor transform                                         │
│  ──────────────────────●──────────────  On                   │
│  Off                              On                          │
│                                                              │
│  ─────────────────────────────────────────                   │
│  ⚠ Lossy WebP detected. Re-encoding as lossless will          │
│    increase file size. Consider WebP → JPG instead.           │
│  ℹ Metadata (EXIF, XMP, ICC) stripped per privacy policy.    │
│                                                              │
│  Estimated output: 340 KB (+18%)                             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Original: 288 KB  ──▶  Optimized: ~340 KB           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  [Transmutar]                                                │
└─────────────────────────────────────────────────────────────┘
```

**Design notes:**
- Amber warning appears only when `probe_webp_format` detects lossy VP8
- Byte delta turns amber when output > input (same pattern as resize upscale, resize_premium_roadmap.md §6.3)
- "Consider WebP → JPG instead" is a deep-link to `/transmute/webp-to-jpg` (same lane, different category — cross-category link)

### 4.4 OptionsControls layout — SVG minify

```
┌─────────────────────────────────────────────────────────────┐
│  SVG Minify                                                  │
│                                                              │
│  Optimization level                                          │
│  ──────────●──────────────────────────  Balanced             │
│  Conservative    Balanced    Aggressive                      │
│                                                              │
│  ▸ Advanced options                                          │
│    ☑ Strip comments                                          │
│    ☑ Strip editor metadata                                   │
│    ☑ Collapse whitespace                                     │
│    ☐ Compact path data (reduces editability)                 │
│                                                              │
│  ─────────────────────────────────────────                   │
│  ℹ Vector source optimized — no pixels generated.            │
│    File remains scalable to any resolution.                  │
│  ℹ Metadata and editor namespaces removed (privacy).         │
│                                                              │
│  Estimated output: 12.4 KB (−76%)                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Original: 52 KB  ──▶  Minified: ~12 KB              │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  [Transmutar]                                                │
└─────────────────────────────────────────────────────────────┘
```

**Design notes:**
- Green `lossless` badge always (SVG minify is always visually lossless)
- Advanced options in a collapsible section (same pattern as resize filter "Advanced ▾" in resize_premium_roadmap.md §8)
- "Compact path data" has an inline warning about editability (amber text)
- No dimension display (SVG has no fixed dimensions until rasterized)
- Estimate is instant (text processing, no rasterization) — no debounce needed

### 4.5 ToolBrowser lane integration

Current optimize lane (v3.3.3):
```
Optimize lane:
  PNG Compress · JPEG Compress · PNG Resize · JPEG Resize
```

After 4a.2:
```
Optimize lane:
  PNG Compress · JPEG Compress · WebP Compress ·
  PNG Resize · JPEG Resize · SVG Minify
```

**Visual grouping:** The ToolBrowser already groups by `toolGroup`. Both new tools get `toolGroup: "jpeg-png"` (shared with existing optimize tools) or a new `toolGroup: "webp-svg"`. Recommend keeping `"jpeg-png"` for compress tools and adding `"svg"` for SVG minify to match the convert lane's grouping pattern.

### 4.6 Notice Rail integration

**WebP compress notices:**

| Notice key | Trigger | Severity | i18n keys needed |
|------------|---------|----------|------------------|
| `webpCompress.lossySource` | `probe_webp_format == Lossy` | `warn` | EN + ES |
| `webpCompress.losslessSource` | `probe_webp_format == Lossless` | `info` | EN + ES |
| `webpCompress.extendedFormat` | `probe_webp_format == Extended` | `info` | EN + ES |
| `webpCompress.sizeIncrease` | estimate > input size | `warn` | EN + ES (reuse existing `compress.larger` pattern) |
| `webpCompress.animatedNotSupported` | `has_animation() == true` | `warn` | EN + ES |

**SVG minify notices:**

| Notice key | Trigger | Severity | i18n keys needed |
|------------|---------|----------|------------------|
| `svgMinify.vectorOptimized` | Always (info) | `info` | EN + ES |
| `svgMinify.metadataStripped` | `strip_metadata == true` | `info` | EN + ES |
| `svgMinify.aggressiveMode` | `optimizationLevel == 2` | `info` | EN + ES |
| `svgMinify.editabilityWarning` | `compact_paths == true` | `warn` | EN + ES |
| `svgMinify.hasExternalRefs` | `has_external_refs == true` | `warn` | EN + ES (reuse existing svg security notice) |

---

## 5. Architecture decisions summary

### 5.1 Crate assignment

| Tool | Crate | Rationale |
|------|-------|-----------|
| `webp-compress` | Extend `transmutador_optimize` | Same pipeline class (decode→raster→encode), same Wasm binary, +1 feature flag on `image` dep |
| `svg-minify` | Extend `transmutador_svg` (Phase 1) | Already has SVG parsing infrastructure; minify is a natural sibling of SVG→PNG/JPEG. If oxvg_optimiser is adopted later (Phase 2), evaluate split. |

### 5.2 New dependencies

| Phase | Crate | Version | License | Wasm-viable? | Size estimate |
|-------|-------|---------|---------|--------------|---------------|
| 4a.2 WebP | `image` `webp` feature | 0.25 | MIT/Apache | ✅ (already transitive) | +50-150 KB |
| 4a.2 SVG (Option B) | None (use roxmltree) | — | — | ✅ | +5-20 KB |
| Future SVG (Option A) | `oxvg_optimiser` | 0.0.5 | MIT | ❓ spike | +500 KB-2 MB |
| Future SVG (Option A) | `lightningcss` (transitive) | 1.0.0-alpha | **MPL-2.0** | ❓ spike | included above |

### 5.3 SPEC amendments needed

| Section | Amendment |
|---------|-----------|
| §1.3 Ladder C | Add `webp-compress` and `svg-minify` to optimization tools |
| §5.12 WebP science | Add §5.12.5 "WebP recompress constraints" — document lossy encode blocker, lossless-only doctrine |
| §6.13 `transmutador_optimize` | Add WebP exports to Wasm API table; add `webp` to image features |
| §6.12 `transmutador_svg` | Add `minify_svg` exports; document text-optimization class (no rasterization) |
| §12.5 Tier 4a | Add `webp-compress` and `svg-minify` rows to tool table; update 4a.2 status |
| New §5.13 (proposed) | "SVG optimization science" — text-level vs raster-level operations, lossless visual equivalence, editability tradeoff |

### 5.4 `OutputFormat` extension

`core_utils::OutputFormat` currently has `Png | Jpeg | WebP | Avif`. SVG minify output is **SVG text**, not a raster format. Two options:

1. **Add `Svg` variant** to `OutputFormat` — `validate_output` checks for `<svg` or `<?xml` prefix. Clean but extends the enum for a non-raster format.
2. **Skip `validate_output` for SVG minify** — the output is the serialized XML string; validation is "does it parse back?" (round-trip safety). Different validation class.

**Recommendation:** Option 2 — SVG minify validates by re-parsing the output with `roxmltree` and confirming it produces a valid tree. This is the text-equivalent of the raster `validate_output` magic-bytes check.

### 5.5 Limit pipeline alignment

| Limit | WebP compress | SVG minify |
|------|---------------|------------|
| `MAX_INPUT_BYTES` (50 MB soft) | ✅ Applies (WebP file size) | ✅ Applies (SVG file size — also XML bomb protection) |
| `HARD_LIMIT` (150/100 MB) | ✅ Applies | ✅ Applies |
| `MAX_PIXELS` (40 MP) | ✅ Applies (decoded raster) | ❌ Does NOT apply (no rasterization) |
| Risk mode (S6) | ✅ Applies (bypass 40 MP, raise byte caps) | ❌ Does NOT apply (no decode limits to bypass) |
| Session input limit | ✅ Applies | ✅ Applies (byte cap only) |
| Astro downscale | ✅ If output > 40 MP | ❌ N/A |

**`transmutador_svg` already has `set_session_input_limit` and `set_risk_mode` exports. SVG minify reuses these for byte-limit parity, but `set_risk_mode` is a no-op for the minify path (no pixel cap to bypass).**

---

## 6. Risk matrix

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| **R1** | WebP lossy→lossless size inflation confuses users | Trust damage | Mandatory `warn` notice when `probe_webp_format == Lossy`; deep-link to WebP→JPG alternative; estimate-first shows byte delta before transmute |
| **R2** | `image` `webp` feature inflates Wasm beyond budget | NFR-7 violation | Spike gate: measure `transmutador_optimize` Wasm before/after adding `webp` feature. Abort if > +200 KB. |
| **R3** | SVG minify breaks complex SVGs (gradients, filters, masks) | Visual corruption | Round-trip validation: re-parse output, confirm tree structure matches. Fixture matrix from tier3_3_svg_analysis.md §7.4. Manual QA on real-world SVGs (Illustrator, Inkscape exports). |
| **R4** | `oxvg_optimiser` adoption blocked by lightningcss MPL-2.0 | Legal | **Resolved:** lightningcss MPL-2.0 pre-approved by Product Owner (Q10, 2026-06-24). Use unmodified as dependency. Document in SECURITY.md. 4a.2c spike gated only on Wasm size, not license. |
| **R5** | SVG minify aggressive mode (path compaction) alters rendering | Visual regression | Pass 8 (compact paths) is OFF by default. When enabled, `warn` notice. Path compaction must preserve exact geometry (only whitespace/decimal removal, no command substitution). |
| **R6** | WebP animated files silently lose frames | Data loss | **Resolved:** Hard reject animated WebP with error (Q8). Detect `has_animation()` via `WebPDecoder`; error: "Animated WebP not supported for recompress." No silent frame loss. |
| **R7** | SVG XML bomb / billion laughs | DoS / OOM | Existing `validate_svg_input` byte cap. Add entity expansion limit in parser (roxmltree has `ParserOptions`). |
| **R8** | SVG with embedded `<image href="data:...">` rasters grows after minify | Size increase | Detect embedded rasters in `inspect_svg_meta` (already exists — `embedded_raster_count`); `info` notice "SVG contains embedded raster images. Minify optimizes vector data only." |

---

## 7. Execution order (finalized — decisions resolved 2026-06-24)

```
Phase 4a.2a — WebP recompress (v3.9.0)
  ├── S1: Spike — add "webp" feature to transmutador_optimize image dep
  ├── S2: Measure Wasm size delta (gate: < +200 KB)
  ├── S3: Implement probe_webp_format in core_utils (Lossy/Lossless/Extended)
  ├── S4: Implement recompress_webp + recompress_webp_with_options + estimate exports
  ├── S5: Animated WebP detection → hard reject with error
  ├── S6: ToolRegistry entry (webp-compress, category: optimize)
  ├── S7: Worker dispatch + warmup-wasm integration
  ├── S8: Notices (lossy source warning + deep-link to webp-to-jpg, size increase, animated reject, metadata stripped)
  ├── S9: i18n EN + ES
  └── S10: Tests (lossy→lossless, lossless→lossless, color type, animated reject, .svgz)

Phase 4a.2b — SVG minify (v3.9.1 — separate release)
  ├── S1: Implement lightweight minifier (passes 1-6, 10) in transmutador_svg
  ├── S2: Add minify_svg + minify_svg_with_options + estimate exports
  ├── S3: Round-trip validation (re-parse output with roxmltree)
  ├── S4: Accept .svgz input (usvg::Tree::from_data handles gzip); output uncompressed .svg
  ├── S5: ToolRegistry entry (svg-minify, category: optimize)
  ├── S6: Worker dispatch (new route, no rasterization, no MAX_PIXELS)
  ├── S7: UI: optimization level slider (Conservative/Balanced/Aggressive) + advanced collapsible toggles
  ├── S8: Notices (vector optimized, metadata stripped, editability warning on aggressive, embedded raster info)
  ├── S9: i18n EN + ES
  ├── S10: Tests (fixture matrix, metadata strip, whitespace collapse, path compact, .svgz input, round-trip)
  └── S11: Manual QA on Illustrator + Inkscape SVG exports

Phase 4a.2c (future, post-4a.2b) — SVG minify aggressive (Option A spike)
  ├── Spike oxvg_optimiser Wasm compilation + size measurement
  ├── lightningcss MPL-2.0 pre-approved (Product Owner decision 2026-06-24)
  ├── If Wasm size < 3 MB: integrate oxvg_optimiser for passes 7-9 + CSS minification
  └── If Wasm size >= 3 MB: extend custom minifier with manual passes 7-9

Phase 4a.2d (future, post-4a.2a) — WebP resize (deferred)
  └── Add webp-resize tool reusing optimize resize pipeline + VP8L re-encode
```

---

## 8. Resolved decisions (Product Owner sign-off — 2026-06-24)

All 10 architectural decisions resolved. Recommendations accepted as-is.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| **Q1** | WebP recompress: reject lossy WebP or accept with warning? | **Accept with warning** | Camaleon doctrine is honest, user decides. Rejecting limits usefulness; warning preserves trust. Estimate-first shows byte delta before transmute. |
| **Q2** | WebP resize in same phase or deferred? | **Deferred to 4a.2d** | Ship WebP compress first (4a.2a), validate the WebP decode→re-encode pipeline, then add resize as sub-phase. Lower risk, faster delivery of core value. |
| **Q3** | SVG minify: Option B (custom) or Option A (oxvg) for first ship? | **Option B first, Option A later** | Zero deps, zero license risk, ships immediately in 4a.2b. Option A (oxvg_optimiser) is a future enhancement (4a.2c) for aggressive optimization. |
| **Q4** | SVG minify: extend `transmutador_svg` or new crate? | **Extend `transmutador_svg`** | Shared parsing infrastructure (usvg/roxmltree), minimal Wasm size delta (+5-20KB). Split only if oxvg_optimiser bloats beyond 3 MB NFR-7. |
| **Q5** | SVG minify: accept `.svgz` (gzipped SVG) input? | **Accept .svgz input** | `usvg::Tree::from_data` already handles gzip. Output as uncompressed `.svg`. Matches existing transmutador_svg behavior for SVG→PNG/JPEG. |
| **Q6** | SVG minify: should output be gzipped (.svgz) optionally? | **Backlog — not in 4a.2** | Ship uncompressed `.svg` output first. Add gzip output toggle later if user demand. Gzip typically 60-80% on already-minified SVG text. |
| **Q7** | WebP `OutputFormat::WebP` validation already exists? | **Yes — confirmed** | `core_utils::OutputFormat::WebP` validates RIFF `WEBP` magic. Already implemented for `transmutador_encode` (§6.5). No new validation needed. |
| **Q8** | Should `webp-compress` support animated WebP (frame-by-frame re-encode)? | **Reject with error** | Detect `has_animation()` via `WebPDecoder`. Error: "Animated WebP not supported for recompress." Cleanest — no silent frame loss, no complex frame sequencing. |
| **Q9** | SVG minify: expose individual pass toggles or just optimization level? | **Level + advanced toggles** | Primary: optimization level slider (Conservative/Balanced/Aggressive). Advanced ▾: individual pass checkboxes (strip comments, strip metadata, collapse whitespace, compact paths). Matches resize filter pattern (3 visible + 2 advanced). |
| **Q10** | `lightningcss` MPL-2.0: is it acceptable for Camaleon (MIT)? | **Acceptable as-is** | We use lightningcss unmodified as a dependency — no modification to their source. Standard dependency usage. Compatible with MIT per SPDX. Document in SECURITY.md. Pre-approved for 4a.2c spike. |

---

## 9. Competitor positioning

| Capability | Squoosh | TinyPNG | SVGO | Camaleon (target) |
|------------|---------|---------|------|-------------------|
| WebP lossless recompress | ✅ (libwebp) | ❌ | ❌ | ✅ (pure Rust VP8L) |
| WebP lossy recompress | ✅ (libwebp C→Wasm) | ❌ | ❌ | ❌ (pure-Rust constraint) — honest notice |
| SVG minify | ❌ | ❌ | ✅ (JS, server) | ✅ (pure Rust, browser-local) |
| SVG minify + rasterize | ❌ | ❌ | ❌ | ✅ (unique — same tool family) |
| Privacy (zero upload) | ✅ | ❌ (cloud) | ❌ (CLI/server) | ✅ |
| Offline (PWA) | ✅ | ❌ | ❌ | ✅ |
| Honesty notices | ❌ | ❌ | ❌ | ✅ (unique) |
| Estimate-first UX | ❌ | ❌ | ❌ | ✅ (unique) |
| Risk Mode | ❌ | ❌ | ❌ | ✅ (unique) |

**Camaleon's unique position:** The only privacy-first, browser-native tool that combines **WebP lossless recompress** with **SVG minify** in a single interface, with honest notices about the lossy WebP limitation. SVGO is the gold standard for SVG minification but runs server-side. Camaleon brings it to the browser with zero upload.

---

## 10. References

| Doc | Role |
|-----|------|
| `docs/planning/tier4_plan.md` §8 | 4a.2 backlog definition |
| `docs/planning/compress_premium_roadmap.md` | Compress A-E evolution (prior art) |
| `docs/planning/resize_premium_roadmap.md` | Resize Premium evolution (prior art) |
| `docs/planning/compress_before_vs_after.md` | Pipeline evolution summary |
| `docs/planning/tier3_3_svg_analysis.md` | SVG format science + spike results |
| `docs/planning/tier3_3_svg_spike_results.md` | resvg/usvg Wasm viability (1.63 MB) |
| `docs/SPEC.md` §5.12 | WebP format science |
| `docs/SPEC.md` §5.10 | StripAll metadata policy |
| `docs/SPEC.md` §12.5 | Tier 4a normative spec |
| `docs/SPEC.md` §7.4 | Verde Camaleón design system |
| `motor_transmutacion/transmutador_optimize/src/lib.rs` | Current optimize implementation (842 KB Wasm) |
| `motor_transmutacion/transmutador_encode/src/lib.rs` | WebP lossless encode (VP8L via image crate) |
| `motor_transmutacion/transmutador_svg/src/lib.rs` | SVG rasterizer (resvg/usvg, 1.63 MB Wasm) |
| `frontend/src/lib/tools/tool-registry.ts:717-914` | Current optimize tool definitions |
| `frontend/src/lib/wasm/wasm-crates.ts` | Wasm crate registry (13 crates) |
| `image-webp` crate 0.2.4 | Pure-Rust WebP codec (VP8L lossless encode only) |
| `webp` crate 0.3.1 | libwebp-sys wrapper (NOT Wasm-viable) |
| `oxvg_optimiser` crate 0.0.5 | Pure-Rust SVG optimizer (40+ jobs, lightningcss dep) |
| `lightningcss` crate 1.0.0-alpha | CSS minifier (MPL-2.0 license) |

---

*Technical investigation for Tier 4a.2 Matrix Expand. All 10 architectural decisions resolved (Product Owner sign-off 2026-06-24). Roadmap finalized: **4a.2a WebP compress (v3.9.0)** → **4a.2b SVG minify (v3.9.1)** → **4a.2c oxvg spike (future)** → **4a.2d WebP resize (future)**. WebP recompress = lossless VP8L re-encode with honest lossy-source warnings. SVG minify = lightweight custom minifier (zero deps) with future oxvg_optimiser upgrade path. Both tools extend existing crates, align with Verde Camaleón design system, and follow the estimate-first + honesty-notice doctrine established by Compress Premium A-E.*
