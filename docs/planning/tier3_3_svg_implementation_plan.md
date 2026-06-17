# Tier 3.3 — SVG Implementation Plan

> **Date:** 2026-06-11  
> **Status:** Ready to execute — **blocked on 3.3.0 spike go/no-go**  
> **Prerequisites:** v2.3.4 on `main` (Settings S1–S4, Notice Rail, 19 tools, AVIF suite)  
> **Science & format analysis:** `docs/planning/tier3_3_svg_analysis.md` (updated 2026-06-11)  
> **Target app versions:** **v2.4.0** (spike) · **v2.4.1** (SVG→PNG) · **v2.4.2** (SVG→JPEG)  
> **End state:** **21 active tools**

---

## 0. Executive summary

SVG is **not decoded** like AVIF — it is **rasterized** at user-chosen dimensions:

```
SVG → usvg (parse) → resvg (render RGBA) → PNG or JPEG encode → StripAll
```

Implementation follows the **same spine** as AVIF encode (3.2) and WebP suites:

1. Rust crate + Wasm spike (size gate)
2. Worker lazy-load + route handlers
3. ToolRegistry (`soon` → `active`)
4. Prepare probe + LimitContext on **output** pixels
5. Notice Rail profiles + Settings S2 defaults
6. i18n honesty (NFR-8)
7. Release + SPEC amendment per phase

---

## 1. Alignment with v2.3.x (avoid legacy patterns)

| Area | v2.3.x reality | SVG must use |
|------|----------------|--------------|
| **Encode defaults** | `resolveSpecDefault` + `buildDefaultOptions` + Settings S2 | PNG compression + JPEG quality + alpha background for `svg-to-jpg` |
| **Performance** | `useAdaptiveResourceProfile` + Settings S3 | Estimate = full render; `expensive` notice profile; cache/debounce from profile |
| **Notices** | `NoticeRail` + `tool-notice-profiles.ts` + density S4 | `svg-to-*`: `estimateCost/transmuteCost: expensive`; new cost factors |
| **Prepare UI** | `FilePrepareGate` + ring/bar from Settings S4 | Same; no duplicate progress pref |
| **Limits** | `docs/LIMIT_PIPELINE.md` + astro downscale | 40 MP on **output** W×H, not SVG file bytes |
| **Worker recycle** | SPA route exit recycles Wasm | Add `transmutador_svg` to recycle list |
| **What's New** | Release manifest entries | v241, v242 entries after ship |
| **Tests** | Vitest per prefs module; `cargo test --workspace` | Spike + integration tests in crate |

**Do not:** standalone `localStorage` keys for SVG options; duplicate notice components; canvas-based SVG render in TS.

---

## 2. Phase breakdown

### Phase 3.3.0 — Spike (`transmutador_svg`) → **v2.4.0**

**Goal:** Prove `resvg` + `usvg` Wasm ≤ 3 MB (NFR-7), security resolver, fixture matrix.

| # | Task | Owner layer | Deliverable |
|---|------|-------------|-------------|
| 1 | Add `transmutador_svg` to workspace `Cargo.toml` | Rust | Crate skeleton `cdylib` + `rlib` |
| 2 | Pin `resvg`, `usvg`, `tiny-skia`; `default-features = false` | Rust | `Cargo.toml` locked versions from spike |
| 3 | `core_utils` integration: `validate_input`, `validate_output`, StripAll path | Rust | Same as other crates |
| 4 | Custom `ImageHrefResolver` — **`data:` only** | Rust | Reject `http(s)://`, `file://` |
| 5 | Font strategy: bundled subset (Noto/DejaVu) + `data:` fonts | Rust | Document size in spike results |
| 6 | `inspect_svg_meta(bytes)` — no full pixmap | Rust/Wasm | Intrinsic W×H, flags |
| 7 | `transmutar_svg_a_png` / `_jpg` at fixed test dimensions | Rust/Wasm | Round-trip fixtures |
| 8 | `wasm-pack build --target web --release` + measure `.wasm` | Build | Record in `tier3_3_svg_spike_results.md` |
| 9 | Fixture matrix §7.4 (analysis doc) | Rust tests | `cargo test -p transmutador_svg` |
| 10 | `scripts/build-wasm.mjs` + sync-wasm-assets | Build | Glue in `public/wasm/transmutador_svg/` |
| 11 | Chief Architect **go/no-go** | Docs | If > 4 MB or security fail → stop |

**Exit gate:** Spike doc complete; SPEC §6.x stub for `transmutador_svg`; no frontend until go.

