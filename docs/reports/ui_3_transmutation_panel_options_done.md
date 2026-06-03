# Technical Report: UI-3 — TransmutationPanel + Atomic OptionsControls

**Task ID:** ui_3_transmutation_panel_options
**Status:** done
**Date:** 2026-06-03
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Pre-Execution Analysis

### Viable Options Boundary

Only three controls are scientifically safe and backed by existing Wasm exports (v0.5.4–v0.5.6):

| Direction | Control | Range | Safety rationale |
|-----------|---------|-------|------------------|
| JPG→PNG | Compression | 1–9 | Always lossless; CPU↔size tradeoff only |
| PNG→JPG | Quality | 1–100 | Primary perceptual lever; bounded so encoder always valid |
| PNG→JPG | Background color | RGB 0–255 each | Only fills transparent pixels; opaque pixels untouched |

Excluded: chroma subsampling (image-crate limitation), resize (transformation, not transmutation), metadata-preserve (P7/StripAll forbidden), palette/lossy-PNG (contract change). The `ToolOptionSpec` discriminated union is extensible for future viable options.

### Flow Redesign

UI-2 auto-converted on drop. UI-3 introduces a staged flow: drop → review options → explicit "Transmutar" → result view (size delta + preview + download). This is necessary because options must be set before conversion — they're passed to parameterized Wasm exports.

## 2. Work Performed

### Files Created

| File | Purpose |
|------|--------|
| `frontend/src/lib/format/bytes.ts` | `formatBytes()` human-readable size formatter |
| `frontend/src/components/transmute/OptionsControls.tsx` | Declarative renderer: `SliderControl` with presets + range + labels; `ColorControl` with swatches + native color input |
| `frontend/src/components/transmute/TransmutationPanel.tsx` | Full flow container: idle(staged→processing→success→error) with size delta, local preview, explicit download |

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/lib/tools/types.ts` | Added `SliderOptionSpec`, `ColorOptionSpec`, `ToolOptionSpec`, `RgbColor`; replaced `options: ToolOption[]` with `optionSpecs?: ToolOptionSpec[]` on `ToolDefinition` |
| `frontend/src/lib/tools/tool-registry.ts` | Populated `optionSpecs` for both active tools with presets, hints, defaults |
| `frontend/src/workers/types.ts` | Added `TransmutationOptions`, `RgbColor`; extended `WorkerRequest` with `options?` |
| `frontend/src/workers/transmutation.worker.ts` | Imports parameterized Wasm exports; routes by `options.compression`/`options.quality`/`options.background`; preserves defaults when no options |
| `frontend/src/hooks/useTransmutationWorker.ts` | `transmutate(module, bytes, options?)` signature; passes `options` in `postMessage` |
| `frontend/src/app/transmute/[slug]/page.tsx` | Replaced `TransmutationDropzone` with `TransmutationPanel` |
| `frontend/src/components/transmute/ToolCard.tsx` | Flex-column layout with `flex-1` on description; reserved height (5rem) for affordance row |
| `frontend/src/components/ui/Card.tsx` | `CardBody` padding adjusted to `py-4` for consistent spacing |
| `frontend/package.json` | Version `0.6.2` → `0.6.3` |
| `frontend/src/components/layout/Footer.tsx` | Version string updated |
| `docs/SPEC.md` | Version `0.6.2` → `0.6.3`; §7.2/§7.5/§7.6/§7.8 updated; §11 amendment |

### OptionsControls Architecture

```
OptionsControls
├── specs: ToolOptionSpec[]
├── values: TransmutationOptions
└── onChange → renders:

    kind: "slider"  ──→ SliderControl
    │   ├── preset buttons (aria-pressed)
    │   ├── <input type="range"> (min/max/step)
    │   ├── numeric value (mono, tabular-nums)
    │   └── lowerLabel / upperLabel ends + hint

    kind: "color"   ──→ ColorControl
        ├── swatch buttons (aria-pressed, inline bg style)
        ├── custom <input type="color"> (hex ↔ RGB)
        └── hint
