# Camaleon — System Specification (SPEC)

> **Authoritative source of truth** for architecture, structure, and functional / non-functional requirements.
>
> - **Chief Architect (Cursor)** owns this document.
> - **OpenCode** must read SPEC before every task and **update SPEC** at task completion to reflect any architectural or behavioral change introduced.
> - If code and SPEC disagree, **SPEC wins** until a deliberate amendment is recorded.

**Version:** 1.4.0  
**Last updated:** 2026-06-06  
**Status:** MVP — Camaleon v1.4.0 (adaptive resource tuning) / Engine v1.2.0

---

## 1. Vision & Principles

### 1.1 Mission

Camaleon transmutes file formats entirely inside the user's browser. Privacy is non-negotiable: file bytes never leave the client.

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
│   │   ├── hooks/
│   │   ├── types/           ← Shared TypeScript declarations
│   │   └── workers/
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
└── motor_transmutacion/     ← Rust workspace (Wasm engine)
    ├── Cargo.toml
    ├── core_utils/
    ├── transmutador_jpg/    ← JPEG → PNG
    ├── transmutador_png/    ← PNG → JPEG
```

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
| Document in errors/UI when alpha is detected and flattened | Recommended (Phase 4) |

#### 5.5.3 Quality and encoder levers

| Lever | Role | Current / target |
|-------|------|------------------|
| **Quality factor** | Scales quantizer matrix; primary perceptual control | `DEFAULT_JPEG_QUALITY = 85`; `MIN=1`, `MAX=100`; `transmutar_png_a_jpg_with_quality(bytes, quality)` Wasm export ✅ (v0.5.4) |
| **Chroma subsampling** | `4:2:0` max compression vs `4:4:4` color fidelity | `JpegEncoder` (image v0.25) defaults to **4:2:0** and **does not expose** a sampling-factor setter in its public API. `4:4:4`/`4:2:2` control **requires an encoder swap** (see §5.5.6). Deferred to `refine_jpeg_encoder_swap`. |
| **Optimized Huffman** | Smaller files at same quality | `image` crate uses fixed standard tables and exposes no optimization toggle. Requires encoder swap (mozjpeg/jpeg-encoder, §5.5.6). |
| **Progressive JPEG** | Perceived faster load on web | Future optional |
| **Metadata strip** | Privacy + bytes (EXIF, ICC) | ✅ StripAll verified (v0.5.3) |

**Quality guidance:**

| Range | Effect |
|-------|--------|
| `< 70` | Visible artifacts on most photos |
| `75–85` | Sweet spot for web delivery ("visually near-lossless") |
| `> 95` | Diminishing returns; file size spikes |

#### 5.5.4 Module objectives (priority order)

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

#### 5.5.5 Current implementation alignment (v0.5.4)

- `JpegEncoder::new_with_quality(..., quality)` — **P1/P2 ✅** (quality configurable via `transmutar_png_a_jpg_with_quality`; default 85 via `transmutar_png_a_jpg`).
- Alpha flatten onto `BackgroundFill::WHITE` — **P3 ✅** (manual compositing with `(α·C_fg + (255-α)·C_bg + 127) / 255`; `BackgroundFill` is configurable).
- Subsampling — **P4 ✅ documented** (`4:2:0` via `image` crate `JpegEncoder` default; `4:4:4` toggle deferred — see §5.5.6).
- Optimized Huffman — **P5 deferred** (see §5.5.6).

#### 5.5.6 Encoder-swap doctrine

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
| `refine_jpeg_encoder_swap` | Replace JPEG encode backend to unlock chroma subsampling / optimized Huffman; `ChromaSubsampling` enum | §5.5.6 | **Planned** |

§5.8 backend refinements through v0.6.6 are **complete**. **v1.0.0 shipped** (UI-5 baseline + CI). Post-1.0: `refine_jpeg_encoder_swap` (§5.5.6), Playwright E2E, UI/UX polish layer.

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

## 6. Module Specifications

### 6.1 `core_utils`

**Purpose:** Shared error handling, byte-level utilities, and pre-decode safety checks.

**Status:** Implemented — Phase 1 + dimension guards (v0.5.1) + metadata scanners (v0.5.3).

**Capabilities:**

- `TransmutationError` enum with variants: `EmptyInput`, `InputTooLarge { size, max }`, `DimensionsTooLarge { width, height, pixel_count, max_pixels }`, `InvalidDimensions { reason }`, `ConversionFailed(String)`
- `Display` implementation for `String` conversion at Wasm boundary
- `validate_input(bytes: &[u8]) -> Result<(), String>` — rejects empty, input exceeding `MAX_INPUT_BYTES`, and (for PNG/JPEG magic) dimensions exceeding `MAX_PIXELS` or zero dimensions
- `validate_output(bytes: &[u8], format: OutputFormat) -> Result<(), String>` — post-encode integrity: rejects empty output, validates destination magic bytes (PNG signature / JPEG SOI). O(1), mandatory in both `_inner` pipelines (v0.6.6)
- `OutputFormat` enum: `Png | Jpeg`
- `probe_dimensions`, `pixel_count`, metadata scanners (unchanged)
- `MAX_INPUT_BYTES`: **50 MB**; `MAX_PIXELS`: **40,000,000** (40 MP)

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

## 7. Frontend Specifications

### 7.1 Dropzone (Implemented — Phase 3)

- **Input:** Drag-and-drop and click-to-select
- **Format filter:** `.jpg`, `.jpeg`, `.png` — auto-routed to correct module by extension
- **Routing:**
  - `.jpg` / `.jpeg` → `transmutador_jpg` → outputs `.png` (`image/png`)
  - `.png` → `transmutador_png` → outputs `.jpg` (`image/jpeg`)
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
  module: "transmutador_jpg" | "transmutador_png";
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

**Estimate path (v1.3.0 + v1.4.0):** when `purpose === "estimate"`, the worker calls Wasm `estimate_*_size` exports (v1.4.0 — `CountingWriter`, no output buffer allocation) and returns `{ purpose: "estimate", outputSize }` only. Worker pipeline serializes jobs; estimate coalescing drops superseded requests; transmute preempts pending estimates. Estimation reads a fresh `file.arrayBuffer()` copy (WeakMap-cached per `File`); the staged buffer is never used for estimates.

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
│   ├── transmutador_jpg.js        ← JS glue (ES module)
│   ├── transmutador_jpg_bg.wasm   ← Wasm binary
│   ├── transmutador_jpg.d.ts      ← TypeScript declarations
│   └── transmutador_jpg_bg.wasm.d.ts
└── transmutador_png/
    ├── transmutador_png.js        ← JS glue (ES module)
    ├── transmutador_png_bg.wasm   ← Wasm binary
    ├── transmutador_png.d.ts      ← TypeScript declarations
    └── transmutador_png_bg.wasm.d.ts
```

