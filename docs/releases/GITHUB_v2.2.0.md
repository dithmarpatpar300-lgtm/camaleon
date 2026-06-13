# Camaleon v2.2.0 — AVIF encode pair

> **App version:** `2.2.0` (`frontend/package.json`)  
> **Engine:** `1.6.0` (`motor_transmutacion/Cargo.toml` workspace)  
> **Tier 3:** Phase 3.2.0–3.2.2 complete — inbound AVIF pair

## Highlights

### New

- **PNG → AVIF** — 18th conversion tool; quality + speed sliders; semantic alpha on encode
- **JPEG → AVIF** — 19th tool; generational loss honesty (NFR-8)
- **`transmutador_avif_encode`** — dedicated Wasm module (~1.67 MB); decode stays in `transmutador_avif`

### Architecture

- **Split crate** — combined decode+encode exceeded NFR-7 (3.45 MB); lazy-load encode module only when needed

## Tool count

**19 active conversion tools** — full AVIF matrix: decode (→PNG/JPEG) + encode (PNG/JPEG →).

## Docs

- Release notes: `docs/releases/v2.2.0.md`
- Encode spike: `docs/planning/tier3_2_avif_encode_spike_results.md`
- Next analysis: `docs/planning/tier3_3_svg_analysis.md`
