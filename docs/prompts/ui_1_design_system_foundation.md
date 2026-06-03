SYSTEM DIRECTIVE: Act as a Senior Frontend Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§7.1–§7.3** existing frontend, **§7.4–§7.8** UI architecture & design system, **§8** NFRs) and `docs/ROADMAP.md` before any action.
All source code, comments, and outputs must be strictly in English.
Do not substitute the technology stack (Next.js App Router + TypeScript + Tailwind v4). Do not modify `docs/ROADMAP.md`.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/SPEC.md` §7.4–§7.8 in full. The "Verde Camaleón" identity, design tokens, and component taxonomy are authoritative.
2. Inspect the current frontend: `frontend/src/app/page.tsx` (inline dropzone + worker logic), `layout.tsx`, `globals.css` (Tailwind v4 `@import`), `hooks/useTransmutationWorker.ts`, `workers/`.
3. Plan the token layer and theme strategy (class vs data-attribute) so there is NO flash of unstyled/incorrect theme (FOUC) on first paint.
4. Plan how to wrap the existing dropzone in the new layout shell WITHOUT breaking transmutation (worker, hook, download flow stay intact).
5. Confirm: this task is foundation only. The landing redesign (Hero/ToolGrid), per-tool routes, and full i18n dictionaries are LATER phases (UI-2/UI-3/UI-4) — do NOT build them now.
6. State assumptions and theme-strategy decision in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `ui_1_design_system_foundation`
PHASE: UI track — UI-1 (Design system foundation)
OBJECTIVE: Establish the "Verde Camaleón" design-token layer, a theme provider (dark/light, persisted, no FOUC), a small set of reusable `ui/` primitives, and a layout shell (Header + Footer) — all per SPEC §7.4–§7.7 — **without changing transmutation behavior**.

---

CONTEXT

- The frontend today is a single `page.tsx` with the dropzone, states, and download logic inline. There is no header, theming, or component system.
- Backend is complete through v0.5.5 (JPG↔PNG with quality/compression Wasm exports). The Worker protocol (§7.2) and `useTransmutationWorker` hook are stable — **do not change them**.
- Identity is decided: dark-first minimalism, single chameleon-green accent, alchemical voice ("Transmutar"/"Transmutaciones"). Reference mockup: `assets/camaleon-mockup-b-minimal.png`.
- Header first cut = logo + "Transmutaciones" nav + language selector (EN/ES) + theme toggle. **No** search, mega-menu, sound, or counter in this phase.

---

REQUIREMENTS

### R1 — Design tokens (`globals.css`, Tailwind v4 `@theme`)

Implement the SPEC §7.4 token table as CSS custom properties, exposed to Tailwind v4 via `@theme`. Provide BOTH themes:

- **Dark (base):** values from the §7.4 dark table.
- **Light:** same token names, neutrals inverted to off-white surfaces + dark text, identical accent green `#22C55E`.

Theme is selected by a strategy of your choice (recommended: `class="dark"` on `<html>`, or `data-theme`). Tokens are the **single source of truth** — components must reference tokens (Tailwind classes mapped to tokens), never hardcoded hex.

Document the token→Tailwind mapping approach in the report.

### R2 — ThemeProvider + useTheme (`providers/`, `hooks/`)

- `ThemeProvider` manages `"dark" | "light"`, defaulting to `prefers-color-scheme` on first visit, then persisted in `localStorage` (key e.g. `camaleon-theme`).
- Expose `useTheme()` returning `{ theme, setTheme, toggleTheme }`.
- **No FOUC:** inject a tiny inline script in `app/layout.tsx` (before hydration) that reads `localStorage`/`prefers-color-scheme` and sets the theme class on `<html>` synchronously. (You may use `next-themes` instead if you prefer — it is lightweight and App-Router compatible — but justify the dependency in the report. Otherwise implement the minimal custom provider.)

### R3 — Typography (`next/font`)

- Load a neutral sans-serif (Geist or Inter) as the UI font and a monospace (Geist Mono / JetBrains Mono) for technical data, via `next/font`.
- Wire font variables into `<body>` and the token layer. No decorative serif.

### R4 — `ui/` primitives (token-driven, typed, accessible)

Create reusable primitives under `frontend/src/components/ui/`:

| Component | Notes |
|-----------|-------|
| `Button` | Variants: `primary` (accent), `ghost`, `subtle`; sizes `sm`/`md`; `focus-visible` ring using accent; disabled state |
| `IconButton` | Square icon-only button; **requires** `aria-label`; used by ThemeToggle |
| `Badge` | Variants: `lossless` (green), `lossy` (neutral grey), `neutral` — per §7.4 tokens |
| `Card` | Surface container (`--bg-surface`/`--border`, rounded); composable header/body |
| `Spinner` | Accessible loading indicator (`role="status"`, label) |

