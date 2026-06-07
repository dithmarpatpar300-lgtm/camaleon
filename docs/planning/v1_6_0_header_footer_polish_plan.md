# v1.6.0 — Header & Footer Visual Polish (UI-9)

> **Author:** Chief Architect (Cursor)  
> **Date:** 2026-06-07  
> **Status:** Planned — ready for OpenCode execution  
> **Target release:** Frontend **v1.6.0** (engine stays **v1.2.0** — no Rust/Wasm changes)  
> **Builds on:** v1.5.0 (metrics UX, result cache, Command Palette glass identity)  
> **Executable prompt:** `docs/prompts/ui_9_header_footer_polish.md`

---

## 1. Context & Trigger

Post-v1.5.0 UX review: **Command Palette**, **MetricsPanel**, and **result view** now share a premium visual language (glass, badges, mono technical data, accent-subtle pills). **Header** and **Footer** remain at UI-1 foundation level — functional but visually disconnected.

| Zone | Current state | Target |
|------|---------------|--------|
| Header | Flat bar, generic logo, no active trigger state, no tool context | Glass shell, active palette trigger, contextual breadcrumb on tool routes |
| Footer | Two muted text lines; version hardcoded | 3-zone trust footer; dynamic version; GitHub + shortcuts |
| Global | Engine status only inside `TransmutationPanel` | Shared worker provider + footer engine pill |

**Brand anchor (SPEC §7.4):** "Verde Camaleón" — dark-first minimalism, accent green used sparingly, alchemical transmutation voice, verifiable privacy (NFR-1).

---

## 2. Scope

**Frontend-only.** No Rust/Wasm crate changes. No new npm dependencies.

| Priority | ID | Deliverable |
|----------|-----|-------------|
| **P1 — High** | P1.1 | Footer: 3-zone layout + trust pill (lock icon, accent-subtle) |
| | P1.2 | Footer: dynamic version from `package.json` (never hardcoded) |
| | P1.3 | Header: visual active state when Command Palette open |
| | P1.4 | Header: contextual breadcrumb on `/transmute/[slug]` (registry-driven) |
| **P2 — Medium** | P2.1 | Header: subtle glass treatment (lighter than Command Palette) |
| | P2.2 | Header: refined utility cluster (EN/ES + theme grouped) |
| | P2.3 | Footer: GitHub link (MIT repo) |
| **P3 — Low** | P3.1 | Header: logo mark redesign (chameleon narrative, minimal SVG) |
| | P3.2 | Footer: global Wasm engine status indicator |
| | P3.3 | Footer: keyboard shortcuts modal (trigger from footer) |

**All P1–P3 ship in a single OpenCode pass.** Partial delivery is unacceptable without `status: partial` and explicit gap list.

---

## 3. Architecture Decisions

### 3.1 Visual language inheritance

Reuse existing tokens and patterns — do **not** invent a third style:

| Pattern | Source | Apply to |
|---------|--------|----------|
| `glass-palette` (backdrop blur, `border-white/8`) | `globals.css` + Command Palette | Header shell (reduced intensity) |
| Trust pill (`bg-accent-subtle`, lock SVG) | `PrivacyBanner.tsx` | Footer zone 1 |
| Badge / pill typography | `Badge.tsx`, MetricsPanel delta pills | Footer trust + engine status |
| `uppercase tracking-widest text-xs` section labels | Command Palette | Shortcuts modal header |
| `font-mono tabular-nums` | SPEC §7.4 | Version, format slug, shortcut keys |

### 3.2 Footer — 3-zone layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [🔒 100% local · …]          [GitHub] [Atajos]          [v1.6.0 · MIT] │
│  trust pill (flex-1 min-w-0)   center links (shrink-0)    mono meta      │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Mobile:** stack vertically (`flex-col gap-3 sm:flex-row`) — trust pill full width; links + meta on second row.
- **No layout shift:** reserved min-height; trust pill always present (not conditionally mounted).
- **Engine pill (P3.2):** small dot + label inline with meta zone OR adjacent to trust — must not duplicate long copy.

### 3.3 Dynamic version

```typescript
// frontend/src/lib/site.ts (new)
import packageJson from "../../package.json";
export const APP_VERSION = packageJson.version;
export const SITE_REPO_URL = "https://github.com/gator/camaleon"; // single source
```

