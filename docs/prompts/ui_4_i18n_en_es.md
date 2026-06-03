SYSTEM DIRECTIVE: Act as a Senior Frontend Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§5.6.3**, **§7.1–§7.8**, **§8** NFRs) and `docs/ROADMAP.md` before any action.
All source code, comments, and technical report must be strictly in English.
Do not substitute the technology stack (Next.js App Router + TypeScript + Tailwind v4). Do not modify `docs/ROADMAP.md`.

> **PREREQUISITE:** This task depends on **UI-3 (v0.6.3)** — `TransmutationPanel`, `OptionsControls`, extended worker protocol, and populated `ToolRegistry` with `optionSpecs`. Confirm those deliverables exist before starting. **No Rust/Wasm/Worker changes in this task.**

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read SPEC §7.4 (brand voice: alchemical lexicon in both locales), §7.5 (component tree — `I18nProvider` + `lib/i18n/` planned), §7.7 (LanguageSelector already renders but locale is local-only), §7.8 (UI-4 scope).
2. Inventory every user-facing string in the frontend: layout shell, landing, tool cards, tool page, `TransmutationPanel`, `Dropzone`, `OptionsControls`, badges, aria-labels, root metadata. Note the current **ES/EN mix** (e.g. Hero/Footer in Spanish; panel error strings in English; registry descriptions mixed).
3. Design a **lightweight client-side i18n layer** mirroring the existing `ThemeProvider` pattern (context + hook + `localStorage` persistence). Do **not** introduce `[locale]` URL segments, `next-intl`, or server-side routing changes — those are post-MVP.
4. Decide how `ToolRegistry` stays the structural SSOT while **prose moves to dictionaries**: numeric bounds, RGB swatches, module mapping, and technical titles (`JPG → PNG`) stay in the registry; descriptions, hints, option labels/presets/end-labels resolve via i18n keys keyed by `tool.id`.
5. Plan `<html lang>` synchronization and a minimal no-flash strategy (inline script or immediate effect) analogous to theme FOUC prevention.
6. State assumptions (default locale, metadata strategy, backend error strings) in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `ui_4_i18n_en_es`
PHASE: UI track — UI-4 (Internationalization EN/ES)
OBJECTIVE: Deliver full bilingual UI (English + Spanish) via an `I18nProvider`, typed dictionaries, and wired `LanguageSelector` — covering all user-facing copy across landing, tool workspace, options, and layout — per SPEC §7.4/§7.7/§7.8.

---

CONTEXT

- **UI-3 (v0.6.3)** delivered: staged `TransmutationPanel`, declarative `OptionsControls`, worker options routing, landing card uniformity.
- **UI-1 (v0.6.1)** delivered: `LanguageSelector` with local `useState<"EN"|"ES">` defaulting to **ES** — switching does **nothing** today. `ThemeProvider` + inline no-FOUC script is the reference pattern for persistence.
- **Brand voice (both locales):** alchemical transmutation lexicon — "Transmutar", "Transmutaciones", "Transmutación completa" (ES) / "Transmute", "Transmutations", "Transmutation complete" (EN). Tool identifiers stay technical (`JPG → PNG`).
- **Privacy copy** must remain accurate and verifiable in both languages (NFR-1).
- **Backend/worker error strings** arrive in English from Rust (`String` errors). UI-4 should map known errors to localized messages where feasible; unknown errors may fall back to the raw English string with a note in the report.

---

SCOPE BOUNDARY

| In scope (UI-4) | Out of scope (defer) |
|-----------------|----------------------|
| `I18nProvider` + `useI18n()` / `t()` hook | `[locale]` URL routing |
| `lib/i18n/dictionaries/en.ts` + `es.ts` | `next-intl`, i18next, react-intl |
| Wire `LanguageSelector` to global locale | ICU plural rules / date-fns locale |
| All UI chrome + registry prose localized | Full a11y audit (UI-5) |
| `<html lang>` updates on locale change | Mega-menu, search, toast |
| Root layout metadata default locale | Locale-aware `generateMetadata` per route (note as gap) |
| Known backend error message mapping | Translating Rust test strings / logs |

---

REQUIREMENTS

### R1 — i18n infrastructure (`lib/i18n/` + `providers/I18nProvider.tsx`)

Create a minimal, typed i18n layer:

```typescript
// lib/i18n/types.ts
export type Locale = "en" | "es";
export type Dictionary = { /* nested string tree — mirror en.ts structure */ };
```

| File | Purpose |
|------|---------|
| `lib/i18n/types.ts` | `Locale`, `Dictionary` type (shared shape) |
| `lib/i18n/dictionaries/en.ts` | English dictionary (default export) |
| `lib/i18n/dictionaries/es.ts` | Spanish dictionary (same keys as `en`) |
| `lib/i18n/index.ts` | `getDictionary(locale)`, `DEFAULT_LOCALE`, `LOCALE_STORAGE_KEY` (`camaleon-locale`) |
| `providers/I18nProvider.tsx` | Context: `{ locale, setLocale, t, dictionary }` |
| `hooks/useI18n.ts` | Re-export or thin wrapper over context (throw if used outside provider) |

