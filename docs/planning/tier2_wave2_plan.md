# Tier 2 — Wave 2 (TIFF, ICO, TGA)

> **Branch:** `dev` → target **v1.10.x** on `main`  
> **Status:** Phase 7.0 spike ✅ · Phase 7.1 TIFF→PNG ✅ (v1.10.0) · Phase 7.2 TIFF→JPEG ✅ (v1.10.1) · Phase 7.3+ pending  
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

## 3. ICO — format science (summary)

**ICO** = Windows icon container holding **multiple bitmap sizes** (16, 32, 48, 256…) often with AND mask for transparency.

| Direction | MVP logic |
|-----------|-----------|
| **ICO → PNG** | Decode **largest** embedded image (or user-picked size — spike); PNG lossless out |
| **PNG → ICO** | Resize source to **256×256** (user confirm); single-size ICO MVP; multi-size favicon pack → backlog |

Variables: size pick (ICO→PNG), optional downscale (PNG→ICO), PNG compression N/A for ICO encode.

---

## 4. TGA — format science (summary)

**TGA (Targa)** — legacy game / texture format; uncompressed or RLE; 24/32-bit BGR(A).

| Direction | MVP logic |
|-----------|-----------|
| **TGA → PNG** | Decode → PNG; alpha in 32-bit; RLE transparent |

Variables: PNG compression 1–9 only. No encode TGA in Wave 2.

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
7.0  TIFF spike (fixtures + wasm size + 16-bit policy)
7.1  TIFF → PNG
7.2  TIFF → JPEG
7.3  ICO → PNG
7.4  PNG → ICO
7.5  TGA → PNG
7.6  Wave 2 polish + v1.10.0 release (manifest, GitHub release, docs)
```

**Rationale:** TIFF first — highest value for science/print users, exercises multi-page UI and 16-bit policy; ICO/TGA are smaller scope afterward.

---

## 8. Open questions (dev session)

1. **16-bit TIFF → PNG:** preserve 16-bit in PNG output vs always 8-bit? (PNG supports 16-bit but UI preview is 8-bit canvas — recommend **8-bit MVP** with honesty copy.)
2. **ICO → PNG:** largest vs picker UI?
3. **PNG → ICO:** single 256×256 only vs multi-size ZIP?
4. **GeoTIFF:** one-line disclaimer on TIFF tools linking to astro doc?

---

## Related

- `docs/SPEC.md` §12.3 Wave 2 table
- `docs/planning/wave2_astro_roadmap.md` — large TIFF mosaics + downscale
- `docs/planning/adaptive_limits_proposal.md` — LimitContext
- `docs/planning/gif_premium_roadmap.md` — page/frame picker pattern for TIFF multi-page
