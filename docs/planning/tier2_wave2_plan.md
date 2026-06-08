# Tier 2 — Wave 2 (TIFF, ICO, TGA)

> **Branch:** merged to **`main`** at **v1.10.4**  
> **Status:** Phase 7.0–7.2 TIFF ✅ · Phase 7.3–7.4 ICO ✅ · Phase 7.5 TGA→PNG ✅ (v1.10.4) · Phase 7.6 polish pending  
> **Prerequisite:** Tier 2 Wave 1 ✅ · Release Comms ✅ · LimitContext + astro downscale ✅  
> **Doctrine:** Same pipeline as Wave 1 — decode → honest options → re-encode → StripAll → estimate-first

---

## 1. Wave 2 scope summary

| Phase | Version (target) | Direction | Crate | Tools added |
|-------|------------------|-----------|-------|-------------|
| **7.1** | v1.10.0 | TIFF → PNG | `transmutador_tiff` | 1 |
| **7.2** | v1.10.1 | TIFF → JPEG | `transmutador_tiff` | 1 |
| **7.3** | v1.10.2 | ICO → PNG | `transmutador_ico` | 1 |
| **7.4** | v1.10.3 | PNG → ICO | `transmutador_ico` | 1 |
| **7.5** | v1.10.4 | TGA → PNG | `transmutador_tga` | 1 |

**End state:** **15 active tools** (10 today + 5 new).  
**Out of Wave 2 MVP:** PNG/JPEG → TIFF, multi-page TIFF export, multi-size ICO emit, 16-bit HDR preservation (spike → maybe v1.11).

---

## 2. TIFF — format science (Wave 2 anchor)

### 2.1 What TIFF is

**TIFF (Tagged Image File Format)** is a **container**, not a single compression codec. Each image is described by an **IFD (Image File Directory)** — a directory of typed **tags** (width, height, bit depth, photometric interpretation, compression type, strip/tile layout, etc.) pointing at pixel data.

| Property | Implication for Camaleon |
|----------|-------------------------|
| **Tag-based** | Same extension `.tif`/`.tiff` can mean wildly different internal layouts |
| **Multi-page** | One file = many IFDs (scan pages, fax stacks, microscopy z-stacks) |
| **Bit depth** | 1-bit bilevel, 8-bit palette, 8/16-bit gray, 24-bit RGB, 32-bit RGBA, 16-bit/channel float |
| **Compression** | None, PackBits, LZW, Deflate/ZIP, JPEG-in-TIFF, old CCITT fax encodings |
| **Color models** | RGB, grayscale, palette-indexed, CMYK (print), separated |

TIFF is the **archival / professional raster** format: scanners, print prepress, GIS, microscopy, satellite tiles, and many **science archives** distribute GeoTIFF or large RGB mosaics as TIFF.

### 2.2 What TIFF is for (user jobs)

| Use case | Why users convert in Camaleon |
|----------|------------------------------|
| **Archive → web** | TIFF is huge; PNG/JPEG for sharing |
| **Print / scan → edit** | Open in browser tools that only accept PNG |
| **GIS / science mosaic** | Often TIFF or BigTIFF; may already hit our 40 MP / 150 MB limits → **astro downscale path** applies |
| **Multi-page document** | MVP: export **one selected page** (same honesty pattern as GIF frame picker) |
| **CMYK / exotic** | Likely **unsupported** in MVP — fail with precise i18n error |

### 2.3 What Camaleon will do (MVP)

**Inbound only** — decode TIFF, re-encode to web-friendly formats:

```
TIFF bytes
  → validate_input (dimensions, byte cap)
  → decode page N (default 0) via image::tiff or dedicated path
  → optional: normalize to 8-bit RGB/RGBA in engine (16-bit → scale)
  → StripAll (drop tags on output)
  → encode PNG or JPEG
```

| Direction | Fidelity | User-facing label |
|-----------|----------|-------------------|
| **TIFF → PNG** | Lossless (re compression only) | Lossless — master/edit format |
| **TIFF → JPEG** | Lossy | Lossy — web compression; alpha flattened |

