SYSTEM DIRECTIVE: Act as a Senior Frontend Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§5.4**, **§5.5**, **§5.6.3**, **§5.10**, **§7.1–§7.8**, **§8** NFRs) and `docs/ROADMAP.md` before any action.
All source code, comments, and outputs must be strictly in English (Spanish allowed only for brand-voice UI copy, matching existing precedent).
Do not substitute the technology stack (Next.js App Router + TypeScript + Tailwind v4). Do not modify `docs/ROADMAP.md`.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read SPEC §5.4.3 (JPG→PNG objectives), §5.5.2/§5.5.3 (PNG→JPG alpha + quality), §5.6.3 (user messaging doctrine). The set of *viable* options is bounded by transmutation science — never offer controls that corrupt the raster or produce invalid encoder input.
2. Inspect the existing pipeline: `workers/transmutation.worker.ts` (calls ONLY default exports today), `hooks/useTransmutationWorker.ts` (`transmutate(module, bytes)` — no options), `workers/types.ts` (protocol `{ id, module, bytes }`), `types/wasm-modules.d.ts` (the `*_with_quality` / `*_with_compression` exports already exist).
3. Confirm: the parameterized Wasm exports are ALREADY built (v0.5.4/v0.5.5). This task wires them through the worker + UI. **No Rust/Wasm changes.**
4. Design the option system **declaratively** ("atomic modifiable variables"): each tool declares its option specs in the registry; a generic `OptionsControls` renders them; the worker maps options → the correct Wasm export. Bounds must mirror backend-valid ranges so invalid input is impossible from the UI (backend still validates — defense in depth).
5. Plan the new conversion flow: stage file → adjust options → explicit "Transmutar" action → result (size + ratio + preview + download). Options must be set BEFORE conversion, so auto-convert-on-drop is replaced.
6. State assumptions and the viable-options analysis in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `ui_3_transmutation_panel_options`
PHASE: UI track — UI-3 (TransmutationPanel + atomic OptionsControls + polish)
OBJECTIVE: Deliver a refined per-tool workspace (`TransmutationPanel`) with declarative, science-bounded **atomic option controls** (JPEG quality, PNG compression) wired through an extended worker protocol, a result view (size/ratio/preview/download), and landing card height uniformity — per SPEC §5.4/§5.5/§5.6.3 and §7.

---

CONTEXT

- **UI-2 (v0.6.2)** delivered: landing + `ToolRegistry` + `/transmute/[slug]` route shell + `Dropzone`/`TransmutationDropzone`.
- **Backend** complete through v0.5.5. Parameterized exports already exist and are typed in `wasm-modules.d.ts`:
  - `transmutar_jpg_a_png_with_compression(bytes, compression)` — compression `1..9`
  - `transmutar_png_a_jpg_with_quality(bytes, quality)` — quality `1..100`
- The worker currently ignores these and calls the defaults. UI-3 connects them.
- **User feedback to address in this task:**
  1. Landing cards (`JPG → PNG` vs `PNG → JPG`) have unequal heights due to differing text length — must be **uniform/symmetric** (fixed visual rhythm).
  2. Tool pages are good but should be **more refined, modern, aesthetic**.
  3. Introduce **"atomic modifiable variables"**: pertinent, viable options per direction — never options that would corrupt/destroy the image.

---

VIABLE OPTIONS ANALYSIS (authoritative scope for this task)

Only the following are scientifically safe AND already backed by Wasm — implement EXACTLY these two controls:

| Direction | Atomic variable | Range | Default | Backing export | Why safe |
|-----------|-----------------|-------|---------|----------------|----------|
| JPG → PNG | **PNG compression effort** | `1–9` | `6` | `transmutar_jpg_a_png_with_compression` | Always lossless; only trades CPU vs file size. Cannot corrupt. (§5.4.3 P4) |
| PNG → JPG | **JPEG quality** | `1–100` | `85` | `transmutar_png_a_jpg_with_quality` | Primary perceptual control; bounded so encoder input is always valid. (§5.5.3) |

**Explicitly OUT OF SCOPE (do NOT add):** background-color picker for alpha flatten (requires a new Wasm export — backend task, not yet available), chroma subsampling toggle (image-crate limitation, §5.5.3 deferred), resize/scale (transformation, not transmutation), metadata-preserve (forbidden by P7 / §5.10 StripAll), palette/lossy-PNG (changes contract). The `OptionsControls` framework MUST be declarative so these drop in later with zero refactor once viable.

---

REQUIREMENTS

### R1 — Declarative option schema (`lib/tools/types.ts` + registry)

Extend the registry types with an atomic option spec:

```typescript
export type OptionKey = "quality" | "compression";

export type ToolOptionSpec = {
  key: OptionKey;
  label: string;            // e.g. "Calidad JPEG" / "Compresión PNG"
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  presets: { label: string; value: number }[];
  hint: string;             // tradeoff explanation (§5.6.3)
  lowerLabel?: string;      // slider low end, e.g. "Más liviano"
  upperLabel?: string;      // slider high end, e.g. "Más fiel"
};
```

