# Limit & session pipeline (regression reference)

> **Normative companion** to SPEC §6.1 (`core_utils`), §7 limits UX, and `docs/planning/wave2_astro_roadmap.md`.  
> Read this before changing prepare, estimate, transmute, semantic alpha, or astro downscale.

---

## Three independent limits

| Layer | Constant | Value | Enforced by |
|-------|----------|-------|-------------|
| **Bytes (soft)** | `SOFT_LIMIT_BYTES` | 50 MB | Wasm default session; UI “elevated” threshold |
| **Bytes (hard)** | `HARD_LIMIT_DESKTOP_BYTES` / `HARD_LIMIT_MOBILE_BYTES` | 150 MB / 100 MB (≤4 GB RAM) | `validate_input_with_limit`; UI hard block |
| **Megapixels** | `MAX_PIXELS` | 40,000,000 (40 MP) | `probe_dimensions` in `validate_input`; `LimitContext` |

**Rule:** Never raise `MAX_PIXELS` to “fix” large science files. Use **client-side downscale** (canvas) first — unless **Risk mode** is enabled (Settings S6).

---

## Risk mode (Settings S6, v2.3.8)

When **Risk mode** is on (`RiskModeProvider` → `computeLimitContext({ riskModeEnabled: true })` + Wasm `set_risk_mode(true)`):

| Limit | Normal | Risk ON |
|-------|--------|---------|
| 40 MP pixels | Block + astro downscale | Bypass (TS + Wasm) |
| Elevated byte consent | Required | Auto-consent |
| Hard byte cap | 150 / 100 MB | **500 / 250 MB** |
| 12K astro preset | Gated by RAM + 40 MP | Allowed (browser may still fail) |
| SVG output scale > 40 MP | Block | Allow |
| SVG external href security | Block | **Never bypass** |

Session ceiling when Risk on: `effectiveSessionInputLimit` returns full hard limit (not 50 MB soft cap).

See `docs/planning/risk_mode_analysis.md` for the full surface map.

---

## Zone model (`frontend/src/lib/transmutation/limits.ts`)

| Zone | File size | UI |
|------|-----------|-----|
| `normal` | ≤ 50 MB | No byte consent |
| `elevated` | 50 MB – hard limit | `OversizeConsentPanel` before transmute/estimate |
| `hard` | > hard limit | Blocked (`DimensionsBlockPanel` / hard file message) |

**Session ceiling for Wasm** (must stay aligned with Rust `set_session_input_limit`):

```typescript
sessionLimitForBytes(fileSize, deviceMemoryGb?)
  → effectiveSessionInputLimit(getLimitZone(...), hardLimit)
  → normal: 50 MB | elevated/hard: hardLimit (150/100 MB)
```

Use **`sessionLimitForBytes`** everywhere — prepare, `assessSemanticAlpha`, worker `effectiveMaxInputBytes`. Do **not** cap elevated files back to 50 MB in the worker.

---

## Prepare phase (`run-prepare.ts`)

Order matters:

1. **Warmup** Wasm module for the tool.
2. **Format-specific metadata** (GIF session, TIFF/ICO/AVIF inspect) with `prepareSessionInputLimit` (= hard limit for elevated files).
3. **`resolveSourceImageMeta`** — header/probe only for PNG/JPEG/WebP (no full decode).
4. **`assessSemanticAlpha`** — **only if** `width × height ≤ MAX_PIXELS`. Full decode via Wasm must not run above 40 MP during prepare.
5. Return `PreparedFileContext` with `sourceMeta` so `LimitContext` can show astro UI.

---

## Astro downscale (images > 40 MP)

```
DimensionsBlockPanel → user taps "Resize to continue"
  → AstroResizePanel (4K / 6K / 8K / 12K presets; disable presets that still exceed 40 MP)
  → downscaleImageBytes (canvas only — no Wasm)
  → assessSemanticAlpha on resized PNG (sessionLimitForBytes — output can still be > 50 MB)
  → setOversizeConsented(true) if resized bytes > 50 MB (explicit user consent via astro flow)
  → transmute/estimate with post-resize bytes + `resolvePostResizeWasmConfig`
```

**Never** call Wasm `validate_input` on the original >40 MP raster before downscale.

---

## Semantic Alpha Engine (`assessSemanticAlpha`)

- Always call `set_session_input_limit` before `assess_alpha` / `assess_page_alpha`.
- If `sessionInputLimitBytes` is omitted, limit is derived from input byte length via `sessionLimitForBytes`.
- Prepare skips assess when pixels > `MAX_PIXELS`; post-resize assess runs on smaller buffer.

---

## Worker (`transmutation.worker.ts`)

```typescript
sessionLimit = req.effectiveMaxInputBytes ?? SOFT_LIMIT_BYTES
applySessionInputLimit(route, sessionLimit)
```

`effectiveMaxInputBytes` comes from `limitContext.sessionInputLimitBytes` (150 MB for elevated after consent). Do not re-introduce `Math.min(..., SOFT_LIMIT_BYTES)` for non-consented elevated files.

---

## AVIF-specific (Tier 3.1)

| Step | Behavior |
|------|----------|
| Container | `normalize_avif_input` patches `mif1`/`miaf` → `avif` when compatible brand present |
| Animated | `animation_info().frame_count > 1`; lazy frame preview via `decode_avif_preview_png` (not eager full session in prepare) |
| Prepare | `inspectAvifMeta` + decode probe only |
| Frame picker | `AvifFrameScrubber` (mirror GIF scrubber) |

---

## Regression checklist (manual)

Before merging limit/alpha/prepare/AVIF changes:

1. [ ] 128 MB / 123 MP PNG → prepare succeeds → astro panel → 8K resize → transmute PNG→JPG
2. [ ] 60 MB file → consent panel → transmute after consent
3. [ ] 30 MB file → no consent, direct transmute
4. [ ] AVIF static + animated smoke; `mif1` major brand file decodes
5. [ ] `cargo test -p transmutador_avif` + `npm run build`

---

## File index

| Area | Path |
|------|------|
| Limits & zones | `frontend/src/lib/transmutation/limits.ts` |
| LimitContext | `frontend/src/lib/transmutation/limit-context.ts` |
| Prepare | `frontend/src/lib/transmutation/prepare/run-prepare.ts` |
| Semantic alpha | `frontend/src/lib/semantic-alpha/assess.ts` |
| Astro UI | `DimensionsBlockPanel`, `AstroResizePanel`, `downscale-image.ts` |
| Worker | `frontend/src/workers/transmutation.worker.ts` |
| Rust guards | `motor_transmutacion/core_utils/src/lib.rs` |
