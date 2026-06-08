# Release Comms Module — Onboarding + Changelog (v1.10 planning)

> **Status:** ✅ Shipped on `main` (folded into v1.9.0). Formal v1.10.0 manifest entry + SPEC §7.11 policy pending next release bump.  
> **Codename:** `ReleaseComms` (or product name: **What's New** / **Novedades**).  
> **Privacy:** No server state; all dismissal/version tracking is `localStorage` only.

---

## 1. Problem statement

Camaleon ships meaningful updates (v1.9.0: 4 new format families, adaptive limits, astro downscale) but users discover features only by accident. We need:

| Audience | Need | Trigger |
|----------|------|---------|
| **First-time visitor** | Understand what Camaleon is, privacy model, 10 tools, limits honesty | First landing on `/` |
| **Returning visitor** | Learn what changed since their last seen version | `APP_VERSION` > `lastSeenRelease` |
| **Anyone** | Re-read past updates after dismissing a modal | Persistent **What's New** entry point |

All flows must be **optional, dismissible, accessible, bilingual (EN/ES)**, and consistent with privacy (no analytics on read/dismiss unless explicitly opted in later).

---

## 2. Product vision (refined)

### 2.1 Two surfaces, one content system

Do **not** build two separate systems. Build **one release catalog** consumed three ways:

```
content/releases/
  manifest.ts          ← ordered list of ReleaseEntry ids + semver gates
  v1.9.0.ts            ← structured entry (i18n keys or inline EN/ES)
  v1.7.9.ts
  ...

manifest drives:
  ┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
  │ OnboardingPanel │     │ ReleaseNotesModal    │     │ WhatsNewPage / Drawer │
  │ (first visit)   │     │ (returning + bump)     │     │ (footer link)       │
  └─────────────────┘     └──────────────────────┘     └─────────────────────┘
```

### 2.2 Onboarding (first visit)

**Not a multi-step joyride** (fragile, annoying on mobile). Prefer a **single floating panel** anchored bottom-right or centered card on landing:

- **Headline:** privacy + local processing (trust first)
- **Bullets:** 10 tools, EN/ES, dark mode, no upload
- **Technical honesty block (collapsible):** Wasm workers, 40 MP / 150 MB limits, metadata strip
- **CTA primary:** "Explore transmutations" (scroll to tools or open command palette hint)
- **CTA secondary:** "Read full guide" → expands inline or links to `/about`
- **Dismiss:** "Got it" → never show onboarding again

**Do not block** the page; no modal trap without focus escape. Use `role="dialog"` + focus trap only if modal variant.

### 2.3 Release notes (returning user, version bump)

When `package.json` version > `localStorage.camaleon-last-seen-release`:

- Show **ReleaseNotesModal** on first visit to `/` (main) after deploy — not on every route (avoid interrupting mid-conversion).
- Content from `releases/v1.9.0.ts`: grouped sections (New formats, Improvements, Fixes, Technical).
- **Dismiss:** sets `lastSeenRelease = APP_VERSION`
- **"Remind me later"** (optional): snooze 24h without marking seen — useful if user opened site briefly.

If user lands directly on `/transmute/png-to-jpg` after deploy, defer modal until they hit `/` OR show a **non-blocking toast** with link "See what changed" (less intrusive).

### 2.4 Persistent "What's New" (footer / niche)

**Footer label (EN):** `What's new` · **ES:** `Novedades`

Opens:
- **Option A:** Slide-over drawer (matches Command Palette acrylic)
- **Option B:** `/whats-new` static page (SEO-friendly, shareable)

List all `ReleaseEntry` from manifest, newest first. Each entry accordion: version badge, date, summary, expandable detail. Current version highlighted.

---

## 3. Data model

```typescript
type ReleaseAudience = "onboarding" | "changelog";

type ReleaseHighlight = {
  id: string;
  icon?: "sparkle" | "shield" | "tool" | "cpu"; // maps to lucide or inline svg
  titleKey: string;   // i18n
  bodyKey: string;
};

type ReleaseEntry = {
  version: string;              // semver "1.9.0"
  date: string;                 // ISO "2026-06-08"
  titleKey: string;
  summaryKey: string;           // one-liner for list
  highlights: ReleaseHighlight[];
  technicalKey?: string;        // optional deep paragraph
  tags?: ("feature" | "fix" | "security" | "perf")[];
};

type ReleaseManifest = {
  entries: ReleaseEntry[];
  /** Content shown only on first visit (can reference latest or be static). */
  onboarding: {
    titleKey: string;
    sections: ReleaseHighlight[];
    technicalKey?: string;
  };
};
```

**Single source of truth:** adding v1.10.0 = one new file + manifest line. Footer list and modal both update automatically.

---

## 4. Client state (localStorage)

| Key | Type | Purpose |
|-----|------|---------|
| `camaleon-onboarding-complete` | `"1"` | First-visit panel dismissed |
| `camaleon-last-seen-release` | `"1.9.0"` | Changelog modal acknowledged |
| `camaleon-release-snooze-until` | epoch ms | Optional "remind later" |

**Version compare:** use semver-aware `compare(APP_VERSION, lastSeen)` (or simple string equality if we only ever bump minor).

**Migration:** if `onboarding-complete` absent but `lastSeen` exists (legacy users), skip onboarding.

**Privacy copy** in `/privacy`: document these keys alongside locale/theme.

---

## 5. Architecture (frontend)

```
frontend/src/lib/releases/
  manifest.ts
  types.ts
  compare-version.ts
  useReleaseComms.ts          ← hook: shouldShowOnboarding, shouldShowChangelog, dismiss*

frontend/src/components/release-comms/
  OnboardingPanel.tsx         ← floating card, landing only
  ReleaseNotesModal.tsx       ← version bump
  WhatsNewDrawer.tsx          ← footer trigger
  ReleaseHighlightList.tsx    ← shared bullets
  ReleaseCommsHost.tsx        ← mounts in layout; orchestrates one-at-a-time

layout.tsx                    ← <ReleaseCommsHost /> inside providers
Footer.tsx                    ← link triggers WhatsNewDrawer
```

**Orchestration rules (`ReleaseCommsHost`):**

1. Never show onboarding + changelog simultaneously — priority: changelog if both eligible? **No:** new user gets onboarding only; changelog requires `onboarding-complete`.
2. Respect `prefers-reduced-motion` — fade only, no slide acrobatics.
3. Respect route: onboarding only on `/`; changelog on `/` (configurable).
4. Z-index below Command Palette, above content.

---

## 6. i18n strategy

- Release content: keys in `dictionaries/en.ts` under `releases.v190.*` OR co-located `releases/v1.9.0.en.ts` imported by manifest (better for long changelog text).
- Keep **product/marketing** copy in i18n files; keep **version-specific** copy in release modules to avoid bloating main dictionary.

---

## 7. v1.9.0 seed content (first entry)

Use this as the template for `releases/v1.9.0.ts`:

**Highlights:**
- 10 conversion tools (GIF + BMP suites)
- GIF frame picker + GIF89a compositing
- Adaptive limits (50 MB soft / 150 MB hard / 40 MP)
- Science imagery downscale (4K–8K presets)
- Wasm worker memory recycle on navigation
- Full EN/ES

**Technical (collapsible):** Rust/Wasm in Web Workers, StripAll metadata, client-only resize before Wasm.

---

## 8. Implementation phases (dev)

| Phase | Scope | Version target |
|-------|-------|----------------|
| **RC-1** | Types, manifest, v1.9.0 entry, `useReleaseComms`, localStorage | v1.10.0-alpha |
| **RC-2** | `OnboardingPanel` on `/` | |
| **RC-3** | `ReleaseNotesModal` on version bump | |
| **RC-4** | Footer `What's new` + drawer + i18n ES | |
| **RC-5** | A11y audit, reduced motion, privacy doc update | |
| **RC-6** | Optional: extract release body from GitHub tag at build time (future) | v1.11+ |

**Out of scope v1:** multi-step tour highlighting DOM nodes, server-side "read receipts", push notifications.

---

## 9. UX copy — footer naming options

| EN | ES | Tone |
|----|-----|------|
| **What's new** | **Novedades** | Friendly, standard |
| Release notes | Notas de versión | Technical |
| Updates | Actualizaciones | Generic |

**Recommendation:** **What's new / Novedades** in footer; modal title **"Camaleon 1.9.0"** with subtitle "Here's what changed".

---

## 10. Success metrics (privacy-safe)

Without server tracking:

- Optional dev-only `console.debug` when panels show/dismiss
- Future: anonymous aggregate only if user opts in (backlog)

Qualitative: fewer "how do I convert GIF?" issues in GitHub feedback.

---

## 11. Relation to GitHub Releases

| Source | Role |
|--------|------|
| Git tag `v1.9.0` + GitHub Release | Developer/operator changelog (markdown) |
| `lib/releases/v1.9.0.ts` | In-app user-facing copy (shorter, bilingual, UX-toned) |

Keep in sync manually per release (release checklist item). Future: script parses `CHANGELOG.md` → generates TS (RC-6).

---

## 12. Open questions for dev planning session

1. Modal on `/` only vs toast on any route when version bumps?
2. Drawer vs `/whats-new` page for persistent list?
3. Show onboarding again via "?" in footer (reset key)?
4. Include screenshots/GIFs in release entries (asset pipeline)?

---

## Related

- `docs/ROADMAP.md` — Tier 2 Wave 2 after Release Comms
- `frontend/src/lib/site.ts` — `APP_VERSION`
- `frontend/src/lib/prefs.ts` — localStorage patterns
