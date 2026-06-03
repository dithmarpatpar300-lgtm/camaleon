SYSTEM DIRECTIVE: Act as a Senior Frontend Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§5.6.3**, **§7.1–§7.8**, **§8** NFRs) and `docs/ROADMAP.md` before any action.
All source code, comments, and outputs must be strictly in English.
Do not substitute the technology stack (Next.js App Router + TypeScript + Tailwind v4). Do not modify `docs/ROADMAP.md`.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/SPEC.md` §7.5 (`ToolRegistry` schema), §7.6 (page model), §7.8 (UI-2 scope), and §5.6.3 (user-facing fidelity messaging).
2. Inspect UI-1 deliverables: `globals.css` tokens, `components/ui/*`, `components/layout/*`, `providers/ThemeProvider.tsx`, current `app/page.tsx` (inline dropzone + worker logic).
3. Plan how `ToolRegistry` becomes the single source of truth for landing cards AND (minimal) tool routes — without duplicating format/module mapping logic.
4. Plan the split between presentational `Dropzone` and container `TransmutationDropzone` so UI-3 can wrap the latter in a full `TransmutationPanel`.
5. Confirm scope: landing redesign + registry + dropzone extraction + **minimal** `/transmute/[slug]` route shell. **No** OptionsControls (quality/compression sliders), **no** search/mega-menu, **no** full i18n dictionaries (UI-4).
6. Preserve Worker protocol (§7.2), `useTransmutationWorker`, and Wasm artifacts — **do not change backend**.
7. State assumptions in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `ui_2_landing_tool_registry`
PHASE: UI track — UI-2 (Landing + ToolRegistry + Dropzone extraction)
OBJECTIVE: Transform `/` into a proper landing (Hero + PrivacyBanner + ToolGrid driven by `ToolRegistry`), extract reusable transmutation dropzone components, and wire **minimal** per-tool routes so active cards navigate without 404 — per SPEC §7.5–§7.6.

---

CONTEXT

- **UI-1 (v0.6.1)** delivered: design tokens, theme system, `ui/` primitives, Header/Footer shell. Current `/` still embeds dropzone + worker logic inline in `page.tsx`.
- **Backend** complete through v0.5.5: `transmutador_jpg` (RGB PNG, compression 1–9), `transmutador_png` (alpha flatten, quality 1–100). Worker routes by `TransmutationModule` — unchanged.
- **Identity:** "Verde Camaleón" dark-first minimalism; alchemical voice ("Transmutar", "Transmutaciones"). Reference: `assets/camaleon-mockup-b-minimal.png`.
- **Routing decision (approved):** landing at `/` + dedicated page per tool at `/transmute/[slug]`. UI-3 will add full `TransmutationPanel` polish + `OptionsControls`; UI-2 delivers the **route shell** so ToolCards work end-to-end.

---

REQUIREMENTS

### R1 — ToolRegistry (`frontend/src/lib/tools/`)

Create a typed registry as the **single source of truth** (SPEC §7.5):

```typescript
// lib/tools/types.ts
export type ImageFormat = "JPG" | "JPEG" | "PNG";
export type ToolCategory = "image"; // extensible later
export type ToolFidelity = "lossless" | "lossy";
export type ToolStatus = "active" | "soon";
export type ToolOption = "quality" | "compression";

export type ToolDefinition = {
  id: string;              // "jpg-to-png"
  slug: string;            // URL segment (must match id or be explicit)
  title: string;           // "JPG → PNG" (display)
  description: string;     // One-line card copy (English for now; i18n in UI-4)
  fromFormat: ImageFormat;
  toFormat: ImageFormat;
  module: TransmutationModule;  // import from @/workers/types
  category: ToolCategory;
  fidelity: ToolFidelity;
  status: ToolStatus;
  acceptExtensions: string[];   // e.g. [".jpg", ".jpeg"] or [".png"]
  outputExtension: string;      // "png" | "jpg"
  fidelityHint?: string;        // §5.6.3 messaging surfaced on card
  options?: ToolOption[];       // metadata for UI-3; not wired in UI-2
};
```

Create `tool-registry.ts`:

| Function | Purpose |
|----------|---------|
| `TOOLS: ToolDefinition[]` | Static array — **minimum 2 active** entries matching MVP |
| `getToolBySlug(slug: string): ToolDefinition \| undefined` | Lookup for dynamic route |
| `getActiveTools(): ToolDefinition[]` | For ToolGrid |
| `getSoonTools(): ToolDefinition[]` | Optional placeholders (e.g. WebP) — `status: "soon"`, non-navigable |

**Active tools (required):**

| slug | module | fidelity | acceptExtensions | fidelityHint (§5.6.3) |
|------|--------|----------|------------------|------------------------|
| `jpg-to-png` | `transmutador_jpg` | `lossless` | `.jpg`, `.jpeg` | Warn: file size may increase for photos; lossless master, not for shrinking |
| `png-to-jpg` | `transmutador_png` | `lossy` | `.png` | Warn: irreversible quality loss; alpha flattened to white |

**Optional soon placeholders (1–2):** e.g. `webp-to-png`, dimmed in grid, no route.

**Do not** duplicate `detectModule()` logic outside the registry — route pages derive `module` and accepted extensions from `ToolDefinition`.

### R2 — Landing components (`components/transmute/`)

#### `Hero.tsx`

- Centered hero per mockup B: primary headline using transmutation voice (e.g. "Transmutar tus archivos" or bilingual-friendly layout).
- Subheadline: alchemical tagline reference (*"La materia no se crea ni se destruye, solo se transmuta."*) — may use Spanish brand voice per Footer precedent.
- Token-driven typography; generous whitespace; **no hardcoded hex**.

#### `PrivacyBanner.tsx`

- Prominent, calm reassurance strip (not marketing fluff):
  - *"100% local. Tus archivos nunca salen de tu dispositivo."*
- Optional lock/shield icon (inline SVG, `aria-hidden`).
- Surfaces NFR-1 as verifiable trust signal.

#### `ToolCard.tsx`

Props: `tool: ToolDefinition`

- Renders `Card` with: format title (`JPG → PNG`), `Badge` (`lossless` / `lossy`), one-line `description`, optional `fidelityHint` in muted text.
- **`status: "active"`:** wrap in `<Link href={`/transmute/${tool.slug}`}>` with hover/focus states; include subtle navigate affordance (↗ icon).
- **`status: "soon"`:** render dimmed/disabled card (`opacity`, `cursor-not-allowed`), badge "Pronto" / "Soon", **no** link.
- Keyboard accessible; visible focus ring via tokens.

#### `ToolGrid.tsx`

- Responsive grid: 1 col mobile, 2 cols `md+` (match mockup density).
- Maps `getActiveTools()` + optional `getSoonTools()` to `ToolCard`.
- Section heading optional (e.g. "Transmutaciones disponibles").

### R3 — Dropzone extraction

Split current `page.tsx` logic into reusable components:

#### `Dropzone.tsx` (presentational)

Props (typed):

```typescript
type DropzoneProps = {
  accept: string;                    // input accept attribute
  status: "idle" | "processing" | "success" | "error";
  dragging: boolean;
  sourceFileName: string | null;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  idleLabel?: string;
  processingLabel?: string;
};
```

- Encapsulates: hidden `<input type="file">`, drag/drop handlers, dashed border states, `Spinner`, keyboard a11y (`role="button"`, `tabIndex`, Enter/Space) — preserve UI-1 patterns.
- **No** Worker imports — pure UI.

#### `TransmutationDropzone.tsx` (container)

Props:

```typescript
type TransmutationDropzoneProps = {
  tool: ToolDefinition;  // drives module, accept extensions, output naming
};
```

- Move from `page.tsx`: worker hook, file handling, `downloadResult`, status state, success/error banners, engine ready indicator.
- Validate file extension against `tool.acceptExtensions` before transmutating; clear error if wrong type.
- Use `tool.module` for `transmutate()` call; derive download extension from `tool.outputExtension`.
- Reuse `Dropzone` internally; reuse `Badge` for fidelity if helpful.

Extract shared helpers to `lib/transmutation/download.ts` (or similar) if it reduces duplication — keep focused.

### R4 — Landing page refactor (`app/page.tsx`)

Replace inline dropzone with landing composition:

```tsx
<Hero />
<PrivacyBanner />
<ToolGrid />
```

- **Remove** the universal dropzone from `/` — entry is now via ToolCards → `/transmute/[slug]`.
- Page is a Server Component shell if possible; client components only where needed (`ToolGrid`/`ToolCard` may be server if no client state — your choice, document in report).

### R5 — Minimal tool route shell (`app/transmute/[slug]/page.tsx`)

Create dynamic route (UI-2 route shell; full `TransmutationPanel` deferred to UI-3):

1. Resolve `slug` via `getToolBySlug(slug)`; call `notFound()` if missing or `status !== "active"`.
2. Render a focused workspace:
   - Tool title (`tool.title`) + fidelity `Badge`
   - Optional one-line `fidelityHint`
   - `<TransmutationDropzone tool={tool} />`
   - Back link to `/` ("← Transmutaciones" or similar)
3. Use `generateStaticParams()` for the two active slugs (SSG-friendly).

**Do NOT** implement quality/compression sliders (`OptionsControls`) — UI-3.

### R6 — Header alignment

- Ensure Header `Transmutaciones` nav link to `/` still makes sense (landing is now the tool directory).
- No other header changes in this task.

### R7 — Accessibility & responsive

- ToolGrid responsive at `sm`/`md`/`lg` breakpoints.
- All card links and back navigation keyboard operable.
- Preserve `prefers-reduced-motion` respect from UI-1.

### R8 — Verification

| Command / check | Must pass |
|-----------------|-----------|
| `npm run build` | Production build succeeds |
| Manual E2E | `/` shows Hero + PrivacyBanner + ToolGrid (2 active + optional soon cards) |
| Manual E2E | Click `JPG → PNG` card → `/transmute/jpg-to-png` → drop file → download `.png` |
| Manual E2E | Click `PNG → JPG` card → `/transmute/png-to-jpg` → drop file → download `.jpg` |
| Manual E2E | Invalid slug → 404; soon tool card not clickable |
| Regression | Worker/hook/Wasm unchanged; theme toggle still works |

### R9 — Version & SPEC amendment

Bump to **v0.6.2**:

- `frontend/package.json` version
- `Footer` version string if hardcoded

Update `docs/SPEC.md`:

- §7.5: mark `tool-registry.ts` ✅; note implemented helpers
- §7.6: update `/` and `/transmute/[slug]` status (route shell delivered UI-2)
- §7.8: mark **UI-2 ✅** with v0.6.2; UI-3 scope unchanged (TransmutationPanel + OptionsControls)
- Bump SPEC version; Amendment Log → `ui_2_landing_tool_registry_done.md`

**Do not** modify `docs/ROADMAP.md`.

---

CONSTRAINTS

- **Scope:** UI-2 only — no search, mega-menu, sound, session counter, i18n dictionaries, OptionsControls.
- **Backend untouched:** no Rust/Wasm/Worker protocol changes.
- **Tokens only:** no hardcoded hex in new components.
- **Registry is authoritative:** no parallel format→module maps in page files.
- **English** for code, comments, and report; Spanish allowed for brand-voice UI copy (Hero/PrivacyBanner) matching Footer precedent.
- **Do not** remove or break UI-1 primitives/theme/header/footer.

---

DELIVERABLES

1. `lib/tools/` — types + registry + helpers (R1).
2. `components/transmute/` — Hero, PrivacyBanner, ToolCard, ToolGrid, Dropzone, TransmutationDropzone (R2–R3).
3. Refactored `app/page.tsx` landing (R4).
4. `app/transmute/[slug]/page.tsx` minimal route shell (R5).
5. `docs/SPEC.md` amendments (R9).
6. `docs/reports/ui_2_landing_tool_registry_done.md` per GOVERNANCE §5.

---

EXIT GATE (self-check before report)

- [ ] `/` is Hero + PrivacyBanner + ToolGrid — no inline dropzone.
- [ ] ToolRegistry drives cards and route resolution (single source of truth).
- [ ] Active ToolCards link to `/transmute/[slug]`; transmutation works on both MVP tools.
- [ ] Dropzone extracted; TransmutationDropzone encapsulates worker logic.
- [ ] §5.6.3 fidelity hints visible on cards or tool pages.
- [ ] Worker/hook/Wasm unchanged.
- [ ] `npm run build` passes.
- [ ] SPEC v0.6.2 updated.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
