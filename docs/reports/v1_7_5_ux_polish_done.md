# Technical Report: v1.7.5 — UX Polish (ScrollVeil, Theme Fade, Header Controls)

**Task ID:** v1_7_5_ux_polish  
**Status:** done  
**Date:** 2026-06-07  
**Agent:** Chief Architect (Cursor)  
**Version:** Frontend v1.7.5 (includes v1.7.4 hotfix baseline already on `master`)

## 1. Summary

Shipped premium bounded-scroll UX for the tool grid and Command Palette, synchronized overlay scrollbar, modal scroll-lock, animated header utility controls, and a smooth dark↔light theme crossfade — without regressing v1.7.4 MetricsPanel behavior for zero-option encode tools.

## 2. Work Performed

### Files Created

| File | Purpose |
|------|--------|
| `frontend/src/components/ui/ScrollVeil.tsx` | Fixed-height scroll region with top/bottom frosted veils; rAF-synced opacity; `main` and `palette` variants |
| `frontend/src/lib/scroll-lock.ts` | Reference-counted `html.camaleon-scroll-locked` for modal overlays |
| `frontend/src/hooks/useScrollLock.ts` | React hook wrapping scroll-lock acquire/release |
| `docs/prompts/phase5_jpg_to_webp.md` | OpenCode prompt for Phase 5.4 JPEG→WebP (Tier 1 final route) |

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/app/globals.css` | ScrollVeil veil tokens (`background-color` + accent `background-image` + `mask-image`); `camaleon-theme-fade`; animated language pill; theme icon entrance |
| `frontend/src/components/transmute/ToolGrid.tsx` | Wrapped tool cards in `ScrollVeil` (`variant="main"`) |
| `frontend/src/components/layout/CommandPalette.tsx` | Wrapped tool list in `ScrollVeil` (`variant="palette"`) |
| `frontend/src/components/layout/LanguageSelector.tsx` | Sliding circular pill driven by `--active-idx`; scalable `LOCALES` array |
| `frontend/src/components/layout/ThemeToggle.tsx` | `!rounded-full` circular border; `theme-icon-in` entrance on toggle |
| `frontend/src/components/layout/UtilityCluster.tsx` | `rounded-full` pill container |
| `frontend/src/providers/ThemeProvider.tsx` | `camaleon-theme-fade` class during user-initiated theme switch |
| `frontend/src/hooks/useOverlayScrollbar.ts` | Direct DOM thumb positioning via rAF |
| `frontend/src/components/layout/OverlayScrollbar.tsx` | Thumb ref + hide when scroll locked |
| `frontend/src/hooks/useCommandPalette.ts` | Scroll lock while palette open |
| `frontend/src/components/layout/Footer.tsx` | Scroll lock while shortcuts dialog open |
| `frontend/package.json` | v1.7.5 |

## 3. Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Veil `background-color: var(--color-bg-*)` separate from accent `background-image` | CSS cannot interpolate `linear-gradient` shorthand; solid color participates in `camaleon-theme-fade` — eliminates veil flash during theme switch |
| `mask-image` on veil elements | Leading edge always transparent — no hard green/dark fringe against container border |
| rAF + direct DOM for veil opacity and scrollbar thumb | Avoids React render lag during scroll |
| `camaleon-theme-fade` only on user toggle | Initial load / stored-theme hydration stays instant; respects `prefers-reduced-motion` |
| `LOCALES` readonly array in `LanguageSelector` | Pill animation scales to N locales; popover pattern documented for 4+ languages |
| `!rounded-full` on `ThemeToggle` | `IconButton` base uses `rounded-lg`; Tailwind order requires `!important` override |

## 4. Verification

| Check | Result |
|-------|--------|
| Tool grid bounded scroll + bottom/top veils | Manual — veils appear when overflow |
| Command Palette scroll + veils | Manual |
| Theme dark↔light crossfade | Manual — no veil color flash |
| Language EN↔ES pill slide | Manual |
| Theme icon circular + entrance animation | Manual |
| Overlay scrollbar thumb sync | Manual |
| Modal scroll lock (palette + shortcuts) | Manual |
| `MetricsPanel` on zero-option tools (v1.7.4) | Not regressed |

## 5. Regression Notes for Phase 5.4

When adding `jpg-to-webp` (sixth tool), verify:

- `ToolGrid` `ScrollVeil` still caps height and shows veils with 6 cards
- New tool route appears in static params (9 → 10)
- Theme transition does not flash veils (keep `background-color` token pattern)
- Do not remove `MetricsPanel` for tools without `optionSpecs`