**TIFF → ?** for Wave 2:

- ✅ **TIFF → PNG** — primary path; preserves pixels (within 8-bit normalization policy)
- ✅ **TIFF → JPEG** — quality slider + background color for alpha
- ❌ **TIFF → WebP** — deferred (encode crate scope; Tier 3+)
- ❌ **TIFF → GIF/BMP** — no product demand; skip

### 2.4 Logic behind the transmutation

#### TIFF → PNG

1. **Decode** IFD `page_index` to `DynamicImage` / RGBA8 (or RGB8 if no alpha).
2. **16-bit sources:** MVP policy = **scale to 8-bit** with documented tone mapping (linear stretch or `/256` for gray16 — **spike required** to match `image` 0.25 behavior).
3. **Encode PNG** with user compression 1–9 (`PngEncoder` + adaptive filter — same as JPG→PNG path).
4. **Size expectation:** uncompressed TIFF → PNG often **smaller** (DEFLATE); JPEG-compressed TIFF → PNG may be **much larger** (honest hint like BMP growth notice).

#### TIFF → JPEG

1. Same decode path as above.
2. **Alpha:** if meaningful alpha → flatten to user background (reuse `BackgroundFill` / `transmutador_png` pattern).
3. **Encode JPEG** quality 1–100, 4:2:0 subsampling (documented).
4. **CMYK / separated:** reject at probe with clear error — do not silently convert to wrong RGB.

### 2.5 Variables modifiable **before** transmutation (UI / Wasm)

| Variable | TIFF → PNG | TIFF → JPEG | Notes |
|----------|------------|-------------|-------|
| **Page index** | ✅ | ✅ | MVP: 0..N-1; UI page scrubber if `page_count > 1` |
| **PNG compression** | ✅ (1–9) | — | Same as other PNG outputs |
| **JPEG quality** | — | ✅ (1–100) | Standard slider |
| **Background color** | — | ✅ (if alpha) | Reuse `BackgroundColorPill` |
| **Downscale preset** | ✅ | ✅ | If pixels > 40 MP — existing `AstroResizePanel` |
| **Oversize consent** | ✅ | ✅ | Existing `LimitContext` |

**Not user-modifiable (intrinsic to file):**

- Source compression (LZW vs none vs JPEG tiles)
- Bit depth at source (we normalize)
- Photometric interpretation (handled by decoder)
- ICC color profile (StripAll on output — **warn** that color may shift if profile stripped)

### 2.6 Multi-page TIFF (product constraint)

| Tier | Behavior |
|------|----------|
| **MVP (v1.10.0)** | `page_index` parameter; default `0`; scrubber when `page_count > 1` (mirror GIF premium) |
| **Future** | Export all pages as ZIP of PNGs — backlog |

Wasm exports (proposed):

```rust
inspect_tiff_meta(bytes) -> TiffMeta { page_count, width, height, bit_depth, has_alpha, photometric }
transmutar_tiff_a_png_with_compression(bytes, compression, page_index)
transmutar_tiff_a_jpg_with_options(bytes, quality, bg_r, bg_g, bg_b, page_index)
estimate_tiff_to_png_size(bytes, compression, page_index)
estimate_tiff_to_jpg_size(bytes, quality, bg_r, bg_g, bg_b, page_index)
```

### 2.7 Risk matrix (spike gates before Phase 7.1)

| Risk | Mitigation |
|------|------------|
| **16-bit / float TIFF** | Spike: decode sample files; document downshift to 8-bit |
| **CMYK / separated** | Probe tag; reject with i18n |
| **BigTIFF (>4 GB)** | Byte cap 150 MB hard limit already blocks most |
| **JPEG-in-TIFF** | `image` crate support — verify in spike |
| **Wasm size** | Enable only `tiff` feature; NFR-7 gate ≤ 3 MB |
| **Memory** | Full decode of 40 MP 16-bit = huge; `LimitContext` + downscale preflight |
| **GeoTIFF metadata** | StripAll; optional UI note "geo tags removed" |

