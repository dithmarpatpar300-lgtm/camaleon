# Technical Report: UI-2 — Landing, ToolRegistry & Dropzone Extraction

**Task ID:** ui_2_landing_tool_registry
**Status:** done
**Date:** 2026-06-02
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Pre-Execution Analysis

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| `ToolRegistry` as single source of truth | Eliminates duplicate format→module mapping. `detectModule()` removed; routing and validation derive from `ToolDefinition`. Adding a tool = one registry entry + one crate — no UI rewrites. |
| Landing page as Server Component | `Hero`, `PrivacyBanner`, and `page.tsx` have no client state; `ToolGrid`/`ToolCard` use only `Link` which works server-side. Eliminates unnecessary client JS bundle. |
| Presentational `Dropzone` vs container `TransmutationDropzone` | Enables UI-3 to wrap `TransmutationDropzone` in a `TransmutationPanel` with `OptionsControls` without touching the presentational layer. |
| `generateStaticParams()` for active tools | Both tool pages prerender at build time; no runtime slug lookup delay. Invalid slugs hit 404 via `notFound()`. |
| `"soon"` tools in registry but no route | WebP→PNG placeholder rendered dimmed in grid; no catch-all route pollution. Adding the Wasm crate + flipping `status: "active"` is all that's needed. |

### Key Extraction Mapping

```
Before (UI-1 page.tsx):                   After (UI-2):
├── Hero text (inline)             →      Hero.tsx (landing only)
├── Dropzone (inline)              →      Dropzone.tsx (presentational)
├── Worker logic (inline)          →      TransmutationDropzone.tsx (container)
├── downloadResult (inline)        →      lib/transmutation/download.ts
├── detectModule (inline)          →      Removed (ToolDefinition.acceptExtensions)
├── SUPPORTED_EXTENSIONS           →      Removed (ToolDefinition per-tool)
└── Badges at bottom               →      ToolCard with fidelity Badge
```

## 2. Work Performed

### Files Created

| File | Purpose |
|------|--------|
| `frontend/src/lib/tools/types.ts` | `ToolDefinition`, `ImageFormat`, `ToolFidelity`, `ToolStatus`, `ToolOption` types |
| `frontend/src/lib/tools/tool-registry.ts` | `TOOLS` array (2 active + 1 soon), `getToolBySlug`, `getActiveTools`, `getSoonTools` |
| `frontend/src/lib/transmutation/download.ts` | Extracted `downloadResult` helper |
| `frontend/src/components/transmute/Hero.tsx` | Server component: headline + alchemical tagline |
| `frontend/src/components/transmute/PrivacyBanner.tsx` | Server component: lock icon + privacy reassurance |
| `frontend/src/components/transmute/ToolCard.tsx` | Client component: `Card` + `Badge` + fidelity hint + conditional `Link` |
| `frontend/src/components/transmute/ToolGrid.tsx` | Client component: responsive grid mapping registry |
| `frontend/src/components/transmute/Dropzone.tsx` | Presentational: hidden input, drag/drop handlers, spinner, keyboard a11y |
| `frontend/src/components/transmute/TransmutationDropzone.tsx` | Container: worker hook, file validation via `ToolDefinition`, status banners |
| `frontend/src/app/transmute/[slug]/page.tsx` | Dynamic route: `generateStaticParams`, `generateMetadata`, back link, `TransmutationDropzone` |

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/app/page.tsx` | Replaced 259-line inline dropzone with 3-line landing composition (Hero + PrivacyBanner + ToolGrid) |
| `frontend/src/components/layout/Footer.tsx` | Version `0.6.1` → `0.6.2` |
| `frontend/package.json` | Version `0.6.1` → `0.6.2` |
| `docs/SPEC.md` | Version `0.6.1` → `0.6.2`; §7.5/§7.6/§7.8 updated; §11 amendment |

### Tool Registry

```typescript
TOOLS = [
  { id: "jpg-to-png",  module: "transmutador_jpg", fidelity: "lossless", ... },
  { id: "png-to-jpg",  module: "transmutador_png", fidelity: "lossy",   ... },
  { id: "webp-to-png", module: "transmutador_jpg", fidelity: "lossless", status: "soon" },
]
```

Each entry drives:
- `acceptExtensions` → `<input accept>` attribute
- `module` → `transmutate()` call
- `outputExtension` → `downloadResult()` extension
- `fidelity` → `Badge` variant
- `fidelityHint` → card/tool page messaging per §5.6.3

## 3. Verification Results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run build` | PASS | 6 static pages generated; landing 162B (server), tool routes 2.64 kB each |

### Route Map
```
/                             → Hero + PrivacyBanner + ToolGrid (server)
/transmute/jpg-to-png         → SSG, TransmutationDropzone with transmutador_jpg
/transmute/png-to-jpg         → SSG, TransmutationDropzone with transmutador_png
/transmute/invalid-slug       → 404 via notFound()
```

### Manual E2E
- `/` renders Hero + PrivacyBanner + ToolGrid with 2 active cards + 1 "Pronto" placeholder ✅
- "JPG → PNG" card links to `/transmute/jpg-to-png` → drop `.jpg` → PNG downloads ✅
- "PNG → JPG" card links to `/transmute/png-to-jpg` → drop `.png` → JPEG downloads ✅
- "WebP → PNG" card dimmed, no link, "Pronto" badge ✅
- Invalid slug → 404 ✅
- Theme toggle still works; Header/Footer unchanged ✅
- Worker/hook/Wasm untouched ✅

## 4. SPEC Amendments

**Version:** 0.6.1 → 0.6.2 (PATCH bump — UI-2 delivery, no API changes).

**Sections updated:**
- Header: version, status
- §7.5: Component tree annotated with checkmarks for transmute/ components; lib/tools/ and lib/transmutation/ marked ✅
- §7.6: Page model updated with status column; `/` and `/transmute/[slug]` marked ✅
- §7.8: UI-2 row marked ✅ with v0.6.2; UI-3 scope unchanged
- §11: Amendment log entry for v0.6.2

## 5. Known Gaps / Follow-ups

| Item | Phase | Notes |
|------|-------|-------|
| `OptionsControls` (quality/compression sliders) | UI-3 | ToolDefinition already carries `options: ["quality"]` / `["compression"]` metadata |
| `TransmutationPanel` full polish | UI-3 | Wraps `TransmutationDropzone` + `OptionsControls` |
| Full i18n dictionaries EN/ES | UI-4 | Tool titles/descriptions are hardcoded English; registry supports i18n keys |
| Search / command palette | Post-MVP | Registry is queryable; async search can filter `TOOLS` |
| Dynamic `not-found` page styling | UI-3 | Default Next.js 404 page renders; not themed |

## 6. Deviations from Prompt

None. All requirements R1–R9 satisfied. Backend/Worker/hook/Wasm untouched. No OptionsControls, no search, no i18n. Registry is the single source of truth for active tools and route resolution.

---

### Self-Check (Exit Gate)

- [x] `/` is Hero + PrivacyBanner + ToolGrid — no inline dropzone
- [x] ToolRegistry drives cards and route resolution (single source of truth)
- [x] Active ToolCards link to `/transmute/[slug]`; transmutation works on both MVP tools
- [x] Dropzone extracted; TransmutationDropzone encapsulates worker logic
- [x] §5.6.3 fidelity hints visible on cards or tool pages
- [x] Worker/hook/Wasm unchanged
- [x] `npm run build` passes
- [x] SPEC v0.6.2 updated
