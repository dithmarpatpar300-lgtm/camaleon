# Pre-Tier 3 — UI/UX Scale & Surface System

**Status:** Planning (branch `dev`)  
**Priority:** Urgent — before Tier 3 format expansion  
**Last updated:** 2026-06-08  
**Related:** SPEC §1.3 (image-first scope), `chat.md` (internal only — never publish)

---

## 1. Executive summary

Camaleon v1.11.0 is **functionally mature** but the **discovery shell** (landing grid + Command Palette + release surfaces) was designed for ~6 tools. At **15 tools** it still works; at **25–40** (Tier 3 + 4) scroll-only navigation will feel cramped, especially on mobile.

Separately, **visual legibility** regressed on mobile: `glass-palette` at **62% opacity** plus missing scrim on `OnboardingPanel` causes background text to bleed through. `ReleaseNotesModal` reads better because it uses a **dimmed dialog backdrop** — that pattern should become the standard.

**Goal:** One surface system (opaque enough to read), responsive patterns per breakpoint, and scalable tool discovery — without blocking Tier 3 engine work.

---

## 2. Problem diagnosis (from screenshots)

### 2.1 Root cause — transparency

Current token in `globals.css`:

```css
.glass-palette {
  background-color: rgba(21, 23, 26, 0.62);  /* 62% — too low on busy backgrounds */
  backdrop-filter: blur(32px) saturate(180%);
}
```

| Surface | Backdrop scrim | Panel opacity | Mobile legibility |
|---------|----------------|---------------|-------------------|
| **OnboardingPanel** | ❌ None | 62% glass | **Poor** — grid text visible through panel |
| **CommandPalette** | ✅ 50% black + blur | 62% glass | **Fair** — scrim helps; panel still soft |
| **ReleaseNotesModal** | ✅ Same as palette | 62% glass | **Good** — centered + heavy scrim |
| **WhatsNewDrawer** | ✅ 50% black | 62% glass, full-width mobile | **OK** — full sheet helps |

**Conclusion:** The issue is not “too much glass everywhere” — it is **(a)** insufficient surface opacity and **(b)** onboarding floating without scrim on top of live content.

### 2.2 Root cause — scale

| Surface | Today | At 30+ tools |
|---------|-------|--------------|
| **ToolGrid** | 2-col grid, vertical scroll | Long landing page; hero pushed up |
| **CommandPalette** | Flat list, `max-h-[316px]` scroll | ⌘K becomes “scroll finder” — no search |
| **Registry** | `category: "image"` only | No grouping for WebP / archival / icon families |
| **Header** | “Transmutaciones” opens palette | No inline search; breadcrumb only on tool routes |

Competitors (e.g. Convertify) show **many tools on one page** but with shallow cards. Camaleon’s cards are richer (fidelity badge, description) — correct for quality, but **needs hierarchy** as count grows.

---

## 3. Design direction — “Camaleon surfaces”

### 3.1 Token ladder (proposed)

Replace single `glass-palette` with a **three-tier surface system**:

| Token | Use | Dark bg | Notes |
|-------|-----|---------|-------|
| `surface-overlay` | Dialog backdrops | `rgba(0,0,0,0.55)` + `blur(4px)` | Standard scrim — all modals |
| `surface-raised` | Modals, palette, release notes | `rgba(21,23,26,0.92)` + light blur | **Reference:** current ReleaseNotes feel |
| `surface-floating` | Onboarding, toasts | `rgba(21,23,26,0.96)` solid | No content behind; optional thin border |
| `glass-header` | Sticky header | Keep, tune to `0.88` opacity | Modernize in Phase B |

**Rule:** Any surface that overlays **readable page content** uses `surface-raised` minimum. True “acrylic” (`0.62`) reserved for nested panels *inside* an already-scrimmed modal (if ever needed).

### 3.2 Responsive patterns

| Component | Desktop (≥640px) | Mobile (&lt;640px) |
|-----------|------------------|---------------------|
| **CommandPalette** | Centered card `max-w-xl`, `mt-16` | **Full-screen sheet** or `mt-0` + `rounded-t-2xl` bottom-anchored; safe-area padding |
| **ReleaseNotesModal** | Centered `max-w-lg` (keep) | Full-width with `mx-3`, reduce top margin |
| **WhatsNewDrawer** | Right rail `max-w-md`, inset `top-4 right-4` (keep — user-approved) | **Bottom sheet** variant OR full-screen with solid `surface-raised` (not edge-to-edge glass) |
| **OnboardingPanel** | Bottom-right card `max-w-md` | **Center modal** with scrim OR bottom sheet with scrim — never float over grid without dimming |

### 3.3 Gold standard

