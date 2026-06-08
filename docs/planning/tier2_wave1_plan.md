# Tier 2 — Wave 1 (GIF + BMP)

> **Branch:** `dev` → merge to `main` at v1.8.3  
> **Scope:** 4 conversion directions across 2 Rust crates  
> **Deferred:** TIFF, ICO, TGA (wave 2, v1.8.5+)

---

## Phases

| Phase | Version | Direction | Crate | Status |
|-------|---------|-----------|-------|--------|
| 6.1 | v1.8.0 | GIF → PNG | `transmutador_gif` | Done |
| 6.2 | v1.8.1 | GIF → JPEG | `transmutador_gif` | Done |
| 6.3 | v1.8.2 | BMP → PNG | `transmutador_bmp` | Done |
| 6.4 | v1.8.3 | BMP → JPEG | `transmutador_bmp` | Done |

---

## MVP constraints

- **Animated GIF:** first frame only (documented in UI)
- **BMP:** uncompressed source may produce larger PNG output (honest hint)

---

## QA gate (per phase)

1. `cargo test --workspace`
2. `cd frontend && npm run build:wasm && npm run build`
3. Manual smoke: drop → download
4. Metrics estimate before transmute
5. i18n EN + ES
6. Wasm ≤ 3 MB (NFR-7)
7. StripAll test passes

---

## Wave 2

See **`docs/planning/tier2_wave2_plan.md`** — active planning for v1.10.0 (TIFF, ICO, TGA).
