# Transparency / Semantic Alpha Engine — Planning Proposal

**Status:** Analysis complete — **implementation in progress on `dev`** (see [semantic_alpha_engine_plan.md](./semantic_alpha_engine_plan.md))  
**Track:** v1.11.0 (`main` when stable)  
**Trigger:** False-positive transparency notice on TIFF→JPEG (`file_example_TIFF_10MB.tiff`) — **fixed on `dev`** (user-verified 2026-06-08)

---

## 1. Problem statement

When a user stages a TIFF for **TIFF → JPEG**, the UI shows **“This image has transparency”** and the background-color picker — even when the image is visually fully opaque.

This violates Camaleon’s honesty policy (SPEC §5.11.6: no silent alpha loss; UI must warn when flattening matters). A warning when flattening **does not** happen is equally misleading: it suggests irreversible compositing the user may not need.

The bug is not JPEG-specific. It exposes an architectural gap: **UI “has alpha” and encode “flatten alpha” use different criteria** on several formats.

---

## 2. Root cause (TIFF, confirmed in code)

| Layer | Function | Rule | Cost |
|-------|----------|------|------|
| **UI / prepare** | `TiffMeta.pageHasAlpha()` → `page_likely_has_alpha()` | `samples_per_pixel >= 4` | Cheap (IFD tags only) |
| **Encode** | `tiff_has_meaningful_alpha()` | Any RGBA pixel with `alpha < 255` | Full page decode |

```rust
// transmutador_tiff/src/tiff_decode.rs
pub fn page_likely_has_alpha(page: &TiffPageInfo) -> bool {
    page.samples_per_pixel >= 4
}
```

Many real-world TIFFs are stored as **RGBA** (4 samples) with an alpha channel that is **entirely 255**. Exporters, DTP tools, and some scanners attach alpha structurally without using it. The encode path already skips unnecessary flattening; only the **UI probe is wrong**.

---

## 3. Vocabulary (canonical terms)

| Term | Meaning | Drives |
|------|---------|--------|
| **Structural alpha** | Format/header says an alpha channel *may* exist (RGBA color type, 4 TIFF samples, BMP 32-bit, VP8X alpha bit, ICO PNG entry, TGA image type) | Diagnostics, optional “advanced” UI |
| **Meaningful alpha** (semantic) | At least one pixel would look different if alpha were ignored (`α < 255`, or GIF/tRNS equivalent) | `TransparencyNotice`, background picker, flatten in lossy encoders |

**User-facing “transparency”** = **meaningful alpha**, not structural alpha.

---

## 4. Current state audit (format matrix)

| Format | UI / prepare detection | Rust encode flatten | Aligned? |
|--------|------------------------|---------------------|----------|
| **BMP** | `bmpHasMeaningfulAlpha` (JS sample, 8k px) + wasm `inspect_bmp.has_meaningful_alpha` | `bmp_has_meaningful_alpha` | ✅ Reference implementation |
| **TIFF** | `pageHasAlpha` → samples ≥ 4 | `tiff_has_meaningful_alpha` after decode | ❌ **Mismatch** |
| **PNG** | `detectPngAlpha`: color type 4/6 or `tRNS` chunk | meaningful after decode in `transmutador_png` | ⚠️ Structural UI; opaque RGBA may false-positive |
| **WebP** | `detectWebpAlpha`: VP8X alpha flag | meaningful after decode | ⚠️ Alpha plane may be all opaque |
| **GIF** | `detectGifAlpha` (container/frames) | per-frame composite | ⚠️ Needs frame-level semantic check for JPG |
| **ICO** | `entry_has_alpha`: PNG entry or BMP ≥32 bpp | `entry_has_meaningful_alpha` after decode | ⚠️ Structural probe exists; no ICO→JPG tool yet |
| **TGA** | `hasAlphaChannel` from header in meta | `tga_has_meaningful_alpha` on encode | ⚠️ Same class as TIFF when TGA→JPG ships |