Generated by `wasm-pack build --target web`. Both modules built by `scripts/build-wasm.ps1`, `scripts/build-wasm.sh`, or `npm run build:wasm`. The `public/wasm/` directory is gitignored.

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

### 7.5 Component Architecture (Implemented — UI-1 foundation)

Reusable, modular taxonomy under `frontend/src/`:

```
components/
├── ui/         # ✅ Button, IconButton, Badge, Card, Spinner (UI-1)
│               # ✅ Toast (UI-6)
│               # □ Dropdown/Popover, SearchInput, Tooltip (later)
├── layout/     # ✅ Header, ThemeToggle, LanguageSelector, Footer (UI-1)
│               # ✅ CommandPalette (UI-7)
│               # □ Mega-menu (deferred per §7.7)
├── transmute/  # ✅ ToolCard, ToolGrid, Dropzone, TransmutationDropzone,
                #   Hero, PrivacyBanner (UI-2)
                # ✅ OptionsControls, TransmutationPanel (UI-3)
                # ✅ TransparencyNotice, BackgroundColorPill, PageDropOverlay (UI-6 / pill v1.2.0-patch)
providers/      # ✅ ThemeProvider (UI-1)
                # ✅ I18nProvider (UI-4)
                # ✅ ToastProvider (UI-6)
lib/            # ✅ utils.ts (cn helper), types.ts (UI-1)
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

### 7.7 Header Anatomy (Implemented — UI-1)

| Zone | Element | Status |
|------|---------|--------|
| Left | Chameleon logo mark (inline SVG) + `Camaleon` wordmark (link to `/`) | ✅ |
| Center-left | `Transmutaciones` command palette trigger (`⌘K` / `Ctrl+K`) — opens glassmorphism `<dialog>` with tool rows | ✅ UI-7 |
| Right | Language selector (EN / ES) — fully wired to I18nProvider, persisted to localStorage, `<html lang>` synced | ✅ UI-4 |
| Right | Theme toggle (dark / light) with `useTheme`, persisted, no FOUC | ✅ |

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
| Resource | ✅ Situational `computeResourceProfile` + coalescing + CountingWriter estimates + manual large-file gate (v1.4.0) | Result cache → v1.5.0 |

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
| 1.0.0-patch | 2026-06-03 | Chief Architect | Round-trip integration tests; CI triggers `master`; README/ROADMAP v1.0.0 alignment; ToolCard `h-full` restored | — |
| 1.2.0-patch | 2026-06-06 | Chief Architect | SPEC §7.5/§7.7/§7.8 sync; dialog close listener fix; TransparencyNotice client directive | — |
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
