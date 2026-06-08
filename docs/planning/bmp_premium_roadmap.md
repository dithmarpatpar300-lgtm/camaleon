# BMP Premium Roadmap — Wave 1 (dev)

> Companion to `gif_premium_roadmap.md`. Same UX standards, adapted for single-frame bitmaps.

---

## Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| **B1** | Engine QA — 8-bit, 32 opaque, compression, alpha flatten | Done |
| **B2** | Semantic alpha detection (32-bit BGRA sampling) | Done |
| **B3** | PNG growth warning, WxH·bpp in workspace, BMP large-file hints | Done |
| **B4** | Rust `inspect_bmp_meta` Wasm + prepare via `bmp-wasm-client` | Done |
| **B5** | Fixtures: near-limit size, RLE, fake-alpha 32-bit | Done |
| **B6** | ROADMAP + SPEC alignment | Done |

---

## B3 + B4 deliverables

### B4 — Wasm header probe
- `bmp_probe.rs`: parse BITMAPINFOHEADER, sample BGRA alpha without full decode
- `inspect_bmp_meta` exported to JS (`BmpMeta` class)
- `frontend/src/lib/bmp/bmp-wasm-client.ts` + prepare pipeline uses Wasm after warmup

### B3 — Honest size UX
- `BmpPngGrowthNotice` when BMP→PNG estimate > original size
- Workspace shows `{width} × {height} · {bpp}-bit` under file size
- BMP-specific `LargeFileNotice` copy (from B1 wave)

---

## BMP vs GIF UX matrix

| Feature | GIF | BMP |
|---------|-----|-----|
| Frame scrubber | Yes | No |
| Prepare gate | Yes | Yes |
| Wasm meta probe | `inspect_gif_meta` + session | `inspect_bmp_meta` |
| Alpha notice (→ JPG) | Palette/GCE | 32-bit semantic BGRA |
| Large file risk | Medium | **High** |

---

## Next wave (B5–B6)

1. Near-limit fixtures + RLE BMP tests
2. `core_utils` BMP dimension probe in `validate_input`
3. SPEC manual QA checklist

---

## QA gate

1. `cargo test -p transmutador_bmp`
2. `cd frontend && npx tsc --noEmit`
3. Manual: 24-bit BMP, 32-bit real alpha, 32-bit opaque (no transparency UI), BMP→PNG noisy growth warning