**`ReleaseNotesModal`** is the visual anchor:

- `dialog` + `::backdrop`
- `useScrollLock`
- Structured header (version chip, tags, title, summary)
- `PanelScrollFade` for body
- Clear primary CTA

All floating UI should share this **shell component** (`<SurfaceDialog>` / `<SurfaceSheet>`).

---

## 4. Tool discovery — scale architecture

### 4.1 Near-term (15 → 25 tools) — Phase C

**Command Palette v2**

1. **Search input** (autofocus on open) — filter by title, `fromFormat`, `toFormat`, slug, i18n description.
2. **Keyboard nav** — ↑↓ + Enter (partially expected from dialog; verify).
3. **Grouped sections** (registry-driven):

   | Group key | Example tools | i18n |
   |-----------|---------------|------|
   | `jpeg-png` | JPG↔PNG | “JPEG & PNG” |
   | `webp` | WebP suite | “WebP” |
   | `gif-bmp` | GIF, BMP | “GIF & BMP” |
   | `archival` | TIFF, TGA | “Archival & textures” |
   | `icons` | ICO suite | “Icons & favicons” |

   Groups can be a new optional field `toolGroup` on `ToolDefinition` — no new `category` yet.

4. **Mobile footer** — replace “Esc para cerrar” with icon + “Cerrar” tap target; hide kbd hint on `sm:` breakpoint.

**Landing ToolGrid v2**

1. **Collapsible families** — same `toolGroup` keys; first group open by default.
2. **Compact row mode** (optional toggle) — list rows like palette for power users.
3. **Jump links** — sticky subnav under hero: “WebP · TIFF · ICO …” (anchor scroll).

### 4.2 Mid-term (Tier 4 categories) — Phase D

When `category: "optimize" | "edit"` ships (SPEC §12.5–12.6):

- **Header nav tabs:** Transmutar | Optimizar | Editar (or segmented control on landing).
- **Command Palette** gains category filter chips at top.
- **ToolGrid** splits into tabs — avoids infinite scroll landing.

### 4.3 Long-term — Phase E

- **Universal converter** meta-route: drop file → magic-byte detect → redirect to tool (already in `chat.md` horizon).
- **Recent / pinned tools** in `localStorage` (privacy-safe — no file names, only tool ids).
- **Command Palette as primary** on repeat visits; landing hero shrinks for returning users (optional, post-metrics).

---

## 5. Header modernization (Phase UX-4)

**Revision (2026-06-08):** v1 UX-4 used a full-width `min-h-11` faux input inside `h-14` — children fought for height, utilities ballooned, header felt unstable. **v2** keeps the bar at a fixed **56px** and moves “search” affordance to the palette on small screens.

### 5.1 Principles

| Rule | Rationale |
|------|-----------|
| **Fixed bar height** `h-14` (56px) | No child may exceed `h-9` (36px) visually |
| **Search lives in the palette** on mobile | Palette already has autofocus filter — header stays minimal |
| **Progressive disclosure** | Icon → compact pill → full pill + `⌘K` by breakpoint |
| **Touch without bloat** | 36px controls centered in 56px bar (~10px breathing room); palette/footer rows keep 44px |
| **`surface-header`** | ~88% opacity + subtle shadow (done) |

### 5.2 Responsive trigger matrix

| Viewport | Trigger | Width |
|----------|---------|-------|
| **&lt; `sm` (mobile)** | Icon button only (`h-9 w-9`) | Fixed — matches utility weight |
| **`sm` – `lg`** | Ghost pill: icon + truncated placeholder | `max-w-[11rem]` |
| **`≥ lg` (desktop)** | Ghost pill + full placeholder + `⌘K` chip | `max-w-xs` |

Click / `⌘K` → open palette → autofocus search input (unchanged).

### 5.3 Layout (stable)

```
[ Logo ] [ breadcrumb md+ ] ··· flex-1 ··· [ search trigger ] [ EN|ES · theme ]
```

- Logo: `h-7` mark; wordmark from `sm+`
- Breadcrumb: `md+`, single line `truncate`
- Utilities: compact pill `h-9` inner controls (not `h-11`)

**Non-goals:** hamburger mega-menu, account avatar, inline editable search field in header.

---

## 6. Component refactor map

