# Settings / Opciones Panel — System Plan

> **Status:** **S5 shipped** v3.0.0 · **Offline mode** v3.0.1 · **Updates** v3.2.6 · **S4** v2.3.4 · **S3** v2.3.3 · **S2** v2.3.2 · **S1** v2.3.1  
> **Scope:** User-facing preferences (local-first, `localStorage` only)  
> **Doctrine:** NFR-1 privacy — no server sync; document keys in `/privacy`  
> **SPEC anchor:** §7.13 User Settings Panel

---

## 1. Purpose

Consolidate scattered browser preferences into a single **Settings drawer** while keeping quick-access controls in the header (`UtilityCluster`). Settings exposes choices that improve comprehension and comfort without weakening engine safety doctrine (§5.7, §5.10, §5.11).

**S1 (shipped scope):** drawer shell, theme, language, release-comms preferences.  
**S2–S5:** transmutation defaults, performance overrides, notice rail density, offline toolkit (Tier 3.4).

---

## 2. Preference taxonomy

| Layer | Examples | Affects Wasm encode? | Storage |
|-------|----------|----------------------|---------|
| **A — Global UX** | Theme, locale, animations | No | `localStorage` + cookies (SSR) |
| **B — Comms** | Changelog on update, onboarding reset | No | `camaleon-user-settings-v1` |
| **C — Transmutation defaults** | JPEG quality, PNG compression, alpha background, AVIF quality/speed | Yes — `TransmutationOptions` | `camaleon-user-settings-v1.transmutation` ✅ S2 |
| **D — Performance** | Result cache, auto-estimate, resource tier | Yes — worker meta | `camaleon-user-settings-v1.performance` ✅ S3 |
| **E — Notices & prepare** | Rail density, prepare progress | No | `camaleon-user-settings-v1.notices` ✅ S4 |
| **E — Session / tool** | Sliders in `StagedWorkspace` | Yes — per conversion | React state (not Settings) |

**Model:** **Hybrid** — global for UX and performance; family defaults for encode knobs; per-tool session overrides in the workspace panel.

---

## 3. What we expose (roadmap)

### S1 — Shell ✅ (this phase)

| Setting | Why | Internal impact |
|---------|-----|-----------------|
| Language EN/ES | Already in header; mirror in Settings | `I18nProvider`, cookie |
| Theme light/dark | Idem | `ThemeProvider`, cookie |
| Show changelog on update | User control over Release Comms modal | `useReleaseCommsState` |
| View release history | Entry to `WhatsNewDrawer` | UI navigation |
| Show welcome again | Reset onboarding flag | `camaleon-onboarding-complete` |

### S2 — Transmutation defaults ✅ (v2.3.2)

| Default | Tools affected | Wasm field |
|---------|----------------|------------|
| JPEG quality | → JPEG (non-AVIF) | `quality` |
| PNG compression | → PNG | `compression` |
| Alpha flatten background | → JPEG with alpha | `background` |
| AVIF quality / speed | → AVIF encode | `quality`, `speed` |

Pattern: `resolveSpecDefault(tool, spec)` → user override ?? registry baseline.

### S3 — Performance ✅ (v2.3.3)

| Setting | Maps to |
|---------|---------|
| Result cache | `enableResultCache`, `cacheMaxEntries` |
| Auto-estimate on load | `autoEstimate` in `ResourceProfile` |
| Performance profile | Override `computeResourceProfile` tier |

### S4 — Notices & accessibility ✅ (v2.3.4)

| Setting | Maps to |
|---------|---------|
| Notice rail detail (`normal` / `minimal`) | Filter INFO severities in `NoticeRail` |
| Prepare progress style (`ring` / `bar`) | `notices-prefs.ts` — surfaced in S4 |

### S5 — Storage / offline ✅ (v3.0.0 + v3.0.1)

See **`docs/planning/tier3_4_pwa_offline_analysis.md` §6** for full product doctrine.

| Setting | Maps to | Default |
|---------|---------|---------|
| **Download all conversion tools** (opt-in toggle) | Service Worker Layer 3 precache — all `/wasm/transmutador_*` | **OFF** |
| **Offline mode** (v3.0.1) | Tab-scoped cache-only — `force-offline.ts` + SW message | **OFF** |
| **Offline status** | SW active, connectivity pip, cached engine coverage | Read-only |
| **Storage used** | Cache Storage size estimate | Read-only |
| **Clear offline cache** | `caches.delete()` + reset precache pref | Action |

**Doctrine:** Never force bulk download. Model B (shell + lazy Wasm per tool) is automatic; Model C (full toolkit) requires explicit user consent in Settings.

### Updates ✅ (v3.2.6)

| Setting | Maps to | Default |
|---------|---------|---------|
| **Auto-detect updates** | SW poll + `/version.json` beacon → `AppUpdateNotice` | **ON** |
| **Check now** | Manual `pollForUpdates()` from Settings | Action |
| **Show changelog on update** | Post-reload `ReleaseNotesModal` | ON |
| **Open What's New / Reset welcome** | Release comms navigation | Actions |

**Files:** `updates-prefs.ts`, `UpdatesSettingsSection.tsx`, `AppUpdateProvider.tsx`.

### S7 — Batch & Universal (planned, pre–Slice C)

See analysis in Tier 3.6 planning — prefs to ship **before or with Slice C**:

| Setting | Purpose | Default |
|---------|---------|---------|
| **Universal multi-drop** | Disable homogeneous multi-file on home | ON |
| **Select all on batch load** | Initial checkbox state in batch workspace | all |
| **Mixed format policy** | `hint` (Slice B) → `picker` (Slice C) | hint |
| **Aggregate size warning** | Warn when total batch bytes exceed threshold | ON |
| **Unsupported skipped toast** | Toast when files filtered on dedicated route | ON |

