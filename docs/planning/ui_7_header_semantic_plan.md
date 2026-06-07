# UI-7 — Command Palette Header + Semantic Naming + Color UX

> **Author:** Chief Architect (Cursor)  
> **Date:** 2026-06-06  
> **Status:** Planned — ready for OpenCode execution  
> **Target release:** Frontend **v1.2.0** (engine stays **v1.1.0** — no Wasm changes)

---

## 1. Context & Trigger

Review of Camaleon v1.1.0 UI exposed three friction points:

| # | Problem | Evidence |
|---|---------|----------|
| R1 | Header nav is a simple link — no discovery surface for future N tools | Image 2/3: reference shows command palette pattern |
| R2 | Tool titles are format-technical ("JPG → PNG"), not action-oriented | Image 1/4/5: compare competitor naming |
| R3 | TransparencyNotice exposes raw hex (#808080) to end users | Image 6: "#808080" in Spanish UI copy |

**Note — Architect pre-fix (applied before this plan):** `colorLabel` has been refactored to be locale-aware (`t?: TranslateFn` param) and gray added to KNOWN_COLORS. The `colors.white/black/gray` i18n namespace is now in both dictionaries. This resolves the immediate hex exposure for the three palette swatches. **R3 in this plan adds the full visual-swatch enhancement for arbitrary colors** (future color picker readiness).

---

## 2. Scope

**Frontend-only.** No Rust/Wasm/Worker changes.

| Requirement | Scope |
|-------------|-------|
| R1 — Command Palette | New component + hook; Header refactor |
| R2 — Semantic naming | i18n dictionary + ToolDefinition schema extension |
| R3 — Color visual swatch | TransparencyNotice + colorLabel enhancement |

---

## 3. Architecture Decisions

### 3.1 Command Palette (R1)

**Pattern:** Triggered overlay — not an inline dropdown, not a full-page modal. Follows macOS Spotlight / VS Code ⌘K convention.

**Trigger in Header:**
- The current `<Link href="/">Transmutaciones</Link>` nav item becomes a `<button>` that:
  - Keeps the text "Transmutaciones" for brand continuity
  - Adds a subtle keyboard hint `⌘K` badge (hidden on mobile, `hidden sm:inline`)
  - Opens `CommandPalette` on click

```
Before: [Logo]  Transmutaciones (link →/)   [─────────]  [EN/ES]  [☾]
After:  [Logo]  [Transmutaciones ⌘K ▾]      [─────────]  [EN/ES]  [☾]
```

**`CommandPalette` component:**
- Renders a `<dialog>` element (native, accessible, Escape-closes by default via `HTMLDialogElement.close()`) with `aria-modal="true"`, `aria-label`.
- Positioned: `fixed inset-0 z-50` backdrop + centered panel `max-w-xl w-full mx-auto mt-20`
- The panel is the glassmorphism container.

**Glassmorphism (Acrylic/Windows 11 reference):**
```css
/* globals.css — new utility class */
.glass-palette {
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  background-color: rgba(21, 23, 26, 0.82);   /* --bg-base with alpha */
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
```

**Internal palette structure:**
```
┌─ glass-palette (max-w-xl) ──────────────────────────────────┐
│  [Optional search input]  (v1: skip search, add in UI-8)    │
│  ─────────────────────────────────────────────────────────  │
│  IMAGEN                              [category label]        │
│                                                              │
│  [PaletteTool] JPG → PNG  [Sin pérdida]                     │
│    Preservar Calidad · Convierte JPEG a PNG sin pérdida     │
│                                                              │
│  [PaletteTool] PNG → JPG  [Con pérdida]                     │
│    Comprimir para Web · Archivos más pequeños               │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  PRÓXIMAMENTE                                                │
│  [PaletteTool disabled] WebP → PNG  [Sin pérdida]           │
└──────────────────────────────────────────────────────────────┘
```

**`PaletteTool` card anatomy — layout rules:**
```tsx
<div className="flex items-center gap-4 px-4 py-3 rounded-xl
                hover:bg-bg-elevated transition-colors cursor-pointer">

  {/* Format icon — fixed size, no shrink */}
  <div className="shrink-0 flex h-10 w-10 items-center justify-center
                  rounded-lg bg-bg-elevated border border-border text-xs
                  font-mono text-text-muted">
    <span>{tool.fromFormat}</span>
    <ArrowIcon className="h-3 w-3 mx-0.5" />
    <span>{tool.toFormat}</span>
  </div>

  {/* Text block — min-w-0 prevents flex-shrink overflow */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-semibold text-sm text-text-primary truncate">
        {actionTitle}               {/* "Preservar Calidad" */}
      </span>
      <span className="font-mono text-xs text-text-muted shrink-0">
        {tool.fromFormat} → {tool.toFormat}
      </span>
    </div>
    <p className="text-xs text-text-secondary truncate mt-0.5">
      {description}
    </p>
  </div>

  {/* Badge — fixed, no shrink */}
  <Badge variant={tool.fidelity} className="shrink-0" />
</div>
```

**Key layout directives (prevents image-3 deformation):**
- Parent: `flex items-center` — never `items-start` (misaligns icon vs text vertically)
- Text block: `flex-1 min-w-0` — `min-w-0` is critical; without it, long text strings expand the flex child past container width
- Icon and badge: `shrink-0` — prevent compression on narrow viewports
- Use `truncate` (not `break-words`) on title and description

**`useCommandPalette` hook:**
```typescript
export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openPalette = () => { setOpen(true); dialogRef.current?.showModal(); }
  const closePalette = () => { setOpen(false); dialogRef.current?.close(); }
  const toggle = () => open ? closePalette() : openPalette();

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
  }, [open]);

  return { open, openPalette, closePalette, toggle, dialogRef };
}
```

**Files to create/modify:**
| File | Action |
|------|--------|
| `components/layout/CommandPalette.tsx` | New component (dialog + PaletteTool rows) |
| `hooks/useCommandPalette.ts` | New hook (state + ⌘K shortcut) |
| `components/layout/Header.tsx` | Replace nav link with palette trigger button |
| `app/globals.css` | `.glass-palette` utility class |
| `lib/i18n/dictionaries/en.ts` + `es.ts` | Palette strings (trigger label, aria, category headers) |
| `docs/SPEC.md` | §7.5 + §7.7 updates |

---

### 3.2 Semantic Naming — Three Proposals (R2)

**Architecture:** Add optional `actionTitle` field to `ToolDefinition`. When present, used in:
- Landing `ToolCard` as the card `h3` (replacing bare "JPG → PNG")
- `CommandPalette` primary row label
- Tool page `<h1>` (paired with format indicator as subtitle)

The existing `title` field ("JPG → PNG") is kept for breadcrumbs, `<title>` metadata, and tab labels.

```typescript
// lib/tools/types.ts — add to ToolDefinition
actionTitle?: string;   // i18n key, resolved via t("tools.[id].actionTitle")
```

**Proposal A — "Verb + Outcome" (Recommended)**

| Tool | EN | ES |
|------|----|----|
| jpg-to-png | **Preserve Quality** | **Preservar Calidad** |
| png-to-jpg | **Compress for Web** | **Comprimir para Web** |

Rationale: Short, scannable, maps directly to user intent ("I want to preserve quality", "I want to compress"). Works as a command palette label. Pairs cleanly with the format indicator.

**Proposal B — "Adjective + noun"**

| Tool | EN | ES |
|------|----|----|
| jpg-to-png | **Lossless Archive** | **Archivo sin Pérdida** |
| png-to-jpg | **Web-Ready Compression** | **Compresión para Web** |

Rationale: Noun-based, easier to translate consistently. Slightly less action-oriented.

**Proposal C — Alchemical brand voice**

| Tool | EN | ES |
|------|----|----|
| jpg-to-png | **Transmute to Archive** | **Transmutar a Archivo** |
| png-to-jpg | **Transmute to Web** | **Transmutar a Web** |

Rationale: Most on-brand. Risk: may be less intuitive for first-time users who don't know the brand yet. Viable if a subtitle always shows the format.

**Chief Architect recommendation:** Proposal A for landing + palette. Proposal C for the CTA button on the landing card ("Transmutar ›"). OpenCode must implement Proposal A but document B and C in the report so the Product Owner can choose.

**Files to modify:**
| File | Action |
|------|--------|
| `lib/tools/types.ts` | Add `actionTitle?: string` to `ToolDefinition` |
| `lib/tools/tool-registry.ts` | Populate `actionTitle` i18n key for active tools |
| `lib/i18n/dictionaries/en.ts` + `es.ts` | `tools.[id].actionTitle` key (Proposal A) |
| `lib/i18n/tool-copy.ts` | Export `resolveToolActionTitle(tool, t)` helper |
| `components/transmute/ToolCard.tsx` | Use `actionTitle` as h3 when available |
| `components/layout/CommandPalette.tsx` | Use `actionTitle` in PaletteTool rows |
| `app/transmute/[slug]/page.tsx` | Show `actionTitle` as h1 + format as subtitle |

---

### 3.3 Color Visual Swatch (R3)

**Architect pre-fix (already committed):** `colorLabel` is now locale-aware — gray/white/black resolve to localized names in both EN/ES. This resolves the immediate hex display problem for the three named palette swatches.

**OpenCode task — full visual swatch for unknown colors:**

When a future color picker allows arbitrary RGB, `colorLabel` returns the hex string (#RRGGBB). The `TransparencyNotice` must handle this gracefully without exposing hex.

**Decision: Hybrid approach (Option A + B)**

- Known colors (white, black, gray): show **localized name** only. No swatch needed — the name is unambiguous.
- Unknown colors (arbitrary RGB from future picker): show **inline color swatch circle** + generic phrase `t("panel.transparencyNotice.thisColor")`.

**New `ColorSwatch` inline component (or inline JSX in TransparencyNotice):**
```tsx
function ColorDisplay({ color, t }: { color: RgbColor; t: TranslateFn }) {
  const name = colorLabel(color, t);
  const isHex = name.startsWith("#");

  if (!isHex) return <strong>{name}</strong>;

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

**Scalability:** When a full HSL/HEX color picker is added (UI-8+), this component requires zero changes — arbitrary colors always render the swatch + generic label.

**New i18n key:**
```typescript
panel: {
  transparencyNotice: {
    thisColor: "this color",   // ES: "este color"
    // body becomes: "...se aplanarán sobre {colorDisplay}..."
    // {colorDisplay} is a React element, not a string
  }
}
```

**Note on implementation:** Because `{colorDisplay}` is now a React element (not a string), the body must shift from `t("panel.transparencyNotice.body", { color: label })` (string interpolation) to a split string pattern:
```tsx
// Instead of t("body", { color: label }), split into prefix + component + suffix:
// i18n key: panel.transparencyNotice.bodyBefore + bodyAfter (or use two keys)
// OR: keep string interpolation for named colors, render ColorDisplay only for hex
```
**Simplest implementation:** Keep `{color}` string param for named colors; for hex colors, override the entire body render.

```typescript
// In TransparencyNotice.tsx
const label = colorLabel(background, t);
const isHex = label.startsWith("#");
```

If `isHex` → render full body with `<ColorDisplay>` inline. If named → use existing `t("body", { color: label })` string.

**Files to modify:**
| File | Action |
|------|--------|
| `lib/format/color-label.ts` | Add `isKnownColor` export (already done by Architect pre-fix) |
| `components/transmute/TransparencyNotice.tsx` | Add `ColorDisplay` sub-component; handle hex vs named |
| `lib/i18n/dictionaries/en.ts` + `es.ts` | `panel.transparencyNotice.thisColor` key |

---

## 4. Implementation Order for OpenCode

```
Step 1 → R3 (Color swatch) — smallest, isolated, tests immediately visible
Step 2 → R2 (Semantic naming) — no structural risk, dictionary + registry + display only
Step 3 → R1 (Command Palette) — largest, builds on R2 actionTitle
```

---

## 5. Version & SPEC Notes

- Frontend: **v1.2.0** (MINOR — new navigation component, semantic naming, UX enhancement)
- Engine: unchanged (v1.1.0)
- SPEC §7.5: add `CommandPalette`, `useCommandPalette`, `ColorDisplay`
- SPEC §7.7: update header anatomy (palette trigger replaces/wraps nav link)
- SPEC §7.8: add UI-7 row

---

## 6. Acceptance Criteria (Architect validation)

### R1
- [ ] "Transmutaciones" in header opens `CommandPalette` on click
- [ ] ⌘K / Ctrl+K opens/closes palette from anywhere on the page
- [ ] Escape closes palette (`<dialog>` native behavior)
- [ ] Glassmorphism effect visible on both dark and light themes
- [ ] All tool rows display correct `actionTitle`, format pair, fidelity badge
- [ ] `WebP → PNG` row present but in "Próximamente" section and visually disabled
- [ ] Layout holds at 320px width: no text overflow, no flex deformation
- [ ] `min-w-0` present on text block (prevents layout deformation bug)
- [ ] `aria-modal`, accessible focus management when palette opens

### R2
- [ ] Landing `ToolCard` h3 shows action title (Proposal A by default)
- [ ] Tool page `<h1>` shows action title, format pair visible as subtitle or badge
- [ ] EN and ES action titles both present in dictionaries
- [ ] Proposals B and C documented in OpenCode report
- [ ] `resolveToolActionTitle(tool, t)` helper exported from `tool-copy.ts`

### R3
- [ ] Named colors (White/Black/Gray) render localized name in TransparencyNotice
- [ ] Arbitrary hex colors render inline color swatch + "este color" / "this color"
- [ ] No hex string visible to end users in any state
- [ ] `isKnownColor` exported for use by palette or other future components

### General
- [ ] `npm run build` passes
- [ ] No Wasm/engine changes
- [ ] All new strings in both EN + ES

---

## 7. What Comes After UI-7

| Track | Contents |
|-------|----------|
| **UI-8** | Search input in CommandPalette; keyboard arrow-key navigation |
| **Engine v1.1.0** | Playwright E2E, `refine_jpeg_encoder_swap` |
| **Point 3 — Features** | WebP crate (makes the "Próximamente" row in palette go live) |