| File | Change |
|------|--------|
| `globals.css` | Add `surface-*` tokens; deprecate opaque `glass-palette` for overlays |
| `components/ui/SurfaceDialog.tsx` | **New** — shared dialog shell (backdrop, scroll lock, animation) |
| `components/ui/SurfaceSheet.tsx` | **New** — mobile bottom sheet / desktop side panel |
| `CommandPalette.tsx` | Search, groups, mobile layout, `surface-raised` |
| `OnboardingPanel.tsx` | Scrim + `surface-floating`; mobile center/bottom sheet |
| `ReleaseNotesModal.tsx` | Migrate to `SurfaceDialog` (no visual change) |
| `WhatsNewDrawer.tsx` | Mobile bottom sheet; desktop keep rail |
| `KeyboardShortcutsDialog.tsx` | Share `SurfaceDialog` |
| `Header.tsx` | Search-styled trigger, opacity token |
| `ToolGrid.tsx` | Grouped sections + anchors |
| `lib/tools/types.ts` | Optional `toolGroup?: string` |
| `lib/i18n/dictionaries/*.ts` | Group labels |

---

## 7. Phased delivery (Pre-Tier 3)

### Phase UX-0 — Hygiene (0.5 day)

- [ ] Add `chat.md` to `.gitignore` (internal notes — never commit)
- [ ] Snapshot “before” screenshots in `docs/planning/ui-baseline/` (optional)

### Phase UX-1 — Surface legibility (1–2 days) **URGENT**

- [x] Implement `surface-raised` / `surface-floating` / `surface-sheet-mobile` tokens
- [x] OnboardingPanel: `dialog` scrim (`surface-overlay`) + `surface-floating` sheet
- [x] CommandPalette: `surface-raised`; mobile bottom sheet + stronger backdrop
- [x] WhatsNewDrawer: `surface-raised` + `surface-sheet-mobile` on small screens
- [x] ReleaseNotesModal + KeyboardShortcutsDialog: `surface-raised`
- [ ] Visual QA: iPhone SE, iPhone 14, Pixel, desktop 1440p, light + dark

**Exit gate:** No readable bleed-through of landing text behind onboarding on mobile.

### Phase UX-2 — Command Palette v2 (2–3 days)

- [x] Search filter + `toolGroup` registry field
- [x] Mobile full-sheet layout + 44px row height
- [x] Group headers in palette

**Exit gate:** Find any of 15 tools in &lt;3 keystrokes via search.

### Phase UX-3 — Landing scale (2 days)

- [x] ToolGrid grouped collapsibles
- [x] Anchor jump links under hero

**Exit gate:** Landing usable at 25 mocked tools without excessive scroll.

### Phase UX-4 — Header polish (1 day)

- [x] `surface-header` opacity / shadow
- [x] Adaptive search trigger v2 (icon → ghost pill → pill + `⌘K`)
- [x] Fixed `h-14` bar; controls capped at `h-9`

**Exit gate:** Header height visually stable on iPhone SE, iPad, and 1440p desktop; no “thick bar” stretch.

### Phase UX-5 — Unification (1–2 days)

- [x] `SurfaceDialog` + `SurfaceSheet` extract; migrate modals
- [x] Document tokens in SPEC §7.4.1

### Phase UX-6 — Landing Option D (1–2 days)

**Goal:** Replace the accordion + jump-chip layout with **family tabs + compact rows** that scale to 25–40 tools without the page becoming a ladder.

**Approach (CSS-only, no framer-motion):**

- [x] Sticky tab bar (`top-14`, inside `.surface-header`) — tabs are `All` + each `toolGroup` (JPEG, WebP, GIF, TIFF, ICO).
- [x] **Density toggle** (compact rows ↔ detailed cards), `sm:` and up; persisted in `localStorage` (`camaleon.tools.density.v1`).
- [x] Active tab persisted in `localStorage` (`camaleon.tools.tab.v1`); `#tool-group-*` hash still focuses a tab on load + `hashchange`.
- [x] Compact `ToolRow` reuses Command Palette pattern (`FormatChip` + title + fidelity badge).
- [x] CSS animations only:
  - `tabContentIn` (200 ms fade + 4 px lift) on tab switch (re-keyed container).
  - `toolRowIn` (260 ms with `--tool-row-index` stagger of 28 ms) for row entrance.
  - Both gated by `prefers-reduced-motion`.
- [x] Keyboard nav: `←/→/Home/End` between tabs (roving `tabindex`).
- [x] Removed `ToolGrid.tsx` + `ToolGroupJumpNav.tsx`; landing now mounts a single `ToolBrowser`.

**Why CSS instead of framer-motion (now):**

- `tabContentIn` fade is trivial in CSS via `key`-driven remount.
- Stagger is solved with `animation-delay: calc(var(--tool-row-index) * 28ms)`.
- Bundle stays at zero new dependencies.
- Framer Motion is reserved for **Phase E** (gestures, layout transitions, multi-stage exit/entry orchestration) where its `AnimatePresence` and `layout` props earn their ~30 KB.