**No ToolRegistry activation in 3.3.0.**

---

### Phase 3.3.1 — SVG → PNG → **v2.4.1**

**Goal:** First user-facing tool; dimension UX; honest copy.

#### 2.1 Rust / Wasm

| Task | Detail |
|------|--------|
| `inspect_svg_meta` Wasm export | JS prepare path |
| `transmutar_svg_a_png(bytes, out_w, out_h, compression)` | MAX_PIXELS before alloc |
| `estimate_svg_to_png_size` | Full render acceptable; alpha hint optional |
| `set_session_input_limit` | Same pattern as AVIF |
| gzip `.svgz` | via `usvg::Tree::from_data` |

#### 2.2 Frontend — new cross-cutting work

**Dimension controls (largest UI delta):**

SVG has no fixed pixel grid — must expose **output width × height** (aspect lock default).

| Approach | Recommendation |
|----------|------------------|
| Extend `SliderOptionSpec` keys | Add `outputWidth`, `outputHeight` OR single `outputScale` + intrinsic from meta |
| **Preferred MVP** | `outputScale` presets (100%, 200%, 512px, 1024px, 2048px) derived from `inspect_svg_meta` intrinsic — less error-prone than free W/H |
| Aspect lock | Changing scale updates both dimensions from viewBox ratio |
| Prepare panel | Show intrinsic size + computed output MP |

**Types to extend:**

- `frontend/src/lib/tools/types.ts` — option keys
- `frontend/src/workers/types.ts` — `TransmutationOptions`
- `frontend/src/components/transmute/OptionsControls.tsx` — scale preset UI (mirror ICO presets pattern)
- `TransmutationPanel` prepare — call `inspect_svg_meta` via worker probe

#### 2.3 Worker

| Task | Detail |
|------|--------|
| `TransmutationModule` += `"transmutador_svg"` | `types.ts` |
| `initSvgWasm()` lazy promise | `transmutation.worker.ts` |
| Route transmute/estimate for `svg-to-png` | Match png compression option |
| Recycle on route exit | Provider recycle list |

#### 2.4 ToolRegistry

```typescript
{
  id: "svg-to-png",
  slug: "svg-to-png",
  fromFormat: "SVG",
  toFormat: "PNG",
  module: "transmutador_svg",
  toolGroup: "modern",
  fidelity: "lossless", // post-raster — honesty copy clarifies
  status: "active", // was "soon" on trunk during spike
  acceptExtensions: [".svg"],
  outputExtension: "png",
  optionSpecs: [ compression slider, outputScale presets ],
}
```

#### 2.5 Limits & prepare

- `SourceImageMeta` extension or parallel `SvgMeta` in prepare state
- `limitContext`: `pixelCount = out_w * out_h` from options + intrinsic
- Astro downscale when output MP > 40 — reuse `AstroResizePanel` pattern or inline scale cap

#### 2.6 Notices & profiles

```typescript
"svg-to-png": {
  estimateCost: "expensive",
  transmuteCost: "expensive",
  costFactors: ["compression", "outputWidth", "outputHeight"], // extend CostFactorKey
},
```

- Extend `hasExtremeCostFactors` if large output dimensions
- i18n: `svgFontSubstitutionHint`, `svgRendererSubsetHint`, `svgVectorToRasterHint`

#### 2.7 Settings S2

- PNG compression default already applies via `resolveSpecDefault` for `compression` key — no schema change

#### 2.8 Release

- `docs/releases/v2.4.1.md`
- What's New `v241`
- SPEC §6.12 `transmutador_svg`, §12.4 row update
- `npm run build` + manual smoke

---

### Phase 3.3.2 — SVG → JPEG → **v2.4.2**

| Task | Detail |
|------|--------|
| `transmutar_svg_a_jpg_with_options` | quality + bg RGB |
| `estimate_svg_to_jpg_size` | alpha hint from raster |
| Semantic alpha | Post-render `assess` — meaningful alpha → background pill + notices |
| ToolRegistry `svg-to-jpg` | quality + background color specs |
| Settings S2 | JPEG quality + alpha background via existing defaults |
| Fidelity notices | Generational loss + vector→raster honesty |
| Integration tests | StripAll; JPEG magic validation |
| Release v2.4.2 | 21 tools total |

---

## 3. File touch list (checklist)

### Rust (new)

```
motor_transmutacion/transmutador_svg/
  Cargo.toml
  src/lib.rs
  tests/integration_test.rs
  tests/fixtures/...
```