### 2.8 Spike checklist (Phase 7.0 — before coding)

- [x] `wasm-pack` with `image` feature `tiff` only — **919 KB** (see `tier2_wave2_spike_results.md`)
- [x] Fixture set: 8-bit RGB, 16-bit gray, palette, LZW, uncompressed, multi-page (2 IFDs), alpha RGBA
- [x] Document which fixtures fail in `image` 0.25 — **palette fails**; rest pass
- [x] Decide 16-bit → 8-bit algorithm — **`(u16 + 128) / 257`** via `DynamicImage::to_rgb8()` (match `image` 0.25)
- [x] Confirm `estimate_*` via `CountingWriter` parity — within 5% on rgb8 fixture

---

## 3. ICO — format science (Wave 2 phases 7.3–7.4)

### 3.1 What ICO is

**ICO (Icon)** is a **Windows container format** — not a pixel codec. One `.ico` file holds a **directory of embedded images** at different dimensions (typical favicon pack: 16, 32, 48, 256 px). Each entry is either:

| Entry type | Since | Pixel layout | Transparency |
|------------|-------|--------------|--------------|
| **DIB BMP** | Win32 | XOR bitmap (+ optional color table) | **1-bit AND mask** applied after decode |
| **Embedded PNG** | Vista+ | **32-bit RGBA** only (MSDN rule) | Alpha channel in PNG |

**On-disk layout:**

```
ICONDIR (6 B)     — reserved=0, type=1 (icon) or 2 (cursor), count=N
ICONDIRENTRY × N  — width, height, bpp, byte size, file offset (16 B each)
image data × N    — BMP+DIB+mask OR raw PNG bytes at each offset
```

| Property | Implication for Camaleon |
|----------|-------------------------|
| **Multi-size** | One drop → many resolutions; user must pick **which entry** to export (not silent) |
| **256 encoded as 0** | Directory width/height `0` means **256 px** — probe must normalize |
| **`.cur` files** | Same container as ICO (`type=2`); adds **hotspot** in directory fields — pixels decode the same |
| **Max dimension** | **256×256** per entry (ICO spec); no astro / 40 MP path needed |
| **`image` 0.25 default** | `IcoDecoder::new` picks **`best_entry`** = highest `(bpp, width×height)` — **not user-selectable** |

ICO is the **favicon / Windows shell / legacy app asset** format. Users convert when they need a normal PNG for editing, docs, or non-Windows targets — or when they have a PNG logo and need a `.ico` for a site or installer.

### 3.2 What ICO is for (user jobs)

| Use case | Why users convert in Camaleon |
|----------|------------------------------|
| **Favicon pack → one PNG** | `favicon.ico` has 4 sizes; designer wants the 32×32 or 256×256 layer |
| **App icon extraction** | Legacy `.ico` from a game or installer → PNG for wiki / asset pipeline |
| **PNG logo → favicon** | Single PNG brand mark → `.ico` for `<link rel="icon">` or Windows shortcut |
| **Cursor asset** | `.cur` dropped as icon source → PNG still (hotspot ignored in MVP) |
| **Transparency** | BMP-style icons use AND mask; PNG-style use alpha — output PNG must preserve both paths |

### 3.3 What Camaleon will do (MVP)

**Two directions** in one crate `transmutador_ico`:

```
ICO bytes
  → validate_input (byte cap; dimensions per entry ≤ 256)
  → inspect_ico_meta → entry list (width, height, bpp, format bmp|png)
  → decode entry[entry_index] (NOT image::load_from_memory — custom index)
  → StripAll on PNG output
  → encode PNG (7.3)

PNG bytes
  → validate_input
  → resize to target (16 | 32 | 48 | 256) if larger than target
  → encode single-entry ICO (PNG embedded via IcoEncoder — Vista+ style)
  → validate output (7.4)
```

| Direction | Fidelity | User-facing label |
|-----------|----------|-------------------|
| **ICO → PNG** | Lossless (re PNG compression only) | Lossless — extract one size as PNG |
| **PNG → ICO** | Lossless container; **resize is lossless** at integer scale | Lossless favicon — single size up to 256×256 |

