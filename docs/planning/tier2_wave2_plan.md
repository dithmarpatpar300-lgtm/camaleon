# Tier 2 — Wave 2 (TIFF, ICO, TGA)

> **Branch:** `dev` → target **v1.10.x** on `main`  
> **Status:** Phase 7.0–7.2 TIFF ✅ · Phase 7.3.0 ICO spike ✅ · Phase 7.3 ICO→PNG ✅ (v1.10.2) · Phase 7.4 PNG→ICO ✅ (v1.10.3) · Phase 7.5 pending  
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
7.0    TIFF spike (fixtures + wasm size + 16-bit policy)
7.1    TIFF → PNG
7.2    TIFF → JPEG
7.3.0  ICO spike (entry_index API + fixtures + wasm size)
7.3    ICO → PNG
7.4    PNG → ICO
7.5    TGA → PNG
7.6    Wave 2 polish + v1.10.x release (manifest, GitHub release, docs)
```

**Rationale:** TIFF first — highest value for science/print users, exercises multi-page UI and 16-bit policy; ICO/TGA are smaller scope afterward.

---

## 8. Open questions (dev session)

### Resolved (TIFF — shipped 7.1–7.2)

1. **16-bit TIFF → PNG:** ✅ **8-bit MVP** with honesty copy (`to_rgb8()` policy).
2. **GeoTIFF:** deferred — optional one-line disclaimer backlog.

### ICO — decisions needed before 7.3.0 spike

| # | Question | Recommendation | Status |
|---|----------|----------------|--------|
| 1 | **ICO → PNG:** silent largest vs picker? | **Picker** when `entry_count > 1`; default index = largest area (same score as `image::best_entry`) | ✅ |
| 2 | **Accept `.cur`?** | **Yes** — same tool, extensions `.ico` + `.cur`; hotspot shown in meta optional, not used in PNG out | ✅ |
| 3 | **PNG → ICO:** single 256 only vs size presets? | **Presets 16 / 32 / 48 / 256** (default 256); single entry in file | ⏳ confirm |
| 4 | **PNG → ICO:** upscale if source smaller than target? | **No upscale** — `output = min(source, target)` per side; honesty hint | ⏳ confirm |
| 5 | **ICO → JPEG?** | **No** — not in Wave 2 scope | ✅ out of scope |
| 6 | **Multi-size ICO emit?** | **Backlog** (Tier 4 Favicon Suite); MVP single size only | ✅ deferred |

---

## Related

- `docs/SPEC.md` §12.3 Wave 2 table
- `docs/planning/wave2_astro_roadmap.md` — large TIFF mosaics + downscale
- `docs/planning/adaptive_limits_proposal.md` — LimitContext
- `docs/planning/gif_premium_roadmap.md` — page/frame picker pattern for TIFF multi-page
