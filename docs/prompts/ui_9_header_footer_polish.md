SYSTEM DIRECTIVE: Act as a Senior Frontend Engineer for the Camaleon project.
Read **in full** before any action:
- `docs/SPEC.md` (§7.4 identity, §7.5 component tree, §7.7 header anatomy)
- `docs/planning/v1_6_0_header_footer_polish_plan.md` (this task's architecture bible)
- `docs/GOVERNANCE.md` §3–§5 (cognitive directive + report format)

All source code, comments, and the technical report must be strictly in **English**.
Do not substitute the technology stack. **Do not add new npm dependencies.**
Do not modify `docs/ROADMAP.md`. **Do not change Rust/Wasm/worker transmutation logic.**

> **PREREQUISITE:** v1.5.0 present. Confirm `cd frontend && npm run build` passes **before** starting.
> Chief Architect has flagged prior OpenCode deliveries as **incomplete** (wiring skipped, hardcoded values, i18n missing). This prompt is **zero-tolerance** for silent partial work.

---

## COGNITIVE DIRECTIVE — THINK BEFORE ACTING (MANDATORY)

Before writing or modifying **any** file:

1. Read the planning doc **end-to-end** (§3 architecture decisions + §5 file manifest + §6 exit gate).
2. List **every** deliverable ID (P1.1–P3.3). Draft a checklist. Do not start coding until the checklist exists in your notes.
3. Identify **execution order** to avoid rework:
   - `TransmutationWorkerProvider` **before** Footer engine pill
   - `lib/site.ts` **before** Footer version
   - `globals.css` `.glass-header` **before** Header class application
   - i18n keys **before** components that reference them
4. After **each** phase (P1, P2, P3), run `npm run build` and fix errors before proceeding.
5. Self-audit against §6 exit gate. If **any** item fails, status = `partial` — list gaps explicitly.
6. **Never** mark `status: done` with known missing P1–P3 items.

Document key decisions in the report §3.

---

## ANTI-PATTERNS — DO NOT REPEAT PRIOR FAILURES

| Failure mode | Required behavior |
|--------------|-------------------|
| Hardcoded version `"1.5.0"` in Footer | Import `APP_VERSION` from `lib/site.ts` |
| UI strings only in one language | Every new key in **both** `en.ts` and `es.ts` |
| Provider created but not wired in `layout.tsx` | Provider must wrap app; hook must consume context |
| Multiple Web Workers | **One** `workerRef` in provider; grep for `new Worker` — must be single occurrence |
| Breadcrumb with `if (tool.id === ...)` | Registry lookup via `TOOLS` + `resolveToolActionTitle` only |
| Glass header as strong as Command Palette | `.glass-header` blur **12px** / saturate **150%** — palette stays 24px / 200% |
| Shortcuts modal without Esc close | Native `<dialog>` + backdrop click + documented in report |
| Skipping SPEC update | Amend §7.7 + add §7.9 Footer anatomy |
| Dumping code in chat | Report path + one-paragraph summary only |

---

TASK ID: `ui_9_header_footer_polish`
PHASE: Frontend v1.6.0 — UI-9 Header & Footer visual polish
OBJECTIVE: Elevate Header and Footer to the same premium visual identity as Command Palette and MetricsPanel; deliver **all** P1–P3 items in one pass.

---

## PHASE P1 — HIGH PRIORITY (BLOCKING)

### P1.1 — Footer 3-zone layout + trust pill

Rewrite `components/layout/Footer.tsx`:

```
[Zone 1: trust pill]     [Zone 2: GitHub + Shortcuts]     [Zone 3: version · MIT + engine]
```

- Zone 1: reuse lock SVG from `PrivacyBanner.tsx` (copy markup, do not import PrivacyBanner — layout layer stays independent)
- Pill: `inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3 py-1 text-xs text-accent`
- Copy: `t("footer.privacy")` (existing key) — truncate gracefully on mobile (`truncate` / `min-w-0`)
- Responsive: `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`
- **Fixed min-height** on footer inner container to prevent layout jump

### P1.2 — Dynamic version

Create `frontend/src/lib/site.ts`:

```typescript
import packageJson from "../../package.json";

export const APP_VERSION = packageJson.version;
export const SITE_REPO_URL = "https://github.com/gator/camaleon";
```

- Enable `resolveJsonModule` in `tsconfig.json` if needed
- Footer zone 3: `t("footer.version", { version: APP_VERSION })` — update i18n if key shape differs
- **Grep** codebase after work: zero matches for hardcoded `"1.5.0"` in `Footer.tsx`

### P1.3 — Header active state (Command Palette open)

In `Header.tsx`, when `open === true` on palette trigger:

```tsx
open
  ? "bg-accent-subtle text-accent ring-1 ring-accent/20"
  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
```

- `aria-expanded={open}` must remain
- Visual change must be **obvious** in dark and light themes

### P1.4 — Contextual breadcrumb on `/transmute/[slug]`

In `Header.tsx`:

- `usePathname()` from `next/navigation`
- Match `/transmute/[slug]` → lookup `TOOLS.find(t => t.slug === slug)`
- Render between logo and nav (or after logo block):

```
Camaleon  /  {actionTitle}  ·  {fromFormat} → {toFormat}
```

- `actionTitle` = `resolveToolActionTitle(tool.id, t)`
- Format segment: `font-mono text-xs text-text-muted`
- On `/` or unknown slug: **no breadcrumb** (no error UI)
- **Zero** per-tool `if (tool.id === "png-to-jpg")` branches

**P1 gate:** `npm run build` passes. All P1 items verifiable.

---

## PHASE P2 — MEDIUM PRIORITY (REQUIRED IN SAME DELIVERY)

### P2.1 — Glass subtle header

Add to `globals.css`:

```css
.glass-header { /* per plan §3.6 — 12px blur, 75% bg-base */ }
.light .glass-header { /* light variant */ }
```

Apply `glass-header` to `<header>` element. Keep `sticky top-0 z-50 border-b border-border`.

### P2.2 — Utility cluster (EN/ES + theme)

Group `LanguageSelector` + `ThemeToggle` in bordered cluster per plan §3.7.

- Adjust `LanguageSelector` padding if needed — buttons must fit inside cluster
- Optional extract `UtilityCluster.tsx` — if Header exceeds ~120 lines

### P2.3 — GitHub link in footer

Zone 2: external link to `SITE_REPO_URL`

```tsx
<a href={SITE_REPO_URL} target="_blank" rel="noopener noreferrer" …>
  {t("footer.github")}
</a>
```

- Style: `text-xs text-text-muted hover:text-accent transition-colors`
- `aria-label` includes "opens in new tab" semantics via visible text sufficient

**P2 gate:** `npm run build` passes.

---

## PHASE P3 — LOW PRIORITY (REQUIRED IN SAME DELIVERY — NOT OPTIONAL)

### P3.1 — Logo mark redesign

Replace inline SVG in `Header.tsx` with minimal **chameleon** mark:

- Single-color `text-accent`, readable at 28×28
- Alchemical / chameleon narrative (SPEC §7.4) — not a generic refresh icon
- `aria-hidden="true"` on SVG; link `aria-label` or visible "Camaleon" text satisfies a11y

### P3.2 — Global Wasm engine status in footer

**Step 1 — Provider (mandatory):**

Create `providers/TransmutationWorkerProvider.tsx`:

- Move Worker instantiation from `useTransmutationWorker.ts` into provider
- Expose `{ ready, transmutate, estimate }` via React context
- Single `workerRef`, single `useEffect` mount

**Step 2 — Refactor consumers:**

- `hooks/useTransmutationWorker.ts` → thin context consumer (throws helpful error if missing provider)
- `app/layout.tsx` → wrap `<TransmutationWorkerProvider>` inside existing providers (order: I18n → Theme → **Worker** → Toast)
- Update `TransmutationPanel.tsx` (and `TransmutationDropzone.tsx` if it uses the hook)

**Step 3 — Footer pill:**

- Small status: green dot (`bg-accent`) when `ready`, muted animated dot when not
- Labels: `t("footer.engineReady")` / `t("footer.engineInit")`
- Place in zone 3 near version — do not wrap to second line on desktop

**Verification:** In report, state Worker count = 1. Grep `new Worker` — single file.

### P3.3 — Keyboard shortcuts modal

Create `components/layout/KeyboardShortcutsDialog.tsx`:

- Native `<dialog>` with backdrop (pattern from `CommandPalette.tsx`)
- Props: `open: boolean`, `onClose: () => void`
- Rows: Open transmutations (`⌘K` or `Ctrl+K`), Close (`Esc`)
- OS detection client-side for modifier label
- Footer zone 2 link `t("footer.shortcuts")` toggles dialog
- i18n keys per plan §4

**P3 gate:** `npm run build` passes. All P3 items verifiable.

---

## i18n — BOTH LOCALES (BLOCKING)

Add to `en.ts` and `es.ts`:

```typescript
footer: {
  github: "...",
  shortcuts: "...",
  shortcutsTitle: "...",
  shortcutOpenPalette: "...",
  shortcutClose: "...",
  engineReady: "...",
  engineInit: "...",
  // privacy + version keys — reuse or extend existing footer.* keys
}
```

**Grep** for new `t("footer.` keys — every key must exist in **both** dictionaries.

---

## VERSION & SPEC (BLOCKING)

1. Bump `frontend/package.json` version → **1.6.0**
2. Amend `docs/SPEC.md`:
   - §7.7 Header Anatomy — add rows: glass shell, active trigger, breadcrumb, logo mark, utility cluster
   - **New §7.9 Footer Anatomy** — 3-zone layout, trust pill, engine status, shortcuts, dynamic version
   - Version history row for v1.6.0
3. Update `docs/SPEC.md` component tree §7.5: `TransmutationWorkerProvider`, `KeyboardShortcutsDialog`, `lib/site.ts`

---

## REQUIREMENTS SUMMARY

| ID | Requirement |
|----|-------------|
| R1 | Footer 3-zone + trust pill — no layout shift |
| R2 | `APP_VERSION` from package.json — never hardcoded |
| R3 | Header palette trigger active visual state |
| R4 | Registry-driven breadcrumb on transmute routes |
| R5 | `.glass-header` subtler than `.glass-palette` |
| R6 | Utility cluster groups locale + theme |
| R7 | GitHub link → `SITE_REPO_URL` |
| R8 | Chameleon logo mark SVG |
| R9 | Single Worker via provider; footer engine pill |
| R10 | Keyboard shortcuts dialog from footer |
| R11 | EN + ES for all new strings |
| R12 | `npm run build` pass; package **1.6.0**; SPEC updated |

---

## CONSTRAINTS

- No Rust/Wasm changes.
- No new npm dependencies (no Framer Motion, no Radix, no icon packs).
- No hardcoded hex — design tokens only.
- English for code, comments, report.
- Do not modify `docs/ROADMAP.md`.
- Do not break Command Palette ⌘K / Ctrl+K (verify `useCommandPalette` still works).

---

## DELIVERABLES (ALL REQUIRED)

1. `frontend/src/lib/site.ts`
2. `frontend/src/providers/TransmutationWorkerProvider.tsx`
3. `frontend/src/hooks/useTransmutationWorker.ts` (refactored)
4. `frontend/src/components/layout/Footer.tsx` (rewritten)
5. `frontend/src/components/layout/Header.tsx` (enhanced)
6. `frontend/src/components/layout/KeyboardShortcutsDialog.tsx`
7. `frontend/src/components/layout/UtilityCluster.tsx` (if extracted)
8. `frontend/src/app/globals.css` (`.glass-header`)
9. `frontend/src/app/layout.tsx` (provider wrap)
10. `frontend/src/lib/i18n/dictionaries/en.ts` + `es.ts`
11. `frontend/package.json` → 1.6.0
12. `docs/SPEC.md` amended
13. `docs/reports/ui_9_header_footer_polish_done.md`

---

## EXIT GATE — SELF-CHECK BEFORE REPORT

Copy this checklist into report §4. **Every box must be `[x]` for `status: done`.**

```
P1
[ ] Footer 3-zone layout renders on / and /transmute/*
[ ] Trust pill uses lock icon + accent-subtle (matches PrivacyBanner language)
[ ] Footer height stable — no jump when engine state changes
[ ] Version string matches package.json 1.6.0 — not hardcoded
[ ] Header "Transmutaciones" visually distinct when palette open
[ ] Breadcrumb on /transmute/jpg-to-png and /transmute/png-to-jpg
[ ] No breadcrumb on /

P2
[ ] .glass-header on header — visibly softer than Command Palette
[ ] EN/ES + theme grouped in utility cluster
[ ] GitHub link opens SITE_REPO_URL in new tab

P3
[ ] New chameleon logo SVG in header
[ ] grep "new Worker" → exactly 1 occurrence (provider only)
[ ] Footer engine pill reflects ready true/false
[ ] Shortcuts modal opens from footer; Esc closes
[ ] OS-appropriate ⌘K vs Ctrl+K label in modal

Global
[ ] All new t("footer.*") keys in EN + ES
[ ] npm run build — exit 0
[ ] Command Palette still works (click + keyboard)
[ ] TransmutationPanel transmute flow unchanged
[ ] SPEC §7.7 + §7.9 updated
[ ] No hardcoded "1.5.0" in Footer
```

---

## REPORT FORMAT (GOVERNANCE §5)

**Filename:** `docs/reports/ui_9_header_footer_polish_done.md`

**Status rules:**

- `done` — all exit gate items checked, build passes
- `partial` — any P1–P3 item missing; list each gap in §6 with reason
- `blocked` — cannot proceed; explain blocker

Required sections: Pre-Execution Analysis, Work Performed (file list), Architectural Decisions, Verification Results (include `npm run build` output summary), SPEC Amendments, Known Gaps, Deviations.

Include in §2: **Worker instance count verification** (grep result).

---

## EXECUTION OUTPUT

Do **NOT** dump raw code in chat.

Submit **only**:

1. Path to completed report: `docs/reports/ui_9_header_footer_polish_done.md`
2. One-paragraph summary (status, build result, any gaps)

If you cannot complete P1–P3, you **must** use `status: partial` and enumerate unfinished IDs — never claim `done` with silent omissions.
