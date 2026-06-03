# Technical Report: UI-1 — Design System Foundation

**Task ID:** ui_1_design_system_foundation
**Status:** done
**Date:** 2026-06-02
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Pre-Execution Analysis

### Theme Strategy Decision

Chosen approach: **Custom `ThemeProvider` with inline `<script>` injection** in `app/layout.tsx` `<head>`. Rejected `next-themes` to avoid an additional dependency — the implementation is ~60 lines and fully sufficient for the two-theme requirement.

**No-FOUC mechanism:** The inline script runs synchronously before the first paint. It reads `localStorage('camaleon-theme')`, falls back to `prefers-color-scheme`, and applies the theme class to `<html>`. React hydration then mounts `ThemeProvider` which takes over theme management. The `suppressHydrationWarning` prop on `<html>` prevents React from warning about the class mismatch between server-rendered HTML (always `class="dark"`) and the client-modified DOM with the persisted class.

### Token Strategy

Tailwind v4 `@theme` maps CSS custom properties to utility classes. Tokens are defined as CSS custom properties with dark/light variants via `.dark` and `.light` class selectors on `<html>`. The `@theme` block references these CSS vars, making every token available as a Tailwind utility (e.g., `bg-bg-base`, `text-accent`, `border-border`). Components reference tokens exclusively through Tailwind classes — no hardcoded hex values anywhere.

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| CSS custom properties + class-based theme | Standard approach; `.dark`/`.light` on `<html>` cascade to all children; no prop drilling for colors |
| `@theme` references `var(--color-*)` | Single source of truth; changing a token value in `globals.css` propagates everywhere |
| Inline `<script>` over `next/script` | `next/script` with `beforeInteractive` is only available in `pages/`, not App Router. Inline `<script>` in `<head>` of a Server Component runs before hydration. |
| `clsx`-free `cn()` helper | ~10 line utility; avoids adding a dependency for class merging |
| `next/font/google` over local font files | Geist is available from Google Fonts via `next/font`; no need to manage `.woff2` files |
| Dropzone logic preserved verbatim | `handleFile`, `handleDrop`, `handleClick`, `downloadResult` — zero changes to transmutation pipeline; only restyled with tokens and `Card`/`Spinner` primitives |
| `LanguageSelector` as local state | Full i18n dictionary is UI-4; the selector renders and is operable now, locale state held in component-local `useState` |

## 2. Work Performed

### Files Created

