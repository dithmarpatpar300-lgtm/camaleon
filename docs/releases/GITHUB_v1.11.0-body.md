## Summary

**Semantic Alpha Engine** — Camaleon now detects **meaningful** transparency (pixels that would look different if alpha were ignored), not merely whether a file has an alpha channel.

This fixes false transparency warnings on **opaque RGBA TIFFs** and unifies honesty across **PNG, WebP, GIF, BMP, and TIFF → JPEG** — all assessed in Wasm at prepare time, with encode flatten using the same policy.

No new conversion tools; **15 tools** unchanged. Engine remains **v1.4.2** (nine Wasm crates).

## What changed for users

| Before | After |
|--------|-------|
| TIFF with RGBA but all α=255 could show transparency notice | Notice hidden — file is treated as opaque |
| PNG/WebP/GIF structural alpha flags could mismatch encode | UI and JPEG output agree on flatten vs preserve |
| Resize revert kept stale alpha state | Re-assess on return to original bytes |

## Affected tools

All lossy paths with a **background** option:

- PNG → JPEG
- WebP → JPEG
- GIF → JPEG
- BMP → JPEG
- TIFF → JPEG

## Technical highlights

- **`core_utils::semantic_alpha`** — shared probe + full-raster semantics
- **Wasm assess exports** — `assess_alpha`, `assess_page_alpha` (TIFF pages)
- **Frontend** — `lib/semantic-alpha/` at prepare; `TransparencyNotice` driven by `hasMeaningfulAlpha`
- **SPEC §5.5.3** — semantic vs structural alpha documented
- **Contract tests** — assess meaningful === encode flatten decision per format
- **Fixtures** — `docs/fixtures/semantic-alpha/`

## Privacy & architecture (unchanged)

- 100% client-side — Wasm in Web Workers
- StripAll on outputs
- Estimate-first pipeline with session limits (50 MB soft / 150 MB hard / 40 MP)

## Upgrade path

- **From v1.10.4:** Run `npm run build:wasm` before deploy (assess exports updated in existing crates).
- **Deploy:** merge/tag on `main`; Cloudflare / CI per `docs/DEPLOY.md`.

## Docs

- [semantic_alpha_engine_plan.md](docs/planning/semantic_alpha_engine_plan.md)
- [transparency_engine_proposal.md](docs/planning/transparency_engine_proposal.md)
- [ROADMAP](docs/ROADMAP.md)
- Release note: `docs/releases/v1.11.0.md`
