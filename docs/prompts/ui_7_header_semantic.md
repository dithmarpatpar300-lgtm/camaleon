SYSTEM DIRECTIVE: Act as a Senior Frontend Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§7.4–§7.8**), `docs/planning/ui_7_header_semantic_plan.md` (full architecture decisions), and `docs/ROADMAP.md` before any action.
All source code, comments, and the technical report must be strictly in English.
Do not substitute the technology stack (Next.js App Router + TypeScript + Tailwind v4). Do not modify `docs/ROADMAP.md`.

> **PREREQUISITE:** v1.1.0 must be present (UI-6, toasts, i18n, color-label locale-aware). The `colorLabel(color, t?)` function and `colors.white/black/gray` i18n keys are already implemented (Architect pre-fix). Confirm `npm run build` passes before starting. **No Rust/Wasm/Worker changes in this task.**

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/planning/ui_7_header_semantic_plan.md` fully. The architecture decisions are final — do not redesign the approach.
2. Inspect `components/layout/Header.tsx`, `lib/tools/tool-registry.ts`, `lib/tools/types.ts`, `lib/i18n/tool-copy.ts`, `components/transmute/ToolCard.tsx`, `components/transmute/TransparencyNotice.tsx`, `lib/format/color-label.ts`.
3. Understand the `<dialog>` native element API (`showModal()`, `close()`, `::backdrop`). This is the correct implementation primitive for the palette — not a `<div>` with manual z-index stacking.
4. Plan execution order: **Step 1 R3 → Step 2 R2 → Step 3 R1** (smallest to largest, each independently verifiable).
5. For glassmorphism: add `.glass-palette` as a CSS class in `globals.css` (not inline Tailwind arbitrary values). Both dark and light theme variants must be defined.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `ui_7_header_semantic`
PHASE: UI track — UI-7 (Command Palette Header + Semantic Naming + Color UX)
OBJECTIVE: Deliver three complementary UX improvements: (1) a glassmorphism Command Palette triggered from the Header, (2) action-oriented tool naming in landing cards and palette, and (3) a visual color swatch for arbitrary colors in the TransparencyNotice — all per `docs/planning/ui_7_header_semantic_plan.md`.

---

CONTEXT

- **v1.1.0** shipped: UI-6 (toast, transparency notice, page overlay, locale metadata).
- `colorLabel(color, t?)` is now locale-aware. Named colors (White/Black/Gray) resolve correctly. The Architect has already fixed the immediate i18n regression.
- This task adds the **visual swatch for unknown/arbitrary colors** (R3), **action titles** (R2), and **Command Palette** (R1) — in that order.

---

REQUIREMENTS

### R3 — Color Visual Swatch (TransparencyNotice) — implement FIRST

Enhance `TransparencyNotice.tsx` to handle both named and arbitrary colors gracefully.

**New i18n keys** (both EN and ES):

```typescript
panel: {
  transparencyNotice: {
    // existing: title, body (string with {color} placeholder)
    thisColor: "this color",   // ES: "este color"
  }
}
```

**Logic inside `TransparencyNotice`:**

```typescript
const label = colorLabel(background, t);   // already locale-aware
const isHex = label.startsWith("#");
```

- **`isHex === false`** (named color): use existing `t("panel.transparencyNotice.body", { color: label })` — no visual change.
- **`isHex === true`** (arbitrary/unknown color): render the body with an inline `ColorDisplay` element instead of the string interpolation. Structure:

```tsx
function ColorDisplay({ color, t }: { color: RgbColor; t: TranslateFn }) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <span
        className="inline-block h-3.5 w-3.5 rounded-full border border-white/20 shrink-0"
        style={{ background: `rgb(${color.r},${color.g},${color.b})` }}
        aria-hidden="true"
      />
      <strong>{t("panel.transparencyNotice.thisColor")}</strong>
    </span>
  );
}
```

When `isHex`, split the body string using `t("panel.transparencyNotice.bodyBefore")` + `<ColorDisplay>` + `t("panel.transparencyNotice.bodyAfter")`. Add `bodyBefore` / `bodyAfter` i18n keys for both locales. Do NOT use `dangerouslySetInnerHTML`.

Example EN body split:
- `bodyBefore`: `"Transparent areas will be flattened onto "`
- `bodyAfter`: `" before JPEG encoding. JPEG does not support transparency."`

Example ES body split:
- `bodyBefore`: `"Las áreas transparentes se aplanarán sobre "`
- `bodyAfter`: `" antes de codificar a JPEG. JPEG no soporta transparencia."`

**Verification:** Named color (white) → shows "White" / "Blanco". Gray → "Gray" / "Gris". An arbitrary RGB like `{ r: 100, g: 150, b: 200 }` → renders color swatch circle + "this color" / "este color".

---

### R2 — Semantic Tool Naming — implement SECOND

**Schema extension (`lib/tools/types.ts`):**

Add to `ToolDefinition`:
```typescript
actionTitle?: string;  // i18n key fragment — resolved via t(`tools.${id}.actionTitle`)
```

**Registry (`lib/tools/tool-registry.ts`):**

No value needed in registry — the `actionTitle` is resolved via i18n by convention (same as `title` is hardcoded but description is in dictionaries). Keep registry clean. Set `actionTitle` resolution in `tool-copy.ts`.

**i18n keys** — implement **Proposal A** as default, document B and C in report:

```typescript
// en.ts
tools: {
  "jpg-to-png": {
    actionTitle: "Preserve Quality",
    // ...existing keys unchanged
  },
  "png-to-jpg": {
    actionTitle: "Compress for Web",
    // ...existing keys unchanged
  },
}