**ICO → ?** for Wave 2:

- ✅ **ICO → PNG** — only outbound decode path (icons are tiny; JPEG adds no value)
- ❌ **ICO → JPEG** — no product demand; alpha + small pixels favor PNG
- ❌ **ICO → WebP** — Tier 3+

**PNG → ICO only** (no JPG → ICO in Wave 2 — JPEG has no alpha; favicons need transparency).

### 3.4 Logic behind the transmutation

#### ICO → PNG

1. **Probe** `ICONDIR` + all `ICONDIRENTRY` records (own parser — mirror `tiff_probe`; do not rely on `image::load_from_memory`).
2. **Select** `entry_index` (default = index of **largest area**, tie-break higher `bpp` — same scoring as `image::best_entry`).
3. **Decode entry:**
   - PNG signature at offset → `PngDecoder` (must be RGBA8 per MSDN).
   - Else → `BmpDecoder::new_with_ico_format` + read/apply **AND mask** (copy logic from `image` ico decoder).
4. **Reject** BMP entries that cannot produce RGBA8 (no alpha channel path) — precise i18n.
5. **Encode PNG** compression 1–9; StripAll; post-encode validation.

**Size expectation:** ICO → PNG is usually **similar or larger** (DEFLATE vs packed icon); honesty hint only if notably bigger.

#### PNG → ICO

1. **Decode** source PNG → RGBA8 (or RGB8).
2. **Target size** user picks: **16, 32, 48, or 256** (default **256**).
3. If `max(w,h) > target` → `imageops::resize` (**Lanczos3** — same quality bar as astro downscale).
4. If source is smaller than target → **do not upscale** by default (honesty: "source is already 32×32; output stays 32×32") — spike to confirm policy.
5. **Encode** via `IcoEncoder::write_image` → embeds **PNG-in-ICO** (modern, alpha-safe).
6. Single entry in container for MVP.

### 3.5 Variables modifiable **before** transmutation (UI / Wasm)

| Variable | ICO → PNG | PNG → ICO | Notes |
|----------|-----------|-----------|-------|
| **Entry index** | ✅ | — | `entry_index` 0..N-1; scrubber when `entry_count > 1` |
| **PNG compression** | ✅ (1–9) | — | Standard slider |
| **Target icon size** | — | ✅ | Presets 16 / 32 / 48 / 256 px (square) |
| **Astro downscale** | — | — | Not needed (max 256 px) |
| **Oversize consent** | ✅ (bytes) | ✅ (bytes) | `LimitContext` byte caps only |

**Not user-modifiable (intrinsic):**

- Which sizes exist inside a given `.ico` (read-only list from probe)
- BMP vs PNG storage inside ICO (decoder handles both)
- CUR hotspot coordinates (ignored in MVP; optional meta display later)
- Multi-size ICO emit (backlog — Tier 4 Favicon Suite)

### 3.6 Multi-size ICO (product constraint)

| Tier | Behavior |
|------|----------|
| **MVP (v1.10.2–3)** | `entry_index` parameter; default = largest entry; `IcoEntryScrubber` when `entry_count > 1` (mirror `TiffPageScrubber` / GIF frame picker) |
| **Future (Tier 4)** | PNG → ICO **multi-size pack** (16+32+48+256 in one `.ico` or ZIP) via `IcoEncoder::encode_images` |

Wasm exports (proposed):

```rust
inspect_ico_meta(bytes) -> IcoMeta { entry_count, entries: [{ width, height, bpp, has_alpha, format }] }
render_ico_entry_preview_png(bytes, entry_index) -> PNG (compression=1, for UI)
transmutar_ico_a_png_with_compression(bytes, compression, entry_index)
estimate_ico_to_png_size(bytes, compression, entry_index)

// Phase 7.4
transmutar_png_a_ico(bytes, target_size)   // target_size: 16 | 32 | 48 | 256
estimate_png_to_ico_size(bytes, target_size)
```

Frontend: `TransmutationOptions.entryIndex` (parallel `pageIndex` / `frameIndex`).

