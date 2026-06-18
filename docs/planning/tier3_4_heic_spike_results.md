# Tier 3 Phase 3.4.0 — HEIC Decode Spike Results

> **Date:** 2026-06-11  
> **Crate:** `motor_transmutacion/transmutador_heic`  
> **Backend:** **`heic` 0.1.6** (pure Rust HEVC + HEIF parse, `default-features = false`, `std` only)  
> **Gate:** NFR-7 Wasm ≤ 3 MB per module · §12.4 go/no-go ≤ 4 MB

---

## 1. Verdict: **GO (technical) — proceed to 3.4.1 (HEIC→JPEG) after license review**

All Phase 3.4.0 **technical** spike gates **pass**. No frontend / ToolRegistry wiring in this phase.

| Gate | Result |
|------|--------|
| `wasm-pack build --target web --release` | ✅ |
| `.wasm` size (release + wasm-opt) | **555,438 B (~542 KB)** — ✅ NFR-7 (large headroom) |
| Fixture matrix §7.5 (`cargo test -p transmutador_heic`) | ✅ 10 tests |
| `inspect_heic_meta` + `ImageInfo::from_bytes` probe | ✅ no full HEVC decode for dimensions |
| Grid tile stitch (`grid.heic`) | ✅ |
| Alpha aux → PNG RGBA (`alpha.heic`) | ✅ |
| Orientation (`iden_rot90.heic`) | ✅ output matches probed W×H |
| Estimate within 5% of full encode | ✅ JPEG + PNG on `bt709.heic` |
| `cargo test -p transmutador_heic` | ✅ |

Build command:

```bash
cd motor_transmutacion/transmutador_heic
wasm-pack build --target web --release \
  --out-dir spike-wasm-out --out-name transmutador_heic
```

Artifact (gitignored): `spike-wasm-out/`

Native / integration tests:

```bash
cargo test -p transmutador_heic
```

Fixtures sourced from [imazen/heic testdata](https://github.com/imazen/heic/tree/main/testdata/features) (MIT-compatible test vectors; **decoder crate license separate** — see §5).

---

## 2. Wasm size

| Module | `.wasm` (release + wasm-opt) | NFR-7 | Notes |
|--------|-------------------------------|-------|-------|
| **`transmutador_heic`** | **~542 KB** | ✅ | HEVC decode much smaller than feared; headroom ~2.46 MB before 3 MB gate |

**Aggregate `public/wasm/` when shipped:** +~542 KB lazy-loaded (after 3.4.1 frontend wiring).

Compare siblings (release):

| Crate | ~Size |
|-------|-------|
| `transmutador_avif` (decode) | ~1.90 MB |
| `transmutador_svg` | ~1.63 MB |
| **`transmutador_heic`** | **~0.54 MB** |

---

## 3. Wasm API (spike exports)

Crate: `transmutador_heic`

```rust
inspect_heic_meta(bytes) -> HeicMeta
transmutar_heic_a_png(bytes, compression)
transmutar_heic_a_jpg_with_options(bytes, quality, bg_r, bg_g, bg_b)
estimate_heic_to_png_size(bytes, compression, alpha_confidence, alpha_meaningful)
estimate_heic_to_jpg_size(bytes, quality, bg_r, bg_g, bg_b, alpha_confidence, alpha_meaningful)
assess_heic_meaningful_alpha(bytes) -> AlphaAssessmentJs
set_session_input_limit / reset_session_input_limit
set_risk_mode / risk_mode_enabled
```

| Parameter | Range | Default | Notes |
|-----------|-------|---------|-------|
| **compression** (PNG) | 1–9 | **6** | Spike validates encode path; tool ships in 3.4.2 |
| **quality** (JPEG) | 1–100 | **85** | Primary MVP target (3.4.1) |
| **background RGB** | 0–255 | white | Semantic alpha flatten |

**Pipeline:** HEIC → `heic` decode (RGBA8) → `image` PNG/JPEG encode → `validate_output` (StripAll in worker at ship).

**Estimate:** Full HEVC decode + `CountingWriter` encode — same order as transmute; Notice Rail `expensive` in 3.4.1.

---

## 4. Fixture matrix results

| Fixture | Probe | Decode | Notes |
|---------|-------|--------|-------|
| **bt709.heic** (iphone_photo_rgb) | ✅ | ✅ | Baseline still |
| **grid.heic** | ✅ | ✅ | Tiled grid stitch |
| **alpha.heic** | ✅ | ✅ | `has_alpha_channel` true |
| **iden_rot90.heic** | ✅ | ✅ | Orientation applied in decoder output |
| **depth10.heic** | ✅ | ✅ | RGB decodes; depth flag not always in probe |
| **corrupt / truncated** | error | — | Honest errors |
| **live_photo_container** | — | — | Not in corpus yet — Q2 backlog |
| **10bit_main10** | — | — | Add fixture in 3.4.1 if needed |
| **oversize_dims** | — | — | Covered by `inspect_and_validate` + `MAX_PIXELS` unit path |

---

## 5. License gate (Chief Architect — before 3.4.1 merge)

The `heic` crate (v0.1.6) is licensed **AGPL-3.0-only OR LicenseRef-Imazen-Commercial** — **not compatible** with Camaleon’s MIT license without:

- Imazen commercial license, **or**
- AGPL compliance for the distributed app, **or**
- Fallback spike **B** (`libheif-rs` + embedded libheif — also license/size review)

**Technical spike recommends backend A**; **legal review required** before adding to `public/wasm/` production build.

Patent note (from upstream crate): HEVC decode may implicate patent pools — same class as any HEVC decoder; decode-only, local, user-initiated.

---

## 6. Implementation notes

- **Probe:** `heic::ImageInfo::from_bytes` — container parse only; wired as `inspect_heic` / `HeicMeta`.
- **Decode limits:** set `Limits.max_pixels` from `core_utils::MAX_PIXELS` (and Risk mode); do **not** clamp `max_width`/`max_height` to probed size (breaks tiled decode).
- **Orientation:** applied inside `heic` decoder — output pixels match probed dimensions for `iden_rot90.heic`.
- **Depth/HDR aux:** probe flags available; MVP drops aux planes (honesty in 3.4.1 UI).

---

## 7. Next steps

| Phase | Work |
|-------|------|
| **Legal** | Resolve `heic` crate license vs MIT (commercial license or alternate backend) |
| **3.4.1** | ToolRegistry `heic-to-jpg`, worker lazy-load, i18n, Notice Rail `expensive` |
| **3.4.2** | `heic-to-png` tool activation |
| **Docs** | SPEC §6.x stub for `transmutador_heic` at 3.4.1 ship |

---

*Spike complete on `dev`. Backend **A (`heic`)** validated for Wasm size and fixture coverage.*