// es.ts
tools: {
  "jpg-to-png": {
    actionTitle: "Preservar Calidad",
  },
  "png-to-jpg": {
    actionTitle: "Comprimir para Web",
  },
}
```

**Helper (`lib/i18n/tool-copy.ts`):**

```typescript
export function resolveToolActionTitle(
  toolId: string,
  t: TranslateFn
): string | undefined {
  const key = `tools.${toolId}.actionTitle`;
  const resolved = t(key);
  return resolved !== key ? resolved : undefined;
}
```

**ToolCard** (`components/transmute/ToolCard.tsx`):

Replace the `<h3>{tool.title}</h3>` with:
```tsx
const actionTitle = resolveToolActionTitle(tool.id, t);

<h3 className="text-lg font-semibold text-text-primary">
  {actionTitle ?? tool.title}
</h3>
{actionTitle && (
  <span className="font-mono text-xs text-text-muted shrink-0">
    {tool.fromFormat} → {tool.toFormat}
  </span>
)}
```

Place the format indicator inline with the title (same `flex items-center gap-2` row), before the fidelity badge. This keeps technical info visible without making it the primary label.

**Tool page** (`app/transmute/[slug]/page.tsx`):

The `<h1>` currently shows `{tool.title}` ("JPG → PNG"). Update to:
```tsx
const actionTitle = resolveToolActionTitle(tool.id, t);  // but this is a Server Component...
```

**Important:** `app/transmute/[slug]/page.tsx` is a Server Component. It cannot use `useI18n()`. Use the `getDictionary` + `resolveLocaleFromCookie` + cookie pattern (as already done in `generateMetadata`) to resolve the action title server-side. OR: Extract a `ToolPageHeading` client component that uses `useI18n()` (like the existing `ToolPageStrings`).

Recommended: Add `actionTitle` resolution to the existing `ToolPageStrings` component (which is already client-side). Add a new prop like `showActionTitle?: boolean` to `ToolPageStrings` — renders the h1 with action title + format subtitle.

**Verification:** Landing cards show "Preserve Quality" / "Comprimir para Web". Tool page h1 shows the action title. EN/ES toggle changes both correctly.

---

### R1 — Command Palette Header — implement THIRD

#### 1a. Glassmorphism CSS (`app/globals.css`)

Add after the existing motion-safe utilities:

```css
/* Command Palette glass panel */
.glass-palette {
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  background-color: rgba(21, 23, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.55),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
  border-radius: 1.25rem;
}

.light .glass-palette {
  background-color: rgba(245, 247, 250, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.07);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.85) inset;
}

/* Native dialog backdrop */
dialog.command-palette::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}
```

#### 1b. `useCommandPalette` hook (`hooks/useCommandPalette.ts`)

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openPalette = useCallback(() => {
    setOpen(true);
    dialogRef.current?.showModal();
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    dialogRef.current?.close();
  }, []);

  const toggle = useCallback(() => {
    if (dialogRef.current?.open) {
      closePalette();
    } else {
      openPalette();
    }
  }, [openPalette, closePalette]);

  // Sync state when dialog closes via native Escape key
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => setOpen(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  return { open, openPalette, closePalette, toggle, dialogRef };
}
```