**Exit gate:** Landing renders 25 mocked tools per family without exceeding two viewports of scroll on iPhone SE in compact view; switching tabs feels immediate (no perceptible pause); detailed view remains the recognizable card grid.

### Phase UX-7 — Ambient bloom + soft sticky bars

**Goal:** Add Vercel-style accent ambience and remove the visible "limit" line under the tool browser tabs without losing legibility.

- [x] **`.surface-subnav`** token in `globals.css` — sticky bars with `backdrop-filter: blur(10px)` and a `mask-image: linear-gradient(...)` fade on the bottom edge. No `border-b`, no hard drop-shadow.
- [x] `ToolBrowser` tabs bar migrated from `surface-header + border-b` to `surface-subnav` with `pt-2.5 pb-4` (the bottom padding sits inside the mask fade).
- [x] **`<AmbientBloom />`** decorative layer mounted in `RootLayout`:
  - Three radial halos in `--color-accent` at low opacity (top-left strong, top-right medium, bottom soft).
  - GPU-friendly: `filter: blur(80px)` + `transform`-only animation (28–44 s, alternating).
  - Subtle dotted grid masked to the upper viewport for texture.
  - `pointer-events-none`, `aria-hidden`, `prefers-reduced-motion` disables drift.
- [x] Light-mode tuning — halos clamped to 0.10–0.22 opacity; grid swapped to dark dots on light bg.
- [x] Layout layering: `<AmbientBloom />` is `fixed inset-0 z-0`; the page wrapper around `<Header>/<main>/<Footer>` becomes `relative z-10`, so the bloom sits between body bg and content.

**Why this matters:** The previous tab bar relied on a `box-shadow + border-b` combo that read as a hard "edge" especially on light mode. Replacing it with a mask fade aligns with the Vercel/Next.js marketing aesthetic the user pointed to and frees the eye from "boxed" UI.

**Revision (2026-06-09):** `mask-image` on `.surface-subnav` reverted — caused (a) first list row veil-shadow on hover, (b) filtered-tab content sliding under pills, (c) Huawei P30 pill corruption when combined with `backdrop-filter` + ambient bloom. Subnav is now **solid opaque** (`0.96` mobile, `0.92` + blur on `sm+`), `z-40`, `mb-5` gap before tabpanel.

### Phase UX-7b — Bloom tuning + light mode parity

- [x] Remove bottom-center halo entirely.
- [x] Shrink corner halos (~420px / ~380px desktop; ~280px / ~240px mobile).
- [x] Reposition: top-left above hero, top-right mid-right (not overlapping sticky bars).
- [x] Mobile perf tier: `blur(40px)`, no animation, lower opacity on `<640px`.
- [x] Light theme tokens retuned: `--color-bg-base: #F8FAF9`, green-tinted borders, stronger bloom grid dots.
- [x] Active tab pills: `shadow-accent/10` for light-mode legibility.

### Phase UX-8 — Transmutadores shell refresh

- [x] `ToolPageHeader` — format chip, fidelity badge, large title, description (replaces fragmented `ToolPageStrings`).
- [x] `.transmute-shell` — raised panel with accent gradient hairline (dark + light variants).
- [x] `.transmute-dropzone` — icon in accent ring, dashed border with drag glow.
- [x] `StagedWorkspace` file strip with bottom border; metrics card refined.
- [x] Success state wrapped in same shell.

**Total estimate:** ~10–15 dev days on `dev` before Tier 3 engine spike.

---

## 8. What we explicitly defer

| Item | Why |
|------|-----|
| PDF / document UI | Tier 5 — different product line (SPEC §12.7) |
| PWA / offline | Post Tier 3 |
| Playwright visual regression | Nice-to-have after UX-1 |
| Full redesign / rebrand | Polish within existing accent + dark identity |

---

## 9. Success criteria

| # | Criterion |
|---|-----------|
| 1 | Mobile onboarding and palette: **no background text bleed-through** |
| 2 | All overlay surfaces share **one opacity standard** (raised ≥ 0.90) |
| 3 | Command Palette: **search** finds tools by name/format |
| 4 | Landing supports **grouped tools** ready for 25+ entries |
| 5 | Whats New: desktop rail unchanged; mobile **readable full sheet** |
| 6 | `chat.md` **not** in repository |

---

## 10. Relation to Tier 3

Tier 3 adds AVIF/SVG/HEIC tools — likely **+3–6 registry entries**. Without UX-2/UX-3, each new tool worsens scroll fatigue. **Recommend:** complete **UX-1** (legibility) immediately, **UX-2** (search + groups) before first Tier 3 tool ships.

---

*Planning doc for Pre-Tier 3 UI/UX. Implementation tracked on `dev`.*