### 3.7 Risk matrix (spike gates before Phase 7.3)

| Risk | Mitigation |
|------|------------|
| **`image::load` picks largest only** | Custom `entry_index` decode path; spike proves parity with `best_entry` default |
| **BMP ICO without RGBA** | Reject at decode with i18n (`icoBmpNoAlpha`) |
| **PNG-in-ICO not RGBA** | Reject per `image` rules (`PngNotRgba`) |
| **AND mask missing vs required** | Follow `image` 0.25: accept if `data_end == image_end`; else apply mask |
| **`.cur` vs `.ico`** | Accept both extensions; probe `type` field; ignore hotspot in MVP |
| **256 as 0 in directory** | `real_width`/`real_height` helper (`0 → 256`) |
| **Upscale on PNG → ICO** | MVP: **no upscale** — output dimension = `min(source, target)` with honesty copy |
| **Wasm size** | Features `ico`+`png` only (`bmp` via `ico`); NFR-7 gate ≤ 3 MB |
| **Memory** | Trivial (≤256² × 4 per entry); no worker recycle changes |

### 3.8 Spike checklist (Phase 7.3.0 — before coding 7.3)

- [x] `wasm-pack` with `image` features `ico`+`png` only — **260 KB** (see `tier2_wave2_ico_spike_results.md`)
- [x] Fixture set: multi-size (16+32+256), PNG-embedded RGBA, single 16×16, `.cur` container
- [x] Document `entry_index` decode vs `image::load_from_memory` (largest) on multi-size fixture
- [x] BMP legacy path → **reject** at decode (`icoBmpLegacy` i18n); PNG-in-ICO is MVP scope
- [x] `estimate_*` within 5% on single-size fixture
- [x] PNG → ICO round-trip — Phase 7.4 (`png_to_ico_round_trip`, `png_to_ico_no_upscale`)

**Recommended execution:**

```
7.3.0  ICO spike (fixtures + wasm size + entry_index API)
7.3    ICO → PNG
7.4    PNG → ICO
```

---

## 4. TGA — format science (Wave 2 closing format)

### 4.1 What TGA is

**TGA (Truevision Targa)** is a **legacy raster** format from the 1980s, still common in **game assets**, **modding**, **Source/GoldSrc** pipelines, and older 3D tools. Unlike TIFF (tag container) or ICO (multi-entry directory), a classic TGA is a **single image** with a fixed **18-byte header** + optional ID field + optional color map + raw or RLE pixel data.

| Property | Implication for Camaleon |
|----------|-------------------------|
| **Header-driven** | Width, height, bpp, image type, and origin live in header — no IFD / ICONDIR |
| **Single image** | No multi-page or multi-entry picker (simplest Wave 2 UX) |
| **Pixel order** | Stored **BGR / BGRA** on disk; `image` decoder normalizes to RGB/RGBA |
| **Origin** | Rows may be **top-left or bottom-left**; decoder must flip (handled by `image::TgaDecoder`) |
| **Compression** | **Uncompressed (raw)** or **RLE** per scanline packets — user-invisible |
| **Bit depths** | 8-bit gray, 8-bit gray+alpha, 15/16-bit RGB (5-5-5), 24-bit RGB, 32-bit RGBA, indexed via color map |
| **TGA 2.0** | Optional footer with extension area (metadata, thumbnails) — **`image` 0.25 does not parse footer**; spike must test real files |