**`t()` API** — choose ONE approach and document it:

- **Recommended:** dot-path keys with type safety where practical, e.g. `t("landing.hero.title")`, optional interpolation `t("panel.processing", { fileName })` for `{fileName}` placeholders.
- Must support nested keys for tools: `t("tools.jpg-to-png.description")`, `t("tools.jpg-to-png.options.compression.presets.balanced")`.

**Persistence & default locale:**

- Mirror `ThemeProvider`: read `localStorage` on mount; if absent, default to **`es`** (matches current `LanguageSelector` default and brand-voice precedent).
- Optional: fall back to `navigator.language` only when no stored preference — document if used.

**Provider wiring:**

- Wrap app in `I18nProvider` inside `app/layout.tsx` (alongside `ThemeProvider` — order documented in report).
- Update `<html lang="...">` when locale changes (`document.documentElement.lang = locale`).
- Add a minimal inline script in `<head>` (like theme) to set `lang` from `localStorage` before paint if feasible.

### R2 — Wire `LanguageSelector` (`components/layout/LanguageSelector.tsx`)

- Remove isolated `useState`; consume `useI18n()` / `I18nProvider`.
- Display `EN` / `ES` buttons; map to `"en"` / `"es"` internally.
- Persist selection via provider's `setLocale`.
- Keep existing `aria-label` / `aria-current` behavior — localized via `t()`.

### R3 — Dictionary coverage (complete string inventory)

Replace **all** hardcoded user-facing strings. Minimum namespaces:

| Namespace | Examples (EN / ES) |
|-----------|-------------------|
| `meta` | Root title, description |
| `nav` | "Transmutaciones" / "Transmutations", main nav aria |
| `lang` | Language switch aria-labels |
| `theme` | Theme toggle aria-labels (dark ↔ light) |
| `footer` | Privacy line, version line pattern |
| `landing.hero` | Headline + tagline |
| `landing.privacy` | Privacy banner |
| `landing.tools` | Section headings ("Available transmutations", "Coming soon") |
| `badges` | Lossless / lossy / soon |
| `toolCard` | "Transmutar" affordance |
| `dropzone` | Idle, drag-over, processing, file-select aria |
| `panel` | Staged actions (Transmutar, Replace file), processing, success (Tamaño/Size, Descargar/Download, Transmutar otro/Transmute another), error (title, Adjust & retry, Start over), engine status, extension error |
| `tools.{id}` | Per active + soon tool: `description`, `fidelityHint`, and for each option key under `options.{key}`: `label`, `hint`, `lowerLabel`, `upperLabel`, `presets.{name}` |
| `errors` | Known backend/worker error substring → localized message map |

**Technical titles** (`JPG → PNG`, `PNG → JPG`, `WebP → PNG`) may remain in the registry as locale-neutral identifiers — do not translate format arrows.

**Spanish brand voice:** preserve alchemical tone; do not literal-translate to awkward phrasing. English should be clear and concise, not overly formal.

### R4 — Refactor `ToolRegistry` for i18n (`lib/tools/tool-registry.ts` + consumers)

Structural data stays in `TOOLS[]`:

- `id`, `slug`, `title` (format arrow), `fromFormat`, `toFormat`, `module`, `category`, `fidelity`, `status`, `acceptExtensions`, `outputExtension`
- `optionSpecs`: keep `kind`, `key`, numeric `min`/`max`/`step`/`defaultValue`, preset **values** (numbers), swatch **RGB values**, `allowCustom`

**Remove prose from registry** — replace string fields with i18n key paths OR resolve at render time via `tool.id`:

- Remove from registry (or stop rendering directly): `description`, `fidelityHint`, option `label`/`hint`/`lowerLabel`/`upperLabel`, preset `label`, swatch `label`
- Add helper `lib/i18n/tool-copy.ts` (or similar):

```typescript
export function getToolStrings(tool: ToolDefinition, t: TranslateFn): ResolvedToolStrings;
export function getOptionSpecStrings(toolId: string, spec: ToolOptionSpec, t: TranslateFn): ResolvedOptionStrings;
```

Update consumers: `ToolCard`, `ToolGrid`, `TransmutationPanel`, `OptionsControls`, `app/transmute/[slug]/page.tsx` (description/hint under title if shown).

Update `ToolOptionSpec` types in `lib/tools/types.ts` to reflect structural-only specs (document breaking change in report + SPEC §7.5).

### R5 — Component migration

Convert or wrap components that display copy so they use `useI18n()`:

