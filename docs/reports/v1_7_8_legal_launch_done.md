# v1.7.8 — Legal shields & launch-readiness baseline

**Date:** 2026-06-07  
**Author:** Chief Architect (Cursor)  
**App version:** `frontend/package.json` → **1.7.8**

---

## Summary

Public-launch trust layer: bilingual legal pages, minimal footer, and landing privacy link — aligned with Camaleon's local-only architecture (no uploads, no analytics, MIT license).

---

## Delivered

### Legal pages (`/about`, `/contact`, `/privacy`, `/terms`)

- Content in `frontend/src/lib/legal/content/{en,es}.ts` — honest copy matching actual behavior.
- Shared `LegalDocument` + `LegalPageShell` with ambient glow, document card, section animations.
- Per-page `generateMetadata` via cookie locale.

### Footer redesign

- Single-tier minimal layout: legal links · GitHub · Shortcuts.
- Copyright line: `© 2026 Camaleon · MIT · v1.7.8`.
- Removed redundant trust pill (already on landing `PrivacyBanner`).

### Landing

- `PrivacyBanner` links to `/privacy`.

### Site constants (`lib/site.ts`)

- `SITE_NAME`, `COPYRIGHT_YEAR`, `SITE_LICENSE`, `SITE_CONTACT_ISSUES_URL`.

---

## Launch checklist (recommended before broad traffic)

| Item | Status |
|------|--------|
| Six active tools (JPG↔PNG, WebP suite) | ✅ |
| Legal pages EN + ES | ✅ |
| Privacy model documented | ✅ |
| Footer + copyright | ✅ |
| Production deploy (Cloudflare Pages / Vercel) | ⏳ |
| Git tag `v1.7.8` | ⏳ |
| Custom domain + HTTPS | ⏳ |
| Playwright smoke E2E | ⏳ deferred |
| Contact email (optional) | ⏳ GitHub Issues only |

---

## Files touched

- `frontend/src/lib/legal/**`
- `frontend/src/components/legal/**`
- `frontend/src/app/{about,contact,privacy,terms}/`
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/app/globals.css` (`.site-footer`, `.legal-*`)
- `frontend/src/lib/i18n/dictionaries/{en,es}.ts`
- `frontend/src/lib/i18n/metadata.ts`
- `frontend/src/lib/site.ts`