- `Footer.tsx` imports `APP_VERSION` — **never** literal `"1.5.0"`.
- Enable `resolveJsonModule` in `tsconfig.json` if not already present.

### 3.4 Header — active Command Palette trigger

When `open === true`:

```tsx
className={cn(
  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
  open
    ? "bg-accent-subtle text-accent ring-1 ring-accent/20"
    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
  ...
)}
```

Mobile: show grid/search icon when `⌘K` kbd hidden (`sm:hidden`).

### 3.5 Header — contextual breadcrumb (registry-driven)

On `/transmute/[slug]`:

```
[Logo Camaleon]  /  Comprimir para Web  ·  PNG → JPG     [Transmutaciones ⌘K]  …
```

Implementation:

- `usePathname()` in `Header.tsx`
- Parse slug → `TOOLS.find(t => t.slug === slug)`
- `resolveToolActionTitle(tool.id, t)` + `tool.fromFormat → tool.toFormat` in mono
- On `/`: no breadcrumb (unchanged)
- **Scalable:** zero per-tool `if` branches — registry + i18n only

### 3.6 Header — glass shell

New utility in `globals.css`:

```css
.glass-header {
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  background-color: rgba(14, 15, 17, 0.75); /* --bg-base @ 75% */
}
.light .glass-header {
  background-color: rgba(250, 250, 250, 0.82);
}
```

Apply to `<header>` — **less** blur/saturation than `.glass-palette` (24px / 200%).

### 3.7 Utility cluster (EN/ES + theme)

Wrap `LanguageSelector` + `ThemeToggle` in:

```tsx
<div className="flex items-center gap-0.5 rounded-xl border border-border bg-bg-elevated/60 p-0.5">
  <LanguageSelector />
  <div className="h-4 w-px bg-border" aria-hidden />
  <ThemeToggle />
</div>
```

Extract `UtilityCluster.tsx` in `components/layout/` if Header grows — optional.

### 3.8 Global engine status (P3.2) — provider required

**Problem:** `useTransmutationWorker` currently instantiates a Worker per hook call. Footer cannot call it independently.

**Solution:** `TransmutationWorkerProvider` at app root.

```
providers/TransmutationWorkerProvider.tsx  (new)
hooks/useTransmutationWorker.ts          (refactor: consume context)
app/layout.tsx                           (wrap children)
Footer.tsx                               (engine pill)
TransmutationPanel.tsx                   (use context hook)
TransmutationDropzone.tsx                (if still used — migrate)
```

Provider exposes: `{ ready, transmutate, estimate }` — same API as today.

Footer engine pill:

| `ready` | Display |
|---------|---------|
| `true` | green dot + `t("footer.engineReady")` |
| `false` | muted pulse dot + `t("footer.engineInit")` |

Reuse `panel.engineReady` / `panel.engineInit` keys OR add `footer.engineReady` / `footer.engineInit` — prefer footer namespace for layout layer.

### 3.9 Keyboard shortcuts modal (P3.3)

- `components/layout/KeyboardShortcutsDialog.tsx` — native `<dialog>`, same backdrop pattern as Command Palette
- Footer link: `t("footer.shortcuts")` opens dialog
- Content (i18n-driven):

| Action | Keys (display) |
|--------|----------------|
| Open transmutations | `⌘K` / `Ctrl+K` (OS-aware label) |
| Close overlay | `Esc` |

- Detect Mac via `navigator.platform` or `userAgent` for `⌘` vs `Ctrl` — client-only, no dependency
- `prefers-reduced-motion`: no entrance animation

### 3.10 Logo mark redesign (P3.1)

Replace current generic circular-arrow SVG with a **minimal chameleon mark**:

- Silhouette or eye + curved tail in `text-accent`
- Single-color, works at 28×28 in header
- `aria-hidden` on decorative SVG; wordmark "Camaleon" remains primary label
- Document design rationale in report (1–2 sentences)

**Constraint:** inline SVG only — no image assets, no icon library.

---

## 4. i18n Keys (EN + ES required)

Add to `panel` or new `footer` namespace in both dictionaries:

```typescript
footer: {
  github: "GitHub",
  shortcuts: "Shortcuts" / "Atajos",
  shortcutsTitle: "Keyboard shortcuts" / "Atajos de teclado",
  shortcutOpenPalette: "Open transmutations" / "Abrir transmutaciones",
  shortcutClose: "Close" / "Cerrar",
  engineReady: "Engine ready" / "Motor listo",
  engineInit: "Engine starting…" / "Motor iniciando…",
  // privacy reuses footer.privacy OR landing.privacy.text — pick one, DRY
}
```

Header breadcrumb separator can be plain `/` (no i18n).

---

## 5. File Manifest

| File | Action |
|------|--------|
| `frontend/src/lib/site.ts` | **Create** — version + repo URL |
| `frontend/src/providers/TransmutationWorkerProvider.tsx` | **Create** |
| `frontend/src/hooks/useTransmutationWorker.ts` | **Refactor** — context consumer |
| `frontend/src/components/layout/Footer.tsx` | **Rewrite** — 3-zone layout |
| `frontend/src/components/layout/Header.tsx` | **Enhance** — glass, active state, breadcrumb, logo |
| `frontend/src/components/layout/KeyboardShortcutsDialog.tsx` | **Create** |
| `frontend/src/components/layout/UtilityCluster.tsx` | **Create** (optional) |
| `frontend/src/components/layout/LanguageSelector.tsx` | **Tweak** — cluster-compatible styles |
| `frontend/src/app/globals.css` | **Add** `.glass-header` |
| `frontend/src/app/layout.tsx` | **Wrap** TransmutationWorkerProvider |
| `frontend/src/lib/i18n/dictionaries/en.ts` | **Add** footer keys |
| `frontend/src/lib/i18n/dictionaries/es.ts` | **Add** footer keys |
| `frontend/package.json` | **Bump** to `1.6.0` |
| `docs/SPEC.md` | **Amend** §7.7 Header + new §7.9 Footer anatomy |
| `docs/reports/ui_9_header_footer_polish_done.md` | **Create** — OpenCode report |

**Do not modify:** `docs/ROADMAP.md`, Rust/Wasm crates, worker transmutation logic.

---

## 6. Acceptance Criteria (Exit Gate)

### Visual / UX

- [ ] Footer does not collapse height when toggling engine state or opening shortcuts
- [ ] Header "Transmutaciones" shows clear active state when palette open
- [ ] Breadcrumb appears on `/transmute/jpg-to-png` and `/transmute/png-to-jpg`; absent on `/`
- [ ] Trust pill visually matches PrivacyBanner lock + accent language
- [ ] Glass header visible but subtler than Command Palette panel
- [ ] Shortcuts modal opens from footer, closes on Esc and backdrop click
- [ ] Version in footer matches `package.json` after bump to 1.6.0

### Technical

- [ ] Exactly **one** Web Worker instance app-wide (verify in report)
- [ ] All new UI strings in EN + ES
- [ ] No hardcoded hex — tokens only
- [ ] `npm run build` passes with zero errors
- [ ] `prefers-reduced-motion` respected on new animations

### Regression

- [ ] Command Palette still opens via click + ⌘K/Ctrl+K
- [ ] Transmutation flow unchanged (staged → processing → success)
- [ ] Theme + locale toggles work inside utility cluster

---

## 7. Deferrals (document only — NOT in this task)

- Command Palette search (UI-8)
- Mega-menu
- Footer tool-context line on transmute pages (optional enhancement)
- Animated logo / Lottie

---

## 8. Risk Register

| Risk | Mitigation |
|------|------------|
| Multiple Workers after provider refactor | Provider owns single `workerRef`; hook throws if used outside provider |
| Footer hydration mismatch on engine state | `ready` starts `false`; pill updates after mount — acceptable |
| `import package.json` breaks build | Verify `resolveJsonModule`; fallback constant only if build fails |
| Breadcrumb hydration on SSR | `usePathname` client-only in Header (already `"use client"`) |

---

## 9. Version & SPEC

- Bump `frontend/package.json` → **1.6.0**
- SPEC §7.7 Header Anatomy — update table with breadcrumb, glass, active trigger, logo
- SPEC new **§7.9 Footer Anatomy** — 3-zone layout, trust pill, engine status, shortcuts entry