### Rust (modify)

```
motor_transmutacion/Cargo.toml          # workspace member
motor_transmutacion/core_utils/         # if shared SVG magic validation
```

### Frontend (3.3.1+)

```
frontend/src/workers/transmutation.worker.ts
frontend/src/workers/types.ts
frontend/src/lib/tools/tool-registry.ts
frontend/src/lib/tools/types.ts
frontend/src/lib/notices/tool-notice-profiles.ts
frontend/src/lib/notices/types.ts                    # CostFactorKey
frontend/src/lib/format/source-image-meta.ts         # or svg-meta.ts
frontend/src/components/transmute/OptionsControls.tsx
frontend/src/components/transmute/TransmutationPanel.tsx
frontend/src/providers/TransmutationWorkerProvider.tsx
frontend/scripts/build-wasm.mjs
frontend/scripts/sync-wasm-assets.mjs
frontend/src/lib/i18n/dictionaries/en.ts
frontend/src/lib/i18n/dictionaries/es.ts
frontend/src/lib/i18n/tool-copy.ts
frontend/src/lib/releases/manifest.ts
frontend/package.json                                 # version bump
```

### Docs (each phase)

```
docs/planning/tier3_3_svg_spike_results.md   # after 3.3.0
docs/SPEC.md                                  # §6.12 + §12.4 + amendment log
docs/ROADMAP.md
docs/planning/tier3_plan.md                   # 3.3 status rows
docs/releases/v2.4.x.md
```

---

## 4. Open decisions — resolve in spike (3.3.0)

| ID | Question | Proposal | Blocker? |
|----|----------|----------|----------|
| Q1 | Default output size | Intrinsic at 96 DPI via `tree.size()` | Spike |
| Q3 | External href | Hard reject | Spike |
| Q4 | Font bundle | Noto Sans subset ~200–400 KB | Spike size |
| Q6 | Animated SVG | Static first frame OR reject — pick in spike | Spike |
| Q-DIM | Scale vs W/H UI | **Scale presets MVP**; free W/H backlog | 3.3.1 UX |
| Q-EST | Cache raster for slider? | Result cache helps re-encode only if same raster buffer — spike: likely **full re-render** per estimate unless we cache pixmap in worker | Performance |

---

## 5. Verification matrix

| Gate | Command / action |
|------|------------------|
| Rust | `cargo test -p transmutador_svg` |
| Workspace | `cargo test --workspace` |
| Wasm size | measure after `build:wasm` |
| Frontend unit | existing vitest + any new svg meta tests |
| Build | `npm run build` |
| Manual | simple icon, gradient, text, embedded PNG, external href reject, 40 MP block |
| Honesty | EN/ES copy review for NFR-8 |
| Privacy | No network from Wasm resolvers |

---

## 6. Versioning & branches

| Phase | Branch | Tag |
|-------|--------|-----|
| 3.3.0 spike | `dev` | `v2.4.0` (spike-only release optional) |
| 3.3.1 | `dev` → `main` | `v2.4.1` |
| 3.3.2 | `dev` → `main` | `v2.4.2` |

Engine version: bump **motor workspace** patch/minor only if Wasm API surface changes (likely **1.7.0** at first SVG ship — record in release notes).

---

## 7. Risks & mitigations (execution)

| Risk | Mitigation |
|------|------------|
| Wasm > 3 MB | Minimal font; pin resvg; LTO; wasm-opt |
| Dimension UI complexity | Scale presets first; lock aspect |
| Estimate lag | Notice Rail expensive + S3 debounce; honest copy |
| Illustrator ≠ resvg | NFR-8 Micro SVG subset messaging |
| Legacy option keys | Extend types once; don't fork OptionsControls |

---

## 8. Related documents

| Doc | Role |
|-----|------|
| `tier3_3_svg_analysis.md` | Format science, security, API contract |
| `tier3_plan.md` | Tier 3 umbrella |
| `docs/LIMIT_PIPELINE.md` | Output pixel limits |
| `docs/planning/tier3_2_avif_encode_spike_results.md` | Spike doc template |
| `settings_panel_plan.md` | S2 defaults wiring |

---

## 9. Next action (when user says go)

**Start 3.3.0 only:**

1. Create `transmutador_svg` crate skeleton
2. Run Wasm build + size measurement
3. Implement fixture matrix + security resolvers
4. Write `tier3_3_svg_spike_results.md`
5. Present go/no-go before any ToolRegistry or UI work
