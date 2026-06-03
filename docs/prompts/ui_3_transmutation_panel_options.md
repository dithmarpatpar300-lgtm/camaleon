SYSTEM DIRECTIVE: Act as a Senior Frontend Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§5.4**, **§5.5**, **§5.6.3**, **§5.10**, **§7.1–§7.8**, **§8** NFRs) and `docs/ROADMAP.md` before any action.
All source code, comments, and outputs must be strictly in English (Spanish allowed only for brand-voice UI copy, matching existing precedent).
Do not substitute the technology stack (Next.js App Router + TypeScript + Tailwind v4). Do not modify `docs/ROADMAP.md`.

> **PREREQUISITE:** This task depends on **v0.5.6** (`refine_png_background_option`), which adds the Wasm export `transmutar_png_a_jpg_with_options(bytes, quality, bg_r, bg_g, bg_b)`. Confirm it exists in `frontend/src/types/wasm-modules.d.ts` before wiring the background control. All three PNG→JPG exports and both JPG→PNG exports are already built — **no Rust/Wasm changes in this task.**

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read SPEC §5.4.3 (JPG→PNG objectives), §5.5.2/§5.5.3 (PNG→JPG alpha flatten + quality + background), §5.6.3 (user messaging doctrine). The set of *viable* options is bounded by transmutation science — never offer controls that corrupt the raster or produce invalid encoder input.
2. Inspect the pipeline: `workers/transmutation.worker.ts` (calls ONLY default exports today), `hooks/useTransmutationWorker.ts` (`transmutate(module, bytes)` — no options), `workers/types.ts` (protocol `{ id, module, bytes }`), `types/wasm-modules.d.ts` (parameterized exports already exist after v0.5.6).
3. Confirm the parameterized Wasm exports exist (quality, compression, options-with-background). This task wires them through the worker + UI. **No Rust/Wasm changes.**
4. Design the option system **declaratively** ("atomic modifiable variables"): each tool declares its option specs in the registry; a generic `OptionsControls` renders them; the worker maps options → the correct Wasm export. Bounds mirror backend-valid ranges so invalid input is impossible from the UI (backend still validates — defense in depth).
5. Plan the new conversion flow: stage file → adjust options → explicit "Transmutar" action → result (size + ratio + preview + download). Options are set BEFORE conversion, so auto-convert-on-drop is replaced.
6. State assumptions and the viable-options analysis in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `ui_3_transmutation_panel_options`
PHASE: UI track — UI-3 (TransmutationPanel + atomic OptionsControls + polish)
OBJECTIVE: Deliver a refined per-tool workspace (`TransmutationPanel`) with declarative, science-bounded **atomic option controls** (JPEG quality, JPEG background color, PNG compression) wired through an extended worker protocol, a result view (size/ratio/preview/download), and landing card height uniformity — per SPEC §5.4/§5.5/§5.6.3 and §7.

---

CONTEXT

- **UI-2 (v0.6.2)** delivered: landing + `ToolRegistry` + `/transmute/[slug]` route shell + `Dropzone`/`TransmutationDropzone`.
- **Backend** complete through **v0.5.6**. Parameterized exports already exist and are typed in `wasm-modules.d.ts`:
  - `transmutar_jpg_a_png_with_compression(bytes, compression)` — compression `1..9`
  - `transmutar_png_a_jpg_with_quality(bytes, quality)` — quality `1..100`, white background
  - `transmutar_png_a_jpg_with_options(bytes, quality, bg_r, bg_g, bg_b)` — quality + custom background (v0.5.6)
- The worker currently ignores these and calls the defaults. UI-3 connects them.
- **User feedback to address in this task:**
  1. Landing cards (`JPG → PNG` vs `PNG → JPG`) have unequal heights due to differing text length — must be **uniform/symmetric** (fixed visual rhythm).
  2. Tool pages are good but should be **more refined, modern, aesthetic**.
  3. Introduce **"atomic modifiable variables"**: pertinent, viable options per direction — never options that would corrupt/destroy the image.

---

VIABLE OPTIONS ANALYSIS (authoritative scope for this task)

Implement EXACTLY these three controls — all scientifically safe AND backed by Wasm exports:

