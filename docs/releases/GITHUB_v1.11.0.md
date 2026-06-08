# GitHub Release — v1.11.0 (Semantic Alpha Engine)

> **Tag:** `v1.11.0`  
> **Commit:** `main` @ release tag  
> **App version:** `1.11.0` (`frontend/package.json`)  
> **Engine:** Rust workspace `v1.4.2` — nine Wasm crates (no new crate)

Use the markdown below as the **release description** when you publish on GitHub.

---

## Title (GitHub Release name)

```
Camaleon v1.11.0 — Honest transparency detection
```

---

## Body (copy from here ↓)

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

---

## Body (copy until here ↑)

---

## Publish checklist (for you)

1. **Pre-merge on `dev`**
   - [ ] Manual QA matrix §8.4 (`docs/planning/semantic_alpha_engine_plan.md`) — PNG, WebP, GIF, BMP fixtures
   - [ ] `cargo test --workspace`
   - [ ] `cd frontend && npm run build:wasm && npm run build && npm run test:semantic-alpha`

2. **Merge & tag**
   - Merge `dev` → `main`
   - Create tag `v1.11.0` on `main`

3. **GitHub → Releases → Draft a new release**
   - **Choose tag:** `v1.11.0`
   - **Release title:** `Camaleon v1.11.0 — Honest transparency detection`
   - **Description:** paste the **Body** section above (or use `GITHUB_v1.11.0-body.md`)
   - ☑ Set as **latest release**
   - **Publish release**

4. **Deploy production**
   - `npm run build:wasm && npm run build` in `frontend/`
   - Deploy via Cloudflare per [docs/DEPLOY.md](../DEPLOY.md)
   - Confirm footer shows **v1.11.0**

5. **Smoke test (5 min)**
   - [ ] What's New shows v1.11.0
   - [ ] `file_example_TIFF_10MB.tiff` → TIFF→JPG — **no** transparency banner
   - [ ] PNG with real alpha → JPEG — banner + background picker
   - [ ] EN / ES release copy

## CLI alternative (if `gh` is installed)

```bash
gh release create v1.11.0 \
  --title "Camaleon v1.11.0 — Honest transparency detection" \
  --notes-file docs/releases/GITHUB_v1.11.0-body.md
```
