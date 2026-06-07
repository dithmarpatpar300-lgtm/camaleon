SYSTEM DIRECTIVE: Act as a Senior Frontend Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§5.5.2**, **§5.11.2**, **§5.11.6**, **§7.4–§7.8**, **§8** NFRs), `docs/planning/ui_6_ux_polish_plan.md`, and `docs/ROADMAP.md` before any action.
All source code, comments, and the technical report must be strictly in English.
Do not substitute the technology stack (Next.js App Router + TypeScript + Tailwind v4). Do not modify `docs/ROADMAP.md`.

> **PREREQUISITE:** **v1.0.0** must be present (`TransmutationPanel`, UI-5, i18n EN/ES, CI). Confirm `npm run build` passes before starting. **No Rust/Wasm/Worker changes in this task.**

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read SPEC §5.5.2 (alpha flatten) and §5.11.2 (silent alpha loss UX gap). The transparency notice is **informational**, not a blocking gate — users must still transmute freely.
2. Read `docs/planning/ui_6_ux_polish_plan.md` §3 for the approved technical approach. Do not implement `[locale]` URL routing — only the cookie-bridge metadata pattern (R4).
3. Inspect existing deliverables: `TransmutationPanel.tsx`, `Dropzone.tsx`, `I18nProvider.tsx`, `app/layout.tsx`, `app/transmute/[slug]/page.tsx`, dictionaries `en.ts` / `es.ts`.
4. Plan alpha detection as a **lightweight PNG byte parser** (IHDR color type + `tRNS` chunk scan) — avoid full Canvas decode on large files.
5. Plan toast UX so **at most one toast** fires per user action (avoid spam on success → download).
6. State assumptions and trade-offs in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `ui_6_ux_polish_layer`
PHASE: UI track — UI-6 (post-v1.0.0 UX polish)
OBJECTIVE: Deliver the **UX polish layer** (point 2 from post-MVP roadmap): transparency pre-notice for PNG→JPG, full-page drag overlay on tool pages, toast feedback after download, and locale-aware SSR metadata via cookie bridge — per SPEC §5.11.6 and planning doc.

---

CONTEXT

- **v1.0.0** shipped UI-1..UI-5, staged transmutation flow, bilingual client i18n.
- **This task is frontend-only.** Point 3 (WebP, batch, new crates) and engine items (Playwright, encoder swap) are **explicitly deferred**.
- UI copy remains localized via existing `I18nProvider` + dictionaries.

### Four deliverables (all required)

| ID | Priority | Summary |
|----|----------|---------|
| **R1** | Alta | PNG alpha detection + `TransparencyNotice` on PNG→JPG staged state |
| **R2** | Baja | Full-page drag overlay on `/transmute/[slug]` |
| **R3** | Baja | Minimal toast system + download confirmation |
| **R4** | Media | Locale-aware `generateMetadata` via `camaleon-locale` cookie |

---

REQUIREMENTS

### R1 — Transparency pre-notice (PNG→JPG)

**New module:** `frontend/src/lib/format/detect-png-alpha.ts`

```typescript
export type PngAlphaDetection = {
  hasAlpha: boolean;
  reason: "rgba" | "trns" | "none" | "not-png";
};

export function detectPngAlpha(bytes: ArrayBuffer): PngAlphaDetection;
```

**Algorithm (authoritative):**

1. Verify PNG signature `\x89PNG\r\n\x1a\n` (8 bytes). Else return `{ hasAlpha: false, reason: 'not-png' }`.
2. Parse IHDR chunk (first chunk after signature). Byte offset 25 = **color type**:
   - `4` (grayscale + alpha) or `6` (RGBA) → `{ hasAlpha: true, reason: 'rgba' }`.
3. For color types `0`, `2`, `3`: walk chunks (length + type + data + CRC) up to **64 KB** from start or EOF. If chunk type is `tRNS` → `{ hasAlpha: true, reason: 'trns' }`.
4. Otherwise `{ hasAlpha: false, reason: 'none' }`.
5. Must not throw on truncated/corrupt PNG — return safe `{ hasAlpha: false, reason: 'not-png' }` or `'none'`.

**Component:** `frontend/src/components/transmute/TransparencyNotice.tsx`

- Props: `background: RgbColor`, optional `className`.
- Visual: info/warning banner using tokens (`border-info/30`, `bg-info/10`, or `--warning` if preferred — stay token-driven).
- Icon optional (inline SVG, `aria-hidden`).

