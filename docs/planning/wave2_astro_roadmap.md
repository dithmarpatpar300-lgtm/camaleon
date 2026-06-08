# Wave 2 — Astronomy / Science Imagery (safe resize path)

> Status: **Planned** — starts after Wave 1.5 limits polish (v1.8.7).  
> Goal: support hybrid cases (moderate file size + extreme megapixels) **without** raising `MAX_PIXELS` blindly.

---

## Problem statement

Science archives (Hubble, JWST, ESA, NASA) often ship:

- PNG/TIFF mosaics **50–150 MB** (fits elevated byte zone)
- **80–200+ megapixels** (exceeds `MAX_PIXELS` = 40 MP)

Example: Carina Nebula `'Cosmic Cliffs'` — **124.7 MB**, **14575 × 8441** (~123 MP).

v1.8.7 correctly **blocks** these with `DimensionsBlockPanel`. Wave 2 adds a **controlled downscale path** so users can still convert in-browser.

---

## Design principles (non-negotiable)

| Principle | Implementation |
|-----------|----------------|
| **Safety first** | Never decode full raster above `MAX_PIXELS`; downscale in chunks or via canvas/WebCodecs before Wasm |
| **Explicit consent** | User chooses target size; show MP + RAM estimate before processing |
| **Privacy** | All resize + transmute stays client-side (no upload) |
| **Performance** | Progressive resize, yield to main thread, cancelable |
| **Honest limits** | Hard file ceiling (150 MB) unchanged; output-size warnings unchanged |

---

## Architecture overview

```
[Large science PNG]
       │
       ▼
 prepare → sourceMeta (123 MP) → DimensionsBlockPanel
       │
       ▼ (user taps "Resize to continue")
 AstroResizePanel — presets: 4K / 8K / custom max edge
       │
       ▼
 resize pipeline (JS canvas or OffscreenCanvas worker)
       │  output: Uint8Array PNG/JPEG under 40 MP
       ▼
 existing transmute flow (LimitContext normal/elevated)
```

**Key decision:** resize happens **before** Wasm `validate_input`, producing a new in-memory buffer that fits `MAX_PIXELS`.

---

## Phase A — Resize engine (Rust-free v1)

| Task | Detail |
|------|--------|
| A1 | `frontend/src/lib/imaging/downscale/` — canvas drawImage with `imageSmoothingQuality: 'high'` |
| A2 | `computeTargetDimensions(srcW, srcH, maxEdge)` — preserve aspect, cap longest side |
| A3 | `downscaleToBlob(maxEdge)` → PNG blob for lossless handoff to Wasm |
| A4 | Progress callback via `createImageBitmap` + chunked yield (`requestAnimationFrame`) |
| A5 | Unit tests: dimension math; manual QA on 8K/16K samples |

**Performance guards:**

- Refuse resize if decoded bitmap would exceed `deviceMemory` heuristic
- `maxEdge` ceiling: **8192** default, **12288** desktop opt-in with extra consent
- Use `OffscreenCanvas` in dedicated worker when available (keeps UI responsive)

---

## Phase B — Astro UX flow

| Task | Detail |
|------|--------|
| B1 | Extend `DimensionsBlockPanel` with CTA: **"Resize to continue"** |
| B2 | `AstroResizePanel` — presets (4096 / 6144 / 8192 px), custom slider, live MP + RAM preview |
| B3 | Second consent: *"Downscale is lossy in resolution (not tone); original file unchanged"* |
| B4 | Prepare sub-phase `resizing` in gate (0–100%) |
| B5 | i18n EN/ES; link to `astro_imagery_tier.md` |

---

## Phase C — Integration with LimitContext

| Task | Detail |
|------|--------|
| C1 | `PreparedFileContext.resizedBytes` optional — transmute uses resized buffer |
| C2 | `sourceMeta` shows both original and effective dimensions |
| C3 | Fingerprint includes resize params (avoid cache collisions) |
| C4 | `computeLimitContext` uses **effective** dimensions post-resize |

---

## Phase D — Optional Wasm assist (later)

Only if JS canvas path is insufficient for TIFF/16-bit:

| Task | Detail |
|------|--------|
| D1 | Evaluate `image` crate resize in new `transmutador_resize` crate |
| D2 | Streamed decode if `image` supports — otherwise defer TIFF to Wave 2b |

**Default:** ship Phase A–C with canvas path for PNG/JPEG/WebP only.

---

## Phase E — QA matrix

| Fixture | Expected |
|---------|----------|
| Carina 123 MP PNG | Block → resize 8192 → PNG→JPG succeeds |
| 8K PNG (33 MP) | No resize; normal flow |
| 60 MB / 45 MP | Elevated consent only |
| Resize cancel mid-flight | No partial state; clean reset |
| Mobile 4 GB RAM | 8192 cap enforced |

---

## Security checklist

- [ ] No `eval` / no remote URLs in resize path
- [ ] Resized buffer size validated before Wasm handoff
- [ ] `validate_input` still runs on resized bytes
- [ ] No persistence of oversized originals (session-only `ArrayBuffer`)
- [ ] CSP-compatible (no blob workers if blocked — fallback to main thread with warning)

---

## Versioning

| Milestone | Version | Deliverable |
|-----------|---------|-------------|
| Wave 1.5 limits polish | v1.8.7 | `LimitContext`, `DimensionsBlockPanel` ✅ |
| Wave 2 Astro A+B | v1.9.0 | Resize + UX |
| Wave 2 Astro C | v1.9.1 | Full pipeline integration |
| TIFF / 16-bit | v2.0+ | Separate tier |

---

## Out of scope (Wave 2 Astro)

- FITS native decode
- Multi-file tiling / mosaics
- Server-side processing
- Raising `MAX_PIXELS` without resize

---

## Related

- `astro_imagery_tier.md` — product context
- `adaptive_limits_proposal.md` — byte-zone model
- `limit-context.ts` — `ASTRONOMICAL_PIXEL_THRESHOLD`
