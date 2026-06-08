# Tier 2 Wave 2 — Phase 7.0 TIFF Spike Results

> **Date:** 2026-06-08  
> **Crate:** `motor_transmutacion/transmutador_tiff` (spike ✅ — wired to frontend in phases 7.1–7.2)  
> **Dependencies:** `image` 0.25.10 (`tiff` feature), `tiff` 0.11.3  
> **Gate:** NFR-7 Wasm ≤ 3 MB per module

---

## 1. Wasm size (release + wasm-opt)

| Module | `.wasm` size | NFR-7 |
|--------|-------------|-------|
| `transmutador_tiff` (spike, `tiff`+`png`+`jpeg` features) | **919 KB** | ✅ pass |
| `transmutador_bmp` (reference) | 650 KB | ✅ pass |

Build command used:

```bash
cd motor_transmutacion/transmutador_tiff
wasm-pack build --target web --release --out-dir spike-wasm-out --out-name transmutador_tiff
```

Spike artifact path (gitignored): `motor_transmutacion/transmutador_tiff/spike-wasm-out/`

---

## 2. Fixture matrix (`image` 0.25 decode)

Fixtures are generated programmatically in `transmutador_tiff/tests/spike_fixtures.rs`.

| Fixture | Container probe | `image` decode | Notes |
|---------|-----------------|----------------|-------|
| **rgb8_uncompressed** | ✅ 16×16 RGB, None | ✅ `Rgb8` | Baseline path |
| **gray16_uncompressed** | ✅ 8×8, 16-bit gray | ✅ `L16` | Downshifts to 8-bit on `to_rgb8()` |
| **lzw_rgb8** | ✅ LZW compression | ✅ `Rgb8` | LZW decode works |
| **rgba_alpha** | ✅ RGBA | ✅ `Rgba8` | Meaningful alpha preserved in PNG out |
| **multipage_2_ifd** | ✅ `page_count=2` (2×2 + 3×3) | ✅ first page only (2×2) | `page_index` API required in 7.1 |
| **palette_indexed** | ✅ photometric=`RGBPalette` | ❌ unsupported color type | Reject at probe in 7.1 |

**Not in spike fixtures (deferred):**

- **JPEG-in-TIFF** — not generated; `tiff` 0.11 supports `CompressionMethod::ModernJPEG` when `jpeg` feature enabled; spike crate uses `deflate`+`lzw` only. Phase 7.1 should add one JPEG-compressed TIFF fixture before ship.
- **CMYK** — `image` maps CMYK to RGB at decode (silent conversion). MVP policy: **reject at probe** via `PhotometricInterpretation::CMYK` before transmute (honesty).
- **Float32 RGB** — supported by `image` decode but out of Wave 2 MVP; treat like 16-bit (downshift to 8-bit) if encountered.

---

## 3. Failures in `image` 0.25

| Case | Behavior |
|------|----------|
| **Palette / indexed** | `TiffDecoder::new` → `UnsupportedError` for `ColorType::Palette(n)` |
| **Exotic photometric** | CIELab, ITU Lab, transparency mask → unsupported at `tiff` colortype stage |
| **Multi-page** | Only **first IFD** decoded by `ImageReader::decode()`; additional pages invisible without `tiff::Decoder::next_image()` + manual re-encode |

Probe (`inspect_tiff`) uses `tiff::Decoder` tag reads and **does** enumerate all IFDs without full raster decode.

---

## 4. 16-bit → 8-bit policy (decision)

**MVP decision:** Always emit **8-bit** PNG/JPEG. Match `image` 0.25 tone mapping exactly:

```text
u8 = (u16 + 128) / 257    // equivalent to round(u16 * 255 / 65535)
```

Implemented in spike as `downshift_u16_sample_to_u8()` and verified by `downshift_matches_image_to_rgb8_for_gray16` integration test against `DynamicImage::to_rgb8()`.

**Rationale:**

- UI preview canvas is 8-bit; 16-bit PNG output would mislead users.
- Using `image`'s native cast avoids a second rounding policy and keeps estimate/transmute aligned.
- Document in tool honesty copy: "16-bit sources are normalized to 8-bit."

**Not in MVP:** 16-bit PNG output, HDR tone mapping, linear stretch for astro mosaics (astro downscale still applies to dimensions, not bit depth).

---

## 5. `estimate_*` parity (`CountingWriter`)

| Path | Parity |
|------|--------|
| `estimate_tiff_to_png_size` vs `transmutar_tiff_a_png_inner` | ✅ within **5%** on rgb8 fixture (`spike_test`) |

Same pattern as `transmutador_bmp` — encode to `CountingWriter` without allocating output buffer.

---

## 6. Phase 7.1 readiness checklist

- [x] Wasm size gate
- [x] Fixture matrix + documented failures
- [x] 16-bit policy locked
- [x] Estimate parity confirmed
- [ ] Wire `transmutador_tiff` into `build-wasm.mjs` + worker (7.1)
- [ ] `inspect_tiff_meta` Wasm export + `page_index` on transmute/estimate (7.1)
- [ ] CMYK + palette reject with i18n errors (7.1)
- [ ] JPEG-in-TIFF fixture + test (7.1 pre-ship)

---

## Related

- `docs/planning/tier2_wave2_plan.md` §2.8
- `motor_transmutacion/transmutador_tiff/tests/spike_test.rs`