**Integration in `TransmutationPanel`:**

- After staging a file, if `tool.id === 'png-to-jpg'`, run `detectPngAlpha(staged.bytes)` (sync is fine for chunk scan).
- Store `hasAlpha` in component state; reset on `handleReset`.
- Render `TransparencyNotice` between file summary and `OptionsControls` when `hasAlpha === true`.
- Pass current `options.background` (default white) so copy updates when user changes swatch.

**i18n** (both `en.ts` and `es.ts`):

```typescript
panel: {
  transparencyNotice: {
    title: "...",
    body: "... {colorName} ...",  // e.g. "Transparent areas will be flattened onto {colorName}."
  },
}
```

Add helper to format background as readable label (e.g. "White" for #FFFFFF, "Black" for #000000, else `#RRGGBB`) — can live in `lib/format/color-label.ts`.

**Do NOT:** block the Transmute button; call Wasm; decode full image in Canvas.

### R2 — Full-page drag overlay (tool pages)

**Hook:** `frontend/src/hooks/usePageFileDrop.ts`

- Options: `{ enabled: boolean; onFile: (file: File) => void; acceptExtensions: string[] }`.
- When `enabled` is false (e.g. `status === 'processing'`), detach listeners.
- Use **drag counter** (`dragenter` +1, `dragleave` -1) to prevent overlay flicker.
- Ignore drops with no files; on drop take first file only (match existing panel behavior).
- `dragover` → `preventDefault()` to allow drop.

**Component:** `frontend/src/components/transmute/PageDropOverlay.tsx`

- Visible when parent sets `active={true}`.
- Fixed `inset-0 z-50`, semi-transparent backdrop, dashed accent border, centered label via `t('dropzone.pageOverlayLabel')`.
- `aria-hidden={!active}` when hidden; when active, `role="presentation"` on backdrop (drop handled by hook).

**Integration:**

- Use hook inside `TransmutationPanel` with `enabled: status === 'idle' || status === 'staged'`.
- Render overlay as sibling at end of panel root (portal not required unless z-index conflicts — fix with z-index if Header overlaps).

**Scope limit:** Do **not** add window-level drop on landing `/`.

### R3 — Toast system

**Components:**

- `frontend/src/components/ui/Toast.tsx` — single toast UI (message, variant `success` | `info`, dismiss button optional).
- `frontend/src/providers/ToastProvider.tsx`:
  - `useToast()` → `{ toast: (opts: { message: string; variant?: 'success' | 'info' }) => void }`.
  - Queue max **1 visible** toast (replace if new arrives).
  - Auto-dismiss **4000 ms**; clear timer on unmount.
  - `prefers-reduced-motion: reduce` → no slide animation (instant show/hide).

**Layout:** Wrap app in `ToastProvider` inside `I18nProvider` in `app/layout.tsx`.

**Triggers:**

- In `TransmutationPanel.handleDownload`, after `downloadResult(...)`, call `toast({ message: t('toast.downloadStarted'), variant: 'success' })`.
- **Do not** also toast on `success` status if it duplicates the download feedback — one confirmation path only.

**i18n:**

```typescript
toast: {
  downloadStarted: "Download started",
  dismiss: "Dismiss",
}
```

(+ Spanish equivalents)

**A11y:** Container `aria-live="polite"`, `role="status"`. Dismiss button has `aria-label={t('toast.dismiss')}`.

### R4 — Locale-aware metadata (cookie bridge)

**Problem:** SSR `generateMetadata` cannot read `localStorage`. Client locale is in `camaleon-locale` localStorage key today.

**Cookie constant:** `LOCALE_COOKIE_NAME = 'camaleon-locale'` (export from `lib/i18n/index.ts` alongside `LOCALE_STORAGE_KEY`).

**Sync cookie:**

1. In `I18nProvider.setLocale`, also set:
   `document.cookie = \`${LOCALE_COOKIE_NAME}=${l}; path=/; max-age=31536000; SameSite=Lax\``
2. In `app/layout.tsx` inline bootstrap script, after reading `localStorage` locale, write the same cookie so the **first full navigation** after load has SSR locale.

**Metadata helper:** `frontend/src/lib/i18n/metadata.ts`

```typescript
import type { Locale } from "./types";

export function resolveLocaleFromCookie(value: string | undefined): Locale;
export function getRootMetadata(locale: Locale): Metadata;
export function getToolMetadata(locale: Locale, toolId: string, toolTitle: string): Metadata;
```

- Use existing dictionary `meta` sections; extend dictionaries with per-tool metadata if needed:

```typescript
meta: {
  title: "...",
  description: "...",
  tools: {
    "jpg-to-png": { title: "...", description: "..." },
    "png-to-jpg": { title: "...", description: "..." },
  },
}
```

**Update pages:**

- `app/layout.tsx`: replace static `export const metadata` with `export async function generateMetadata()` using `cookies()` from `next/headers` + `getRootMetadata`.
- `app/transmute/[slug]/page.tsx`: `generateMetadata` uses cookie locale + `getToolMetadata`.
- Include OpenGraph basics: `openGraph: { title, description, locale: locale === 'es' ? 'es_ES' : 'en_US', type: 'website' }`.

**Deferred (document in report):** `[locale]` URL segments, hreflang alternates, middleware — not in this task.

### R5 — Version & SPEC amendment

Bump frontend to **v1.1.0**:

- `frontend/package.json`
- `Footer.tsx` version string

Update `docs/SPEC.md`:

- **§7.5:** Mark `TransparencyNotice`, `PageDropOverlay`, `Toast` ✅; note `detect-png-alpha.ts`.
- **§7.8:** Add row **UI-6 ✅** (v1.1.0): transparency notice, page drop overlay, toasts, locale metadata cookie bridge.
- **§5.11.2 / §5.11.6:** Note transparency pre-notice UX delivered (UI-6).
- Bump SPEC version; Amendment Log → `ui_6_ux_polish_layer_done.md`.

**Do not** modify `docs/ROADMAP.md`.

### R6 — Verification

| Check | Must pass |
|-------|-----------|
| `npm run build` | Production build succeeds |
| R1 | Transparent PNG (RGBA or tRNS) on PNG→JPG → notice visible; changes when background swatch changes |
| R1 negative | Opaque PNG → no notice; JPG→PNG tool → never shows notice |
| R2 | Drop file anywhere on tool page while idle/staged → file staged |
| R2 | Overlay hidden during `processing` |
| R3 | Download click → toast appears, auto-dismisses |
| R4 | Switch to ES → refresh → Spanish `<title>` on home and tool page |
| Regression | Worker transmutation, UI-5 focus/motion, theme toggle, options controls unchanged |

Optional: add **unit tests** for `detectPngAlpha` only if you add a test runner — **not required**; document manual verification with minimal PNG fixtures built inline in the report.

---

CONSTRAINTS

- **No Rust/Wasm/Worker/hook protocol changes.**
- **No new npm dependencies** (no react-hot-toast, no framer-motion).
- **Tokens only** — no hardcoded hex in component styling (swatch data values OK).
- **NFR-1:** All processing stays local; alpha detection is client-side byte scan only.
- **i18n:** Every new user-facing string in **both** EN and ES dictionaries.
- **UI-5:** Do not regress `role="alert"`, reduced motion, ToolCard affordance, focus rings.
- English for code/comments/report.

---

DELIVERABLES

1. `detect-png-alpha.ts` (+ optional `color-label.ts`) (R1).
2. `TransparencyNotice.tsx` + panel integration (R1).
3. `usePageFileDrop.ts` + `PageDropOverlay.tsx` (R2).
4. `Toast.tsx` + `ToastProvider.tsx` + layout wiring (R3).
5. Cookie sync + `metadata.ts` + `generateMetadata` updates (R4).
6. Dictionary + SPEC amendments + version bump (R5).
7. `docs/reports/ui_6_ux_polish_layer_done.md` per GOVERNANCE §5.

---

DEFERRALS (list in report §6)

- `[locale]` URL routing / hreflang (UI-7)
- Landing-page global drop → auto-route to tool
- WebP, batch, encoder swap, Playwright E2E
- Auto-download (explicit download button remains)

---

EXIT GATE (self-check before report)

- [ ] All four requirements R1–R4 implemented.
- [ ] EN + ES strings complete for new copy.
- [ ] No backend/Wasm changes.
- [ ] `npm run build` passes.
- [ ] SPEC §7.5/§7.8 updated; frontend v1.1.0; amendment logged.
- [ ] Manual verification checklist filled in report.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
