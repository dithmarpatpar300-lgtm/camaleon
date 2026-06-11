# Camaleon — System Specification (SPEC)

> **Authoritative source of truth** for architecture, structure, and functional / non-functional requirements.
>
> - **Chief Architect (Cursor)** owns this document.
> - **OpenCode** must read SPEC before every task and **update SPEC** at task completion to reflect any architectural or behavioral change introduced.
> - If code and SPEC disagree, **SPEC wins** until a deliberate amendment is recorded.

**Version:** 2.1.1-avif  
**Last updated:** 2026-06-11  
**Status:** v2.1.1 on `main` — Tier 3.1 AVIF pair complete (Phase 3.1.0–3.1.2); Engine v1.5.1

---

## 1. Vision & Principles

### 1.1 Mission

Camaleon transmutes **image** formats entirely inside the user's browser. Privacy is non-negotiable: file bytes never leave the client.

### 1.3 Product scope — images first (normative)

Camaleon is an **image platform** first. Expansion follows a fixed priority ladder. Do not skip tiers or mix document tooling into image tiers without an explicit SPEC amendment.

| Ladder | Name | What it is | Status |
|--------|------|------------|--------|
| **A** | **Image transmutation** | Format-to-format raster conversion (decode → policy → encode) | ✅ **Shipped** — Tiers 1–2 + Semantic Alpha Engine (v1.11.0) |
| **B** | **Modern image formats** | AVIF, SVG→raster, HEIC (spike-gated) | 🚧 **Tier 3 in progress** — AVIF→PNG/JPEG ✅ v2.1.1; encode next (3.2) |
| **C** | **Image optimization** | Same-format re-encode: compress, resize (metrics-first) | 📋 **Tier 4a** — planned after Tier 3 |
| **D** | **Image editing** | Crop, rotate, flip on raster (Wasm + canvas UI) | 📋 **Tier 4b** — planned after Tier 4a |
| **E** | **Documents** | PDF merge/split, PDF→images — non-raster domain | 🚫 **Deferred** — far horizon; separate planning doc required |

**Out of scope (unless amended):** server uploads, accounts, cloud storage, ML tools (e.g. watermark removal), and any tool whose primary artifact is not a raster image file.

