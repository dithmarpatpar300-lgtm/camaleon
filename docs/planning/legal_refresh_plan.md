# Legal Footer Refresh — v3.4.0

**Status:** Implemented in v3.4.0  
**Revision ID:** `2026-06-v3.4`  
**Scope:** About, Contact, Privacy, Terms — full content rewrite + minimal UI + dedicated user notice

---

## Goals

1. Align legal copy with Camaleon **v3.4** (25 tools, optimize lane, batch, PWA, offline, settings S1–S7, risk mode, unified storage).
2. Replace v1.x-era visual language (glow + stacked cards) with typographic minimal layout.
3. Notify existing users via **LegalRefreshNotice** (separate from What's New) to review Privacy and Terms.

---

## Content outline — About

| ID | EN title | Key points |
|----|----------|--------------|
| `what-is` | What Camaleon is | Local-first image transmutation in the browser; no accounts |
| `capabilities` | What you can do | 25 tools; Convert + Optimize lanes; Universal handoff; batch; formats (JPEG, PNG, WebP, AVIF, SVG, GIF, TIFF, BMP, TGA, ICO) |
| `how-it-works` | How it works | Rust → Wasm in Web Worker; engine v1.6.0; files never uploaded |
| `privacy-first` | Privacy by design | StripAll metadata default; originals untouched |
| `pwa-offline` | Install & offline | PWA install; Serwist SW; optional full toolkit precache (S5) |
| `open-source` | Open source | MIT; public repo |
| `what-we-dont-do` | What we do not do | No upload, analytics, ads, sale of file data |
| `project-status` | Project status | Active development; honest lossless/lossy labeling |

---

## Content outline — Contact

| ID | EN title | Key points |
|----|----------|--------------|
| `overview` | How to reach us | GitHub-first open source project |
| `bugs` | Bug reports | Template, repro steps, no personal files in issues |
| `features` | Feature requests | Template |
| `privacy-legal` | Privacy & legal questions | GitHub issues; link Privacy page |
| `translations` | Translations | EN/ES in app; contributions welcome |
| `security` | Security vulnerabilities | Private advisory |
| `releases` | Release notes | Settings → Updates / What's New drawer |
| `no-support` | No commercial support | MIT as-is |

---

## Content outline — Privacy

| ID | EN title | Key points |
|----|----------|--------------|
| `summary` | Summary | callout: files stay on device |
| `files` | Files & transmutation | Worker/Wasm flow |
| `no-collection` | What we do not collect | List |
| `cookies` | Cookies | locale, theme, tool lane/tab/density (SSR) |
| `local-storage` | localStorage | Table synced with `lib/storage/keys.ts` + user-settings sections |
| `session-storage` | sessionStorage | force-offline debug key |
| `cache-offline` | Cache & offline | SW precache; S5 opt-in |
| `app-updates` | App update checks | `/version.json` beacon when enabled |
| `analytics` | Analytics & third parties | None in app code |
| `metadata` | Metadata in outputs | StripAll |
| `risk-mode` | Risk mode acknowledgment | acknowledgedAt in user-settings |
| `legal-revision-ack` | Legal revision notice | camaleon-legal-revision-ack |
| `children` | Children | No collection |
| `changes` | Changes to this policy | Revision date |
| `contact` | Contact | GitHub |

---

## Content outline — Terms

| ID | EN title | Key points |
|----|----------|--------------|
| `service` | The service | Browser-based tools; static hosting |
| `no-warranty` | No warranty | As-is; not for medical/legal/forensic |
| `responsibility` | Your responsibility | Files, backups, copyright |
| `batch` | Batch & multi-file | User responsibility for selections |
| `optimize` | Optimize results | No guarantee of size reduction |
| `risk-mode` | Risk mode | callout warning; elevated limits at user risk |
| `pwa-offline` | PWA & offline | No uptime guarantee offline |
| `app-updates` | App updates | Reload may interrupt session |
| `acceptable-use` | Acceptable use | Lawful use |
| `intellectual-property` | Intellectual property | MIT; user owns local outputs |
| `liability` | Limitation of liability | Standard limitation |
| `changes` | Changes | Revision date |
| `governing-law` | Governing law | English; consumer protections |

---

## UI changes

- Remove `.legal-page-glow`, heavy `.legal-document` card, section hover cards
- Add `LegalSubnav`, `LegalToc` (Privacy/Terms), block renderers (callout, table)
- `legalRevision` field on all pages: `2026-06-v3.4`

---

## User comms

- **LegalRefreshNotice** modal on home when `camaleon-legal-revision-ack` ≠ current revision
- Shown after onboarding, before release changelog modal
- What's New v3.4.0 mentions legal refresh briefly; does not replace notice

---

## ES mirror

All section IDs identical; titles and body translated in `content/es.ts`.