Add `optionSpecs?: ToolOptionSpec[]` to `ToolDefinition`. Populate in `tool-registry.ts`:

- **jpg-to-png** → `compression`: min 1, max 9, step 1, default 6; presets `Fast (1)` / `Balanced (6)` / `Smallest (9)`; hint about lossless + size/CPU tradeoff.
- **png-to-jpg** → `quality`: min 1, max 100, step 1, default 85; presets `Web (60)` / `Balanced (85)` / `High (95)`; hint about irreversible loss + larger file at higher quality.

The registry remains the single source of truth — no option ranges hardcoded elsewhere.

### R2 — Extend worker protocol (TypeScript only — no Rust)

In `workers/types.ts`:

```typescript
export type TransmutationOptions = {
  quality?: number;      // PNG→JPG, 1..100
  compression?: number;  // JPG→PNG, 1..9
};

export type WorkerRequest = {
  id: string;
  module: TransmutationModule;
  bytes: ArrayBuffer;
  options?: TransmutationOptions;
};
```

In `transmutation.worker.ts`:

- Import the parameterized exports alongside defaults.
- `transmutador_jpg`: if `options?.compression != null` → `transmutar_jpg_a_png_with_compression(input, compression)`; else `transmutar_jpg_a_png(input)`.
- `transmutador_png`: if `options?.quality != null` → `transmutar_png_a_jpg_with_quality(input, quality)`; else `transmutar_png_a_jpg(input)`.
- Preserve init/race handling, `Transferable` transfer, mime/extension logic. Surface backend `String` errors unchanged (NFR-4).

In `hooks/useTransmutationWorker.ts`:

- `transmutate(module, bytes, options?)` — pass `options` in the `postMessage` payload. Keep the transfer list (`[bytes]`) and pending-promise map intact.

### R3 — `OptionsControls` component (`components/transmute/OptionsControls.tsx`)

Generic, declarative renderer driven by `ToolOptionSpec[]`:

- Props: `specs: ToolOptionSpec[]`, `values: TransmutationOptions`, `onChange: (next: TransmutationOptions) => void`.
- For each spec render:
  - **Preset segmented control:** buttons for each preset (`aria-pressed` for active); selecting sets the value.
  - **Fine slider:** `<input type="range">` with min/max/step/value bound to tokens; shows current numeric value (mono font); `lowerLabel`/`upperLabel` at the ends.
  - **Hint line:** muted text from `spec.hint` (§5.6.3 messaging).
- Fully keyboard accessible (slider + preset buttons), visible `focus-visible` ring, `aria-label`s. Token-driven only.
- If a tool has no `optionSpecs`, render nothing.

### R4 — `TransmutationPanel` (`components/transmute/TransmutationPanel.tsx`)

Replace `TransmutationDropzone` usage on the tool page with a richer container that manages the full flow. States: `idle → staged → processing → success → error`.

1. **idle:** `Dropzone` (reuse existing presentational component).
2. **staged** (file selected, not yet converted):
   - Show file name + input size (formatted KB/MB).
   - Render `OptionsControls` from `tool.optionSpecs` (initialized to defaults).
   - Primary `Button` "Transmutar" triggers conversion with current options.
   - Secondary action to clear/replace the file.
3. **processing:** `Spinner` with the tool's action label.
4. **success — result view:**
   - Output size + delta ratio vs input (e.g. `1.7 MB → 10.6 MB (+520%)` or `2.1 MB → 480 KB (−77%)`). This surfaces §5.4.2 / §5.6.3 honesty (JPG→PNG grows; PNG→JPG shrinks).
   - **Local preview** thumbnail of the output via `URL.createObjectURL` (revoke on reset/unmount — privacy-safe, all local).
   - `Button` "Descargar" (explicit download — no surprise auto-download) + secondary "Transmutar otro" (reset to idle).
5. **error:** themed error banner + retry; keep the staged file so the user can adjust options and retry.

Use `tool.module` + the assembled `TransmutationOptions` via `transmutate(...)`. Derive download name/extension from `tool.outputExtension` + `downloadResult`. Add a `lib/format/bytes.ts` helper for human-readable sizes.

### R5 — Tool page refinement (`app/transmute/[slug]/page.tsx`)

- Render `TransmutationPanel` (replacing the bare dropzone).
- Polish: consistent max-width, clear hierarchy (title + fidelity badge + hint, then panel), generous spacing, subtle section separation using tokens. Keep the back link to `/`.
- Keep `generateStaticParams` / `generateMetadata` / `notFound()` behavior.

### R6 — Landing card uniformity (`components/ui/Card.tsx` + `components/transmute/ToolCard.tsx` + `ToolGrid.tsx`)

Fix the height disonance so active cards are visually symmetric regardless of text length:

- `Card`: support filling its grid cell — add `h-full` capability (e.g. allow `className` to stretch; ensure the card can be a flex column).
- `ToolCard`: make the card a full-height flex column — title/badge row pinned top, description area `flex-grow`, the "Transmutar ↗" affordance pinned to the bottom and **always occupying its space** (reserve height; do not let hover-only rendering shift layout).
- `ToolGrid`: ensure grid items stretch (`items-stretch`) so both columns match the tallest card in the row.
- Result: `JPG → PNG` and `PNG → JPG` cards render at identical height with aligned badges and bottom affordance.

### R7 — Accessibility & responsive

- Sliders and preset controls keyboard operable; `aria-label`/`aria-pressed`; visible focus ring.
- Panel and result view responsive (mobile single column; comfortable touch targets).
- Respect `prefers-reduced-motion` (from UI-1).
- Preview image has meaningful `alt` (e.g. "Transmutation result preview").

### R8 — Verification

| Check | Must pass |
|-------|-----------|
| `npm run build` | Production build succeeds |
| E2E JPG→PNG | Stage `.jpg` → change compression preset/slider → Transmutar → result shows size growth + preview → download `.png` |
| E2E PNG→JPG | Stage `.png` → set quality 60 vs 95 → Transmutar → lower quality yields smaller output size shown in result → download `.jpg` |
| E2E options effect | Confirm different option values produce different output sizes (proves the `_with_*` exports are actually invoked) |
| E2E error | Corrupt/wrong-extension file → themed error; staged file retained for retry |
| Landing | Both active cards equal height; affordance aligned; "Pronto" card unaffected |
| Regression | Theme toggle, Header/Footer, Worker init, Wasm artifacts unchanged |

### R9 — Version & SPEC amendment

Bump to **v0.6.3**:
- `frontend/package.json` and `Footer` version string.

Update `docs/SPEC.md`:
- **§7.2:** extend the Worker protocol to document the optional `options` payload and which Wasm export each branch calls (note: backend Wasm unchanged; defaults preserved when no options).
- **§7.5:** mark `OptionsControls`, `TransmutationPanel` ✅; document `ToolOptionSpec` / `optionSpecs` declarative schema.
- **§7.6:** tool page now hosts `TransmutationPanel` (options + result view).
- **§7.8:** mark **UI-3 ✅** (v0.6.3); note background-color/subsampling remain future (need backend), UI-4 = i18n, UI-5 = a11y/responsive sign-off.
- Bump SPEC version; Amendment Log → `ui_3_transmutation_panel_options_done.md`.

**Do not** modify `docs/ROADMAP.md`.

### R10 — Report follow-ups

In the report's "Known Gaps / Follow-ups", explicitly list the next viable atomic options that require backend work, so the Architect can schedule them:
- **Background-color for alpha flatten (PNG→JPG):** needs a new Wasm export `transmutar_png_a_jpg_with_options(bytes, quality, r, g, b)` exposing the existing Rust `BackgroundFill` (§5.5.2).
- **Chroma subsampling 4:2:0 / 4:4:4:** image-crate limitation (§5.5.3) — post-MVP.

---

CONSTRAINTS

- **No Rust/Wasm changes** — the parameterized exports already exist; only worker (TS), hook, registry, and components change.
- **Options bounded to backend-valid ranges** (1–9, 1–100) — UI cannot emit invalid values; backend still validates.
- **Only the two analyzed controls** (quality, compression). No background color, subsampling, resize, metadata, or palette controls in this task.
- **Tokens only** — no hardcoded hex in new/modified components.
- **Registry is authoritative** for option specs.
- **Preserve StripAll** (§5.10) and the privacy model (NFR-1) — previews and processing stay 100% local.
- Do not break UI-1/UI-2 deliverables (theme, primitives, header/footer, landing, routes).
- English for code/comments/report; Spanish allowed for brand-voice UI copy.

---

DELIVERABLES

1. `ToolOptionSpec` schema + populated `optionSpecs` (R1).
2. Extended worker protocol + worker export routing + hook signature (R2).
3. `OptionsControls` declarative component (R3).
4. `TransmutationPanel` with staged/processing/result/error flow + `lib/format/bytes.ts` (R4).
5. Refined tool page (R5).
6. Landing card uniformity fix (R6).
7. `docs/SPEC.md` amendments (R9).
8. `docs/reports/ui_3_transmutation_panel_options_done.md` per GOVERNANCE §5 (incl. R10 follow-ups).

---

EXIT GATE (self-check before report)

- [ ] JPG→PNG exposes compression (1–9); PNG→JPG exposes quality (1–100); both via presets + slider.
- [ ] Worker invokes the parameterized Wasm exports when options are present; defaults preserved otherwise.
- [ ] Changing an option provably changes output size (E2E).
- [ ] Result view shows size, ratio, local preview, explicit download + "transmutar otro".
- [ ] Landing cards are equal height / symmetric.
- [ ] No backend/Wasm changes; StripAll and privacy intact.
- [ ] `npm run build` passes.
- [ ] SPEC §7.2/§7.5/§7.6/§7.8 updated; version bumped; amendment logged.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