**Competitor mapping:** suites like [Convertify](https://herramientas-imagen.pages.dev/en/) bundle conversion + optimization + editing + documents in one landing. Camaleon **matches depth on image transmutation first**, then adds optimization and editing on the **same Rust/Wasm engine**, and treats **documents as a later product line** — not v2.0 scope.

**Registry implication:** `ToolDefinition.category` today is `"image"` only. Future values `"optimize"` and `"edit"` are allowed in Tier 4. `"document"` requires a new SPEC section and ROADMAP phase before any implementation.

### 1.2 Architectural Principles

| # | Principle | Implication |
|---|-----------|-------------|
| P1 | **Privacy by design** | No server-side conversion; no analytics on file content |
| P2 | **Modular transmutators** | One Rust crate per conversion direction; no monolithic converter |
| P3 | **Worker isolation** | All Wasm execution on Web Workers; UI thread never blocks |
| P4 | **Explicit contracts** | Wasm public APIs are typed, documented, versioned |
| P5 | **Fail loudly** | Errors return structured messages; UI never silently drops failures |
| P6 | **SPEC sync** | Every merge-worthy change updates this document |
| P7 | **Metadata strip by default** | Output files must not carry source EXIF/XMP/text chunks unless an explicit opt-in policy is added and documented (§5.10) |

---

## 2. System Context

```mermaid
flowchart LR
    User([User]) --> UI[Next.js UI]
    UI -->|postMessage| Worker[Web Worker]
    Worker -->|wasm-bindgen| Wasm[Rust / Wasm Module]
    Wasm --> Worker
    Worker --> UI
    UI -->|download blob| User
```

**Trust boundary:** Everything inside the browser sandbox. No external services in the conversion path.

---

## 3. Repository Structure

```
camaleon/
├── docs/
│   ├── SPEC.md              ← this document
│   ├── ROADMAP.md           ← phased delivery plan
│   ├── GOVERNANCE.md        ← roles, workflow, prompt rules
│   ├── prompts/             ← archived prompts from Chief Architect
│   └── reports/             ← OpenCode technical reports ({task}_{response}.md)
├── scripts/
│   ├── build-wasm.ps1       ← Wasm build script (Windows PowerShell)
│   └── build-wasm.sh        ← Wasm build script (Unix / CI)
├── frontend/                ← Next.js presentation + worker orchestration
│   ├── public/
│   │   └── wasm/            ← Wasm artifacts (gitignored, generated)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   └── release-comms/  ← Onboarding, changelog modal, What's New drawer
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   └── releases/    ← Release catalog (manifest + entries + localStorage keys)
│   │   ├── types/           ← Shared TypeScript declarations
│   │   └── workers/
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
└── motor_transmutacion/     ← Rust workspace (Wasm engine)
    ├── Cargo.toml
    ├── core_utils/
    ├── transmutador_jpg/    ← JPEG → PNG  (v0.5.5 — active)
    ├── transmutador_png/    ← PNG → JPEG  (v0.5.6 — active)
    ├── transmutador_webp/   ← WebP → PNG + WebP → JPEG (v1.7.0–1.7.2 — active)
    └── transmutador_encode/ ← PNG/JPEG → WebP  (Tier 1 — planned §6.5)
```

> **Planned crates** (no code yet) are documented here so OpenCode has the required naming convention before implementation begins. Do not create these crates until the corresponding planning prompt is issued.

### 3.1 Layer Responsibilities

| Layer | Path | Responsibility |
|-------|------|----------------|
| Presentation | `frontend/src/app`, `components/` | UX, dropzone, download trigger, status display |
| Orchestration | `frontend/src/hooks/` | Worker lifecycle, message dispatch, state |
| Concurrency | `frontend/src/workers/` | Load Wasm, transfer bytes, return results |
| Shared logic | `motor_transmutacion/core_utils/` | Error types, validation, shared helpers |
| Transmutators | `motor_transmutacion/transmutador_*/` | Format-specific encode/decode + Wasm export |

**Rule:** Transmutator crates MUST NOT depend on each other. Shared code goes in `core_utils`.

---

## 4. Technology Stack (Locked)

| Concern | Choice | Notes |
|---------|--------|-------|
| UI framework | Next.js (App Router) | `src/app` layout |
| Language (UI) | TypeScript | `strict: true` |
| Styling | Tailwind CSS | v4 acceptable |
| Engine | Rust 2021 workspace | `motor_transmutacion/` |
| Wasm bridge | `wasm-bindgen` + `wasm-pack` | Target `web` |
| Image processing | `image` crate | Per transmutator |
| Concurrency | Web Workers API | Required before MVP |

**Do not substitute** stack elements without Chief Architect amendment to SPEC.

---

## 5. Transmutation Science & Module Doctrine

> **Authoritative foundation** for backend logic. OpenCode and implementers MUST read this section before modifying `core_utils`, `transmutador_jpg`, or `transmutador_png`. Transmutation is **not** a file-extension swap; it is decode-to-raster followed by re-encode under format-specific rules.

### 5.1 Mental Model: What Transmutation Actually Is

Every Camaleon conversion follows the same abstract pipeline:

```
Input bytes → Decode to in-memory raster (pixels) → Re-encode to target format → Output bytes
```

| Term | Definition |
|------|------------|
| **Raster** | Full-resolution pixel buffer in memory (typically `width × height × channels` bytes) |
| **Decode** | Decompress / parse input format into raster |
| **Re-encode** | Compress / serialize raster into output format |
| **Transmutation** | The full decode + re-encode pipeline for one direction |

**Critical invariant:** `transmutador_jpg` (JPEG→PNG) and `transmutador_png` (PNG→JPEG) are **not inverse operations**. They operate on different encoding philosophies and MUST remain independent crates (Principle P2).

**Non-identity law:**

```
JPEG → PNG → JPEG  ≠  original JPEG   (generational loss)
PNG  → JPEG → PNG  ≠  original PNG   (generational loss + possible alpha loss)
```

A single round-trip may be **visually** near-identical while still being **mathematically** lossy. Repeated cycles **accumulate** degradation.

---

### 5.2 The Science: JPEG (Lossy, Frequency Domain)

#### 5.2.1 Encoding pipeline (what the file contains)

JPEG compression transforms spatial pixel data into quantized frequency coefficients:

1. **Color space conversion:** `RGB → YCbCr` (luminance + chrominance). Human vision is more sensitive to brightness than color.
2. **Chroma subsampling** (typically `4:2:0`): chrominance planes are downsampled (~75% of color spatial information discarded **before** DCT). This is **irreversible** at decode time (upsampled, not recovered).
3. **Block partition:** image split into 8×8 pixel blocks.
4. **DCT-II (Discrete Cosine Transform)** per block — spatial → frequency domain:

\[
F(u,v) = \tfrac{1}{4}\, C(u)\, C(v) \sum_{x=0}^{7}\sum_{y=0}^{7} f(x,y)\cos\!\left[\frac{(2x+1)u\pi}{16}\right]\cos\!\left[\frac{(2y+1)v\pi}{16}\right]
\]

5. **Quantization (loss step):**

\[
\hat{F}(u,v) = \mathrm{round}\!\left(\frac{F(u,v)}{Q(u,v)}\right)
\]

The quantizer matrix \(Q\) (scaled by quality factor) zeroes or compresses high-frequency coefficients. **Information is permanently discarded here.**

6. **Entropy coding** (zigzag + RLE + Huffman): **lossless** packing of quantized coefficients.

#### 5.2.2 What survives in a JPEG file

- Quantized DCT coefficients + Huffman tables + metadata (EXIF, optional ICC profile).
- **Not** raw pixels. **Not** transparency (JPEG has no alpha channel).
- Visible artifacts when pushed hard: 8×8 blocking, ringing on edges, color bleeding, mosquito noise in gradients.

#### 5.2.3 Decode behavior (what Camaleon sees in memory)

Decoding reverses entropy coding and DCT, re-upsamples chroma, converts to RGB (or RGBA if the decoder pads). The resulting raster **embeds all JPEG artifacts** from the source file. No decode step can recover frequencies zeroed during quantization.

---

### 5.3 The Science: PNG (Lossless, Spatial Domain)

#### 5.3.1 Encoding pipeline

1. **Raster input:** exact pixel values per channel (RGB or RGBA).
2. **Filter pass** (per scanline): None, Sub, Up, Average, or **Paeth** — predicts each pixel from neighbors; stores **residuals** to improve compressibility.
3. **DEFLATE** (LZ77 + Huffman): lossless dictionary compression on filtered data.

PNG stores **exact pixel values** (for a given color type and bit depth). No DCT, no quantization, no chroma subsampling.

#### 5.3.2 Color types and when they matter

| PNG color type | Channels | Typical use |
|----------------|----------|-------------|
| Grayscale | 1 | Monochrome imagery |
| Indexed (palette) | 1 + palette | ≤256 colors — logos, UI, screenshots with flat regions |
| Truecolor (RGB) | 3 | Opaque photos, JPEG-derived rasters |
| Truecolor + alpha (RGBA) | 4 | Transparency, compositing, editing workflows |

Choosing the wrong color type wastes bytes (e.g. RGBA for opaque JPEG-derived content adds ~33% raster size for zero benefit).

---

### 5.4 Direction A: JPEG → PNG (`transmutador_jpg`)

#### 5.4.1 What happens algorithmically

1. **Decode JPEG** → full RGB (or equivalent) raster in memory. Artifacts are **baked into** pixels.
2. **Encode PNG** → lossless storage of that exact raster.

PNG does **not** restore discarded JPEG information. It only preserves the decoded result perfectly. Photographic content has **high per-pixel entropy**, so DEFLATE achieves modest ratios → **large file size** is expected and correct.

#### 5.4.2 Entropy and size dynamics

| Domain | Typical entropy | Compressibility |
|--------|-----------------|-----------------|
| JPEG file (frequency + Huffman) | Low on disk | High (lossy) |
| Decoded photo raster | High | Low for DEFLATE |
| PNG of same photo | High (preserved) | Low — **file often 5–15× larger than source JPEG** |

This is **not a bug**; it is information-theoretic consequence of moving from lossy frequency coding to lossless spatial coding.

#### 5.4.3 Module objectives (priority order)

| Priority | Objective | Requirement |
|----------|-----------|-------------|
| P1 | **Bit-exact raster fidelity** | Decoded pixels re-encoded without additional loss |
| P2 | **Correct color type** | JPEG sources → **RGB** PNG (IHDR color type 2), not RGBA (6); grayscale expands to RGB. ✅ Enforced via explicit `to_rgb8()` + `PngEncoder` with `ExtendedColorType::Rgb8` (v0.5.5) |
| P3 | **Honest format semantics** | Document that PNG is a **master / edit** format, not a size-reduction format |
| P4 | **Compression effort** | PNG filter (`FilterType::Adaptive`) + DEFLATE level tunable (1–9). Default 6 via `JpgToPngOptions`. Configurable via `transmutar_jpg_a_png_with_compression` (v0.5.5) |
| P5 | **Palette / indexed PNG** | For suitable content (flat colors), optional indexed mode — future optimization |

**Ideal use cases:** logos, screenshots, text/UI captures, images requiring transparency in downstream editing, intermediate masters, avoiding further generational JPEG loss.

**Anti-goals (must not promise):**

- Smaller files than source JPEG for photographs.
- Quality "recovery" from JPEG compression.
- Invisible improvement of JPEG artifacts.

**Future explicit mode (not default):** lossy PNG via palette quantization (e.g. pngquant-style) — separate flag; changes module contract.

#### 5.4.4 Current implementation alignment (v0.5.5)

- `PngEncoder::new_with_quality(&mut buf, CompressionType::Level(n), FilterType::Adaptive)` — **P4 ✅** (compression configurable 1–9; default 6).
- `ExtendedColorType::Rgb8` via explicit `img.to_rgb8()` + `PngEncoder::write_image` — **P2 ✅** (IHDR color type 2 enforced; never RGBA for JPEG sources).
- Grayscale JPEG expands to RGB — **P2 ✅**.
- `write_to(ImageFormat::Png)` replaced with explicit encoder — full control over color type and compression.
- No palette optimization — **P5 deferred**.

---

### 5.5 Direction B: PNG → JPEG (`transmutador_png`)

#### 5.5.1 What happens algorithmically

1. **Decode PNG** → exact raster (may include alpha).
2. **Re-encode JPEG** → full lossy pipeline (subsampling + DCT + quantization + Huffman).

The output discards information according to quality setting and encoder choices. **Alpha cannot be stored in JPEG.**

#### 5.5.2 Alpha and background composition (critical)

When source PNG contains transparency, JPEG encoding requires **flattening** onto an opaque background. Silent defaults (e.g. black) cause the classic "wrong background" bug.

| Policy | Status |
|--------|--------|
| **Explicit `BackgroundFill` policy** (default: white `#FFFFFF`; compositing via `C_out = round((α·C_fg + (255-α)·C_bg) / 255)` per channel) | ✅ Implemented (v0.5.4) |
| Document in errors/UI when alpha is detected and flattened | ✅ Semantic Alpha Engine (v1.11, §5.5.3) |

#### 5.5.3 Semantic Alpha Engine (meaningful transparency)

Lossy transmutators that flatten alpha (PNG/WebP/GIF/BMP/TIFF → JPEG) must distinguish **structural alpha** (container says a channel may exist) from **meaningful alpha** (at least one pixel with α &lt; 255, or GIF equivalent after composite).

| Term | Definition | Drives |
|------|------------|--------|
| **Structural alpha** | Header/tags indicate alpha capability (RGBA IHDR, TIFF samples ≥ 4, BMP 32-bit, VP8X bit, GIF GCE flag) | Internal diagnostics only |
| **Meaningful alpha** | Pixel data would change if alpha were ignored | `TransparencyNotice`, background picker, flatten at encode |

**Policy:**

1. **UI / prepare** — Wasm `assess_alpha` / `assess_page_alpha` returns `AlphaAssessment.has_meaningful_alpha`. `TransparencyNotice` is shown **only** when meaningful alpha is true. False positives (opaque RGBA TIFF) are forbidden.
2. **Encode** — Full raster scan via `core_utils::semantic_alpha::dynamic_image_has_meaningful_alpha`. Flatten runs only when meaningful; opaque RGBA skips flatten (RGB JPEG path).
3. **Probe tier** — Prepare may downscale to max **512 px** edge and sample up to **8192** pixels. Encode tier is authoritative on the full decoded image.
4. **Opt-in** — Tools with `background` color option spec consume the engine automatically (`frontend/src/lib/semantic-alpha/`).

**Implementation:** `motor_transmutacion/core_utils/src/semantic_alpha/`; per-crate Wasm assess exports; plan: `docs/planning/semantic_alpha_engine_plan.md`.

#### 5.5.4 Quality and encoder levers

| Lever | Role | Current / target |
|-------|------|------------------|
| **Quality factor** | Scales quantizer matrix; primary perceptual control | `DEFAULT_JPEG_QUALITY = 85`; `MIN=1`, `MAX=100`; `transmutar_png_a_jpg_with_quality(bytes, quality)` Wasm export ✅ (v0.5.4) |
| **Chroma subsampling** | `4:2:0` max compression vs `4:4:4` color fidelity | `JpegEncoder` (image v0.25) defaults to **4:2:0** and **does not expose** a sampling-factor setter in its public API. `4:4:4`/`4:2:2` control **requires an encoder swap** (see §5.5.7). Deferred to `refine_jpeg_encoder_swap`. |
| **Optimized Huffman** | Smaller files at same quality | `image` crate uses fixed standard tables and exposes no optimization toggle. Requires encoder swap (mozjpeg/jpeg-encoder, §5.5.7). |
| **Progressive JPEG** | Perceived faster load on web | Future optional |
| **Metadata strip** | Privacy + bytes (EXIF, ICC) | ✅ StripAll verified (v0.5.3) |

**Quality guidance:**

| Range | Effect |
|-------|--------|
| `< 70` | Visible artifacts on most photos |
| `75–85` | Sweet spot for web delivery ("visually near-lossless") |
| `> 95` | Diminishing returns; file size spikes |

#### 5.5.5 Module objectives (priority order)

| Priority | Objective | Requirement |
|----------|-----------|-------------|
| P1 | **Controlled lossy compression** | Minimize bytes for target perceptual quality |
| P2 | **Explicit quality parameter** | Default 85; exposed in API when Wasm contract extended |
| P3 | **Alpha flatten policy** | Configurable background; never silent black unless specified |
| P4 | **Appropriate subsampling** | `4:2:0` for photos default; `4:4:4` option for text-in-image edge cases — future |
| P5 | **Generational loss awareness** | Re-JPEG of already-JPEG content should be documented as cumulative |

**Ideal use cases:** photographs, web delivery, bandwidth-limited sharing, final assets (not archival masters).

**Anti-goals:**

- JPEG for sharp text / flat color logos (ringing, muddy edges).
- Claiming lossless or reversible conversion.

#### 5.5.6 Current implementation alignment (v0.5.4)

- `JpegEncoder::new_with_quality(..., quality)` — **P1/P2 ✅** (quality configurable via `transmutar_png_a_jpg_with_quality`; default 85 via `transmutar_png_a_jpg`).
- Alpha flatten onto `BackgroundFill::WHITE` — **P3 ✅** (manual compositing with `(α·C_fg + (255-α)·C_bg + 127) / 255`; `BackgroundFill` is configurable).
- Subsampling — **P4 ✅ documented** (`4:2:0` via `image` crate `JpegEncoder` default; `4:4:4` toggle deferred — see §5.5.7).
- Optimized Huffman — **P5 deferred** (see §5.5.7).

#### 5.5.7 Encoder-swap doctrine

The `image` crate `JpegEncoder` (v0.25) is intentionally minimal: it exposes **only** a quality factor (`new_with_quality`). It does **not** expose chroma subsampling selection, Huffman table optimization, or progressive scan mode. These are **encoder-level capabilities** that cannot be unlocked from the `image` API — they require replacing the JPEG encode backend. This is a deliberate architectural boundary, **not** a Camaleon defect.

**Candidate backends (decision pending — `refine_jpeg_encoder_swap`):**

| Backend | Subsampling | Optimized Huffman | Progressive | Wasm build risk | Notes |
|---------|-------------|-------------------|-------------|-----------------|-------|
| `image` `JpegEncoder` (current) | ❌ (fixed 4:2:0) | ❌ (standard tables) | ❌ | None (baseline) | Quality-only |
| **`jpeg-encoder`** (vstroebel, pure Rust) | ✅ `set_sampling_factor` | partial | ✅ | **Low** — pure Rust, clean `wasm32-unknown-unknown` | **Recommended** for subsampling control with minimal build risk |
| **`mozjpeg`** (C bindings) | ✅ | ✅ (trellis) | ✅ | **High** — `cc`/C toolchain in `wasm-pack`; larger binary | Best ratio; adopt only if compression ratio is a product goal |

**Doctrine:**

- Default subsampling remains **4:2:0** (correct for photographic content) regardless of backend.
- A `ChromaSubsampling` enum (`S444 | S422 | S420`) makes invalid factors **unrepresentable** (defense in depth, §5.11).
- `4:4:4` matters for **text-in-image / sharp colored edges** (screenshots, rasterized logos) where `4:2:0` causes color bleeding; surface it as an advanced PNG→JPG option only after the swap lands.
- Encoder swap is a **backend-only** task (new `0.5.x`-class engine version); it does not alter the worker protocol beyond an additional optional `subsampling` parameter.

---

### 5.6 Empirical Cycle Analysis (Reference Benchmark)

Documented round-trip using the same source asset (Product Owner validation, 2026-06-02):

| Stage | Format | Size (bytes) | Δ vs previous | Δ vs original |
|-------|--------|--------------|---------------|---------------|
| Original | `.jpg` | 1,242,718 | — | — |
| Transmute | `.png` | 11,161,997 | **×8.98** (+898%) | ×8.98 |
| Re-transmute | `.jpg` | 1,264,369 | ÷8.83 | **+1.74%** (+21,651 B) |

#### 5.6.1 Interpretation: PNG expansion (×8.98)

- Confirms **full decode → lossless re-encode** behavior (correct, not defective).
- PNG stores JPEG artifacts **perfectly** plus full RGB resolution; photographic entropy prevents strong DEFLATE gains.
- The multiplier approximates how aggressively the original JPEG discarded information (~89% of raster entropy not needed for perceptual quality).
- **Raster size estimate:** PNG ~11.16 MB on opaque photo suggests raw raster on the order of **14–22 MB** (3 bytes/pixel, typical DEFLATE ratio ~1.3–2×) → roughly **5–7 megapixels** (e.g. ~2800×2000). Used for memory planning.

#### 5.6.2 Interpretation: return to JPEG (+1.74%)

- Re-compression of artifact-laden raster at Q≈85.
- **Visually near-identical** because perceptually important loss already occurred in first JPEG; second quantization adds small incremental DCT error — below visual threshold in **one** generation.
- **+21,651 bytes vs original** suggests Camaleon encoder slightly less bit-efficient than original JPEG producer (baseline Huffman, table differences) — optimization opportunity, not functional failure.
- **Warning:** repeated cycles will accumulate blocking/ringing even when each step "looks fine."

#### 5.6.3 Doctrine for user-facing messaging (future UI copy)

- JPEG → PNG: warn that **file size will increase** for photos; purpose is fidelity/editing, not shrinking.
- PNG → JPEG: warn that **quality loss is irreversible**; alpha will be flattened.
- Any → re-encode same lossy format: warn about **generational degradation**.

---

### 5.7 Memory Safety & Decompression Bombs

#### 5.7.1 The gap in current validation

`core_utils::validate_input` enforces **`MAX_INPUT_BYTES`** on **compressed input file size** only.

**Peak memory consumption is dominated by the decoded raster:**

\[
\text{memory}_{\text{raster}} \approx width \times height \times channels
\]

A small PNG file (low byte count) can decode to **hundreds of megabytes** if dimensions are extreme (decompression bomb / "zip bomb" analog for images).

The empirical cycle proves the inverse: **1.24 MB JPEG → ~14–22 MB raster** — input bytes are a poor proxy for memory risk.

#### 5.7.2 Required safeguards (implemented — v0.5.1)

| Guard | Description | Owner | Status |
|-------|-------------|-------|--------|
| `MAX_PIXELS` | Cap `width × height` at **40,000,000** (40 MP) — covers 8K workflows up to ~7680×4320 (33 MP) with headroom for professional DSLR photos while preventing decompression bombs | `core_utils` | ✅ Implemented |
| **Dimension probe** | `probe_dimensions(bytes)` reads PNG IHDR / JPEG SOF markers **before** full decode; pure byte-level parsing, no `image` crate dependency | `core_utils` | ✅ Implemented |
| **Raster budget error** | `DimensionsTooLarge { width, height, pixel_count, max_pixels }` with clear English Display: `"Image dimensions {width}x{height} ({pixel_count} pixels) exceed maximum allowed ({max_pixels} pixels)"` | `core_utils` | ✅ Implemented |
| **Zero dimension guard** | `InvalidDimensions { reason }` rejects `width == 0` or `height == 0` in PNG IHDR / JPEG SOF | `core_utils` | ✅ Implemented |
| **Format-aware gating** | `validate_input` only enforces pixel cap on known magic (PNG / JPEG SOI); unknown formats pass through to byte-size check only | `core_utils` | ✅ Implemented |

**Edge cases covered:**
- Truncated PNG/JPEG headers → `InvalidDimensions` error (not silent pass, not panic)
- JPEG with SOI but no valid SOF in first 64 KB → error
- Empty input still rejected first (existing check preserved)
- `pixel_count()` guards `u32 × u32` overflow via `checked_mul`

---

### 5.8 Planned Backend Refinements (Pre–v1.0.0)

Tactical pause after Phase 3 to align code with this doctrine. These are **not** Phase 4 UI polish; they are engine hardening on `0.y.x` versions.

| Task ID | Scope | SPEC targets | Version target |
|---------|-------|--------------|----------------|
| `refine_core_utils_dimensions` | `MAX_PIXELS`, header dimension probe, tests | §5.7, §6.1 | v0.5.1 ✅ |
| `refine_metadata_policy` | Verify StripAll behavior; regression tests; encoder audit; core_utils scanners | §5.10 | v0.5.3 ✅ |
| `refine_transmutador_jpg` | Color-type policy enforcement, PNG compression effort doc | §5.4 | v0.5.5 ✅ |
| `refine_transmutador_png` | Alpha flatten policy, quality as parameter, subsampling explicit | §5.5 | v0.5.4 ✅ |
| `refine_png_background_option` | Selectable background fill for alpha flatten (`_with_options`) | §5.5.2 | v0.5.6 ✅ |
| `refine_output_integrity` | Post-encode output validation (non-empty + magic bytes + optional round-trip) + bounded-parameter newtypes | §5.11 | v0.6.6 ✅ |
| `refine_jpeg_encoder_swap` | Replace JPEG encode backend to unlock chroma subsampling / optimized Huffman; `ChromaSubsampling` enum | §5.5.7 | **Planned** |

§5.8 backend refinements through v0.6.6 are **complete**. **v1.0.0 shipped** (UI-5 baseline + CI). Post-1.0: `refine_jpeg_encoder_swap` (§5.5.7), Playwright E2E, UI/UX polish layer.

---

### 5.9 Format Selection Doctrine (Product Rules)

| User intent | Target format | Module | Rationale |
|-------------|---------------|--------|-----------|
| Archival / editing / transparency | PNG | `transmutador_jpg` or future PNG-preserving paths | Lossless pixel storage |
| Web share / small size / photo | JPEG | `transmutador_png` | Lossy optimized for photos |
| Logo with flat colors → PNG | PNG (indexed future) | `transmutador_jpg` | Sharp edges; palette mode future |
| Logo with transparency → JPEG | JPEG (flatten alpha first) | `transmutador_png` | Must apply §5.5.2 policy |

**Camaleon does not** silently change backgrounds or apply lossy PNG unless an explicit future flag is set and documented. **Metadata** is governed by §5.10 (default: strip, not preserve).

---

### 5.10 Metadata Policy (Privacy & File Container Semantics)

> Governs what happens to EXIF, ICC profiles, XMP, JFIF APP segments, and PNG text/chunk metadata during transmutation. Complements Principle **P1** (Privacy by design) and **P7** (Metadata strip by default).

#### 5.10.1 What metadata is

Metadata is **non-pixel information** embedded in the image **file container**, distinct from the decoded raster (pixel buffer).

| Format | Container location | Examples of sensitive or identifying data |
|--------|-------------------|-------------------------------------------|
| **JPEG** | Marker segments (`APP0` JFIF, `APP1` EXIF, `APP2` ICC Profile, `APP13` IPTC/XMP, etc.) | GPS coordinates, camera make/model, serial numbers, capture timestamp, software, orientation, copyright |
| **PNG** | Chunks after IHDR | `tEXt` / `iTXt` (author, comment), `eXIf` (embedded EXIF), `iCCP` (ICC profile), `pHYs` (DPI), `tIME` (last modification) |

Metadata is **not** destroyed when pixels are decoded; it remains in the **source byte stream** until the engine produces a **new output byte stream**.

#### 5.10.2 How Camaleon processes files (why metadata behaves as it does)

Camaleon transmutators follow the pipeline in §5.1:

```
Source file bytes → decode to raster (pixels only) → re-encode to target format → output file bytes
```

The `image` crate (current stack) decodes to an in-memory representation of **pixel values** and re-encodes using **fresh encoder state**. It does **not** implement a metadata preservation pass:

- **JPEG → PNG:** EXIF/APP segments from the source JPEG are **not** copied into output PNG chunks.
- **PNG → JPEG:** `tEXt`, `eXIf`, `iCCP`, etc. from the source PNG are **not** copied into output JPEG APP segments.

**Observed behavior (v0.5.1):** output files are effectively **metadata-stripped** relative to typical user-origin photos. This is a **side effect** of decode→re-encode, not yet enforced by dedicated strip logic or regression tests.

**Encoder-minimal metadata:** the output may still contain **new, minimal** container data the encoder creates (e.g. baseline JFIF APP0 in JPEG, standard PNG IHDR/IDAT/IDAT structure). This is **not** a copy of the user's source metadata and is generally low sensitivity.

#### 5.10.3 Privacy model: who can read metadata?

| Boundary | Risk | Camaleon posture |
|----------|------|------------------|
| **Network** | Third parties intercept uploads | **None** — no server upload; bytes stay in browser (P1) |
| **In-app** | Other browser tabs / extensions reading files | User's browser trust model; Camaleon does not persist files to server |
| **Downloaded output file** | Anyone who obtains the `.jpg`/`.png` can run ExifTool, OS properties, etc. | If metadata exists **in the file**, it is **always readable** — there is no "hidden but preserved" metadata in standard image formats |

**Critical doctrine:** It is **impossible** to "preserve metadata in the output file" while preventing "other users from reading it." Preservation means the data is **in the container**; reading is trivial. Camaleon's privacy guarantee for metadata is: **do not write sensitive source metadata into the output file** (StripAll default).

#### 5.10.4 Policy matrix (normative)

| Policy ID | Name | Behavior | Default? |
|-----------|------|----------|----------|
| `StripAll` | Strip all non-essential container metadata | Output contains pixel data and minimal encoder structure only; no source EXIF/XMP/tEXt/eXIf/ICC from input | **YES — mandatory default** |
| `PreserveColorProfile` | Copy ICC color profile only | Output may embed ICC for color-accurate display; may leak profile fingerprint | No — future opt-in |
| `PreserveExif` | Copy EXIF APP1 (or eXIf) to output | Output may contain GPS, device IDs, timestamps | **No — forbidden as default** (violates P7) |
| `PreserveSelective` | Copy non-GPS EXIF fields only | Complex; requires EXIF parser and field allowlist | No — post-MVP research |

**Normative rule:** Unless `PreserveColorProfile`, `PreserveExif`, or `PreserveSelective` is explicitly implemented, documented, and user-selected, all transmutators MUST behave as **`StripAll`**.

#### 5.10.5 User-facing doctrine (for UI copy — Phase 4+)

| Direction | Message intent |
|-----------|----------------|
| Any transmutation | "Metadata from your original file is not copied to the output. This protects location, device, and other hidden data." |
| JPEG → PNG | "File size may increase. Hidden photo data (EXIF) is not carried over." |
| PNG → JPEG | "Quality loss is irreversible. Transparency is flattened. Embedded descriptions/EXIF are not carried over." |
| Future opt-in preserve | "Warning: downloaded file may contain identifiable metadata." |

#### 5.10.6 What StripAll does NOT mean

| Misconception | Clarification |
|---------------|---------------|
| "StripAll deletes pixels" | False — only **container** metadata is in scope; raster is preserved per module objectives (§5.4, §5.5) |
| "StripAll encrypts metadata" | False — Camaleon does not encrypt; it omits copying |
| "StripAll prevents forensic recovery of JPEG artifacts" | False — JPEG blocking/ringing in pixels remain in PNG (§5.6) |
| "Source file on disk is modified" | False — only the **downloaded output** is produced in memory |

#### 5.10.7 Implementation requirements

**Current state (v0.5.3):** Policy **documented**; behavior **de facto StripAll** via `image` decode→encode; **verified** by automated integration tests in both transmutators.

**Implemented (refine_metadata_policy, v0.5.3):**

1. ✅ Integration test with synthetic JPEG containing fake EXIF APP1 → output PNG has **no** eXIf chunk, no source EXIF payload text.
2. ✅ Integration test with PNG containing `tEXt` chunk → output JPEG has **no** EXIF APP1, no source text string.
3. ✅ Encoder audit: `image::ImageFormat::Png` and `JpegEncoder::new_with_quality` do not embed source metadata. Minimal encoder output includes only standard container headers (JFIF APP0 in JPEG, IHDR/IDAT/IEND in PNG).
4. ✅ Lightweight `core_utils` metadata scanners (`jpeg_contains_exif_app1`, `png_contains_text_chunk`, `png_contains_exif_chunk`, `png_contains_iccp_chunk`) for test assertions — pure byte-level parsing, no EXIF library.

**Forbidden without SPEC amendment:**

- Default-on EXIF preservation.
- Silent GPS or device serial propagation to output.
- Claiming "private metadata" inside a standard downloadable image file.

#### 5.10.8 Relationship to other SPEC sections

| Section | Interaction |
|---------|-------------|
| §5.4 JPG→PNG | StripAll applies; RGB PNG without copying EXIF to `eXIf` chunk |
| §5.5 PNG→JPG | StripAll applies; alpha flatten (§5.5.2) is separate from metadata strip |
| §5.6 Cycle analysis | Size explosion JPG→PNG is pixel/entropy, not metadata |
| §6.1 `core_utils` | Validates bytes/dimensions only; does not parse EXIF |
| NFR-1 Privacy | StripAll supports zero metadata leakage via output file |

---

### 5.11 Output Integrity Protocol (Corruption Prevention)

> Governs validation **after** encoding, and the type-level bounding of user parameters, so that no configuration can ever yield an empty buffer, a truncated file, or an unreadable output. Complements §5.7 (input/memory safety) and NFR-4 (honest error surfacing).

#### 5.11.1 The validation asymmetry (resolved — v0.6.6)

Historically, hardening (§5.7) validated only the **input**. **`refine_output_integrity` (v0.6.6)** added symmetric **output** checks: both `_inner` pipelines call `validate_output` before returning bytes. Round-trip decode and size-coherence heuristics remain deferred (§5.11.3).

#### 5.11.2 Break-point taxonomy

| Break point | Failure mode | Layer | Status |
|-------------|--------------|-------|--------|
| Empty input buffer | encoder 0 bytes / panic | input | ✅ `validate_input` |
| Out-of-range parameter (quality 0 / >100, compression 0 / >9) | invalid encoder state | params | ✅ `validate_quality` / `validate_compression` |
| Decompression bomb (small file → huge raster) | OOM, tab crash | input | ✅ `MAX_PIXELS` pre-decode probe |
| `width × height` overflow | wraparound evades cap | input | ✅ `pixel_count` `checked_mul` |
| Zero dimension (0×N) | undefined encode | input | ✅ probe guards |
| Truncated header / unknown magic | decoder panic | input | ✅ `with_guessed_format` + `map_err` |
| **Empty / truncated output buffer** | corrupt downloaded file | **output** | ✅ `validate_output` (non-empty) |
| **Wrong-format / headerless output** | unreadable file | **output** | ✅ `validate_output` (magic bytes) |
| Silent alpha loss without notice | perceived corruption | UX | ✅ `TransparencyNotice` banner pre-transmute (UI-6) |

The three exposed levers (quality, compression, background RGB) are **orthogonal** — no valid combination produces an invalid result. Background channels are `u8`, so they are always valid by construction.

#### 5.11.3 Required output validations (implemented — v0.6.6)

Applied in the pipeline wrappers (`transmutar_*_inner`) **after** encode, **before** returning bytes across the Wasm boundary:

| Check | Rule | Cost | Priority | Status |
|-------|------|------|----------|--------|
| **Non-empty** | `output.is_empty()` → `ConversionFailed("encoder produced empty output")` | O(1) | **Mandatory** | ✅ |
| **Magic bytes** | output starts with destination signature (`\x89PNG\r\n\x1a\n` for PNG; `\xFF\xD8` for JPEG) | O(1) | **Mandatory** | ✅ |
| **Round-trip sanity** (strict mode) | re-decode output via `ImageReader`; confirm dimensions match the decoded input raster | ~1 extra decode | Optional / opt-in | Deferred (transmutator crates can implement with `image`) |
| **Size coherence** | output suspiciously small for given dimensions → warning, not hard error | O(1) heuristic | Low | Deferred |

Errors must surface as honest English `String` messages (NFR-4), distinct from input errors so the UI can localize them (i18n `errors.*`).

#### 5.11.4 Make invalid parameters unrepresentable (implemented — v0.6.6)

- **Bounded newtypes:** `Quality(u8)` and `Compression(u8)` with a private field and a `try_new(value) -> Result<Self, String>` as the **only** constructor. `Quality::DEFAULT` (85), `Compression::DEFAULT` (6). Downstream code cannot receive an out-of-range value. Free functions `validate_quality` / `validate_compression` delegate to `try_new` for backward compatibility.

#### 5.11.5 Protocol summary

```
INPUT      [✅ implemented — §5.7]
  non-empty · ≤ 50 MB · pre-decode dimension probe · ≤ 40 MP · no zero dim · checked_mul

PARAMETERS [✅ implemented — §5.11.4]
  quality ∈ [1,100] · compression ∈ [1,9] · background RGB (u8, always valid); `Quality`/`Compression` newtypes + Wasm `try_new`

OUTPUT     [✅ implemented — §5.11.3]
  non-empty · destination magic bytes
```

#### 5.11.6 Relationship to other SPEC sections

| Section | Interaction |
|---------|-------------|
| §5.7 Memory safety | Input-side guards; §5.11 is the symmetric output-side guarantee |
| §5.5.2 Alpha flatten | §5.11 adds a recommended pre-transmute "transparency detected" notice (UX) |
| §6.1 `core_utils` | Hosts `validate_output` + `OutputFormat`; transmutators host `Quality`/`Compression` newtypes |
| NFR-4 Error transparency | Output errors surfaced as honest English strings, localized in UI |

---

### 5.12 WebP Format Science (Tier 1 — planned)

> Foundation for `transmutador_webp` (§6.4) and `transmutador_encode` WebP outputs (§6.5).

#### 5.12.1 What WebP Is

WebP is a **dual-mode** raster format developed by Google (2010), based on VP8/VP8L codecs:

| Mode | Encoding | Alpha | Typical use case |
|------|----------|-------|-----------------|
| **Lossy** | VP8 (intra-frame DCT, similar to JPEG) | No (or separate alpha plane) | Photos, thumbnails |
| **Lossless** | VP8L (spatial prediction + entropy) | Yes (RGBA) | Screenshots, graphics, sprites |
| **Extended** | Lossless + alpha plane + ICC/Exif metadata chunks | Yes | General purpose |

**Key properties:**
- Lossy WebP: ~25–35% smaller than JPEG at equivalent visual quality (per Google benchmarks).
- Lossless WebP: ~26% smaller than PNG on average; worse on photographic content.
- Container: RIFF with `WEBP` FourCC; chunk-based (`VP8 `, `VP8L`, `VP8X`, `EXIF`, `XMP `…).

#### 5.12.2 Decode-side policies (WebP → PNG or JPEG)

| Source | Output | Policy |
|--------|--------|--------|
| Lossy WebP | PNG | Decode to raster (RGB/RGBA) → encode PNG. **File size will increase** (same as §5.4 JPG→PNG — entropy expansion). |
| Lossless WebP | PNG | Lossless round-trip of pixels; alpha preserved as RGBA PNG. |
| Lossy WebP | JPEG | Decode → discard alpha if present → re-compress at requested quality. Two-generation lossy — UI **must warn**. |
| Lossless WebP (with alpha) | JPEG | Alpha flatten (same policy as §5.5.2) → JPEG. |
| Metadata | Any | **StripAll** (§5.10) — EXIF, XMP, ICC chunks are not propagated. |

#### 5.12.3 Encode-side policies (PNG/JPEG → WebP)

| Source | Mode | Policy |
|--------|------|--------|
| PNG (opaque) | Lossless WebP (via `image` crate) | RGB; same lossless pixels. |
| PNG (with alpha) | Lossless WebP | RGBA; alpha preserved. |
| JPEG | Lossless WebP | Decode JPEG → re-encode lossless (size likely increases; UI warns). |
| JPEG | Lossy WebP | Decode → re-compress at requested quality. Two-generation lossy — UI warns. |

> **Constraint (v1.7.x):** The `image` crate 0.25 WebP encoder supports **lossless only**. Lossy WebP encode (PNG→WebP lossy, JPG→WebP lossy) requires a dedicated spike to evaluate `webp` crate or `libwebp` WASM bindings — do not ship until spike is validated. The initial `transmutador_encode` WebP output is therefore **lossless** only and must be clearly labeled.

#### 5.12.4 Size expectations

| Conversion | Typical Δ | Explanation |
|------------|-----------|-------------|
| Lossy WebP → PNG | **+5×–20×** | Entropy expansion (same as §5.4.2) |
| Lossless WebP → PNG | **±0–30%** | Near pixel-identical; compression efficiency differences |
| PNG → WebP (lossless) | **−20–30%** | VP8L beats DEFLATE on most graphics; can be larger on photos |
| JPEG → WebP (lossless) | **2×–10× larger** | Lossless of an already-lossy source inflates size |
| WebP → JPEG | Similar to WebP + JPEG quality | Two lossy generations accumulate |

UI hints for each conversion derived from these ranges — same copy doctrine as §5.6.3.

---

## 6. Module Specifications

### 6.1 `core_utils`

**Purpose:** Shared error handling, byte-level utilities, and pre-decode safety checks.

**Status:** Implemented — Phase 1 + dimension guards (v0.5.1) + metadata scanners (v0.5.3).

**Capabilities:**

- `TransmutationError` enum with variants: `EmptyInput`, `InputTooLarge { size, max }`, `DimensionsTooLarge { width, height, pixel_count, max_pixels }`, `InvalidDimensions { reason }`, `ConversionFailed(String)`
- `Display` implementation for `String` conversion at Wasm boundary
- `validate_input(bytes: &[u8]) -> Result<(), String>` — rejects empty, input exceeding session limit (default `MAX_INPUT_BYTES`), and (for PNG/JPEG/BMP magic) dimensions exceeding `MAX_PIXELS` or zero dimensions
- `set_session_max_input_bytes(max)` / `reset_session_max_input_bytes()` — per-Wasm-instance elevated limit (up to `ABSOLUTE_MAX_INPUT_BYTES` = 150 MB desktop / 100 MB mobile via UI)
- `validate_output(bytes: &[u8], format: OutputFormat) -> Result<(), String>` — post-encode integrity: rejects empty output, validates destination magic bytes (PNG signature / JPEG SOI). O(1), mandatory in both `_inner` pipelines (v0.6.6)
- `OutputFormat` enum: `Png | Jpeg | WebP` — WebP validates RIFF `WEBP` magic (Phase 5.3)
- `probe_dimensions`, `pixel_count`, metadata scanners (unchanged)
- `MAX_INPUT_BYTES`: **50 MB** (soft default); `ABSOLUTE_MAX_INPUT_BYTES`: **150 MB**; `MAX_PIXELS`: **40,000,000** (40 MP)

**Tests:** 31 unit tests covering validation, dimension probing, metadata scanners, output validation, and error display formatting.

### 6.2 `transmutador_jpg`

**Purpose:** JPEG → PNG conversion. See **§5.4** for scientific basis and module objectives.

**Crate type:** `["cdylib", "rlib"]`

**Dependencies:** `wasm-bindgen`, `image`, `core_utils` (Phase 1+)

**Public Wasm API:**

```rust
#[wasm_bindgen]
pub fn transmutar_jpg_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String>
// Uses defaults: RGB output, compression=6

#[wasm_bindgen]
pub fn transmutar_jpg_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
) -> Result<Vec<u8>, String>
// Compression 1–9; RGB output. Invalid compression → Err.
```

**Options types (native + Wasm-ready):**

- `JpgToPngOptions { compression: u8 }` — `Default` gives compression 6.
- `validate_compression(compression: u8) -> Result<u8, String>` — rejects 0 and >9.
- `DEFAULT_PNG_COMPRESSION = 6`, `MIN_PNG_COMPRESSION = 1`, `MAX_PNG_COMPRESSION = 9`.

**Behavior:**

1. Validate via `core_utils::validate_input`
2. Decode JPEG via `image::ImageReader`
3. Convert decoded raster to `Rgb8` via explicit `to_rgb8()`
4. Encode PNG via `PngEncoder::new_with_quality` with `CompressionType::Level(n)`, `FilterType::Adaptive`, `ExtendedColorType::Rgb8` — IHDR color type **2 (RGB)**, never **6 (RGBA)**
5. Return PNG bytes or descriptive `String` error

**Pipeline:** `transmutar_jpg_a_png_inner(input, &options)` → validation → `jpg_bytes_to_png_bytes(input, &options)`. Both Wasm exports delegate to `_inner`.

**Tests:** 15 integration tests (valid JPEG→PNG, empty input, corrupt bytes, truncated JPEG, metadata StripAll, IHDR color type=2, grayscale→RGB, pixel values preserved, compression validation, compression vs size, options defaults, IHDR reader). In-memory fixtures via the `image` crate. **Metadata:** `StripAll` verified by integration test (v0.5.3). **Color-type:** explicit RGB enforcement (v0.5.5).

### 6.3 `transmutador_png`

**Purpose:** PNG → JPEG conversion. See **§5.5** for scientific basis and module objectives.

**Status:** Implemented — Phase 3.

**Crate type:** `["cdylib", "rlib"]`

**Dependencies:** `wasm-bindgen`, `image`, `core_utils`

**Public Wasm API:**

```rust
#[wasm_bindgen]
pub fn transmutar_png_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String>
// Uses defaults: quality=85, background=WHITE

#[wasm_bindgen]
pub fn transmutar_png_a_jpg_with_quality(
    input_bytes: &[u8],
    quality: u8,
) -> Result<Vec<u8>, String>
// Quality 1–100; background=WHITE. Invalid quality → Err.

#[wasm_bindgen]
pub fn transmutar_png_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String>
// Quality 1–100; custom background color (r,g,b each 0–255).
```

**Options types (native + Wasm-ready):**

- `PngToJpgOptions { quality: u8, background: BackgroundFill }` — `Default` gives Q85 + white.
- `Quality(u8)` bounded newtype (v0.6.6): private field, `try_new` rejects 0 and >100, `DEFAULT = 85`. Free function `validate_quality` delegates to `try_new`.
- `Compression(u8)` bounded newtype (v0.6.6): private field, `try_new` rejects 0 and >9, `DEFAULT = 6`. Free function `validate_compression` delegates to `try_new`.
- Background channels `u8`, always valid by construction.

**Behavior:**

1. Validate via `core_utils::validate_input`
2. Decode PNG via `image::ImageReader`
3. If alpha detected: manually composite each pixel onto `options.background` using `(α·C_fg + (255-α)·C_bg + 127) / 255`
4. Encode JPEG via `JpegEncoder::new_with_quality` at requested quality; chroma subsampling **4:2:0** (image crate default)
5. Return JPEG bytes or descriptive `String` error

**Pipeline:** `transmutar_png_a_jpg_inner(input, &options)` → validation → `png_bytes_to_jpg_bytes(input, &options)`. Both Wasm exports delegate to `_inner`.

**Tests:** 17 integration tests (valid PNG→JPEG, empty input, corrupt bytes, truncated PNG, metadata StripAll, alpha flatten on white, alpha flatten on black, custom background red, opaque unchanged with custom bg, quality range/zero/overflow, quality vs size, options defaults). In-memory fixtures via the `image` crate. **Metadata:** `StripAll` verified (v0.5.3). **Alpha:** explicit white-background compositing (v0.5.4). **Background:** selectable via `transmutar_png_a_jpg_with_options` (v0.5.6).

---

### 6.4 `transmutador_webp` (Implemented — Phase 5.1, v1.7.0)

**Purpose:** WebP decoding crate. Handles all conversions **from** WebP: WebP→PNG (v1.7.0) and WebP→JPEG (planned Phase 5.2).

**Status:** Implemented — Phase 5.1 (`phase5_webp_to_png`) + Phase 5.2 (`phase5_webp_to_jpg`, v1.7.2).

**Crate type:** `["cdylib", "rlib"]`

**Dependencies:** `wasm-bindgen`, `image = { version = "0.25", default-features = false, features = ["webp", "png", "jpeg"] }`, `core_utils`

> **Wasm note:** Must compile with `default-features = false` to exclude `rayon` (threading breaks in single-threaded Wasm). Features enabled explicitly: `webp` (decode + lossless encode), `png`, `jpeg`.

**Public Wasm API (planned — subject to Architect confirmation before implementation):**

```rust
// Phase 5.1 — WebP → PNG
#[wasm_bindgen]
pub fn transmutar_webp_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String>
// Default PNG compression: 6. RGB or RGBA output based on alpha presence.

#[wasm_bindgen]
pub fn transmutar_webp_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,        // 1–9
) -> Result<Vec<u8>, String>

#[wasm_bindgen]
pub fn estimate_webp_to_png_size(input_bytes: &[u8], compression: u8) -> Result<u32, String>
// CountingWriter pattern — compression 1–9, mirrors estimate_jpg_to_png_size

// Phase 5.2 — WebP → JPEG (implemented v1.7.2)
#[wasm_bindgen]
pub fn transmutar_webp_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,            // 1–100
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String>
// Alpha flatten policy identical to §5.5.2 (PNG→JPEG background composite)

#[wasm_bindgen]
pub fn estimate_webp_to_jpg_size(input_bytes: &[u8], quality: u8) -> Result<u32, String>
```

**Behavior (WebP→PNG):**
1. `validate_input` via `core_utils`
2. Decode WebP via `image::ImageReader` (auto-detects lossy/lossless/extended)
3. If alpha present → RGBA PNG (color type 6); else → RGB PNG (color type 2)
4. Encode PNG via `PngEncoder` with `CompressionType::Level(n)`, `FilterType::Adaptive`
5. `validate_output(bytes, OutputFormat::Png)` via `core_utils`
6. Return bytes or error string

**Policies:** StripAll (§5.10) — RIFF EXIF/XMP chunks not propagated. No alpha loss without UI notice (§5.11.6). Compression range 1–9 (same `validate_compression` from `core_utils`).

**Required tests (Phase 5.1):**
- Lossy WebP → valid PNG (magic bytes, dimensions preserved)
- Lossless WebP → valid PNG
- WebP with alpha → RGBA PNG (color type 6)
- WebP without alpha → RGB PNG (color type 2)
- Empty input → error
- Corrupt bytes → error
- Truncated RIFF → error
- StripAll: output PNG has no EXIF/tEXt chunks from source
- Compression validation (0 and 10 rejected)
- Estimate vs full-encode size within 5% tolerance
- Large WebP within MAX_PIXELS → OK; over → error

---

### 6.5 `transmutador_encode` (Implemented — Tier 1, Phase 5.3–5.4)

**Purpose:** WebP encoding crate. Handles conversions **to** WebP: PNG→WebP and JPEG→WebP.

**Status:** Implemented — Phase 5.3 (`phase5_png_to_webp`, v1.7.3) + Phase 5.4 (`phase5_jpg_to_webp`, v1.7.6).

**Crate type:** `["cdylib", "rlib"]`

**Initial constraint:** lossless WebP encode only via `image` 0.25 `image-webp` feature. Lossy encode requires an additional spike (see §12.3).

**Planned Wasm API:**

```rust
// Phase 5.3 — PNG → WebP (lossless)
#[wasm_bindgen]
pub fn transmutar_png_a_webp(input_bytes: &[u8]) -> Result<Vec<u8>, String>

#[wasm_bindgen]
pub fn estimate_png_to_webp_size(input_bytes: &[u8]) -> Result<u32, String>

// Phase 5.4 — JPEG → WebP lossless (implemented v1.7.6)
#[wasm_bindgen]
pub fn transmutar_jpg_a_webp(input_bytes: &[u8]) -> Result<Vec<u8>, String>

#[wasm_bindgen]
pub fn estimate_jpg_to_webp_size(input_bytes: &[u8]) -> Result<u32, String>
// Warning: lossless of lossy source. UI surfaces §5.12.4 inflation hint.
```

**Policies:** StripAll (§5.10). PNG→WebP preserves alpha via RGBA lossless. JPEG→WebP warns in UI about size inflation (§5.12.4). `validate_output` must verify RIFF `WEBP` magic (`52 49 46 46 xx xx xx xx 57 45 42 50`).

> **OutputFormat extension required:** `core_utils::OutputFormat` must be extended with `WebP` variant when this crate ships. Chief Architect will issue the amendment at implementation time.

---

### 6.10 `transmutador_avif` (Implemented — Tier 3, Phase 3.1.0–3.1.2, v2.1.1)

**Purpose:** AVIF → PNG / AVIF → JPEG decode paths. First Ladder B / Tier 3 crate.

**Status:** Implemented — Phase 3.1.0 spike, 3.1.1 AVIF→PNG (v2.0.0), 3.1.2 AVIF→JPEG + preview UX (v2.1.1).

**Dependencies:** `zenavif`, `zenavif-parse`, `core_utils`, `wasm-bindgen`, `js-sys`

**Key behaviors:**

- `normalize_avif_input` — MIAF `mif1`/`miaf` major brand shim when `avif` compatible brand present
- `inspect_avif_meta` — dimensions, alpha, animation before full decode
- `transmutar_avif_a_png_*` + `estimate_avif_to_png_size` with optional `frame_index`
- `assess_alpha`, `transmutar_avif_a_jpg_*`, `estimate_avif_to_jpg_size` with alpha hint (v1.12.2 pattern)
- Animated AVIF: `frame-preview.worker` + session cache; `RgbaFrameScrubber` shared with GIF
- 8-bit SDR output policy; StripAll default

**Regression reference:** `docs/LIMIT_PIPELINE.md` (byte zones, 40 MP astro path, session limits).

---

## 7. Frontend Specifications

### 7.1 Dropzone (Implemented — Phase 3)

- **Input:** Drag-and-drop and click-to-select
- **Format filter:** `.jpg`, `.jpeg`, `.png` (active); `.webp` (Tier 1 — planned) — auto-routed to correct module by extension
- **Routing (active):**
  - `.jpg` / `.jpeg` → `transmutador_jpg` → outputs `.png` (`image/png`)
  - `.png` → `transmutador_png` → outputs `.jpg` (`image/jpeg`)
- **Routing (Tier 1 — planned, §12):**
  - `.webp` on `/transmute/webp-to-png` → `transmutador_webp` → outputs `.png`
  - `.webp` on `/transmute/webp-to-jpg` → `transmutador_webp` → outputs `.jpg`
  - `.png` on `/transmute/png-to-webp` → `transmutador_encode` → outputs `.webp`
  - `.jpg` / `.jpeg` on `/transmute/jpg-to-webp` → `transmutador_encode` → outputs `.webp`
- **States:**
  - `idle` — Dropzone accepts interactions
  - `processing` — Spinner with file name; repeated drops disabled
  - `success` — Auto-triggers browser download with correct MIME type and extension
  - `error` — User-visible error message rendered in the UI
- Unsupported extensions produce: `"Supported formats: .jpg, .jpeg, .png"`
- Download filename derived from source with extension replaced per module output

### 7.2 Web Worker Protocol (Implemented — Phase 1 + options extension UI-3)

Implemented in `frontend/src/workers/`:

| File | Purpose |
|------|---------|
| `types.ts` | `WorkerRequest`, `WorkerResponse`, `TransmutationModule`, `TransmutationOptions` type definitions |
| `transmutation.worker.ts` | Loads both Wasm modules (jpg + png) via dynamic `import()`, routes by `WorkerRequest.module`, maps `options` to parameterized Wasm exports, returns correct mime/extension per module |

Message shape (TypeScript):

```typescript
type TransmutationOptions = {
  quality?: number;       // PNG→JPG, 1–100
  compression?: number;   // JPG→PNG, 1–9
  background?: RgbColor;  // PNG→JPG alpha flatten
};

type WorkerPurpose = "transmute" | "estimate";

type WorkerRequest = {
  id: string;
  module: "transmutador_jpg" | "transmutador_png" | "transmutador_webp" | "transmutador_encode"; // Tier 1 modules added as they ship
  bytes: ArrayBuffer;
  options?: TransmutationOptions;
  purpose?: WorkerPurpose;   // default "transmute"
};

type WorkerResponseSuccess = {
  id: string;
  ok: true;
  purpose: WorkerPurpose;
  outputSize: number;        // always present
  bytes?: ArrayBuffer;       // transmute only — transferred to main thread
  mime?: string;
  extension?: string;
};
```

**Estimate path (v1.3.0–v1.12.2):** when `purpose === "estimate"`, dual strategy by `enableResultCache` on `WorkerRequest`: (a) cache-enabled — full encode, store bytes in worker **multi-entry `ResultCache`** (LRU, `cacheMaxEntries` from resource profile — v1.12.2), return `{ outputSize, cacheStored }`; (b) cache-disabled — Wasm `estimate_*_size` (`CountingWriter`). **Alpha hint (v1.12.2):** prepare-time `alphaAssessment` passed to worker → optional `alpha_hint` on estimate exports to skip redundant full-raster semantic-alpha scan when safe. **GIF estimate (v1.12.2):** `inspect_gif` uses metadata-only decode; `composite_gif_frame` stops at target frame index. Worker pipeline serializes jobs; coalescing drops superseded requests; transmute preempts estimates. **Transmute fast path (v1.5.0):** matching `fingerprint` → transfer cached bytes (`cacheHit: true`) without re-encode. Fingerprint built on main thread via `buildTransmuteFingerprint`. Estimation never uses `staged.bytes`.

**Worker routing (v0.6.3):**
- `transmutador_jpg` + `options.compression` → `transmutar_jpg_a_png_with_compression`
- `transmutador_jpg` (no options) → `transmutar_jpg_a_png` (defaults)
- `transmutador_png` + `options.background` → `transmutar_png_a_jpg_with_options`
- `transmutador_png` + `options.quality` → `transmutar_png_a_jpg_with_quality`
- `transmutador_png` (no options) → `transmutar_png_a_jpg` (defaults)
- Defaults preserved when no options present; backend validates all ranges

### 7.3 Wasm Artifact Layout (Implemented — Phase 3)

```
frontend/public/wasm/
├── transmutador_jpg/
│   ├── transmutador_jpg.js             ← JS glue (ES module)
│   ├── transmutador_jpg_bg.wasm        ← Wasm binary
│   ├── transmutador_jpg.d.ts
│   └── transmutador_jpg_bg.wasm.d.ts
├── transmutador_png/
│   ├── transmutador_png.js
│   ├── transmutador_png_bg.wasm
│   ├── transmutador_png.d.ts
│   └── transmutador_png_bg.wasm.d.ts
├── transmutador_webp/                  ← Tier 1 planned (§6.4)
│   ├── transmutador_webp.js
│   ├── transmutador_webp_bg.wasm
│   ├── transmutador_webp.d.ts
│   └── transmutador_webp_bg.wasm.d.ts
└── transmutador_encode/                ← Tier 1 planned §6.5 (Phase 5.3+)
    ├── transmutador_encode.js
    ├── transmutador_encode_bg.wasm
    ├── transmutador_encode.d.ts
    └── transmutador_encode_bg.wasm.d.ts
```

Generated by `wasm-pack build --target web`. Active modules built by `scripts/build-wasm.ps1`, `scripts/build-wasm.sh`, or `npm run build:wasm`. The `public/wasm/` directory is gitignored.

Build scripts must be extended to include new crates when they ship. Each new crate = one `wasm-pack build` invocation added to the scripts and to `package.json`'s `build:wasm` script.

---

### 7.4 UI/UX Architecture & Design System (Implemented — UI-1)

> **Status:** Design approved 2026-06-02. **UI-1..UI-5 delivered (v0.6.1–v1.0.0).** UI track complete per ROADMAP.

**Identity — "Verde Camaleón":** dark-first minimalism. Near-black neutrals with a single chameleon-green accent used sparingly (Swiss/Scandinavian restraint, generous whitespace). The theme toggle is part of the brand narrative — the chameleon changes skin. Reference mockup: `assets/camaleon-mockup-b-minimal.png`.

**Brand voice:** alchemical transmutation lexicon ("Transmutar", "Transmutaciones"). Tool identifiers stay clear/technical (`JPG → PNG`); action labels and feedback use the transmutation voice ("Transmutar", "Transmutación completa").

**Design tokens** (single source of truth; implemented as CSS custom properties consumed by Tailwind v4 `@theme`; components MUST NOT hardcode hex values):

Dark theme (base):

| Token | Value | Role |
|-------|-------|------|
| `--bg-base` | `#0E0F11` | App background |
| `--bg-surface` | `#15171A` | Cards, panels |
| `--bg-elevated` | `#1C1F23` | Raised surfaces |
| `--border` | `#262A2F` | Hairline borders |
| `--text-primary` | `#F2F4F5` | Primary text |
| `--text-secondary` | `#9BA1A8` | Secondary text |
| `--text-muted` | `#61676E` | Muted / disabled |
| `--accent` | `#22C55E` | Chameleon green (sparing use) |
| `--accent-hover` | `#16A34A` | Accent hover/active |
| `--accent-subtle` | `rgba(34,197,94,.12)` | "Sin pérdida" badge background |
| `--lossless` | `#22C55E` | Lossless badge |
| `--lossy` | `#9BA1A8` | Lossy badge (neutral grey) |
| `--warning` | `#F59E0B` | Warnings |
| `--error` | `#F43F5E` | Errors |
| `--info` | `#38BDF8` | Info |

Light theme: identical token names, neutrals inverted to off-white surfaces + dark text, same accent green. There is no separate "warm" palette — the light theme is a minimal variant of the same skin.

**Typography:** neutral sans-serif (Geist or Inter) for UI; monospace (Geist Mono / JetBrains Mono) for technical data (extensions, byte sizes). No decorative serif. Minimal motion; subtle transitions only.

#### 7.4.1 Overlay surface system (Pre-Tier 3 — UX-1 / UX-5)

Floating UI (modals, palette, release comms) shares a **three-tier surface ladder** in `frontend/src/app/globals.css`. Components MUST use these tokens — not ad-hoc opacity or legacy `glass-palette` on overlay parents.

| CSS class | Opacity (dark) | Use |
|-----------|----------------|-----|
| `::backdrop` on `dialog.surface-dialog` | `rgba(0,0,0,.55)` + `blur(4px)` | Standard scrim behind all modals |
| `surface-raised` | ~94% | Command palette, release notes, What's New panel |
| `surface-floating` | ~97% | Onboarding card |
| `surface-sheet-mobile` | ~98% (mobile only) | Bottom sheets — palette, onboarding |
| `surface-header` | ~88% | Sticky app header (not a dialog) |
| `glass-palette` | ~62% | **Nested popovers only** (e.g. color picker inside an opaque panel) |

**Shell components** (`frontend/src/components/ui/`):

- `SurfaceDialog` — portal + native `<dialog>` + scroll lock + `useModalDialog` sync
- `SurfaceSheet` — `SurfaceBackdrop` (layout) + `SurfacePanel` (raised / floating / sheet variants)

All new overlay features MUST compose `SurfaceDialog` + `SurfaceSheet` unless a documented exception applies (e.g. animated drawer with `manageOpen={false}`).

**Scroll lock:** `lib/scroll-lock.ts` — `overflow: hidden` on `html`/`body` with scrollbar-gutter compensation on `.surface-header`; no `position: fixed` on desktop (prevents header/content jump on modal close).

### 7.5 Component Architecture (Implemented — UI-1 foundation)

Reusable, modular taxonomy under `frontend/src/`:

```
components/
├── ui/         # ✅ Button, IconButton, Badge, Card, Spinner (UI-1)
│               # ✅ Toast (UI-6)
│               # □ Dropdown/Popover, SearchInput, Tooltip (later)
├── layout/     # ✅ Header, ThemeToggle, LanguageSelector, Footer (UI-1)
│               # ✅ CommandPalette (UI-7)
│               # ✅ UtilityCluster, KeyboardShortcutsDialog (v1.6.0)
│               # □ Mega-menu (deferred per §7.7)
├── transmute/  # ✅ ToolCard, ToolGrid, Dropzone, TransmutationDropzone,
                #   Hero, PrivacyBanner (UI-2)
                # ✅ OptionsControls, TransmutationPanel (UI-3)
                # ✅ TransparencyNotice, BackgroundColorPill, PageDropOverlay (UI-6 / pill v1.2.0-patch)
                # ✅ MetricsPanel + EstimatedMetricsValue SWR animation (v1.5.0)
providers/      # ✅ ThemeProvider (UI-1)
                # ✅ I18nProvider (UI-4)
                # ✅ ToastProvider (UI-6)
                # ✅ TransmutationWorkerProvider — single Worker app-wide (v1.6.0)
lib/            # ✅ utils.ts (cn helper), types.ts (UI-1)
                # ✅ lib/site.ts — APP_VERSION, SITE_REPO_URL (v1.6.0)
                # ✅ lib/tools/ types.ts + tool-registry.ts (UI-2)
                # ✅ lib/transmutation/ download.ts (UI-2)
                # ✅ lib/format/ bytes.ts (UI-3), detect-png-alpha.ts, color-label.ts (UI-6)
                # ✅ lib/format/ metrics.ts — computeSizeDelta (v1.3.0)
                # ✅ lib/device/ resource-profile.ts — situational scoring (v1.4.0)
                # ✅ lib/i18n/ dictionaries (EN+ES), tool-copy.ts, errors.ts (UI-4)
                # ✅ lib/i18n/ metadata.ts — locale cookie bridge + OpenGraph (UI-6)
hooks/          # ✅ useTransmutationWorker + estimate (v1.3.0), useTheme (UI-1)
                # ✅ usePageFileDrop (UI-6)
                # ✅ useCommandPalette (UI-7)
                # ✅ useFileMetrics — debounced worker estimation (v1.3.0)
                # ✅ useAdaptiveResourceProfile (v1.4.0)
```

**ToolRegistry (scalability keystone — mirrors backend NFR-5):** every tool is declared once in a typed registry that drives the `ToolGrid`, routes, and (later) the menu/search. Adding a format = one registry entry + one Worker route + the crate; no UI rewrites.

```typescript
type ToolDefinition = {
  id: string;            // "jpg-to-png"
  slug: string;          // route segment: jpg-to-png
  fromFormat: ImageFormat;
  toFormat: ImageFormat;
  module: TransmutationModule;             // maps to Worker module + Wasm export
  category: "image";                        // future: "document", "optimize"
  fidelity: "lossless" | "lossy";           // surfaces §5.6.3 messaging
  status: "active" | "soon";
  options?: ("quality" | "compression")[];  // uses *_with_quality / *_with_compression
};
```

Components are token-driven and prop-typed; primitives carry no business logic.

### 7.6 Page & Routing Model (Implemented — UI-2)

Next.js App Router:

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Landing (entry point): `Hero` + `PrivacyBanner` + `ToolGrid` (cards generated from the registry) | ✅ UI-2 |
| `/transmute/[slug]` | Per-tool workspace: `TransmutationPanel` with staged/processing/result flow, declarative `OptionsControls` (slider + color), size delta display, local preview, explicit download | ✅ UI-3 |

Privacy reassurance is a first-class, **verifiable** element (NFR-1), not marketing copy. Tool cards surface the §5.6.3 messaging doctrine (lossless/lossy badge; size-growth hint for JPG→PNG).

### 7.7 Header Anatomy (Implemented — UI-1, polished v1.6.0)

| Zone | Element | Status |
|------|---------|--------|
| Left | Chameleon logo mark (`BrandLink` / Lamina 3C PNG, accent hover) + `Camaleon` wordmark (link to `/`) | ✅ v1.12.1 |
| Center-left (tool routes) | Registry-driven breadcrumb: action title + `FROM → TO` mono slug on `/transmute/[slug]` | ✅ v1.6.0 |
| Center-left | `Transmutaciones` command palette trigger (`⌘K` / `Ctrl+K`) — active state (`accent-subtle` + ring) when open | ✅ v1.6.0 |
| Shell | `.glass-header` — lighter acrylic than Command Palette (12px blur) | ✅ v1.6.0 |
| Right | `UtilityCluster` — EN/ES + theme toggle in bordered segment control | ✅ v1.6.0 |

### 7.9 Footer Anatomy (Implemented — v1.6.0, extended v1.9.0)

| Zone | Element | Status |
|------|---------|--------|
| Legal nav | Privacy, Terms, Contact, About links | ✅ |
| Utilities | GitHub (`SITE_REPO_URL`) + **What's New / Novedades** (`footer.whatsNew`) + keyboard shortcuts dialog | ✅ v1.9.0 |
| Meta | Copyright + dynamic version (`APP_VERSION` from `package.json`) | ✅ |

**What's New** opens the `WhatsNewDrawer` (§7.10) — persistent entry point for release history.

### 7.10 Release Comms — What's New (Implemented — v1.9.0)

> **Product names:** EN *What's New* · ES *Novedades* · **Codename:** `ReleaseComms`  
> **Design detail:** `docs/planning/release_comms_module.md` (internal planning on `dev`)

**Purpose:** Surface meaningful product updates in-app without server state. One release catalog drives three surfaces:

| Surface | Audience | Trigger |
|---------|----------|---------|
| `OnboardingPanel` | First-time visitor | First landing on `/` (not blocking) |
| `ReleaseNotesModal` | Returning visitor | `APP_VERSION` > `camaleon-last-seen-release` on `/` |
| `WhatsNewDrawer` | Anyone | Footer link; full release history (newest first) |

**Architecture:**

```
frontend/src/lib/releases/
  manifest.ts              ← ordered ReleaseEntry list + onboarding copy keys
  entries/vX.Y.Z.ts        ← one file per shipped app version
  storage.ts               ← localStorage keys (onboarding, last-seen, snooze)
  compare-version.ts

frontend/src/components/release-comms/
  OnboardingPanel.tsx | ReleaseNotesModal.tsx | WhatsNewDrawer.tsx
  ReleaseHighlightList.tsx | TechnicalDisclosure.tsx | …

frontend/src/providers/ReleaseCommsProvider.tsx   ← orchestration (one surface at a time)
```

**Client state (`localStorage` only — document in `/privacy`):**

| Key | Purpose |
|-----|---------|
| `camaleon-onboarding-complete` | First-visit panel dismissed |
| `camaleon-last-seen-release` | Changelog modal acknowledged for semver |
| `camaleon-release-snooze-until` | Optional 24h snooze without marking seen |

**UI constraints:** `glass-palette` acrylic; scroll regions use `PanelScrollFade` (hidden scrollbar + edge veil — same as Command Palette). Bilingual copy in `dictionaries/en.ts` + `es.ts` under `releaseComms.*`.

**Orchestration rules:** Never show onboarding + changelog simultaneously; onboarding takes priority for brand-new users; changelog requires onboarding complete (or legacy `lastSeen` migration).

### 7.11 Release & Versioning Policy (Mandatory from v1.9.0 onward)

Every push to `main` that users should **notice** must go through the Release Comms checklist below. **Do not ship user-facing changes silently.**

#### When to bump `frontend/package.json` version

| Change type | Bump | Example |
|-------------|------|---------|
| New tools, Wasm modules, limits behavior, major UX features | **MINOR** (`1.9.0` → `1.10.0`) | Tier 2 Wave 2 (TIFF/ICO/TGA) |
| Meaningful fix or polish users would care about | **PATCH** (`1.9.0` → `1.9.1`) | Release Comms alone would have been `1.9.1` |
| Docs-only, CI, internal refactors (no user-visible delta) | No bump | Planning docs on `dev` |

`APP_VERSION` in `lib/site.ts` is read from `package.json` and gates the changelog modal.

#### Release checklist (required for MINOR and PATCH user-facing ships)

1. **Bump** `frontend/package.json` version.
2. **Add** `frontend/src/lib/releases/entries/vX.Y.Z.ts` + register in `manifest.ts` (newest first).
3. **Add** i18n keys under `releaseComms.entries.vXYZ.*` in EN + ES (title, summary, highlights, optional technical).
4. **Sync** `docs/releases/vX.Y.Z.md` for GitHub Release notes (operator-facing; can be longer than in-app copy).
5. **Tag** `vX.Y.Z` on `main` after merge; create GitHub Release from tag.
6. **Verify** in browser: onboarding (fresh profile), changelog modal (bump), footer What's New drawer.

#### Dual sources of truth

| Artifact | Audience | Role |
|----------|----------|------|
| `lib/releases/entries/vX.Y.Z.ts` + i18n | End users (in-app) | Short, bilingual, UX-toned |
| `docs/releases/vX.Y.Z.md` + Git tag | Developers / GitHub | Full changelog |

**v1.9.0 note:** Release Comms infrastructure shipped in the same deploy as Tier 2 Wave 1 content. Strictly it could have been **v1.9.1** (UI-only delivery of the comms module); it was folded into **v1.9.0** for launch simplicity. **From the next user-visible ship onward, always bump semver and add a manifest entry — never forget What's New.**

### 7.8 UI Implementation Track (Planned)

| Phase | Scope | Constraint |
|-------|-------|-----------|
| UI-1 | ✅ Design system foundation: tokens + `ThemeProvider` + `ui/` primitives + layout shell (Header + Footer) (v0.6.1) | No conversion behavior change |
| UI-2 | ✅ `ToolRegistry` + landing (`Hero`, `PrivacyBanner`, `ToolGrid`) + Dropzone extraction + `/transmute/[slug]` route shell (v0.6.2) | OptionsControls in UI-3 |
| UI-3 | ✅ `/transmute/[slug]` + `TransmutationPanel` + atomic `OptionsControls` (slider + color) wired through extended worker protocol (v0.6.3) | Subsampling deferred |
| UI-4 | ✅ Full bilingual EN/ES i18n via `I18nProvider` + typed dictionaries + `LanguageSelector` wired (v0.6.4) | UI-5 = a11y/responsive sign-off |
| UI-5 | ✅ Accessibility + responsive sign-off (v1.0.0) | — |
| UI-6 | ✅ UX polish layer: transparency pre-notice, page drag overlay, toasts, locale metadata cookie bridge (v1.1.0) | UI-7 = Command Palette |
| UI-7 | ✅ Command Palette + semantic action titles + color visual swatch (v1.2.0) | UI-8 = search + keyboard nav |
| Metrics | ✅ Centralized `computeSizeDelta` + `useFileMetrics` + worker estimate path; debounced “estimated size” preview in staged panel (v1.3.0) | — |
| Resource | ✅ `computeResourceProfile` + coalescing + CountingWriter + result cache + `MetricsPanel` SWR animation (v1.4.0–v1.5.0) | Multi-entry batch cache |
| UI-9 | ✅ Header/footer visual polish: glass header, breadcrumb, trust footer, shortcuts dialog, global engine pill (v1.6.0) | UI-8 search |

This UI track runs after the §5.8 backend refinements (now complete) and feeds Phase 4 MVP polish per ROADMAP.

---

## 8. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Privacy | Zero network transmission of file bytes; output files default to StripAll metadata (§5.10) |
| NFR-2 | UI responsiveness | Main thread free during conversion; 60fps UI goal |
| NFR-3 | Build reproducibility | Documented commands; CI-ready scripts (future) |
| NFR-4 | Error clarity | User-facing errors in plain English |
| NFR-5 | Modularity | New format = new crate + Wasm export + worker route |
| NFR-6 | Code language | Source code and docs in **English** |
| NFR-7 | Wasm bundle size | Each new transmutator crate `.wasm` binary target ≤ 3 MB uncompressed; aggregate `public/wasm/` ≤ 12 MB total. Measure after each Phase 5.x delivery and report in OpenCode technical report. |
| NFR-8 | Format science honesty | UI copy for each new format must reflect correct lossless/lossy semantics per §5.12 and §12; no false "lossless" claims on lossy conversions. |

---

## 9. Build & Verification Commands

| Scope | Command | Must pass |
|-------|---------|-----------|
| Rust workspace | `cargo check --workspace` (in `motor_transmutacion/`) | Before every report |
| Rust tests | `cargo test --workspace` (in `motor_transmutacion/`) | When tests exist |
| Wasm build | `wasm-pack build --target web` for each transmutator crate | Before frontend build if Wasm API changed |
| Frontend build | `npm run build` (in `/frontend`) | Before every report |

Warnings should be resolved or explicitly documented in OpenCode report.

---

## 10. SPEC Amendment Protocol

When OpenCode completes a task that changes architecture, APIs, paths, or behavior:

1. Update the relevant SPEC section(s)
2. Bump **Last updated** date
3. Increment SPEC **Version** if API or structure changed (`PATCH` for docs/clarifications, `MINOR` for new modules/APIs)
4. Add entry to **Amendment Log** below
5. Reference the OpenCode report filename in the log entry

Chief Architect validates SPEC diff during second-pass review.

---

## 11. Amendment Log

| Version | Date | Author | Summary | Report ref |
|---------|------|--------|---------|------------|
| 2.1.1-avif | 2026-06-11 | Chief Architect | Tier 3.1.2: AVIF→JPEG; frame-preview worker + cache; estimate/transmute sync; engine v1.5.1; app v2.1.1 | `docs/releases/v2.1.1.md` |
| 2.0.0-avif | 2026-06-11 | Chief Architect | Tier 3.1.0–3.1.1: `transmutador_avif` AVIF→PNG; animated frame scrubber; limit pipeline hotfixes + `docs/LIMIT_PIPELINE.md`; engine v1.5.0; app v2.0.0 | `docs/releases/v2.0.0.md` |
| 1.12.2-estimate | 2026-06-11 | Chief Architect | Pre²-Tier 3: GIF fast inspect/incremental composite; alpha hint prepare→worker; multi-entry ResultCache; `flatten_rgba` + SIMD128 alpha scan; release LTO/SIMD; engine v1.4.3 | `docs/releases/v1.12.2.md` |
| 1.9.0-comms | 2026-06-08 | Chief Architect | §7.10 Release Comms (What's New): onboarding, changelog modal, drawer; §7.11 release/versioning policy; footer extended; v1.9.0 fold-in note (comms could have been 1.9.1) | — |
| 1.7.8-repo | 2026-06-07 | Chief Architect | Public repo prep: `main` (releases), `dev` (internal docs), `contrib` (community PRs); removed prompts/planning/reports/GOVERNANCE from `main` | — |
| 1.7.8 | 2026-06-07 | Chief Architect | v1.7.8 launch baseline: bilingual legal pages (`lib/legal`), minimal footer, PrivacyBanner → `/privacy` | — |
| 1.7.0 | 2026-06-07 | OpenCode + Chief Architect | Phase 5.1: `transmutador_webp` WebP→PNG + estimate(compression) + worker/registry/i18n; §6.4 implemented | `phase5_webp_to_png_done.md` |
| 1.7.7 | 2026-06-07 | Chief Architect | v1.7.7 scroll UX: `PanelScrollFade` for acrylic panels (mask-based); `ScrollVeil` optimistic SSR defaults (no F5 flash); glass-palette transparency | — |
| 1.7.6 | 2026-06-07 | OpenCode + Chief Architect | Phase 5.4 JPEG→WebP: `transmutar_jpg_a_webp` + estimate; dual `encodeSource` worker routing (Architect patch); Tier 1 WebP Suite complete | `phase5_jpg_to_webp_done.md` |
| 1.7.5 | 2026-06-07 | Chief Architect | v1.7.5 UX polish: `ScrollVeil` bounded scroll (main + palette), scroll-lock for modals, overlay scrollbar rAF sync, animated language pill + circular theme toggle, `camaleon-theme-fade` theme crossfade, veil tokens use `background-color` for theme transition | `v1_7_5_ux_polish_done.md` |
| 1.7.4 | 2026-06-07 | Chief Architect | v1.7.4 hotfix: `MetricsPanel` for zero-option tools; `count_webp_bytes` centralized in `core_utils` | — |
| 1.7.0-planned | 2026-06-07 | Chief Architect | §3 planned crates; §5.12 WebP science; §6.4 transmutador_webp API contract; §6.5 transmutador_encode stub; §7.1 Dropzone Tier 1 routing; §7.3 Wasm layout extended; NFR-7 bundle size; NFR-8 format honesty; §12 Format Expansion Program | — |
| 1.6.1 | 2026-06-07 | Chief Architect | v1.6.1 hotfix: locale/theme FOUC (cookie SSR + bootstrap script); Scrollbar Camaleón overlay; landing shell unification; ToolCard min-heights; CommandPalette FormatChip alignment | — |
| 1.6.0 | 2026-06-07 | Chief Architect | UI-9 header/footer polish; `TransmutationWorkerProvider`; restore v1.5.0 cache/metrics wiring after OpenCode regression | — |
| 1.5.0-patch-2 | 2026-06-07 | Chief Architect | Metrics UX polish: badge delta pills, result view layout, `buildFingerprint` deep serialize fix, estimate flicker fixes | — |
| 1.0.0-patch | 2026-06-03 | Chief Architect | Round-trip integration tests; CI triggers `master`; README/ROADMAP v1.0.0 alignment; ToolCard `h-full` restored | — |
| 1.2.0-patch | 2026-06-06 | Chief Architect | SPEC §7.5/§7.7/§7.8 sync; dialog close listener fix; TransparencyNotice client directive | — |
| 1.5.0-patch | 2026-06-06 | Chief Architect | Phase C wiring: fingerprint/meta to worker; cache-before-encode; dual estimate restored; `cacheWarm` from `cacheStored`; MetricsPanel SWR fixes | — |
| 1.5.0 | 2026-06-06 | OpenCode | Result cache + MetricsPanel SWR animation + `metricsValueIn` CSS | `resource_tuning_phase_c_done.md` |
| 1.4.0-patch | 2026-06-06 | Chief Architect | Worker wired to `estimate_*_size`; pipeline coalescing; superseded fix; manual estimate UI+i18n; size parity tests; Phase C deferred | — |
| 1.4.0 | 2026-06-06 | OpenCode | Adaptive resource tuning: `computeResourceProfile`, worker coalescing, CountingWriter+estimate Wasm exports, `useAdaptiveResourceProfile` | `resource_tuning_engine_done.md` |
| 1.3.0 | 2026-06-06 | OpenCode | Metrics engine: computeSizeDelta, useFileMetrics, worker estimate path (purpose+outputSize), debounced real-time size estimation in TransmutationPanel | `metrics_estimation_engine_done.md` |
| 1.2.0 | 2026-06-06 | OpenCode | UI-7: Command Palette (glassmorphism, ⌘K), semantic action titles (Proposal A), color visual swatch for TransparencyNotice | `ui_7_header_semantic_done.md` |
| 1.1.0 | 2026-06-04 | OpenCode | UI-6: UX polish — transparency pre-notice, page drag overlay, toast system, locale metadata cookie bridge, detectPngAlpha | `ui_6_ux_polish_layer_done.md` |
| 1.0.0 | 2026-06-03 | OpenCode | v1.0.0 MVP sign-off: UI-5 a11y baseline, CI workflow, version bump (encoder swap + Playwright deferred to v1.1.0) | `mvp_1_0_0_signoff_done.md` |
| 0.6.6-docs | 2026-06-03 | Chief Architect | README + ROADMAP aligned to MVP-ready state; SPEC status/UI track notes; MVP acceptance criteria marked met | — |
| 0.6.6 | 2026-06-03 | OpenCode | Backend output integrity: `validate_output` + `OutputFormat` mandatory checks, `Quality`/`Compression` bounded newtypes, post-encode validation wired in both `_inner` pipelines | `refine_output_integrity_done.md` |
| 0.6.5 | 2026-06-03 | Chief Architect | §5.11 Output Integrity Protocol (post-encode validation + bounded-parameter newtypes doctrine); §5.5.6 JPEG encoder-swap doctrine (subsampling/Huffman require backend swap); §5.8 adds `refine_output_integrity` + `refine_jpeg_encoder_swap` planned tasks | — |
| 0.6.4 | 2026-06-03 | OpenCode | UI-4: Full EN/ES i18n — I18nProvider + typed dictionaries + LanguageSelector wired + all UI copy localized + ToolRegistry prose migrated to dictionaries | `ui_4_i18n_en_es_done.md` |
| 0.6.3 | 2026-06-03 | OpenCode | UI-3: TransmutationPanel (staged flow + result view + local preview) + atomic OptionsControls (slider/color) + extended worker protocol + landing card height uniformity | `ui_3_transmutation_panel_options_done.md` |
| 0.5.6 | 2026-06-03 | OpenCode | Background-color Wasm export: `transmutar_png_a_jpg_with_options(bytes, quality, r, g, b)` — custom `BackgroundFill` exposed to frontend | `refine_png_background_option_done.md` |
| 0.6.2 | 2026-06-02 | OpenCode | UI-2: Landing + ToolRegistry + dropzone extraction + /transmute/[slug] route shell with SSG | `ui_2_landing_tool_registry_done.md` |
| 0.6.1 | 2026-06-02 | OpenCode | UI-1: Design system foundation — design tokens via Tailwind v4 @theme, ThemeProvider with no-FOUC inline script, ui/ primitives (Button, IconButton, Badge, Card, Spinner), layout shell (Header + Footer), Geist typography | `ui_1_design_system_foundation_done.md` |
| 0.6.0 | 2026-06-02 | Chief Architect | §7.4–§7.8 Frontend UI/UX architecture & design system: "Verde Camaleón" identity, design tokens, ToolRegistry, page/routing model, header anatomy, UI implementation track (UI-1..UI-5) | — |
| 0.5.5 | 2026-06-02 | OpenCode | JPEG→PNG hardened: RGB color-type enforcement, configurable compression (1–9), PngEncoder with Adaptive filter, dual Wasm exports | `refine_transmutador_jpg_done.md` |
| 0.5.4 | 2026-06-02 | OpenCode | PNG→JPEG hardened: alpha flatten on white, configurable quality (1–100), dual Wasm exports, chroma subsampling 4:2:0 documented | `refine_transmutador_png_done.md` |
| 0.5.3-patch | 2026-06-02 | Chief Architect | PNG chunk walker bounds guard; SPEC §6.1 test count | — |
| 0.5.3 | 2026-06-02 | OpenCode | Metadata StripAll verified: core_utils scanners, integration tests proving EXIF/tEXt not propagated through transmutation | `refine_metadata_policy_done.md` |
| 0.5.2 | 2026-06-02 | Chief Architect | §5.10 Metadata Policy (StripAll default, privacy doctrine, planned refine_metadata_policy); P7 added | — |
| 0.5.1-patch | 2026-06-02 | Chief Architect | JPEG marker error format fix; truncated PNG header test | — |
| 0.5.1 | 2026-06-02 | OpenCode | Dimension guards: MAX_PIXELS, probe_dimensions, pixel_count, validate_input hardened against decompression bombs | `refine_core_utils_dimensions_done.md` |
| 0.5.0 | 2026-06-02 | Chief Architect | §5 Transmutation Science & Module Doctrine (full technical foundation, cycle analysis, planned refinements) | — |
| 0.4.0-patch | 2026-06-02 | Chief Architect | `JpegEncoder` quality 85 applied; `transmutar_png_a_jpg_inner` + test alignment | — |
| 0.4.0 | 2026-06-02 | OpenCode | Phase 3: transmutador_png crate + tests + dual Wasm pipeline + Worker routing + UI auto-detect | `phase3_png_to_jpg_done.md` |
| 0.3.0-patch | 2026-06-02 | Chief Architect | `transmutar_jpg_a_png_inner` + empty-input test; UI `ready` guard | — |
| 0.3.0 | 2026-06-02 | OpenCode | Phase 2: Real JPEG→PNG + tests + UI wired with states + auto-download | `phase2_jpg_to_png_done.md` |
| 0.2.0-patch | 2026-06-02 | Chief Architect | Worker init race fix; hook `ready` state; Unix build script | — |
| 0.2.0 | 2026-06-02 | OpenCode | Phase 1: Wasm pipeline + Worker bridge + core_utils implementation | `phase1_wasm_pipeline_done.md` |
| 0.1.0 | 2026-06-02 | Chief Architect | Initial SPEC from v0.1.0 bootstrap | — |

---

## 12. Format Expansion Program

> **Owned by Chief Architect.** Planned work beyond the JPG/PNG MVP, organized by priority tier (see §1.3). **Tiers 1–2 are complete and live on `main` (v1.11.0).** Next gate: **Tier 3** (modern image formats). Optimization, editing, and documents follow in that order — documents are **not** Tier 3 or Tier 4 scope.

### 12.1 Expansion Principles

All format expansion work follows these rules in addition to existing principles:

| Rule | Detail |
|------|--------|
| **One format at a time** | Each new conversion direction is a separate OpenCode task with its own prompt, tests, and QA gate before moving to the next. |
| **New crate per family** | Decoding crates group by source format (e.g., `transmutador_webp` handles all WebP-source conversions). Encoding crates group by target format where they share logic. |
| **No Wasm feature flags that break WASM** | `default-features = false` on the `image` crate always. Explicitly enable only needed features. Never enable `rayon`. |
| **Estimate-first** | Every new conversion **must** ship a `estimate_*_size` Wasm export using `CountingWriter` (§6.4 pattern) so `useFileMetrics` works immediately. |
| **Metrics coverage** | `MetricsPanel` must display relevant size delta, fidelity badge, and science hint for every new tool. |
| **StripAll default** | No source format's metadata chunks are copied to output (§5.10). |
| **i18n day-one** | Both EN and ES strings shipped in the same task; no partial i18n. |
| **Bundle size gate (NFR-7)** | Each new `.wasm` ≤ 3 MB uncompressed. Block merge if exceeded. |

### 12.2 Tier 1 — WebP Suite (v1.7.x — ✅ Complete)

Goal: make Camaleon the best browser-local WebP converter. Four conversion directions, each its own phase.

| Phase | Task slug | Direction | Crate | Fidelity | Status |
|-------|-----------|-----------|-------|----------|--------|
| **5.1** | `phase5_webp_to_png` | WebP → PNG | `transmutador_webp` | Lossless (raster) | ✅ v1.7.0 |
| **5.2** | `phase5_webp_to_jpg` | WebP → JPEG | `transmutador_webp` (add export) | Lossy | ✅ v1.7.2 |
| **5.3** | `phase5_png_to_webp` | PNG → WebP | `transmutador_encode` | Lossless WebP | ✅ v1.7.3 |
| **5.4** | `phase5_jpg_to_webp` | JPEG → WebP | `transmutador_encode` (add export) | Lossless WebP | ✅ v1.7.6 |

**Version target:** v1.7.x (four phases). Each phase ships independently: v1.7.0 (5.1) → v1.7.2 (5.2) → v1.7.3 (5.3) → v1.7.4 (5.4).

**QA gate between phases (Chief Architect):**
1. `cargo test --workspace` passes
2. Wasm binary built and loadable in browser (manual smoke test)
3. E2E: drop real file, confirm correct output extension, download
4. Metrics: estimated size shown before transmutation
5. i18n: both EN and ES UI strings correct
6. NFR-7: `.wasm` size reported and within budget
7. StripAll: confirmed by test

**Phase 5.3 spike required:** before implementing PNG→WebP (lossless `image` crate encode), validate actual output quality, size, and `.wasm` binary size in a spike task. If lossless WebP output is unacceptably large for photographic sources, reconsider lossy WebP encode using `webp` crate.

### 12.3 Tier 2 — Raster Classics (v1.8.x–v1.9.0)

Low-risk, high-value conversions using the `image` crate without new native dependencies. All use the same `decode → re-encode` pipeline.

**Wave 1 (shipped v1.9.0 on `main`):**

| Direction | Crate | Status |
|-----------|-------|--------|
| GIF → PNG | `transmutador_gif` | ✅ Frame picker + GIF89a compositing (v1.8.4) |
| GIF → JPEG | `transmutador_gif` | ✅ Alpha flatten + frame index |
| BMP → PNG | `transmutador_bmp` | ✅ Semantic alpha + PNG growth notice |
| BMP → JPEG | `transmutador_bmp` | ✅ Quality slider + alpha flatten |

**Client-side astro downscale (v1.9.0):** images exceeding `MAX_PIXELS` (40 MP) may be downscaled via canvas before Wasm handoff. See `docs/planning/wave2_astro_roadmap.md`. Wasm worker is recycled when leaving any `/transmute/*` route to release linear memory.

**Wave 2 (shipped v1.10.0–1.10.4 on `main`):**

| Direction | Crate | Status |
|-----------|-------|--------|
| TIFF → PNG | `transmutador_tiff` | ✅ Multi-page picker; 16-bit → 8-bit policy |
| TIFF → JPEG | `transmutador_tiff` | ✅ Quality + background flatten |
| ICO → PNG | `transmutador_ico` | ✅ `.ico`/`.cur`; entry picker |
| PNG → ICO | `transmutador_ico` | ✅ Presets 16/32/48/256; downscale only |
| TGA → PNG | `transmutador_tga` | ✅ Raw/RLE; indexed + rgba |

**Execution:** same pattern as Tier 1, one phase at a time, separate prompt per direction. Crates group by source format to minimize crate count.

### 12.4 Tier 3 — Modern Image Formats (v2.0.x — **In progress**)

Still **ladder A + B** (§1.3): output is always a raster image. Requires Wasm bundle spikes before commitment.

**Shipped v2.1.1 (Phase 3.1.0–3.1.2 on `main`):**

| Direction | Crate | Status |
|-----------|-------|--------|
| **AVIF → PNG** | `transmutador_avif` | ✅ zenavif decode; frame index; MIAF normalize; estimate |
| **AVIF → JPEG** | `transmutador_avif` | ✅ assess_alpha; quality + background; estimate with alpha hint |

**Planned (Tier 3.2–3.4):**

| Format | Direction | Technical note |
|--------|-----------|---------------|
| **PNG/JPEG → AVIF** | Encode | `ravif` encode; known large bundle. Budget spike before commit. |
| **SVG → PNG/JPEG** | Rasterize | `resvg` + `usvg`; adds ~2–4 MB to bundle; DPI/background parameters |
| **HEIC/HEIF → JPEG** | Decode | No pure-Rust decoder; `libheif` WASM port fragile. Honest UI message if deferred. |

**Limit pipeline (maintainers):** `docs/LIMIT_PIPELINE.md` — byte zones, 40 MP astro downscale, Wasm session ceilings.

**Go/no-go criteria for each:** spike delivers working Wasm build + `.wasm` ≤ 4 MB (≤ 3 MB preferred per NFR-7) + `cargo test --workspace` passes.

### 12.5 Tier 4a — Image Optimization (v2.x — After Tier 3)

**Ladder C (§1.3).** Same raster domain; not format swap — re-encode or resample with metrics-first UX (estimate before apply).

| Tool | Implementation notes |
|------|---------------------|
| **Compress** | Same-format re-encode (PNG compression 1–9, JPEG quality 1–100); size delta as primary metric |
| **Resize** | `imageops::resize`; width/height + aspect-ratio lock; filter type (Nearest/Lanczos/Triangle) |

**Governance:** introduces `ToolDefinition.category: "optimize"`. ToolGrid / Command Palette grouping update required in same release.

### 12.6 Tier 4b — Image Editing (v2.x — After Tier 4a)

**Ladder D (§1.3).** Geometric ops on raster before encode; may share astro/canvas patterns from v1.9.

| Tool | Implementation notes |
|------|---------------------|
| **Crop** | Canvas/coordinate UI; Wasm crops raster before encode |
| **Rotate / Flip** | 90°/180°/270° + horizontal/vertical flip; lossless when source is PNG |
| **Favicon multi-size** | Extend PNG→ICO to emit standard pack (16/32/48/256) in one download |

**Governance:** introduces `ToolDefinition.category: "edit"`.

### 12.7 Tier 5 — Documents (deferred — far horizon)

**Ladder E (§1.3).** Not image transmutation. PDF is a **document** container (pages, vectors, fonts, embedded images). Requires:

- New product planning doc (not started)
- New `category: "document"` and likely separate navigation surface
- Different validation, limits, and StripAll rules
- Spike on `printpdf` / `lopdf` (images→PDF) and `pdfium` WASM (PDF→images) for bundle size

| Tool | Status |
|------|--------|
| Images → PDF | Deferred — no implementation until Tier 5 planning approved |
| PDF → Images | Deferred — same |

**Normative:** Do not implement PDF tools under Tier 3 or Tier 4 milestones. Competitors bundle these early; Camaleon prioritizes **image depth and honesty** first.

### 12.8 Cross-Cutting Requirements for All Format Expansion

These apply to every new tool regardless of tier:

1. **ToolRegistry entry** — `status: "soon"` on trunk, `status: "active"` only when the crate ships and passes all QA gates.
2. **Worker lazy-load** — new Wasm modules loaded on-demand (same pattern as `initJpgWasm` / `initPngWasm`).
3. **`TransmutationModule` type** — `types.ts` must be updated to include the new module identifier.
4. **Wasm type declarations** — `frontend/src/types/wasm-modules.d.ts` must declare the new module's exports.
5. **Build scripts** — `scripts/build-wasm.ps1`, `scripts/build-wasm.sh`, and `package.json build:wasm` must include the new crate.
6. **Estimate function** — `useFileMetrics` must be extended to dispatch to the new module's `estimate_*_size`.
7. **i18n strings** — add to both `en.ts` and `es.ts` dictionaries: `actionTitle`, `description`, `fidelityHint`, and any option labels.
8. **SPEC §6 stub** — Architect writes the module spec before implementation (done for §6.4 and §6.5 above).
9. **ROADMAP update** — Architect updates ROADMAP after each phase completes (not OpenCode's job).