| Direction | Atomic variable | Range / domain | Default | Backing export | Why safe |
|-----------|-----------------|----------------|---------|----------------|----------|
| JPG → PNG | **PNG compression effort** | `1–9` | `6` | `transmutar_jpg_a_png_with_compression` | Always lossless; only trades CPU vs file size. Cannot corrupt. (§5.4.3 P4) |
| PNG → JPG | **JPEG quality** | `1–100` | `85` | `transmutar_png_a_jpg_with_quality` / `_with_options` | Primary perceptual control; bounded so encoder input is always valid. (§5.5.3) |
| PNG → JPG | **Background color** (alpha flatten) | RGB `0–255` each | white `#FFFFFF` | `transmutar_png_a_jpg_with_options` | Only fills transparent pixels; opaque pixels untouched; `u8` always valid. (§5.5.2) |

**STILL OUT OF SCOPE (do NOT add):** chroma subsampling toggle (image-crate limitation, §5.5.3 deferred), resize/scale (transformation, not transmutation), metadata-preserve (forbidden by P7 / §5.10 StripAll), palette/lossy-PNG (changes contract). The `OptionsControls` framework MUST stay declarative so future viable options drop in with zero refactor.

---

REQUIREMENTS

### R1 — Declarative option schema (`lib/tools/types.ts` + registry)

Extend the registry with a **discriminated** atomic option spec:

```typescript
export type OptionKey = "quality" | "compression" | "background";
export type RgbColor = { r: number; g: number; b: number };

export type SliderOptionSpec = {
  kind: "slider";
  key: "quality" | "compression";
  label: string;             // "Calidad JPEG" / "Compresión PNG"
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  presets: { label: string; value: number }[];
  hint: string;              // tradeoff (§5.6.3)
  lowerLabel?: string;       // "Más liviano"
  upperLabel?: string;       // "Más fiel"
};

export type ColorOptionSpec = {
  kind: "color";
  key: "background";
  label: string;             // "Color de fondo"
  defaultValue: RgbColor;    // { r:255, g:255, b:255 }
  swatches: { label: string; value: RgbColor }[];  // White, Black, ...
  allowCustom: boolean;      // native color input for arbitrary RGB
  hint: string;              // "Only affects images with transparency"
};

export type ToolOptionSpec = SliderOptionSpec | ColorOptionSpec;
```

Add `optionSpecs?: ToolOptionSpec[]` to `ToolDefinition`. Populate in `tool-registry.ts`:

- **jpg-to-png** → one `slider` spec: `compression`, min 1, max 9, step 1, default 6; presets `Fast (1)` / `Balanced (6)` / `Smallest (9)`; hint about lossless + size/CPU tradeoff.
- **png-to-jpg** → two specs:
  - `slider`: `quality`, min 1, max 100, step 1, default 85; presets `Web (60)` / `Balanced (85)` / `High (95)`; hint about irreversible loss + larger file at higher quality.
  - `color`: `background`, default white; swatches `White (255,255,255)` / `Black (0,0,0)` (optionally a neutral grey); `allowCustom: true`; hint "Solo afecta imágenes con transparencia."

The registry remains the single source of truth — no option ranges/colors hardcoded elsewhere.

### R2 — Extend worker protocol (TypeScript only — no Rust)

In `workers/types.ts`:

```typescript
export type RgbColor = { r: number; g: number; b: number };

export type TransmutationOptions = {
  quality?: number;       // PNG→JPG, 1..100
  compression?: number;   // JPG→PNG, 1..9
  background?: RgbColor;   // PNG→JPG alpha flatten
};

export type WorkerRequest = {
  id: string;
  module: TransmutationModule;
  bytes: ArrayBuffer;
  options?: TransmutationOptions;
};
```

In `transmutation.worker.ts` (import all needed exports):

- `transmutador_jpg`:
  - `options?.compression != null` → `transmutar_jpg_a_png_with_compression(input, compression)`
  - else → `transmutar_jpg_a_png(input)`
- `transmutador_png`:
  - `options?.background != null` → `transmutar_png_a_jpg_with_options(input, options.quality ?? 85, bg.r, bg.g, bg.b)`
  - else if `options?.quality != null` → `transmutar_png_a_jpg_with_quality(input, quality)`
  - else → `transmutar_png_a_jpg(input)`
