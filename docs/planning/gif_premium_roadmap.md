# GIF Premium Roadmap — Camaleon v1.8.4+

> **Status:** ✅ Shipped — merged to `main` at **v1.9.0** (GIF premium landed v1.8.4; Tier 2 Wave 1 launch v1.9.0)
> **Scope:** Replace MVP “first frame only” with frame-accurate compositing and interactive frame picker.
> **Deferred:** Tier 2 Wave 2 (TIFF/ICO/TGA), BMP product redesign, usage analytics.

---

## Problem statement

GIF→PNG/JPG in v1.8.3 exported only the first decoded frame. That was honest for an MVP but weak for a premium product:

- Animated GIFs are the primary use case for “extract a still.”
- GIF89a **disposal methods** (Keep, Background, Previous) affect how frames composite.
- Users expect to **pick which frame** to export, with a live preview.

---

## Product principles (premium)

| Principle | Implementation |
|-----------|----------------|
| **Honest science** | Fidelity hints explain frame selection, disposal compositing, and size trade-offs. |
| **Local-only** | All decode/composite/encode stays in Wasm; no upload. |
| **Estimate before transmute** | `frame_index` included in fingerprint; estimate reruns when frame changes. |
| **Responsive UI** | Debounced low-compression preview PNG; full encode only on Transmute. |
| **Stable API** | `frame_index` on all GIF transmute/estimate exports; default `0`. |

---

## Architecture

### Rust (`transmutador_gif`)

```
inspect_gif_meta(bytes) → GifMeta { frame_count, width, height, is_animated }
render_gif_frame_preview_png(bytes, frame_index) → PNG bytes (compression=1)
transmutar_gif_a_png_with_compression(bytes, compression, frame_index)
transmutar_gif_a_jpg_with_options(bytes, quality, bg, frame_index)
estimate_* (same frame_index parameter)
```

**Compositing:** `image::GifDecoder` + `AnimationDecoder::collect_frames()` returns **fully composited** full-canvas frames (GIF89a disposal handled by `image` 0.25). We select `frames[frame_index]` — no duplicate disposal logic.

### Frontend

| Layer | Change |
|-------|--------|
| `TransmutationOptions` | `frameIndex?: number` |
| `result-cache` fingerprint | Includes `frameIndex` via `opts` |
| `transmutation.worker.ts` | Forwards `frameIndex` to Wasm |
| `GifFrameScrubber` | Slider + debounced preview via `gif-wasm-client` |
| `TransmutationPanel` | Shows scrubber for `gif-to-png` / `gif-to-jpg` when animated |

### Performance notes

- **Preview:** `render_gif_frame_preview_png` uses PNG compression level 1 (fast).
- **Debounce:** 120 ms on slider to avoid decode storms.
- **Cache:** Transmute result cache keyed by full options including `frameIndex`.
- **Large GIFs:** Existing adaptive resource profile (manual estimate on large files) unchanged.

---

## Release phases

### Phase A — v1.8.4 (this release) ✅

- [x] Frame-accurate compositing via `image` animation decoder
- [x] `frame_index` on transmute + estimate Wasm exports
- [x] `inspect_gif_meta` + `render_gif_frame_preview_png`
- [x] UI frame scrubber with preview
- [x] EN/ES copy update (no more “first frame only”)
- [x] Integration tests: multi-frame red/green, out-of-range rejection

### Phase B — v1.8.5 (optional polish)

- [ ] Keyboard shortcuts (←/→) on scrubber
- [ ] Frame duration display (ms) from GIF delay metadata
- [ ] “Export all frames as ZIP” (batch, still local)
- [ ] Worker-shared Wasm init (scrubber + transmute single init)

### Phase C — v1.9.x (advanced)

- [ ] GIF → WebP still (animated WebP out of scope)
- [ ] Palette / dithering fidelity notes in UI
- [ ] Fuzz tests with disposal-method fixture corpus

---

## Out of scope (explicit)

- **GIF → animated PNG/WebP** — different product surface.
- **GIF encoding** — Camaleon is transmute-out, not author.
- **TIFF/ICO/TGA** — Tier 2 Wave 2, after GIF premium ships.

---

## Test plan

1. `cargo test -p transmutador_gif` — all green including animated frame tests.
2. `npm run build:wasm && npm run build` — no type errors.
3. Manual: 2-frame GIF → scrubber shows red/green; export matches preview.
4. Manual: static GIF → no scrubber; frame 0 export works.
5. Manual: change frame → estimate updates; transmute cache miss on new frame.

---

## Version bump

| Layer | From | To |
|-------|------|-----|
| App | v1.8.3 | **v1.8.4** |
| Engine | v1.4.1 | **v1.4.2** |
