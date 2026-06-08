# GitHub Release — v1.10.4 (Tier 2 Wave 2)

> **Tag:** `v1.10.4`  
> **Commit:** `main` @ release tag  
> **App version:** `1.10.4` (`frontend/package.json`)  
> **Engine:** Rust workspace `v1.4.2` — nine Wasm crates

Use the markdown below as the **release description** when you publish on GitHub.

---

## Title (GitHub Release name)

```
Camaleon v1.10.4 — Tier 2 Wave 2 (TIFF, ICO, TGA)
```

---

## Body (copy from here ↓)

## Summary

**Tier 2 Wave 2 is complete.** Five new conversion tools ship in this line (v1.10.0 → v1.10.4), bringing Camaleon to **15 active tools** — all running 100% in your browser via Rust/WebAssembly.

This release adds archival **TIFF**, favicon **ICO/CUR**, and game-texture **TGA** support with the same honest pipeline as Wave 1: probe → options → estimate → transmute → StripAll.

## New tools (v1.10.0 – v1.10.4)

| Version | Tool | Highlights |
|---------|------|------------|
| **v1.10.0** | **TIFF → PNG** | Multi-page IFD picker; 16-bit → 8-bit policy; palette/CMYK rejection |
| **v1.10.1** | **TIFF → JPEG** | Quality slider; per-page alpha + background flatten |
| **v1.10.2** | **ICO → PNG** | `.ico` + `.cur`; multi-size `IcoEntryScrubber`; PNG-in-ICO decode |
| **v1.10.3** | **PNG → ICO** | Presets 16 / 32 / 48 / 256 px; **downscale only** (no upscale) |
| **v1.10.4** | **TGA → PNG** | Raw + RLE; indexed color; 32-bit alpha; 16-bit RGB honesty |

## Wasm modules added

| Crate | Size (approx.) | Role |
|-------|----------------|------|
| `transmutador_tiff` | ~919 KB | TIFF decode + PNG/JPEG encode |
| `transmutador_ico` | ~260 KB | ICO/CUR ↔ PNG |
| `transmutador_tga` | ~203 KB | TGA → PNG |

All pass NFR-7 (≤ 3 MB per module).

## UX & product

- **Release Comms** manifest entries for v1.10.0 – v1.10.4 (What's New drawer + onboarding)
- **Onboarding** updated: **15 conversion tools** (EN / ES)
- Page scrubbers for TIFF pages and ICO sizes (same pattern as GIF frames)
- **Astro downscale** applies to large TIFFs and 4K+ TGA textures (> 40 MP)
- Fidelity hints: PNG compression = DEFLATE effort (not JPEG-style “quality”); ICO round-trip sizing; TGA 16-bit attribute bit ≠ alpha

## Privacy & architecture (unchanged)

- Zero uploads — Wasm in dedicated Web Workers
- StripAll metadata on outputs
- Estimate-first pipeline with session limits (50 MB soft / 150 MB hard / 40 MP)

## Upgrade path

- **From v1.9.0:** +5 tools, +3 Wasm crates. Run `npm run build:wasm` before deploy.
- **Live deploy:** merge/tag is on `main`; trigger your Cloudflare / CI deploy as usual.

## Docs

- [ROADMAP](docs/ROADMAP.md) — Wave 2 marked shipped
- [tier2_wave2_plan.md](docs/planning/tier2_wave2_plan.md) — full phase record
- Per-version notes: `docs/releases/v1.10.0.md` … `v1.10.4.md`

## What's next

Wave 2 **tool scope is closed**. Optional polish (GitHub release assets, SPEC snapshot) is Phase 7.6. Tier 3 / performance work can land on `dev` without blocking this tag.

---

**Full tool list (15):** JPG↔PNG · WebP suite · GIF suite · BMP suite · TIFF suite · ICO suite · TGA→PNG · PNG/JPEG→WebP

---

## Body (copy until here ↑)

---

## Publish checklist (for you)

1. **Verify tag on GitHub** (after push):  
   `https://github.com/dithmarpatpar300-lgtm/camaleon/releases/tag/v1.10.4`

2. **GitHub → Releases → Draft a new release**
   - **Choose tag:** `v1.10.4` (create from `main` if the tag is not listed yet)
   - **Release title:** `Camaleon v1.10.4 — Tier 2 Wave 2 (TIFF, ICO, TGA)`
   - **Description:** paste the **Body** section above
   - ☑ Set as **latest release**
   - **Publish release**

3. **Deploy production** (if not auto from `main`):
   - `npm run build:wasm && npm run build` in `frontend/`
   - Deploy via Cloudflare per [docs/DEPLOY.md](../DEPLOY.md)
   - Confirm footer shows **v1.10.4** and `/transmute/tga-to-png` works

4. **Smoke test (5 min)**
   - [ ] What's New shows v1.10.4
   - [ ] TIFF multi-page + ICO size picker + TGA texture
   - [ ] EN / ES tool copy

## CLI alternative (if `gh` is installed)

```bash
gh release create v1.10.4 \
  --title "Camaleon v1.10.4 — Tier 2 Wave 2 (TIFF, ICO, TGA)" \
  --notes-file docs/releases/GITHUB_v1.10.4-body.md
```

(A trimmed `GITHUB_v1.10.4-body.md` is generated for `gh` — body only, no checklist.)