- Preserve init/race handling, `Transferable` transfer, mime/extension logic. Surface backend `String` errors unchanged (NFR-4).

In `hooks/useTransmutationWorker.ts`:
- `transmutate(module, bytes, options?)` — include `options` in `postMessage` payload; keep transfer list `[bytes]` and the pending-promise map intact.

### R3 — `OptionsControls` component (`components/transmute/OptionsControls.tsx`)

Generic, declarative renderer driven by `ToolOptionSpec[]`:

- Props: `specs: ToolOptionSpec[]`, `values: TransmutationOptions`, `onChange: (next: TransmutationOptions) => void`.
- `kind: "slider"` → preset segmented control (buttons, `aria-pressed`) + `<input type="range">` (min/max/step/value, token-styled) + current numeric value (mono) + `lowerLabel`/`upperLabel` ends + `hint`.
- `kind: "color"` → swatch buttons (each a labeled color chip, `aria-pressed` for active) + optional native `<input type="color">` when `allowCustom` (maps hex ↔ `{r,g,b}`) + `hint`. Active state compares RGB.
- Fully keyboard accessible; visible `focus-visible` ring; `aria-label`s; token-driven only.
- If a tool has no `optionSpecs`, render nothing.

### R4 — `TransmutationPanel` (`components/transmute/TransmutationPanel.tsx`)

Replace `TransmutationDropzone` on the tool page with a container managing the full flow. States: `idle → staged → processing → success → error`.

1. **idle:** `Dropzone` (reuse the presentational component).
2. **staged** (file selected, not converted):
   - File name + input size (formatted KB/MB).
   - `OptionsControls` from `tool.optionSpecs` (initialized to defaults).
   - Primary `Button` "Transmutar" → converts with current options.
   - Secondary action to clear/replace the file.
3. **processing:** `Spinner` with the tool's action label.
4. **success — result view:**
   - Output size + delta ratio vs input (e.g. `1.7 MB → 10.6 MB (+520%)` or `2.1 MB → 480 KB (−77%)`) — surfaces §5.4.2/§5.6.3 honesty.
   - **Local preview** thumbnail via `URL.createObjectURL` (revoke on reset/unmount — privacy-safe, fully local).
   - `Button` "Descargar" (explicit — no surprise auto-download) + secondary "Transmutar otro" (reset to idle).
5. **error:** themed banner + retry; keep the staged file + options so the user can adjust and retry.

Use `tool.module` + assembled `TransmutationOptions` via `transmutate(...)`. Derive download name/extension from `tool.outputExtension` + `downloadResult`. Add `lib/format/bytes.ts` for human-readable sizes.

### R5 — Tool page refinement (`app/transmute/[slug]/page.tsx`)

- Render `TransmutationPanel` (replacing the bare dropzone).
- Polish: consistent max-width, clear hierarchy (title + fidelity badge + hint, then panel), generous spacing, subtle token-based section separation. Keep the back link to `/`.
- Keep `generateStaticParams` / `generateMetadata` / `notFound()` behavior.

### R6 — Landing card uniformity (`components/ui/Card.tsx` + `ToolCard.tsx` + `ToolGrid.tsx`)

Fix the height disonance so active cards are visually symmetric regardless of text length:

- `Card`: support filling its grid cell (`h-full`, flex-column capable).
- `ToolCard`: full-height flex column — title/badge row pinned top, description `flex-grow`, "Transmutar ↗" affordance pinned bottom and **always occupying its space** (reserve height; no hover-induced layout shift).
- `ToolGrid`: grid items stretch (`items-stretch`) so both columns match the tallest card.
- Result: `JPG → PNG` and `PNG → JPG` cards render at identical height with aligned badges/affordances.

### R7 — Accessibility & responsive

- Sliders, presets, and color swatches keyboard operable; `aria-label`/`aria-pressed`; visible focus ring.
- Panel + result view responsive (mobile single column; comfortable touch targets).
- Respect `prefers-reduced-motion` (UI-1).
- Preview image has meaningful `alt`.

### R8 — Verification

