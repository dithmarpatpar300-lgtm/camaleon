## Summary

**Tier 2 Wave 2 is complete.** Five new conversion tools ship in this line (v1.10.0 → v1.10.4), bringing Camaleon to **15 active tools** — all running 100% in your browser via Rust/WebAssembly.

This release adds archival **TIFF**, favicon **ICO/CUR**, and game-texture **TGA** support with the same honest pipeline as Wave 1: probe → options → estimate → transmute → StripAll.

## New tools (v1.10.0 – v1.10.4)

| Version | Tool | Highlights |
|---------|------|------------|
| **v1.10.0** | **TIFF → PNG** | Multi-page IFD picker; 16-bit → 8-bit policy; palette/CMYK rejection |
| **v1.10.1** | **TIFF → JPEG** | Quality slider; per-page alpha + background flatten |
| **v1.10.2** | **ICO → PNG** | `.ico` + `.cur`; multi-size picker; PNG-in-ICO decode |
| **v1.10.3** | **PNG → ICO** | Presets 16 / 32 / 48 / 256 px; downscale only (no upscale) |
| **v1.10.4** | **TGA → PNG** | Raw + RLE; indexed color; 32-bit alpha; 16-bit RGB honesty |

## Wasm modules added

| Crate | Size (approx.) | Role |
|-------|----------------|------|
| `transmutador_tiff` | ~919 KB | TIFF decode + PNG/JPEG encode |
| `transmutador_ico` | ~260 KB | ICO/CUR ↔ PNG |
| `transmutador_tga` | ~203 KB | TGA → PNG |

## UX & product

- Release Comms entries v1.10.0 – v1.10.4 (What's New + onboarding)
- **15 conversion tools** — full EN / ES UI
- TIFF page scrubber, ICO size scrubber, TGA probe meta
- Astro downscale for large TIFF / 4K TGA textures

## Privacy (unchanged)

100% client-side — no uploads. StripAll on outputs. Estimate-first with honest limits.

## Docs

- `docs/ROADMAP.md` — Wave 2 shipped
- `docs/planning/tier2_wave2_plan.md`
- `docs/releases/v1.10.0.md` … `v1.10.4.md`

**Full tool list (15):** JPG↔PNG · WebP · GIF · BMP · TIFF · ICO · TGA→PNG · PNG/JPEG→WebP