#### 1c. `CommandPalette` component (`components/layout/CommandPalette.tsx`)

```typescript
"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { TOOLS } from "@/lib/tools/tool-registry";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/providers/I18nProvider";
import { resolveToolActionTitle } from "@/lib/i18n/tool-copy";
import { getToolStrings } from "@/lib/i18n/tool-copy";

type CommandPaletteProps = {
  onClose: () => void;
};
```

**Full structure:**

```tsx
<dialog
  ref={/* passed from parent */}
  className="command-palette fixed inset-0 m-0 h-full w-full max-w-none bg-transparent p-4
             sm:p-8 md:p-16"
  aria-label={t("commandPalette.ariaLabel")}
  aria-modal="true"
  onClick={handleBackdropClick}   // close on backdrop click
>
  <div
    className="glass-palette mx-auto mt-16 w-full max-w-xl overflow-hidden"
    onClick={(e) => e.stopPropagation()}   // prevent backdrop close when clicking panel
  >
    {/* Header */}
    <div className="border-b border-white/8 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
        {t("commandPalette.title")}
      </p>
    </div>

    {/* Active tools section */}
    <div className="px-2 py-2">
      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-widest text-text-muted">
        {t("commandPalette.categoryImage")}
      </p>
      {activeTools.map((tool) => (
        <Link
          key={tool.id}
          href={`/transmute/${tool.slug}`}
          onClick={onClose}
          className="flex items-center gap-4 rounded-xl px-3 py-3
                     text-left transition-colors
                     hover:bg-bg-elevated
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-accent"
        >
          {/* Format icon chip */}
          <div className="flex h-10 w-16 shrink-0 items-center justify-center
                          gap-0.5 rounded-lg border border-border bg-bg-elevated
                          font-mono text-xs text-text-muted">
            <span>{tool.fromFormat}</span>
            <svg ...arrowIcon... className="h-2.5 w-2.5" aria-hidden="true" />
            <span>{tool.toFormat}</span>
          </div>

          {/* Text — min-w-0 prevents flex overflow */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-text-primary">
                {actionTitle ?? tool.title}
              </span>
              {actionTitle && (
                <span className="font-mono text-xs text-text-muted shrink-0">
                  {tool.fromFormat} → {tool.toFormat}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-text-secondary">
              {description}
            </p>
          </div>

          {/* Badge — no shrink */}
          <Badge
            variant={tool.fidelity === "lossless" ? "lossless" : "lossy"}
            className="shrink-0"
          >
            {tool.fidelity === "lossless" ? t("badges.lossless") : t("badges.lossy")}
          </Badge>
        </Link>
      ))}
    </div>

    {/* Soon tools section (if any) */}
    {soonTools.length > 0 && (
      <div className="border-t border-white/5 px-2 pb-2 pt-2">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-widest text-text-muted">
          {t("commandPalette.categorySoon")}
        </p>
        {soonTools.map((tool) => (
          <div key={tool.id}
            className="flex cursor-not-allowed items-center gap-4 rounded-xl px-3 py-3 opacity-40">
            {/* Same anatomy as active tool rows, pointer-events-none */}
          </div>
        ))}
      </div>
    )}

    {/* Keyboard hint */}
    <div className="border-t border-white/5 px-4 py-2 text-right">
      <span className="text-xs text-text-muted">
        {t("commandPalette.closeHint")}
      </span>
    </div>
  </div>
</dialog>
```

**Backdrop click handler:**
```typescript
const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
  if (e.target === e.currentTarget) onClose();
};
```

#### 1d. Header update (`components/layout/Header.tsx`)

Replace the `<Link href="/">Transmutaciones</Link>` nav item with a palette trigger button:

```tsx
const { open, toggle, closePalette, dialogRef } = useCommandPalette();

// In the nav:
<button
  onClick={toggle}
  aria-expanded={open}
  aria-haspopup="dialog"
  aria-label={t("commandPalette.triggerAriaLabel")}
  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium
             text-text-secondary transition-colors
             hover:bg-bg-elevated hover:text-text-primary
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
>
  <span>{t("nav.transmutations")}</span>
  <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border
                  px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
    <span>⌘</span><span>K</span>
  </kbd>
</button>

<CommandPalette ref={dialogRef} onClose={closePalette} />
```

