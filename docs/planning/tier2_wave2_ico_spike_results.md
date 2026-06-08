# Tier 2 Wave 2 — Phase 7.3.0 ICO Spike Results

> **Date:** 2026-06-08  
> **Crate:** `motor_transmutacion/transmutador_ico` (spike ✅ — wired to frontend in phase 7.3)  
> **Dependencies:** `image` 0.25.10 (`ico` + `png` features)  
> **Gate:** NFR-7 Wasm ≤ 3 MB per module

---

## 1. Wasm size (release + wasm-opt)

| Module | `.wasm` size | NFR-7 |
|--------|-------------|-------|
| `transmutador_ico` (`ico`+`png`) | **260 KB** | ✅ pass |
| `transmutador_bmp` (reference) | 650 KB | ✅ pass |

---

## 2. Fixture matrix

Fixtures in `transmutador_ico/tests/spike_fixtures.rs` (PNG-in-ICO via `IcoEncoder`).

| Fixture | Probe | `entry_index` decode | Notes |
|---------|-------|---------------------|-------|
| **single_16_png** | ✅ 1 entry 16×16 | ✅ | Baseline |
| **multi_size_png** | ✅ 3 entries (16/32/256) | ✅ index 0→16px, default→256px | Matches `best_entry` scoring |
| **rgba_alpha_32** | ✅ alpha | ✅ RGBA PNG out | |
| **cursor_cur** | ✅ `container=Cursor` | ✅ | `.cur` type field rewritten from ICO fixture |

**Deferred in MVP decode:**

- **Legacy BMP+AND mask ICO** — `BmpDecoder::new_with_ico_format` is `pub(crate)` in `image` 0.25; MVP rejects with i18n `icoBmpLegacy`. Modern favicons use PNG-in-ICO (Vista+). Backlog: vendored BMP ICO path if user demand.

---

## 3. API decisions (confirmed)

| Decision | Choice |
|----------|--------|
| Default entry | Largest `(bpp, area)` — same as `image::IcoDecoder::best_entry` |
| Multi-size UI | `IcoEntryScrubber` when `entry_count > 1` |
| Extensions | `.ico` + `.cur` |
| BMP legacy | Reject with honest error |

---

## 4. Estimate parity

`estimate_ico_to_png_size` within **5%** of full encode on `single_16_png` fixture ✅

---

## Related

- `docs/planning/tier2_wave2_plan.md` §3.8
- Phase 7.4 PNG → ICO ✅ — `ico_encode.rs`, round-trip tests `png_to_ico_round_trip` / `png_to_ico_no_upscale`