**Files (planned):** `batch-universal-prefs.ts`, `BatchUniversalSettingsSection.tsx`.

---

## 4. What we do NOT expose

| Option | Reason |
|--------|--------|
| MAX_PIXELS / hard input MB cap | Safety NFR; TS↔Rust alignment |
| Preserve EXIF/metadata | StripAll product doctrine (§5.10) |
| Chroma subsampling 4:2:0 vs 4:4:4 | Not implemented (`refine_jpeg_encoder_swap`) |
| Disable output validation | Corruption risk (§5.11) |
| Disable worker recycle on route exit | Memory leak on Wasm heap |
| Lossy PNG mode | Not implemented; requires SPEC amendment |
| Hide WARN/ERROR notices | Would hide real operational risk |

---

## 5. Architecture (S1)

```
frontend/src/lib/prefs/
  prefs.ts              ← theme/locale bootstrap (existing)
  user-settings.ts      ← camaleon-user-settings-v1 schema
  transmutation-defaults.ts ← global encode defaults (S2)
  performance-prefs.ts      ← tier/cache/estimate overrides (S3)
  notices-prefs.ts          ← rail density + prepare progress (S4)

frontend/src/lib/transmutation/
  build-default-options.ts ← applies resolveSpecDefault per tool

frontend/src/components/settings/
  SettingsDrawer.tsx    ← surface-raised right drawer (matches WhatsNewDrawer)
  SettingsSection.tsx
  SettingsRow.tsx
  SettingsSwitch.tsx
  ThemeSegment.tsx
  LanguageSegment.tsx
  SettingsModeSegment.tsx
  PerformanceSettingsSection.tsx
  NoticesSettingsSection.tsx

frontend/src/providers/
  SettingsProvider.tsx  ← open/close + mount drawer

Header UtilityCluster → SettingsTrigger (gear)
ReleaseCommsProvider  → inside SettingsProvider (uses openWhatsNew)
```

**Drawer pattern:** Same shell as `WhatsNewDrawer` — `SurfaceDialog` + `slideInRight` / `PanelScrollFade` + `surface-raised`.

**Header rule:** Quick toggles remain in `UtilityCluster`; Settings is the canonical place for discovery and comms prefs.

**Theme selector (Settings panel):** Uses **static active cell** styling (`theme-segment-track`) — no sliding `lang-pill-thumb`. Language in Settings and header still use the animated pill. Rationale: sliding thumb desyncs with `html` theme crossfade (`camaleon-theme-fade`).

---

## 6. Storage keys

| Key | Purpose | S1 |
|-----|---------|-----|
| `camaleon-theme` | Theme | existing |
| `camaleon-locale` | Locale | existing |
| `camaleon-user-settings-v1` | JSON `{ showChangelogOnUpdate }` | **new** |
| `camaleon-onboarding-complete` | Onboarding dismissed | existing |
| `camaleon-last-seen-release` | Changelog acknowledged | existing |
| `camaleon-release-snooze-until` | 24h snooze | existing |

Update `/privacy` legal copy when adding new keys (S1 adds `camaleon-user-settings-v1`).

---

## 7. Phase checklist

### S1 — Shell

- [x] `settings_panel_plan.md` + SPEC §7.13 stub
- [x] `user-settings.ts` + changelog toggle
- [x] `SettingsDrawer` + `SettingsProvider`
- [x] Gear trigger in `UtilityCluster`
- [x] i18n EN/ES under `settings.*`
- [x] Command palette action (optional follow-up) — deferred

**Exit gate:** User opens Settings from header; changes theme/locale/changelog pref; opens What's New from Settings; resets welcome panel.

### S2 — Transmutation defaults

- [x] `transmutation-defaults.ts` + hook in `TransmutationPanel` via `build-default-options.ts`
- [x] Settings section “Transmutation defaults”
- [ ] “Use as default” on tool panel (optional)

### S3 — Performance

- [x] `performance-prefs.ts` + `applyPerformancePrefs`
- [x] `buildResourceProfileForTier` refactor
- [x] Settings section “Performance” / “Rendimiento”
- [x] Live re-apply via `subscribePerformancePrefs`

### S4 — Notices

- [x] `notices-prefs.ts` + `filterNoticesForDensity`
- [x] Settings section “Notices & prepare”
- [x] Prepare progress style in user-settings (legacy key migration)
- [x] Live re-apply via `subscribeNoticesPrefs`

### S5 — Offline ✅ (v3.0.0 + v3.0.1)

- [x] Tier 3.4 PWA integration — `OfflineSettingsSection`, `offline-prefs.ts`, `precacheFullToolkit`

### Updates ✅ (v3.2.6)

- [x] `updates-prefs.ts` + `UpdatesSettingsSection`
- [x] Auto-detect toggle + Check now + toasts (v3.2.7 toast system)

### S7 — Batch & Universal (planned)

- [ ] `batch-universal-prefs.ts` + settings section
- [ ] Wire `defaultSelection`, `universalMultiDrop`, `mixedFormatPolicy` before Slice C

---

## 8. Related docs

| Doc | Role |
|-----|------|
| `notice_system_plan.md` | Notice rail — S4 target |
| `tier3_4_pwa_offline_analysis.md` | PWA/offline science — S5 target |
| `tier3_plan.md` §14 | Offline checklist |
| `release_comms_module.md` | Changelog surfaces |
| `SPEC.md` §5.10 | StripAll — not configurable |
| `SPEC.md` §7.13 | Normative settings panel |

---

*Last updated: 2026-06-11 — Updates v3.2.6 shipped; S7 Batch & Universal planned pre–Slice C.*