**Pattern:** BMP was fixed end-to-end. Other formats copied **structural** checks in the frontend while Rust transmutators already use **semantic** checks at encode time.

---

## 5. Why a centralized module is the right direction

Your **TransparencyEngine** idea is sound. More precisely, Camaleon needs a **Semantic Alpha Engine** — one policy, many format adapters.

### Goals

1. **Single source of truth** for `hasMeaningfulAlpha` across prepare, panel, estimates, and transmute.
2. **No UI/encode drift** (TIFF is the proof that drift happens).
3. **Shared sampling budget** (BMP already uses `MAX_ALPHA_SAMPLES = 8192`).
4. **Test matrix** with `fake-alpha-opaque` fixtures per format (BMP already has `inspect_fake_alpha_32_opaque_no_meaningful_alpha`).
5. **SPEC alignment** — §5.5.2 flatten policy and §5.11.6 transparency notice.

### Non-goals (v1)

- Changing flatten math (already correct in Rust).
- Full raster decode on every prepare for all formats (performance).
- Replacing format-specific decoders.

---

## 6. Proposed architecture

```
                    ┌─────────────────────────────┐
                    │   TransparencyAssessment    │
                    │  hasAlphaChannel: bool      │
                    │  hasMeaningfulAlpha: bool   │
                    │  confidence: header|sample|full │
                    │  reason?: string            │
                    └──────────────┬──────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
   core_utils::alpha      format probes (Rust)      frontend prepare
   rgba_meaningful()      tiff, png, webp, …        thin wasm client
   sample_rgba_budget()   trait AlphaInspector
```

### Rust (`motor_transmutacion/core_utils`)

- `rgba_has_meaningful_alpha(rgba: &RgbaImage) -> bool` — move from duplicated crate copies.
- `rgba_has_meaningful_alpha_sampled(rgba, max_pixels) -> bool` — shared budget.
- Optional: `AlphaAssessment` struct + `AlphaConfidence` enum.

### Per-crate probes (extend, don’t replace decoders)

Each `transmutador_*` exposes wasm:

- `inspect_*_alpha(bytes, page_or_entry_index) -> AlphaAssessmentJs`

Implementation strategy per format:

| Format | Probe strategy |
|--------|----------------|
| BMP | ✅ Already samples BGRA in `bmp_probe` |
| TIFF | **Partial decode or strip sample** — must not use `samples >= 4` alone |
| PNG | Header fast-path; if RGBA/tRNS → sample IDAT via limited inflate **or** wasm decode at max dimension cap |
| WebP | VP8X bit + sample alpha plane if present |
| GIF | Scan frames up to N frames / M pixels for transparent index or partial alpha |
| ICO | Decode selected entry at probe size, then semantic check |
| TGA | Header + sample pixel data region |

### Frontend

- Replace `hasAlpha` in `PreparedFileContext` with `alpha: TransparencyAssessment` (or keep `hasAlpha` as alias to `hasMeaningfulAlpha` during migration).
- `TransparencyNotice` gates on `hasMeaningfulAlpha` only.
- `TransmutationPanel` TIFF page changes call `pageMeaningfulAlpha(i)`, not `pageHasAlpha(i)`.

### TypeScript surface (illustrative)

```ts
export type TransparencyAssessment = {
  hasAlphaChannel: boolean;
  hasMeaningfulAlpha: boolean;
  confidence: "header" | "sampled" | "full";
  reason?: string;
};
```

---

## 7. TIFF-specific fix (minimal vs engine)

**Hotfix (could ship in v1.10.5):**

- Add `page_has_meaningful_alpha(page_index)` in `transmutador_tiff` wasm (sample or decode).
- Wire `run-prepare.ts` + `TransmutationPanel` to use it.

**Engine (v1.11.x):**

- Same behavior, but implemented through shared `core_utils` + unified API and tests.

Recommendation: **do not** only patch TIFF in isolation without extracting shared helpers — otherwise PNG/WebP drift remains.

---

## 8. Performance considerations

