# Astronomy / Science Imagery — Product Note

> Status: **Documented** (Wave 1.5 limits polish). Implementation deferred to Wave 2+.

---

## Context

Space-agency and science archives (Hubble, JWST, ESA, NASA) distribute PNG/TIFF mosaics that are:

- **Moderate file size** when compressed (50–150 MB PNG is common)
- **Extreme pixel count** (80–200+ megapixels for full mosaics)

Example: `'Cosmic Cliffs' in Carina` at **14575 × 8441** ≈ **123 MP**, **124.7 MB**.

---

## Why Camaleon blocks these today

| Guard | Carina example | Limit |
|-------|----------------|-------|
| File bytes (elevated) | 124.7 MB | 150 MB ✅ |
| Megapixels | ~123 MP | **40 MP ❌** |

The **40 MP raster cap** (`core_utils::MAX_PIXELS`) exists to prevent tab OOM. A 123 MP RGBA decode alone is ~470 MB before encode buffers. This is **not** overridden by the elevated file-size consent flow.

Wave 1.5 UI now shows `DimensionsBlockPanel` with astronomy-specific copy when `pixelCount ≥ 80M`.

---

## Wave 2+ options (not in scope yet)

| Option | Description |
|--------|-------------|
| **Resize-on-import** | User picks max edge (e.g. 8192 px) before transmute |
| **Tile / ROI** | Crop region selector for mosaics |
| **Server-side tier** | Out of privacy model unless opt-in |
| **Higher MP with extra consent** | Risky on mobile; desktop-only flag |

Recommended path for an "astronomers" vertical: **resize-on-import** + link to FITS/TIFF desktop tools for full archives.

---

## Related docs

- `adaptive_limits_proposal.md` — three-zone file-byte model
- `limit-context.ts` — `ASTRONOMICAL_PIXEL_THRESHOLD` (80M) for UX copy only
