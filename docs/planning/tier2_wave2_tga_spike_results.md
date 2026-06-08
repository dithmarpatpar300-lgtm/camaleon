# Tier 2 Wave 2 — Phase 7.5.0 TGA Spike Results

> **Date:** 2026-06-08  
> **Crate:** `motor_transmutacion/transmutador_tga` (spike ✅ — **shipped in v1.10.4**)  
> **Dependencies:** `image` 0.25.10 (`tga` + `png` features)  
> **Gate:** NFR-7 Wasm ≤ 3 MB per module

---

## 1. Wasm size (release + wasm-opt)

| Module | `.wasm` size | NFR-7 |
|--------|-------------|-------|
| `transmutador_tga` (`tga`+`png`) | **203 KB** (207,398 bytes) | ✅ pass |
| `transmutador_bmp` (reference) | 650 KB | ✅ pass |
| `transmutador_ico` (reference) | 260 KB | ✅ pass |

---

## 2. Fixture matrix

Fixtures in `transmutador_tga/tests/spike_fixtures.rs` (programmatic `TgaEncoder` + hand-built indexed/16-bit).

| Fixture | Probe | Decode → PNG | Notes |
|---------|-------|--------------|-------|
| **rgb24_raw_top_left** | ✅ | ✅ | Raw truecolor, top-left origin |
| **rgb24_raw_bottom_left** | ✅ orientation | ✅ | `image_desc` bit 5 cleared |
| **rgba32_raw_alpha** | ✅ alpha channel | ✅ | Meaningful alpha in PNG out |
| **rgba32_rle** | ✅ RLE | ✅ | Default encoder RLE path |
| **gray8_raw** | ✅ | ✅ | Grayscale type 3 |
| **gray8_rle** | ✅ RLE | ✅ | Grayscale type 11 |
| **rgb555_16bit** | ✅ `is_rgb555` | ✅ | 15-bit RGB expanded to RGB8 |
| **indexed_raw** | ✅ color-mapped | ✅ | 4×4 palette indices |
| **tga2_footer_suffix** | ✅ | ✅ | Trailing `TRUEVISION-XFILE.\0` footer — decode unaffected |
| **orientation_gradient** | ✅ bottom-left | ✅ | Top pixel blue after flip (row order corrected) |

---

## 3. API decisions (confirmed — recommendations adopted)

| Decision | Choice |
|----------|--------|
| Extensions | **`.tga` only** in MVP |
| Decode path | **`TgaDecoder` directly** — `ImageReader::with_guessed_format` does not sniff TGA |
| 15/16-bit TGA | **RGB8 output**; probe sets `is_rgb555`; no false alpha |
| Indexed color-mapped | **Supported** (types 1/9) via `image` |
| TGA 2.0 footer | **Ignored** — trailing footer bytes do not break decode in spike |
| PNG → TGA / TGA → JPEG | **Out of Wave 2** |
| Preview | **`render_tga_preview_png`** at compression=1 (spike API ready) |

---

## 4. Probe vs decode

`inspect_tga_meta` reads the 18-byte header only (width, height, pixel depth, image type, orientation, alpha-channel hint, rgb555 flag). Dimensions match full decode on all fixtures ✅

---

## 5. Estimate parity

`estimate_tga_to_png_size` within **5%** of full encode on **all** fixture classes ✅

---

## 6. Risks deferred to phase 7.5 (product)

| Item | Spike outcome |
|------|----------------|
| Real GIMP/Photoshop TGA 2.0 with extension area | Footer-only suffix OK; full extension metadata not parsed |
| All-zero alpha in 32-bit | Not fixture-tested; follow `image` at product time |
| `.vda`/`.icb`/`.vst` aliases | Not in MVP |

---

## Related

- `docs/planning/tier2_wave2_plan.md` §4.8
- Shipped: **v1.10.4** — `/transmute/tga-to-png`, worker, i18n EN/ES
