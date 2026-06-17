# Tier 3 Phase 3.3.0 — SVG Rasterize Spike Results

> **Date:** 2026-06-11  
> **Crate:** `motor_transmutacion/transmutador_svg`  
> **Backend:** **resvg 0.44** / **usvg 0.44** (`default-features = false`, `text` only)  
> **Gate:** NFR-7 Wasm ≤ 3 MB per module · §12.4 go/no-go ≤ 4 MB

---

## 1. Verdict: **GO — proceed to 3.3.1 (SVG→PNG) and 3.3.2 (SVG→JPEG)**

All Phase 3.3.0 spike gates **pass**. No frontend / ToolRegistry wiring in this phase.

| Gate | Result |
|------|--------|
| `wasm-pack build --target web --release --no-default-features` | ✅ |
| `.wasm` size (release + wasm-opt) | **1,710,747 B (~1.63 MB)** — ✅ NFR-7 |
| Fixture matrix §7.4 (`cargo test -p transmutador_svg --features native-system-fonts`) | ✅ 17 tests |
| External `href` blocked (`http(s)://`, `file://`) | ✅ |
| `inspect_svg_meta` without output-dimension render | ✅ |
| Alpha preserved on PNG path | ✅ |
| JPEG path flattens semantic alpha | ✅ |
| gzip `.svgz` via `Tree::from_data` | ✅ |
| 40 MP output cap (`MAX_PIXELS`) | ✅ |

Build command:

```bash
cd motor_transmutacion/transmutador_svg
wasm-pack build --target web --release --no-default-features \
  --out-dir spike-wasm-out --out-name transmutador_svg
```

Artifact (gitignored): `spike-wasm-out/`

Native tests (system fonts for `text_latin` fixture):

```bash
cargo test -p transmutador_svg --features native-system-fonts
```

---

## 2. Wasm size

| Module | `.wasm` (release + wasm-opt) | NFR-7 | Notes |
|--------|-------------------------------|-------|-------|
| **`transmutador_svg`** | **1.63 MB** | ✅ | resvg + usvg + tiny-skia + rustybuzz/fontdb (no bundled TTF yet) |

**Headroom before 3 MB gate:** ~1.37 MB — sufficient for a Noto/DejaVu subset (~200–400 KB) in 3.3.1 if required.

**Aggregate `public/wasm/` when shipped:** +~1.63 MB (lazy-loaded; worker recycles on route exit in 3.3.1+).

---

## 3. Wasm API (spike exports)

Crate: `transmutador_svg`

```rust
inspect_svg_meta(bytes) -> SvgMetaJs
transmutar_svg_a_png(bytes, out_w, out_h, compression)
transmutar_svg_a_jpg_with_options(bytes, out_w, out_h, quality, bg_r, bg_g, bg_b)
estimate_svg_to_png_size(bytes, out_w, out_h, compression)
estimate_svg_to_jpg_size(bytes, out_w, out_h, quality, bg_r, bg_g, bg_b)
set_session_input_limit / reset_session_input_limit
```

| Parameter | Range | Default | Notes |
|-----------|-------|---------|-------|
| **out_w × out_h** | 1…√40M | intrinsic from SVG | Main size knob; validated against `MAX_PIXELS` |
| **compression** (PNG) | 1–9 | **6** | Same class as other PNG tools |
| **quality** (JPEG) | 1–100 | **85** | Semantic alpha → flatten on background |

**Pipeline:** SVG → usvg parse → resvg RGBA → `image` PNG/JPEG encode → `validate_output` (StripAll path in worker).

**Estimate:** Full parse + render + encode (same order as transmute — document in Notice Rail `expensive` profile in 3.3.1).

---

## 4. Security

| Threat | Mitigation | Spike result |
|--------|------------|--------------|
| External image URLs | Custom `ImageHrefResolver`: `data:` only; `resolve_string` → `None` | ✅ + pre-parse string scan |
| External fonts | No `resources_dir`; no file/http font loading in resolver | ✅ |
| XXE / billion laughs | Byte cap via `validate_svg_input` + usvg limits | ✅ |
| Script / SMIL | usvg static subset — no execution | ✅ (document in i18n) |

---

## 5. Font strategy (open for 3.3.1)

| Target | Current spike behavior | Next step |
|--------|------------------------|-----------|
| **Native tests** | `native-system-fonts` feature → `fontdb.load_system_fonts()` | Keep for dev/CI on hosts |
| **Wasm release** | Empty fontdb; text renders only if SVG embeds `data:font/*` | Add committed OSS subset to `assets/` + `include_bytes!` before ship OR worker font injection API |

**Wasm size without bundled font:** 1.63 MB. Adding ~350 KB Liberation/Noto subset stays under 3 MB.

**Honesty (NFR-8):** `SvgMeta.has_text` + no embedded font → `svgFontSubstitutionHint` in 3.3.1 UI.

**Note:** `usvg::Tree::has_text_nodes()` in 0.44 always returns `true` (upstream bug — unconditional `true` at end of walker). Camaleon walks the tree and counts `Node::Text` instead.

---

## 6. Fixture matrix §7.4

| Fixture | Parse | Render | Test |
|---------|-------|--------|------|
| simple_icon | ✅ | ✅ | `simple_icon_meta_and_render` |
| gradient_logo | ✅ | ✅ | `gradient_logo_renders` |
| text_latin | ✅ | ✅ | `text_latin_meta_and_render` (native system fonts) |
| text_embedded_font | — | — | Deferred to 3.3.1 with committed WOFF2 fixture |
| embedded_png | ✅ | ✅ | `embedded_png_renders` |
| alpha_mask | ✅ | ✅ | `alpha_mask_png_preserves_alpha` |
| filters_blur | ✅ | ✅ | `filters_blur_meta_and_render` |
| external_href | reject | — | `external_href_rejected_before_render` |
| huge_viewbox_scale | — | reject | `huge_output_dimensions_rejected` |
| corrupt_xml | error | — | `corrupt_xml_returns_error` |
| gzip_svg | ✅ | ✅ | `gzip_svgz_parses_and_renders` |

---

## 7. Build integration

- Workspace member: `motor_transmutacion/Cargo.toml`
- `frontend/scripts/build-wasm.mjs`: `transmutador_svg` with `--no-default-features` (no `system-fonts` on Wasm)
- **Not wired:** ToolRegistry, worker routes, prepare UI — **3.3.1+**

---

## 8. Chief Architect decision

**Adopt `resvg` 0.44 / `usvg` 0.44** for Tier 3.3. Proceed with:

1. **3.3.1** — SVG→PNG tool, dimension UX, bundled font for Wasm
2. **3.3.2** — SVG→JPEG, alpha notices, ToolRegistry activation
3. **SPEC §6.x** stub amendment when 3.3.1 ships

**Stop conditions not triggered:** Wasm ≪ 3 MB; security gates pass; render correctness validated on fixture set.

---

## 9. Related documents

| Document | Role |
|----------|------|
| `docs/planning/tier3_3_svg_analysis.md` | Format science + API contract |
| `docs/planning/tier3_3_svg_implementation_plan.md` | Phases 3.3.1–3.3.2 execution |
| `docs/planning/tier3_2_avif_encode_spike_results.md` | Spike doc template |