TGA is the **gaming / texture / retro asset** format: users convert when they need PNG for web, editors, or docs — not for archival science (that's TIFF).

### 4.2 What TGA is for (user jobs)

| Use case | Why users convert in Camaleon |
|----------|------------------------------|
| **Game texture → PNG** | `.tga` from mod tools, Unreal/Unity exports, or wiki assets → edit in browser |
| **Source engine assets** | VTF pipeline sometimes starts from TGA; designers want a quick PNG preview |
| **Alpha cutouts** | 32-bit TGA with transparency → PNG for web compositing |
| **RLE vs raw** | User does not care — same output; RLE is just smaller on disk |
| **Indexed / 16-bit** | Old UI skins and palettes — must decode or reject honestly |

### 4.3 What Camaleon will do (MVP)

**Inbound only** — one direction in new crate `transmutador_tga`:

```
TGA bytes
  → validate_input (dimensions, byte cap)
  → inspect_tga_meta (probe header: w, h, bpp, rle, has_alpha, color_mapped)
  → decode via image::TgaDecoder (or dedicated path if probe needs parity)
  → StripAll on PNG output
  → encode PNG compression 1–9
```

| Direction | Fidelity | User-facing label |
|-----------|----------|-------------------|
| **TGA → PNG** | Lossless (re PNG compression only) | Lossless — texture / asset to PNG |

**TGA → ?** for Wave 2:

- ✅ **TGA → PNG** — only outbound path (textures favor lossless export)
- ❌ **TGA → JPEG** — no product demand in Wave 2; alpha + game assets favor PNG
- ❌ **TGA → WebP** — Tier 3+ (`transmutador_encode` scope)
- ❌ **PNG → TGA** — **out of Wave 2** (encode + RLE policy + origin choice = separate product decision)

### 4.4 Logic behind the transmutation

#### TGA → PNG

1. **Probe** 18-byte header (+ skip ID, read color map size if present) — mirror `bmp_probe` / `ico_probe` for UI meta without full decode when possible.
2. **Decode** with `ImageReader` / `TgaDecoder`:
   - **Raw truecolor** (type 2), **RLE truecolor** (type 10) — primary MVP paths (24/32 bpp).
   - **Grayscale** (types 3, 11) → expand to RGB or RGBA PNG as appropriate.
   - **Color-mapped** (types 1, 9) — supported if `image` decodes; else reject with i18n.
   - **15/16-bit RGB** — `image` expands 5-5-5 to RGB8; **attribute bit is not alpha** (document in fidelity hint).
3. **Orientation** — trust `image` flip to top-left RGBA/RGB (spike: bottom-left fixture).
4. **Encode PNG** with user compression 1–9 (`PngEncoder` + adaptive filter — same as BMP/TIFF/ICO paths).
5. **StripAll** + post-encode validation.

**Size expectation (honesty copy):**

| Source | Typical PNG outcome |
|--------|---------------------|
| **Uncompressed 24/32-bit TGA** | PNG often **smaller** (DEFLATE vs raw BGR) |
| **RLE TGA** | Decode expands to full raster; PNG size similar to uncompressed equivalent |
| **Low-color / flat UI** | PNG can be **much smaller** than bloated raw TGA |

**Not JPEG-style “quality”:** PNG compression 1–9 changes **DEFLATE effort only** — pixels are identical at every level. Level **1 = faster encode, larger file**; level **9 = smaller file, slower**. Default UI **6** (balanced). Users comparing round-trip sizes must hold compression level constant (see §4.9 note on ICO round-trip).

### 4.5 Variables modifiable **before** transmutation (UI / Wasm)

| Variable | TGA → PNG | Notes |
|----------|-----------|-------|
| **PNG compression** | ✅ (1–9) | Same slider as BMP/TIFF/ICO → PNG; default **6** |
| **Downscale preset** | ✅ | If pixels > 40 MP — `AstroResizePanel` (4K game textures exist) |
| **Oversize consent** | ✅ | `LimitContext` byte caps |

**Not user-modifiable (intrinsic):**

- RLE vs raw (decoder handles both)
- BGR vs RGB channel order (normalized on decode)
- Image origin (top-left vs bottom-left — engine corrects)
- 15/16-bit attribute bit semantics
- Color map contents (read-only from file)
- TGA 2.0 extension metadata (ignored in MVP if present after pixel data)

**No extra pickers** — unlike TIFF `page_index` or ICO `entry_index`. Simplest tool in Wave 2.

### 4.6 Product constraints

| Tier | Behavior |
|------|----------|
| **MVP (v1.10.4)** | Single image per file; `.tga` extension; probe + decode + PNG out |
| **Future** | PNG → TGA (encode, RLE toggle, origin); TGA → JPEG; batch folder — backlog |

Wasm exports (proposed):

```rust
inspect_tga_meta(bytes) -> TgaMeta {
    width, height, pixel_depth, image_type, is_rle, is_color_mapped,
    has_meaningful_alpha, orientation  // meta for UI / fidelity hint
}
render_tga_preview_png(bytes) -> PNG   // compression=1, for prepare pipeline
transmutar_tga_a_png_with_compression(bytes, compression)
estimate_tga_to_png_size(bytes, compression)
```

Frontend: standard tool — **no** `pageIndex` / `entryIndex` / `iconSize`. Only compression slider (+ astro if needed).

### 4.7 Risk matrix (spike gates before Phase 7.5)

| Risk | Mitigation |
|------|------------|
| **TGA 2.0 footer / extension area** | Spike real files from Blender, GIMP, Photoshop; if `image` fails on trailing footer, strip or reject with i18n |
| **15/16-bit “alpha” attribute bit** | `image` maps to RGB8 without alpha — fidelity hint; do not promise transparency |
| **Color-mapped exotic map sizes** | `image` supports 15/16/24/32 map entries; reject unknown with mapped error |
| **All-zero alpha channel** | Some tools write 32-bit with A=0 meaning opaque — follow `image` behavior; spike + honesty if wrong |
| **Huge textures (4K–8K)** | `validate_input` + 40 MP gate + astro downscale path |
| **Wrong extension** | Accept `.tga` only in MVP (`.vda`/`.icb`/`.vst` backlog) |
| **Wasm size** | Features `tga`+`png` only; NFR-7 gate ≤ 3 MB (expect **smaller than TIFF**, similar to BMP) |
| **BGR channel swap** | Rely on `image` `reverse_encoding`; golden test vs known PNG |
| **Estimate drift** | `estimate_*` within 5% on raw + RLE fixtures |

### 4.8 Spike checklist (Phase 7.5.0 — before coding 7.5)

- [x] `wasm-pack` with `image` features `tga`+`png` only — **203 KB** (see `tier2_wave2_tga_spike_results.md`)
- [x] Fixture set:
  - [x] 24-bit RGB raw, bottom-left origin
  - [x] 32-bit RGBA raw with real alpha
  - [x] 32-bit RLE truecolor
  - [x] 8-bit grayscale + 8-bit grayscale RLE
  - [x] 16-bit RGB (attribute bit) — `is_rgb555`, no false alpha in probe
  - [x] Indexed color-mapped raw
  - [x] TGA 2.0 footer suffix (trailing signature bytes)
- [x] `inspect_tga_meta` vs full decode dimensions parity
- [x] Orientation: bottom-left source → correct PNG orientation
- [x] `estimate_tga_to_png_size` within 5% on each fixture class
- [x] StripAll integration test — `strip_all_no_exif_in_output`
- [x] Document results in `docs/planning/tier2_wave2_tga_spike_results.md`

**Recommended execution:**

```
7.5.0  TGA spike (fixtures + wasm size + probe API)
7.5    TGA → PNG
```

### 4.9 Cross-format note — ICO round-trip file sizes (user-reported)

Observed: **512×512 PNG ~15.6 KB** → **PNG→ICO @256px ~15.2 KB** → **ICO→PNG @ compression 1 ~18.1 KB**.

This is **expected**, not entropy loss:

1. **PNG is always lossless** — compression slider is **DEFLATE level**, not visual quality. **1 = minimal compression effort = larger file**; **9 = smaller file**. Default in Camaleon is **6**.
2. **Different resolutions** — after ICO step the raster is **~256px**, not 512px. Comparing KB to the original 512px file mixes **pixel count** and **codec settings**.
3. **Re-encoding changes bytes** — even identical pixels produce different PNG IDs, filters, and zlib streams after ICO embed → extract → re-encode.
4. **ICO embed** may use a different zlib level than the user's ICO→PNG export setting.

**Product takeaway:** fidelity hints for ICO→PNG should continue to say “lossless”; optional backlog — clarify that compression **1** means “faster / larger”, not “highest quality”. For fair size checks, compare at the **same compression level** and **same dimensions**.

---


## 5. Shared engineering pattern (all Wave 2 crates)

Mirror Wave 1:

1. New crate `transmutador_{tiff,ico,tga}` in workspace
2. `default-features = false` on `image`; enable only needed codecs
3. `validate_input` + `StripAll` + post-encode validation
4. `estimate_*_size` on every direction
5. Worker lazy-load + `TransmutationModule` enum extension
6. `tool-registry.ts` entry + i18n EN/ES
7. Prepare pipeline: Wasm `inspect_*_meta` where metadata drives UI (page/size pickers)
8. Release entry `lib/releases/entries/v1.10.x.ts` + What's New manifest (**mandatory per SPEC §7.11**)

---

## 6. QA gate (per phase)

1. `cargo test -p transmutador_<crate>`
2. `cd frontend && npm run build:wasm && npm run build`
3. Manual smoke: drop → options → transmute → download
4. Estimate tracks option changes (page index, quality)
5. i18n EN + ES
6. Wasm ≤ 3 MB
7. StripAll integration test
8. LimitContext: 40 MP block + astro downscale path on huge TIFF

---

## 7. Recommended execution order

```
7.0    TIFF spike (fixtures + wasm size + 16-bit policy)
7.1    TIFF → PNG
7.2    TIFF → JPEG
7.3.0  ICO spike (entry_index API + fixtures + wasm size)
7.3    ICO → PNG
7.4    PNG → ICO
7.5.0  TGA spike (fixtures + wasm size + probe API)
7.5    TGA → PNG
7.6    Wave 2 polish + v1.10.x release (manifest, GitHub release, docs)
```

**Rationale:** TIFF first — highest value for science/print users, exercises multi-page UI and 16-bit policy; ICO/TGA are smaller scope afterward.

---

## 8. Open questions (dev session)

### Resolved (TIFF — shipped 7.1–7.2)

1. **16-bit TIFF → PNG:** ✅ **8-bit MVP** with honesty copy (`to_rgb8()` policy).
2. **GeoTIFF:** deferred — optional one-line disclaimer backlog.

### Resolved (ICO — shipped 7.3–7.4)

| # | Decision | Outcome |
|---|----------|---------|
| 1 | ICO → PNG: picker vs silent largest | **Picker** when `entry_count > 1`; default = largest area |
| 2 | Accept `.cur` | **Yes** — `.ico` + `.cur`; hotspot ignored in MVP |
| 3 | PNG → ICO size presets | **16 / 32 / 48 / 256** (default 256); single entry |
| 4 | PNG → ICO upscale | **No** — downscale only; honesty hint in UI |
| 5 | ICO → JPEG | **Out of scope** Wave 2 |
| 6 | Multi-size ICO emit | **Backlog** (Tier 4 Favicon Suite) |

### Resolved (TGA — spike 7.5.0)

| # | Decision | Outcome |
|---|----------|---------|
| 1 | Extensions | **`.tga` only** in MVP |
| 2 | 15/16-bit TGA | **RGB8** via `image`; `is_rgb555` in probe; fidelity hint in 7.5 |
| 3 | Indexed color-mapped | **Supported** (types 1/9) |
| 4 | TGA 2.0 footer | Trailing footer **does not break** decode; extension metadata ignored |
| 5 | PNG → TGA | **Out of scope** Wave 2 |
| 6 | TGA → JPEG | **Out of scope** Wave 2 |
| 7 | All-zero alpha in 32-bit | Follow `image` at product time; no spike blocker |
| 8 | Preview in prepare | **Yes** — `render_tga_preview_png` exported in spike crate |

---

## Related

- `docs/SPEC.md` §12.3 Wave 2 table
- `docs/planning/wave2_astro_roadmap.md` — large TIFF mosaics + downscale
- `docs/planning/adaptive_limits_proposal.md` — LimitContext
- `docs/planning/gif_premium_roadmap.md` — page/frame picker pattern for TIFF multi-page