```

All controls are token-driven, keyboard accessible, with visible `focus-visible` rings.

### Worker Options Routing

```
Worker handleRequest(req):
  if req.module === "transmutador_jpg":
    if req.options?.compression != null:
      result = transmutar_jpg_a_png_with_compression(input, compression)
    else:
      result = transmutar_jpg_a_png(input)  // defaults: RGB, compression=6

  if req.module === "transmutador_png":
    if req.options?.background != null:
      result = transmutar_png_a_jpg_with_options(input, quality??85, r, g, b)
    else if req.options?.quality != null:
      result = transmutar_png_a_jpg_with_quality(input, quality)
    else:
      result = transmutar_png_a_jpg(input)  // defaults: Q85, WHITE
```

### TransmutationPanel Flow

```
idle          → Dropzone (file selection)
staged        → File info (name + size) + OptionsControls + "Transmutar" button
processing    → Spinner with filename
success       → Preview (local URL.createObjectURL) + size delta + "Descargar" + "Transmutar otro"
error         → Error banner + "Adjust & retry" (keeps staged file + options) + "Start over"
```

### Landing Card Height Fix

- `Card` now supports `h-full flex flex-col`
- `ToolCard`: `CardBody` uses `flex-1 flex flex-col`; description gets `flex-1` to push affordance row down
- Affordance row reserves 5rem height (`h-5`) so hover opacity transition doesn't shift layout
- Grid uses default `items-stretch` behavior

## 3. Verification Results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run build` | PASS | 6 static pages; tool routes 4.35 kB (up from 2.63 kB with OptionsControls + panel) |

### E2E
- JPG→PNG: drop → compression slider shows presets (1/6/9) → Transmutar → size delta shown (+520% typical) → preview renders → download PNG ✅
- PNG→JPG quality: drop → quality slider 60 vs 95 → lower quality produces smaller output ✅
- PNG→JPG background: transparent PNG → white vs black background → preview differs ✅
- Error flow: corrupt file → error banner → "Adjust & retry" keeps staged file ✅
- Landing: both active cards equal height; affordances aligned; "Pronto" card dimmed ✅

## 4. SPEC Amendments

**Version:** 0.6.2 → 0.6.3 (MINOR bump — extended worker protocol, new components, declarative option schema).

**Sections updated:**
- §7.2: Worker protocol extended with `options` payload and routing table
- §7.5: Component tree + lib/; `OptionsControls`/`TransmutationPanel` marked ✅
- §7.6: Tool page description updated (TransmutationPanel + result view)
- §7.8: UI-3 marked ✅ v0.6.3
- §11: Amendment log entry

## 5. Known Gaps / Follow-ups

| Item | Phase | Notes |
|------|-------|-------|
| Chroma subsampling 4:2:0 / 4:4:4 | Post-MVP | image crate limitation (§5.5.3); requires jpeg-encoder crate directly |
| Full i18n dictionaries EN/ES | UI-4 | Option labels/hints are hardcoded Spanish/English mix |
| Accessibility deep audit | UI-5 | Keyboard/ARIA/screen-reader sign-off |
| Drag-over-whole-page UX | Post-MVP | Currently only dropzone accepts drops |
| Preview before conversion with options | Post-MVP | Preview currently shown only post-conversion; pre-conversion preview would need client-side render of options effect |

## 6. Deviations from Prompt

None. All requirements R1–R9 satisfied. No Rust/Wasm changes. Only three viable controls implemented. Registry remains single source of truth. Backward compatible defaults preserved.

## 7. Architect Review (Cursor)

| Item | Fix applied |
|------|-------------|
| Preview URL lifecycle | `useEffect` + `URL.revokeObjectURL` on result change/unmount (was leaking via `useMemo`) |
| File extension validation | `fileMatchesExtensions()` from UI-2 (replaces naive `split(".")`) |
| Slider controlled value | `value ?? spec.defaultValue` in `OptionsControls` |
| Landing card height | `Link` `h-full` + `ToolGrid` `auto-rows-fr` for symmetric stretch |
| README version | Aligned to v0.6.3 |

Verified after corrections: `npm run build` PASS (6 static pages; `/transmute/[slug]` 4.37 kB).

---

### Self-Check (Exit Gate)
- [x] JPG→PNG exposes compression (1–9); PNG→JPG exposes quality (1–100) + background color; via presets/slider/swatches
- [x] Worker invokes parameterized Wasm exports when options present; defaults preserved
- [x] Changing an option provably changes output
- [x] Result view shows size, ratio, local preview, explicit download + "transmutar otro"
- [x] Landing cards equal height / symmetric
- [x] No backend/Wasm changes; StripAll and privacy intact
- [x] `npm run build` passes
- [x] SPEC updated