| Check | Must pass |
|-------|-----------|
| `npm run build` | Production build succeeds |
| E2E JPG→PNG | Stage `.jpg` → change compression → Transmutar → result shows size growth + preview → download `.png` |
| E2E PNG→JPG quality | Stage `.png` → quality 60 vs 95 → lower quality yields smaller output (shown) → download `.jpg` |
| E2E PNG→JPG background | Transparent `.png` → choose Black vs White background → result preview differs accordingly |
| E2E options effect | Different option values provably change output (proves the `_with_*` exports are invoked) |
| E2E error | Corrupt/wrong-extension file → themed error; staged file retained for retry |
| Landing | Both active cards equal height; affordances aligned; "Pronto" card unaffected |
| Regression | Theme toggle, Header/Footer, Worker init, Wasm artifacts unchanged |

### R9 — Version & SPEC amendment

Bump to **v0.6.3**:
- `frontend/package.json` and `Footer` version string.

Update `docs/SPEC.md`:
- **§7.2:** extend the Worker protocol to document the optional `options` payload (`quality`/`compression`/`background`) and which Wasm export each branch calls (backend Wasm unchanged; defaults preserved when no options).
- **§7.5:** mark `OptionsControls`, `TransmutationPanel` ✅; document the discriminated `ToolOptionSpec` (`slider`/`color`) declarative schema.
- **§7.6:** tool page hosts `TransmutationPanel` (options + result view).
- **§7.8:** mark **UI-3 ✅** (v0.6.3); note subsampling remains future; UI-4 = i18n, UI-5 = a11y/responsive sign-off.
- Bump SPEC version; Amendment Log → `ui_3_transmutation_panel_options_done.md`.

**Do not** modify `docs/ROADMAP.md`.

### R10 — Report follow-ups

In the report's "Known Gaps / Follow-ups", list remaining viable atomic options needing backend work, so the Architect can schedule them:
- **Chroma subsampling 4:2:0 / 4:4:4 (PNG→JPG):** image-crate limitation (§5.5.3) — post-MVP.
- Any UX ideas surfaced during implementation (e.g. input preview, drag-over-whole-page).

---

CONSTRAINTS

- **No Rust/Wasm changes** — all needed exports exist (through v0.5.6); only worker (TS), hook, registry, components change.
- **Options bounded to backend-valid ranges** (compression 1–9, quality 1–100, RGB 0–255) — UI cannot emit invalid values; backend still validates.
- **Only the three analyzed controls** (quality, compression, background). No subsampling, resize, metadata, or palette controls.
- **Tokens only** — no hardcoded hex in new/modified components (color swatches store RGB values, not Tailwind classes — acceptable as data, not styling).
- **Registry is authoritative** for option specs.
- **Preserve StripAll** (§5.10) and the privacy model (NFR-1) — previews and processing stay 100% local.
- Do not break UI-1/UI-2 deliverables (theme, primitives, header/footer, landing, routes).
- English for code/comments/report; Spanish allowed for brand-voice UI copy.

---

DELIVERABLES

1. Discriminated `ToolOptionSpec` schema + populated `optionSpecs` (R1).
2. Extended worker protocol + worker export routing + hook signature (R2).
3. `OptionsControls` declarative component with slider + color controls (R3).
4. `TransmutationPanel` with staged/processing/result/error flow + `lib/format/bytes.ts` (R4).
5. Refined tool page (R5).
6. Landing card uniformity fix (R6).
7. `docs/SPEC.md` amendments (R9).
8. `docs/reports/ui_3_transmutation_panel_options_done.md` per GOVERNANCE §5 (incl. R10 follow-ups).

---

EXIT GATE (self-check before report)

- [ ] JPG→PNG exposes compression (1–9); PNG→JPG exposes quality (1–100) + background color; via presets/slider/swatches.
- [ ] Worker invokes the parameterized Wasm exports when options are present (incl. `_with_options` for background); defaults preserved otherwise.
- [ ] Changing an option provably changes output (size and/or background).
- [ ] Result view shows size, ratio, local preview, explicit download + "transmutar otro".
- [ ] Landing cards are equal height / symmetric.
- [ ] No backend/Wasm changes; StripAll and privacy intact.
- [ ] `npm run build` passes.
- [ ] SPEC §7.2/§7.5/§7.6/§7.8 updated; version bumped; amendment logged.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