| Approach | Pros | Cons |
|----------|------|------|
| Header-only | Instant | False positives (current TIFF bug) |
| Statistical sample (BMP style) | Fast, honest for most files | Needs format-aware byte layout |
| Full decode | Exact | Slow on 10 MB TIFF at prepare time |

**Pragmatic policy:**

- Prepare phase: **sampled semantic** check with global pixel budget (e.g. 8k–32k samples).
- Transmute phase: **full semantic** check on decoded raster (already done).
- If sample says “no meaningful alpha” but full decode finds some → rare edge case; document that UI is “best effort at prepare” with conservative encode. Prefer **false negative in prepare** over **false positive** for honesty (user not warned when unnecessary).

For `file_example_TIFF_10MB.tiff`: wasm TIFF module is already loaded in prepare — a **downscaled decode** (e.g. max 512 px) for alpha probe only is acceptable.

---

## 9. Testing plan

1. **Fixtures per format**
   - `opaque-rgba.{tiff,png,webp,bmp,tga}` — structural alpha, all α=255.
   - `real-alpha.{...}` — at least one α<255.
   - `rgb-no-alpha.{...}` — no channel.

2. **Contract tests**
   - `hasMeaningfulAlpha` prepare result === encode flatten decision for same file/page.

3. **Regression**
   - `file_example_TIFF_10MB.tiff` → no transparency notice.

4. **Property**
   - Flatten on meaningful alpha changes output bytes vs opaque passthrough.

---

## 10. Phased rollout

| Phase | Scope | Outcome |
|-------|-------|---------|
| **0** | Spec + this doc + README/Wave 2 status | Planning complete |
| **1** | `core_utils::alpha` extract + BMP/TIFF/ICO/TGA use it | Rust DRY |
| **2** | Wasm `*_alpha_assessment` exports; frontend prepare unified | UI honesty |
| **3** | PNG/WebP/GIF semantic probes | Full lossy-input matrix |
| **4** | i18n copy review (“transparency” vs “alpha channel”) | UX clarity |
| **5** | Release notes + What’s New | v1.11.0 |

---

## 11. Risks

| Risk | Mitigation |
|------|------------|
| Prepare latency on large TIFF | Downscale/sample; run in existing wasm worker |
| tRNS / GIF palette transparency | Dedicated palette/index scan, not only RGBA |
| Premultiplied vs associated alpha | Document TIFF ExtraSamples; treat α<255 as meaningful regardless |
| Duplicate JS/Rust logic | JS only calls wasm for semantic result; keep header parsers for sniffer only |

---

## 12. Recommendation

**Proceed with the TransparencyEngine / Semantic Alpha Engine as a v1.11 cross-cutting initiative.**

The TIFF case is not a one-off special case — it is the visible symptom of **split structural vs semantic detection**. BMP already proved the correct model. Centralizing it reduces future Wave 3+ bugs and matches Camaleon’s “honest transmutation” positioning.

**Immediate user-visible win:** `file_example_TIFF_10MB.tiff` on TIFF→JPEG should not show the blue transparency banner.

---

## 13. Open questions — **RESOLVED**

See [semantic_alpha_engine_plan.md §2](./semantic_alpha_engine_plan.md#2-decisions-locked):

| # | Resolution |
|---|------------|
| 1 | **Meaningful only** in UI; structural internal |
| 2 | **8192** samples, full scan if image ≤8192 px |
| 3 | **All lossy tools in v1.11.0** (PNG included) |
| 4 | **Semantic Alpha Engine**; Rust `core_utils::semantic_alpha`; type `AlphaAssessment` |

---

*Related: [semantic_alpha_engine_plan.md](./semantic_alpha_engine_plan.md); SPEC §5.5.2 (alpha flatten), §5.11.6 (`TransparencyNotice`); BMP reference `detect-bmp-alpha.ts`, `bmp_probe.rs`; TIFF bug `page_likely_has_alpha` vs `tiff_has_meaningful_alpha`.*
