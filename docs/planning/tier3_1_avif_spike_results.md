# Tier 3 Phase 3.1.0 — AVIF Spike Results

> **Date:** 2026-06-11  
> **Crate:** `motor_transmutacion/transmutador_avif`  
> **Decode backend:** **zenavif 0.1.6** + **zenavif-parse 0.6.2** (pure Rust, rav1d-safe)  
> **Gate:** NFR-7 Wasm ≤ 3 MB per module · §12.4 go/no-go ≤ 4 MB

---

## 1. Verdict: **Backend A adopted**

All Phase 3.1.0 spike gates **pass**. Proceed to **3.1.1** (AVIF → PNG) without escalating to `image`+`avif-native`/libdav1d.

| Gate | Result |
|------|--------|
| `wasm-pack build --target web --release` | ✅ |
| `.wasm` size | **1,898,219 B (~1.81 MB)** — ✅ NFR-7 |
| Fixture matrix decode | ✅ 5/5 programmatic fixtures |
| `inspect_avif_meta` without full decode | ✅ `zenavif-parse::AvifParser` + `primary_metadata()` |
| `estimate_*` CountingWriter parity | ⏳ **Deferred to 3.1.1** (not in spike crate API yet) |

Build command:

```bash
cd motor_transmutacion/transmutador_avif
wasm-pack build --target web --release --out-dir spike-wasm-out --out-name transmutador_avif
```

Artifact (gitignored): `motor_transmutacion/transmutador_avif/spike-wasm-out/transmutador_avif_bg.wasm`

---

## 2. Wasm size comparison

| Module | `.wasm` (release + wasm-opt) | NFR-7 |
|--------|-------------------------------|-------|
| **`transmutador_avif`** (spike) | **1.81 MB** | ✅ |
| `transmutador_tiff` (reference) | 919 KB | ✅ |
| `transmutador_webp` (reference) | ~650 KB | ✅ |

AVIF decode is **~2× TIFF** but well under the 3 MB ceiling. Aggregate `public/wasm/` budget still comfortable for two AVIF tools on same crate.

---

## 3. Fixture matrix (`ravif` encode → `zenavif` decode)

Fixtures: `transmutador_avif/tests/spike_fixtures.rs` (dev-dep `ravif` only — not in Wasm bundle).

| Fixture | Probe | Decode | Notes |
|---------|-------|--------|-------|
| **rgb8_lossy** | ✅ | ✅ | 64×64 gradient; probe bit_depth 8 or 10 |
| **rgba_alpha_aux** | ✅ | ✅ | Meaningful alpha; preview PNG has α &lt; 255 |
| **opaque_rgba** | ✅ | ✅ | All α=255; encoder may **omit** alpha aux item |
| **lossless_graphic** | ✅ | ✅ | ravif Q=100 |
| **rgb8_10bit** | ✅ | ✅ | `BitDepth::Ten` → 8-bit raster via `(u16+128)/257` |
| **corrupt/truncated** | error | error | Honest parse/decode errors |
| **animated_avis** | — | — | **Not generated**; policy below |
| **oversize_dims** | — | — | `MAX_PIXELS` math verified; synthetic AVIF deferred to 3.1.1 |

---

## 4. Decode pixel policy (locked for 3.1.x)

`zenavif::decode` returns `PixelBuffer` with **8- or 16-bit** layouts. MVP conversion in `avif_decode.rs`:

| Bytes/pixel | Interpretation | Output |
|-------------|----------------|--------|
| 3 | RGB8 | `ImageRgb8` |
| 4 | RGBA8 | `ImageRgba8` |
| 6 | RGB16 LE | downshift → `ImageRgb8` |
| 8 | RGBA16 LE | downshift → `ImageRgba8` |
| 1–2 | Gray / Gray16 | `ImageLuma8` |

**16/10-bit → 8-bit:** `u8 = min(255, (u16 + 128) / 257)` — same family as TIFF Wave 2 (`image` tone map).

---

## 5. Probe API (spike exports)

| Export | Purpose |
|--------|---------|
| `inspect_avif_meta` | Prepare UI: width, height, bit_depth, has_alpha_channel, is_sequence, frame_count, lossless |
| `decode_avif_preview_png` | Full decode + fast PNG (compression 1) for future prepare preview |
| `set_session_input_limit` / `reset_session_input_limit` | LimitContext parity |

**Probe cost:** ISOBMFF parse + AV1 sequence header metadata — **no full tile raster decode**.

**Animated AVIF:** `inspect_and_validate` returns `"Animated AVIF is not supported yet"` when `is_sequence` (Q1 decision).

---

## 6. Open decisions resolved (§3.5)

| # | Decision | Outcome |
|---|----------|---------|
| **Q1** | Animated AVIF in MVP | **Reject** at `inspect_and_validate` with clear error; frame scrubber backlog |
| **Q2** | 10/12-bit HDR output | **8-bit SDR** raster; honesty hint in 3.1.1/3.1.2 i18n |
| **Q3** | `image` in decode path | **No** — decode via `zenavif` only; `image` for PNG encode in spike preview |
| **Q4** | `assess_alpha` export | **3.1.2** (AVIF → JPEG phase) |
| **Q5** | Alpha hint on estimate | **3.1.2** |

---

## 7. Deferred to 3.1.1+

- `core_utils::probe_dimensions` AVIF magic (`ftyp`) — avoid pulling zenavif into `core_utils`; worker uses `inspect_avif_meta` before transmute
- `transmutar_avif_a_png_*` + `estimate_avif_to_png_size`
- `validate_output` integration tests + StripAll
- Frontend worker + registry (`status: soon`)
- Synthetic oversize AVIF fixture for `DimensionsTooLarge` integration test

---

## Related

- `docs/planning/tier3_plan.md` §7.1
- `motor_transmutacion/transmutador_avif/`