| Component | Action |
|-----------|--------|
| `Header.tsx` | Nav label via `t()` |
| `Footer.tsx` | Privacy + version via `t()` — version number stays `0.6.4` after bump |
| `Hero.tsx` | Use `t()` — likely `"use client"` |
| `PrivacyBanner.tsx` | Use `t()` |
| `ToolGrid.tsx` | Section headings via `t()` |
| `ToolCard.tsx` | Badges, affordance, tool strings via helper |
| `Dropzone.tsx` | Default labels + aria via props from parent OR internal `t()` |
| `TransmutationPanel.tsx` | All panel copy + pass localized dropzone labels |
| `OptionsControls.tsx` | Resolve option strings via helper; localize aria ("Custom background color", preset group labels) |
| `ThemeToggle.tsx` | Localized aria-labels |
| `app/layout.tsx` | `I18nProvider`, default `lang`, metadata from default locale |
| `app/transmute/[slug]/page.tsx` | Tool description/hint from i18n (page may need a small client sub-component for dynamic copy, or accept SSR default-locale for static shell + client hydrate — document choice) |

**Do not break:** theme toggle, worker init, transmutation flow, options wiring, card layout from UI-3.

### R6 — Metadata & HTML lang

- `app/layout.tsx` `metadata`: use **English** as static export default OR document that SSG metadata reflects `DEFAULT_LOCALE` (`es`) — pick one, state in report. Full per-locale metadata deferred.
- Client-side: sync `<html lang>` with active locale.
- Do **not** add `[locale]` route segments.

### R7 — Error message localization (best-effort)

Create `lib/i18n/errors.ts`:

- Map common worker/backend error substrings (empty input, wrong format, size limit, dimension limit) to `errors.*` keys.
- `TransmutationPanel` (or hook) passes errors through mapper before display.
- Unmapped errors: show raw English + log in report as follow-up.

### R8 — Verification

| Check | Must pass |
|-------|-----------|
| `npm run build` | Production build succeeds |
| Language toggle EN | All listed namespaces render English; `<html lang="en">` |
| Language toggle ES | All listed namespaces render Spanish; `<html lang="es">` |
| Persistence | Reload retains selected locale (localStorage) |
| E2E JPG→PNG | Stage → options labels in active locale → Transmutar → result strings localized |
| E2E PNG→JPG | Quality + background labels/swatches localized; conversion still works |
| Regression | Theme toggle, worker, Wasm, options effect, card heights, privacy model unchanged |
| No hardcoded UI prose | Grep audit — no user-facing literals left outside dictionaries (except locale-neutral `JPG → PNG`, version numbers, file names, byte numbers) |

### R9 — Version & SPEC amendment

Bump to **v0.6.4**:

- `frontend/package.json` and `Footer` version string.
- `README.md` header version (align with prior architect commits).

Update `docs/SPEC.md`:

- **§7.5:** mark `I18nProvider` ✅, `lib/i18n/` dictionaries ✅; document i18n key convention for tool copy; update `ToolOptionSpec` if structural-only.
- **§7.7:** LanguageSelector — full i18n wired ✅.
- **§7.8:** mark **UI-4 ✅** (v0.6.4); note UI-5 = a11y/responsive sign-off.
- Bump SPEC version + status line; Amendment Log → `ui_4_i18n_en_es_done.md`.

**Do not** modify `docs/ROADMAP.md`.

### R10 — Report follow-ups

In "Known Gaps / Follow-ups", list:

- Locale-aware `generateMetadata` / `[locale]` routing (post-MVP)
- Remaining untranslated backend error strings
- UI-5 items surfaced (e.g. ToolCard affordance hover-only visibility, keyboard sign-off)
- Any strings intentionally kept locale-neutral

---

CONSTRAINTS

- **No Rust/Wasm/Worker/hook protocol changes** — UI and i18n layer only.
- **No new npm i18n dependencies** unless Chief Architect pre-approved (default: zero deps — roll our own thin layer).
- **Registry remains structural SSOT** — do not duplicate tool/module mapping in dictionaries.
- **Both dictionaries must have identical key trees** — missing key should fail type-check or build-time assertion.
- **Preserve privacy model** (NFR-1) — localized copy must not imply server upload.
- **Preserve StripAll** and transmutation behavior — i18n is presentation-only.
- English for code, comments, report; dictionaries hold UI copy only.

---

DELIVERABLES

1. `lib/i18n/` dictionaries + types + helpers (R1).
2. `I18nProvider` + `useI18n` wired in layout (R1, R5).
3. `LanguageSelector` connected to global locale (R2).
4. Full EN/ES string coverage per inventory (R3).
5. Registry refactor + tool/option string helpers (R4).
6. All components migrated (R5).
7. Error mapping best-effort (R7).
8. `docs/SPEC.md` amendments (R9).
9. `docs/reports/ui_4_i18n_en_es_done.md` per GOVERNANCE §5 (incl. R10 follow-ups).

---

EXIT GATE (self-check before report)

- [ ] Switching EN ↔ ES updates **all** user-facing copy (landing, header, footer, tools, panel, options, badges, aria-labels).
- [ ] Locale persists across reload; `<html lang>` matches active locale.
- [ ] ToolRegistry holds structure only; prose resolves from dictionaries.
- [ ] Transmutation flow + options still change output correctly (regression).
- [ ] No backend/Wasm changes; privacy copy accurate in both languages.
- [ ] `npm run build` passes.
- [ ] SPEC §7.5/§7.7/§7.8 updated; version bumped to 0.6.4; amendment logged.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