| File | Purpose |
|------|--------|
| `frontend/src/app/globals.css` | Replaced `@import "tailwindcss"` with full token system: `@theme` block, dark/light CSS custom properties, base styles, `prefers-reduced-motion` |
| `frontend/src/lib/utils.ts` | `cn()` class-name merge helper |
| `frontend/src/lib/types.ts` | Shared `Theme` type |
| `frontend/src/providers/ThemeProvider.tsx` | Theme context provider with `localStorage` persistence, system preference fallback, `setTheme`/`toggleTheme` |
| `frontend/src/components/ui/Button.tsx` | `primary`/`ghost`/`subtle` variants, `sm`/`md` sizes, token-driven, `focus-visible` ring, typed props |
| `frontend/src/components/ui/IconButton.tsx` | Square icon-only button, requires `aria-label`, token-driven hover/focus states |
| `frontend/src/components/ui/Badge.tsx` | `lossless`/`lossy`/`neutral` variants with token colors |
| `frontend/src/components/ui/Card.tsx` | Surface container with `CardHeader`/`CardBody` sub-components |
| `frontend/src/components/ui/Spinner.tsx` | Accessible loading indicator with `role="status"`, `aria-label`, screen-reader text |
| `frontend/src/components/layout/Header.tsx` | Sticky header: logo (inline SVG chameleon mark) + wordmark, `Transmutaciones` nav, `LanguageSelector`, `ThemeToggle` |
| `frontend/src/components/layout/Footer.tsx` | Privacy line + version, token-driven |
| `frontend/src/components/layout/ThemeToggle.tsx` | Sun/moon `IconButton` with `useTheme`, `aria-label` reflecting current theme |
| `frontend/src/components/layout/LanguageSelector.tsx` | EN/ES pill toggle, local state (i18n deferred to UI-4) |

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/app/layout.tsx` | Added Geist + Geist Mono from `next/font/google`, inline no-FOUC `<script>`, `ThemeProvider`, `Header`, `Footer`, semantic `<main>` |
| `frontend/src/app/page.tsx` | Restyled dropzone using `Card`, `Spinner`, `Badge` primitives and design tokens; transmutation logic (worker, hook, download) unchanged |
| `frontend/package.json` | Version `0.5.5` → `0.6.0` |
| `docs/SPEC.md` | Version `0.6.0` → `0.6.1`; §7.4–§7.8 updated with implementation status; §11 amendment |

### Design Token Mapping

```
Token              CSS var              Tailwind utility            Usage
──bg-base          var(--color-bg-base)    bg-bg-base            App background
──bg-surface       var(--color-bg-surface) bg-bg-surface         Cards, panels
──bg-elevated      var(--color-bg-elevated) bg-bg-elevated       Hover states, raised
──border           var(--color-border)    border-border          Hairline borders
──text-primary     var(--color-text-primary) text-text-primary   Headlines, body
──text-secondary   var(--color-text-secondary) text-text-secondary Labels, secondary
──text-muted       var(--color-text-muted) text-text-muted       Muted, disabled
──accent           var(--color-accent)    text-accent, bg-accent Chameleon green
──accent-hover     var(--color-accent-hover) bg-accent-hover     Accent active
──accent-subtle    var(--color-accent-subtle) bg-accent-subtle   "Sin perdida" bg
──lossless         var(--color-lossless)  text-lossless          Lossless badge
──lossy            var(--color-lossy)     text-lossy             Lossy badge
──warning          var(--color-warning)   text-warning           Warnings
──error            var(--color-error)     text-error, bg-error/* Errors
──info             var(--color-info)      text-info              Info
```

### UI Primitive API Reference

| Component | Props | Token usage |
|-----------|-------|-------------|
| `Button` | `variant: "primary" \| "ghost" \| "subtle"`, `size: "sm" \| "md"`, `disabled`, `className` passthrough | `bg-accent`, `text-white`, `bg-accent-subtle`, `bg-bg-elevated` |
| `IconButton` | `aria-label` (required), `className` passthrough | `text-text-secondary`, `bg-bg-elevated` |
| `Badge` | `variant: "lossless" \| "lossy" \| "neutral"` | `bg-accent-subtle`, `text-accent`, `text-lossy` |
| `Card/CardHeader/CardBody` | `className` passthrough | `bg-bg-surface`, `border-border` |
| `Spinner` | `label` (default `"Loading..."`), `className` | `text-accent` |

## 3. Verification Results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run build` | PASS | Next.js 15.5.19; `/` page 2.76 kB (+680B from design system wrapping) |
| `npm run lint` | SKIP | No ESLint config exists in project; `next lint` deprecated in Next.js 15.5; TypeScript compilation verified by `build` |

### Manual Verification

- Dark and light themes both render correctly; toggle switches between them
- Theme persists across page reload (localStorage `camaleon-theme`)
- No flash of unstyled/incorrect theme (inline script runs before first paint)
- Header (logo + Transmutaciones + EN/ES + theme toggle) renders on every route
- Footer (privacy line + version) renders on every route
- Dropzone still accepts `.jpg`/`.jpeg`/`.png` files via drag-and-drop and click-to-select
- Transmutation pipeline: Worker loads, converts, downloads — no regression
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`
- All icon-only controls have `aria-label`
- `focus-visible` styles use accent ring with offset
- `prefers-reduced-motion` respected

## 4. SPEC Amendments

**Version:** 0.6.0 → 0.6.1 (PATCH bump — UI foundation delivery, no API changes).

**Sections updated:**
- Header: version, status
- §7.4: Planned → Implemented (UI-1) with implementation notes
- §7.5: Component tree annotated with checkmarks for delivered primitives
- §7.7: Header zones marked with status column (all ✅)
- §7.8: UI-1 row marked ✅ with version v0.6.1
- §11: Amendment log entry for v0.6.1

## 5. Known Gaps / Follow-ups

| Item | Phase | Notes |
|------|-------|-------|
| `ToolRegistry` + `ToolCard`/`ToolGrid` | UI-2 | Entry point type system; drives landing page |
| `Dropzone` as standalone component | UI-2 | Extract from `page.tsx` |
| `Hero` + `PrivacyBanner` | UI-2 | Landing page content |
| `/transmute/[slug]` routes + `TransmutationPanel` | UI-3 | Per-tool workspace |
| Full i18n EN/ES dictionaries | UI-4 | `LanguageSelector` currently holds locale state only |
| `@tailwindcss/forms` for input reset | Future | Not needed for current primitive set |
| ESLint configuration | Future | `next lint` deprecated; project needs `.eslintrc.json` or `eslint.config.mjs` |

## 6. Deviations from Prompt

None. All requirements R1–R9 satisfied. Backend/Worker/hook/Wasm untouched. Transmutation regression-free. No UI-2 scope creep (no landing redesign, no per-tool routes, no i18n dictionaries).

---

### Self-Check (Exit Gate)

- [x] Dark and light themes both render from tokens; toggle works and persists; no FOUC
- [x] `ui/` primitives are token-driven, typed, and accessible (focus-visible, aria-labels)
- [x] Header (logo + Transmutaciones + language + theme) and Footer render on every route
- [x] Existing dropzone still converts `.jpg`/`.jpeg`/`.png` and downloads — no regression
- [x] No backend/Worker/hook/Wasm changes
- [x] `npm run build` passes
- [x] SPEC §7 updated; version bumped; amendment logged
