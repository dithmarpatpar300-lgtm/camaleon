# Camaleon v2.0.0 — Tier 3: AVIF decode

> **App version:** `2.0.0` (`frontend/package.json`)  
> **Engine:** `1.5.0` (`motor_transmutacion/Cargo.toml` workspace)  
> **Baseline:** First **major** release line (v2.x) — Tier 3 Modern Image Formats

## Highlights

**Tier 3 is here.** Camaleon now decodes **AVIF** in the browser — the modern web image format — and converts to **PNG** with the same privacy-first, estimate-first pipeline you already trust.

### New

- **AVIF → PNG** — 16th conversion tool; compression slider; size estimate
- **Animated AVIF** — pick a frame before export (lazy scrubber, responsive UI)
- **Broader AVIF compatibility** — MIAF/`mif1` container normalization for files other apps open but strict parsers reject

### Fixed

- **Large science images** — 150 MB byte zone + 40 MP astro downscale (4K–12K) work end-to-end again
- **Limit pipeline** documented in `docs/LIMIT_PIPELINE.md` to prevent future regressions

### What's next

- **AVIF → JPEG** (Tier 3.1.2) on `dev`
- Encode paths (PNG/JPEG → AVIF) remain Tier 3.2 — spike-gated

## Tool count

**16 active conversion tools** — PNG, JPEG, WebP, GIF, BMP, TIFF, ICO, TGA, **AVIF** — EN / ES UI.

## Docs

- Release notes: `docs/releases/v2.0.0.md`
- Tier 3 plan: `docs/planning/tier3_plan.md`
- Limit pipeline (maintainers): `docs/LIMIT_PIPELINE.md`