All primitives: TypeScript prop types, no business logic, no hardcoded colors, sensible `className` passthrough (merge utility allowed).

### R5 — Layout shell (`layout/`)

- `Header`: left = chameleon logo mark (simple inline SVG is fine) + `Camaleon` wordmark; center-left = `Transmutaciones` nav item (link to `/`); right cluster = `LanguageSelector` + `ThemeToggle`.
  - `ThemeToggle`: functional (sun/moon `IconButton`), toggles theme, `aria-label`, reflects current theme.
  - `LanguageSelector`: renders `EN / ES`, holds locale state (simple context or local state) — **full translation of copy is deferred to UI-4**. It must render and be operable, but you are NOT translating the app now.
- `Footer`: privacy line ("100% local. Tus archivos nunca salen de tu dispositivo." — Spanish copy is acceptable here as brand voice) + minimal credits/links.
- Wire `Header`/`Footer` into `app/layout.tsx` so every route gets the shell; page content renders in a semantic `<main>`.

### R6 — Preserve transmutation (do not regress)

- Refactor `app/page.tsx` so it renders **inside** the new shell and continues to work: drag/drop, click-to-select, `.jpg`/`.jpeg`/`.png` routing, worker call, auto-download, and the idle/processing/success/error states — all intact.
- You MAY restyle the existing dropzone block to use the new tokens and primitives (e.g. `Card`, `Button`, `Spinner`) for visual consistency, but **do NOT** build the full landing (Hero/PrivacyBanner/ToolGrid) — that is UI-2.
- **Do NOT** modify `useTransmutationWorker`, the Worker, the Worker protocol (§7.2), or the Wasm artifacts.

### R7 — Accessibility baseline

- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`.
- All icon-only controls have `aria-label`.
- Keyboard operable (theme toggle, language selector, dropzone trigger); visible `focus-visible` styles via accent.
- Respect `prefers-reduced-motion` for any transition.

### R8 — Verification

| Command | Must pass |
|---------|-----------|
| `npm run build` (in `/frontend`) | Production build succeeds |
| `npm run lint` (in `/frontend`) | No errors |
| Manual | Theme toggle persists across reload; no FOUC; dropzone still converts a `.jpg`/`.png` and downloads |

### R9 — SPEC amendment

Update `docs/SPEC.md`:
- §7.8: mark **UI-1 ✅ (delivered)** with the version.
- §7.4/§7.5/§7.7: update status notes from "Planned" to reflect what is now implemented (tokens, theme provider, primitives, header/footer shell). Leave UI-2..UI-5 as Planned.
- Bump SPEC **Version** and add an **Amendment Log** entry referencing `ui_1_design_system_foundation_done.md`.
- Bump `frontend/package.json` version accordingly.

**Do not** modify `docs/ROADMAP.md`.

---

CONSTRAINTS

- **Scope:** foundation only. No landing redesign, no per-tool routes, no i18n dictionaries, no search/mega-menu/sound/counter.
- **Backend untouched:** no Rust/Wasm/Worker/hook changes.
- **Transmutation must keep working** end-to-end (regression-critical).
- **Tokens are the single source of truth;** no hardcoded hex in components.
- **No heavy dependencies** (a minimal theme lib like `next-themes` is acceptable if justified; a `clsx`/`tailwind-merge` class utility is acceptable).
- Dark-first; light theme is a minimal variant of the same skin.
- English for all code, comments, and the report (UI copy may use the Spanish brand voice where specified).

---

DELIVERABLES

1. Token layer in `globals.css` (R1).
2. `ThemeProvider` + `useTheme` with no-FOUC strategy (R2).
3. Typography via `next/font` (R3).
4. `ui/` primitives (R4).
5. Layout shell `Header` + `Footer` wired into `app/layout.tsx` (R5).
6. Refactored `page.tsx` rendering inside the shell, transmutation intact (R6).
7. `docs/SPEC.md` amendments (R9).
8. `docs/reports/ui_1_design_system_foundation_done.md` per GOVERNANCE §5.

---

EXIT GATE (self-check before report)

- [ ] Dark and light themes both render from tokens; toggle works and persists; no FOUC.
- [ ] `ui/` primitives are token-driven, typed, and accessible (focus-visible, aria-labels).
- [ ] Header (logo + Transmutaciones + language + theme) and Footer render on every route.
- [ ] Existing dropzone still converts `.jpg`/`.jpeg`/`.png` and downloads — no regression.
- [ ] No backend/Worker/hook/Wasm changes.
- [ ] `npm run build` and `npm run lint` pass.
- [ ] SPEC §7 updated; version bumped; amendment logged.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