**Use `forwardRef`** on `CommandPalette` to accept the `dialogRef` from `useCommandPalette`.

#### 1e. New i18n keys (both EN and ES)

```typescript
commandPalette: {
  ariaLabel: "Command palette — navigate transmutations",
  triggerAriaLabel: "Open command palette",
  title: "Transmutations",
  categoryImage: "Image",
  categorySoon: "Coming soon",
  closeHint: "Esc to close",
}

// ES:
commandPalette: {
  ariaLabel: "Paleta de comandos — navegar transmutaciones",
  triggerAriaLabel: "Abrir paleta de comandos",
  title: "Transmutaciones",
  categoryImage: "Imagen",
  categorySoon: "Próximamente",
  closeHint: "Esc para cerrar",
}
```

---

### R4 — SPEC + Version + Report

**Bump frontend to v1.2.0:** `frontend/package.json`, `Footer.tsx`.

**Update `docs/SPEC.md`:**

- **§7.5:** Add `CommandPalette`, `useCommandPalette` ✅; update `□ Toast (later)` → removed from pending
- **§7.7 Header Anatomy:** Add palette trigger row
- **§7.8:** Add `UI-7 ✅ (v1.2.0)` row: Command Palette + semantic naming + color swatch
- Bump SPEC version; Amendment Log → `ui_7_header_semantic_done.md`

**Do not** modify `docs/ROADMAP.md`.

---

CONSTRAINTS

- **No Rust/Wasm/Worker changes.**
- **`<dialog>` native element** — do NOT use a `<div role="dialog">` with manual z-index stacking. The native `<dialog>` + `showModal()` provides correct focus trapping, Escape handling, and `::backdrop` layering for free.
- **CSS class `glass-palette`** in `globals.css` — not inline `backdrop-filter` arbitrary values in JSX.
- **`min-w-0` on text blocks** — mandatory in every `flex` row containing text. This is the root cause of the layout deformation seen in prior implementations.
- **`shrink-0` on icons and badges** — mandatory to prevent compression on narrow viewports.
- **NFR-1:** all processing remains local; no new network calls.
- **i18n:** every new user-facing string in both EN + ES.
- English for code/comments/report.

---

DELIVERABLES

1. R3: `TransparencyNotice` with `ColorDisplay` sub-component + `bodyBefore`/`bodyAfter` i18n split (R3).
2. R2: `actionTitle` i18n keys + `resolveToolActionTitle` helper + `ToolCard` + `ToolPageStrings` updates (R2).
3. R1: `globals.css` glass utilities + `useCommandPalette` hook + `CommandPalette` component + `Header` update (R1).
4. Dictionary updates: `panel.transparencyNotice.thisColor/bodyBefore/bodyAfter`, `commandPalette.*`, `tools.*.actionTitle` in EN + ES.
5. SPEC §7.5/§7.7/§7.8 amendments + version v1.2.0 (R4).
6. `docs/reports/ui_7_header_semantic_done.md` per GOVERNANCE §5.

---

NAMING PROPOSALS — Document in report

Implement **Proposal A** in code. Document B and C in report §5 so Product Owner can choose:

| Proposal | jpg-to-png EN / ES | png-to-jpg EN / ES |
|----------|--------------------|--------------------|
| **A (implement)** | Preserve Quality / Preservar Calidad | Compress for Web / Comprimir para Web |
| B | Lossless Archive / Archivo sin Pérdida | Web-Ready Compression / Compresión para Web |
| C | Transmute to Archive / Transmutar a Archivo | Transmute to Web / Transmutar a Web |

---

DEFERRALS (document in report §6)

- Search input inside the palette (UI-8)
- Arrow-key navigation within palette items (UI-8)
- `[locale]` URL routing / hreflang
- WebP live tool entry (after engine v1.1.0 delivers the crate)

---

EXIT GATE (self-check before report)

- [ ] R3: Named color → localized name; hex/arbitrary → color swatch + "this color"
- [ ] R2: Landing cards show action titles; tool page h1 updated; EN/ES toggle works
- [ ] R1: Header trigger opens palette; ⌘K works; Escape closes; glassmorphism visible
- [ ] R1: No flex deformation on 320px; `min-w-0` + `shrink-0` verified
- [ ] `npm run build` passes; no type errors
- [ ] SPEC + dictionaries updated; v1.2.0 bumped

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
