# Smart Notice Recommendations — Technical Investigation

> **Date:** 2026-06-24 · **Author:** OpenCode
> **Status:** Research phase — no code changes
> **Scope:** Transform the passive Notice Rail into an adaptive recommendation engine with cross-tool navigation
> **Parent docs:** `docs/SPEC.md` §7.4 (Verde Camaleón), `docs/planning/pre_tier3_ui_ux_plan.md`
> **Reference:** `lib/notices/`, `lib/transmutation/file-handoff.ts`, `lib/toast/`

---

## 0. Executive summary

**The vision:** Notice Rail notices currently say "Consider WebP → JPG" as passive text. Transform them into **actionable recommendation chips** that:
1. Detect when the user's current transmutation is suboptimal
2. Suggest alternative tools with clickable buttons
3. Transfer the loaded file to the suggested tool via existing handoff system
4. Are context-aware: know what the user likely wants based on source format + tool + estimate delta

**Viability: ✅ Fully feasible on existing infrastructure.** The file handoff system (`file-handoff.ts`, Tier 3.5) already supports cross-tool file transfer with 60s TTL. The single-file `TransmutationPanel` already consumes `?handoff=ID` on mount. The UniversalTransmutator already navigates with `router.push(\`/transmute/${slug}?handoff=${id}\`)`. We only need to wire this into the Notice Rail.

---

## 1. Current state — what exists

### 1.1 Notice Rail (passive display)

| Component | Role | Current capability |
|-----------|------|-------------------|
| `Notice` type | `{id, severity, messageKey, params, priority, phase}` | Text-only, **no action field** |
| `NoticePanel` | `<p role="alert">` with severity-styled border/bg | **No buttons, no interactivity** |
| `NoticeRail` | Renders max 2 notices via `mergeNotices` | Pure display, density filter |
| `compute-staged-notices` | Orchestrates 5 sub-computers | Returns `Notice[]` |

### 1.2 File handoff (already works cross-tool)

| Component | Signature | TTL |
|-----------|-----------|-----|
| `stageFileHandoffFromFile(file)` | `File → Promise<string>` (UUID) | 60s |
| `TransmutationPanel` consumption | Reads `?handoff=ID` → `consumeFileHandoff` → `handleFileSelect` | On mount |
| `UniversalTransmutator` navigation | `router.push(\`/transmute/${slug}?handoff=${id}\`)` | Already implemented |

**Key finding:** The pattern `stageFile + router.push` from `UniversalTransmutator.tsx:124-137` is exactly what we need. No new infrastructure required.

### 1.3 Design tokens (Verde Camaleón)

| Token | Value | Use |
|-------|-------|-----|
| `--accent` | `#22C55E` | Primary action button |
| `--accent-hover` | `#16A34A` | Button hover |
| `--accent-subtle` | `rgba(34,197,94,.12)` | Subtle chip background |
| `--warning` | `#F59E0B` | Warning text (amber) |
| `--info` | `#38BDF8` | Info text (blue) |

Existing `Button` component has `subtle`, `ghost`, `primary` variants in `sm`/`md` sizes — suitable for inline chip-style actions.

### 1.4 Existing action patterns in floating notices

`AppUpdateNotice`, `OfflineInstallPromoNotice`, and `OfflineStatusNotice` already render inline action buttons using BEM classes (`.notice__action`). However, they use custom `<button>` elements, not the shared `<Button>` component. **Recommendation: use the shared `<Button>` component for consistency and token access.**

---

## 2. Architecture proposal

### 2.1 ActionInlinePill component (inline within text)

Following the exact pattern of `BackgroundColorPill` inside `TransparencyNotice.tsx:37-46`:

```tsx
// components/transmute/ActionInlinePill.tsx
type ActionInlinePillProps = {
  label: string;           // e.g. "WebP → JPG"
  toolSlug: string;        // e.g. "webp-to-jpg"
  onClick: () => void;
};

export function ActionInlinePill({ label, toolSlug, onClick }: ActionInlinePillProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-0.5 rounded-md bg-accent-subtle 
                 px-1.5 py-0.5 text-xs font-medium text-accent 
                 transition-colors hover:bg-accent/20 align-middle mx-0.5"
    >
      {label}
      <ArrowRightIcon className="h-2.5 w-2.5" />
    </button>
  );
}
```

Styled identically to the TransparencyNotice's inline element — `mx-0.5` for inline spacing, `bg-accent-subtle` for minimal visual weight.

### 2.2 Notice type — extended with actions

```typescript
export type NoticeAction = {
  labelKey: string;             // i18n key for button text
  toolSlug: string;             // target tool slug
};

export type Notice = {
  id: string;
  severity: NoticeSeverity;
  messageKey: string;
  params?: Record<string, string | number>;
  priority: number;
  phase?: NoticePhase;
  /** Actions rendered inline within the message text at {action:N} positions */
  actions?: NoticeAction[];
};
```

### 2.3 NoticePanel — renders inline action pills at {action:N} positions

```tsx
export function NoticePanel({ notice, onAction }: NoticePanelProps) {
  const { t } = useI18n();
  const message = t(notice.messageKey, notice.params);
  
  // If no actions, render as plain text node (backward compatible)
  if (!notice.actions?.length) {
    return <p className={...}>{message}</p>;
  }

  // If actions exist, split on {action:N} markers and inject inline pills
  const parts = message.split(/\{action:(\d+)\}/);
  // parts = ["prefix text ", "0", " middle text ", "1", " suffix"]
  
  const children: ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Even index = regular text
      children.push(parts[i]);
    } else {
      // Odd index = action index
      const actionIdx = parseInt(parts[i], 10);
      const action = notice.actions[actionIdx];
      if (action) {
        children.push(
          <ActionInlinePill
            key={`action-${actionIdx}`}
            label={t(action.labelKey)}
            toolSlug={action.toolSlug}
            onClick={() => onAction?.(action)}
          />
        );
      }
    }
  }

  return <p className={cn(severityClasses.container, severityClasses.text, "rounded-xl border px-4 py-3 text-sm")}>
    {children}
  </p>;
}
```

The i18n message becomes a template with `{action:0}`, `{action:1}` placeholders:

```typescript
// en.ts
"notices.fidelity.webpLossySource": 
  "Lossy WebP detected. Re-encoding as lossless VP8L will increase file size " +
  "(entropy expansion — same as JPEG→PNG). " +
  "Try {action:0} or {action:1} for size reduction.",
"notices.fidelity.webpLossySource.action0": "WebP → JPG",
"notices.fidelity.webpLossySource.action1": "Compress JPEG",
```

This produces inline text like:

```
"Lossy WebP detected. ... Try [WebP → JPG →] or [Compress JPEG →] for size reduction."
```

Where `[WebP → JPG →]` and `[Compress JPEG →]` are inline `<button>` pills rendered flush with the text, exactly like how `BackgroundColorPill` sits inline in `TransparencyNotice`.

### 2.4 Example render (what the user sees)

```
┌────────────────────────────────────────────────────────────────────┐
│ ⚠ This image has transparency                                      │
│   Transparent areas will be flattened onto █ [Color pill] before   │
│   JPEG encoding. JPEG does not support transparency.                │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ ⚠ Lossy WebP detected. Re-encoding as lossless will increase file  │
│   size (entropy expansion). Try [WebP → JPG →] or [Compress JPEG  │
│   →] for size reduction.                                           │
└────────────────────────────────────────────────────────────────────┘
```

The inline pill sits at `mx-0.5` spacing with `bg-accent-subtle` and `text-accent` — noticeable but not competing with the primary "Transmutar" button.

### 2.3 Recommendation rules engine — `compute-recommendation-notices.ts`

This is the **core intelligence** of the system. A new sub-computer in the notice pipeline that analyzes the user's context and generates action notices.

```typescript
export type RecommendationContext = {
  toolId: string;
  sourceFormat: ImageFormat;        // "PNG", "JPEG", "WEBP", etc.
  sourceHasAlpha: boolean;
  webpSourceFormat?: "lossy" | "lossless" | "extended";
  estimateDelta: SizeDelta | null;
  options: TransmutationOptions;
  dimensionBlocked: boolean;
  needsInputConsent: boolean;
};

export function computeRecommendationNotices(ctx: RecommendationContext): Notice[] {
  // Rules evaluated in priority order (first match wins for each category)
}
```

**Recommendation rules (first-pass heuristic set):**

| # | Rule ID | Trigger | Severity | Action | Rationale |
|---|---------|---------|----------|--------|-----------|
| R1 | `rec-lossy-to-lossless-inflation` | `jpg-to-webp` OR `webp-compress` with lossy source AND delta > 10% | `warn` | Suggest `webp-to-jpg` (if WebP source) or `jpg-compress` (if JPEG source) | Entropy expansion. User likely wants smaller file. |
| R2 | `rec-lossless-already-optimal` | `webp-compress` OR `png-compress` with lossless source AND abs(delta) ≤ 2% | `info` | Suggest higher optimization level or different strategy | Already at compression ceiling; explain options. |
| R3 | `rec-jpeg-generational-loss` | `jpg-compress` OR `jpg-resize` | `warn` | Suggest `png-compress` as intermediate master if editing | Each re-encode adds artifacts. For archival, use PNG. |
| R4 | `rec-alternative-lossy` | `png-to-jpg` OR `svg-to-jpg` with alpha | `warn` | Suggest background color options or `png-to-webp` for alpha preservation | Alpha flattened is permanent data loss. |
| R5 | `rec-size-increase` | Any compress + delta > 0 | `warn` | Suggest lower quality/compression OR alternative tool | User likely wants smaller, not larger. |
| R6 | `rec-upscale-honesty` | Any resize + resizePercent > 100 | `warn` | Suggest finding higher-res source | No new detail created by upscaling. |
| R7 | `rec-extreme-downscale` | Any resize + resizePercent < 25 | `info` | Suggest careful consideration of target dimensions | Detail loss is permanent. |
| R8 | `rec-lossless-preservation` | `png-to-jpg` OR `webp-to-jpg` when source has meaningful alpha | `info` | Suggest `png-to-webp` for alpha preservation | Alpha is valuable for editing workflows. |

**Heuristic constraints:**
1. Max 1 recommendation notice shown (to avoid overwhelming). Priority: warn > info.
2. Recommendations only appear when there's a meaningful alternative (not every notice gets an action).
3. Actions are suggestions, not defaults — user always keeps the primary "Transmutar" button.

### 2.4 Cross-tool navigation helper — `lib/transmutation/recommend-navigate.ts`

```typescript
import { stageFileHandoffFromFile } from "./file-handoff";
import { useRouter } from "next/navigation";

export async function navigateWithFile(
  file: File,
  targetSlug: string
): Promise<string> {
  const handoffId = await stageFileHandoffFromFile(file);
  return `/transmute/${targetSlug}?handoff=${encodeURIComponent(handoffId)}`;
}

// Usage in component:
const router = useRouter();
const handleNoticeAction = async (action: NoticeAction, file: File) => {
  const url = await navigateWithFile(file, action.toolSlug);
  router.push(url);
};
```

**This is ~10 lines of new code.** Everything else already exists.

### 2.5 Integration into pipeline

```
StagedWorkspace notices computation flow (enhanced):
  computeStagedNotices(ctx) {
    → computeRecommendationNotices(ctx)   // NEW — runs AFTER fidelity/limit notices
    → mergeNotices(allNotices, { maxVisible: 3 })  // increased from 2 to 3
    → Render in NoticeRail with onAction callback
  }
```

The `StagedWorkspace` component passes `file` (already available as a prop) to the `onAction` handler.

---

## 3. Design system alignment

### 3.1 Chip-style action button design

Inspired by Material Design chips and matching Verde Camaleón tokens:

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ Lossy WebP detected. Re-encoding as lossless VP8L will     │
│    increase file size (entropy expansion — same as JPEG→PNG).  │
│                                                                │
│  ┌──────────────────────────────┐  ┌───────────────────────┐  │
│  │ Try WebP → JPG →             │  │ Compress JPEG instead │  │
│  └──────────────────────────────┘  └───────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Chip CSS:** `bg-accent-subtle text-accent text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-accent/20 transition-colors`

**Why chips, not buttons:**
- Chips are less visually heavy than primary CTAs — they don't compete with "Transmutar"
- Material Design guidance: chips = "compact elements that represent an input, attribute, or action"
- Apple HIG: inline links with chevrons for "push to next screen"

### 3.2 Notice severity + action pairing

| Severity | Action variant | When |
|----------|---------------|------|
| `warn` | `chip` (accent-subtle bg) | Size increase, generational loss, data loss |
| `info` | `ghost` (transparent, text only) | Already optimal, suggestion for improvement |
| `error` | No action (fatal — transmutation blocked) | Estimate error, hard limit |

### 3.3 Max visible adjustment

Current: `maxVisible: 2` → Proposed: `maxVisible: 3` (to accommodate recommendation without displacing critical fidelity/limit notices).

---

## 4. UX guardrails — preventing recommendation fatigue

| Guardrail | Implementation |
|-----------|---------------|
| **1 per render** | Only the highest-priority recommendation notice is shown (mergeNotices caps by id) |
| **Not dismissible** | Recommendations reflect live state — they self-disappear when conditions change (e.g., user changes options) |
| **No modal** | Nothing blocks the user's primary flow. Recommendations are inline, not interruptions. |
| **Always secondary** | The "Transmutar" button is always visible. Recommendations are suggestions, not defaults. |
| **File preserved** | Clicking a recommendation transfers the file via handoff — user doesn't need to re-drop. |
| **Context exits** | Once the user navigates away or changes options, stale recommendations disappear. |

---

## 5. Impact on other systems

| System | Impact |
|--------|--------|
| **NoticeRail** | New wrapper: receives `onAction` prop. Existing usage sites unaffected (can pass `undefined`). |
| **NoticePanel** | Renders actions when present. Backward compatible — notices without actions render identically. |
| **StagedWorkspace** | Passes `file` to `onAction` handler. One new prop to NoticeRail. |
| **BatchTransmutationPanel** | No impact — doesn't use NoticeRail. |
| **UniversalTransmutator** | No impact — doesn't use NoticeRail. |
| **Toast system** | No impact — completely independent. |
| **File handoff** | Reused as-is. No changes. |
| **Tool routes** | Reused as-is. No changes. |
| **H4.2 Notices density** | Recommendation notices follow the same `"normal"` vs `"minimal"` filter. In minimal mode, `info` recommendations are hidden (only `warn` survives). |

---

## 6. Implementation phases

### Phase 1 — Infrastructure (v3.10.0)
1. Extend `Notice` type with `actions?: NoticeAction[]`
2. Enhance `NoticePanel` to render action chips
3. Add `navigateWithFile()` helper to `lib/transmutation/`
4. Wire `StagedWorkspace` to pass `onAction` to `NoticeRail`
5. Add i18n keys for action button labels

### Phase 2 — Recommendation engine (v3.10.0)
6. Create `compute-recommendation-notices.ts` with rule engine
7. Integrate into `compute-staged-notices.ts` pipeline
8. Implement R1-R8 heuristic rules
9. Add `RecommendationContext` type
10. Add i18n keys for recommendation messages

### Phase 3 — Iteration (post v3.10.0)
11. Manual QA: test each rule with real files
12. Tune rules based on user feedback (add/remove/modify thresholds)
13. Expand rules to cover more tools and edge cases
14. Consider adding recommendations to BatchTransmutationPanel (future)

---

## 7. Files modified vs created

| Layer | Files | Type |
|-------|-------|------|
| Notice types | `lib/notices/types.ts` | Modified (+NoticeAction type, +actions field) |
| Notice renderer | `components/transmute/NoticePanel.tsx` | Modified (+action chips rendering) |
| Notice rail | `components/transmute/NoticeRail.tsx` | Modified (+onAction prop passthrough) |
| Staged workspace | `components/transmute/StagedWorkspace.tsx` | Modified (+onAction handler, +navigateWithFile) |
| Navigation helper | `lib/transmutation/recommend-navigate.ts` | **New** |
| Recommendation engine | `lib/notices/compute-recommendation-notices.ts` | **New** |
| Notice orchestrator | `lib/notices/compute-staged-notices.ts` | Modified (+recommendation integration) |
| i18n EN+ES | `lib/i18n/dictionaries/en.ts`, `es.ts` | Modified (+action labels, +notice messages) |

**Scope: 8 files, 0 new Rust changes, 0 new Wasm, 0 new deps.** Entirely TypeScript/React.

---

## 8. Open decisions

| # | Question | Proposal |
|---|----------|----------|
| Q1 | Max recommendations per render? | **1** — only the highest-priority recommendation. Prevents fatigue. |
| Q2 | Should recommendations auto-dismiss or persist? | **Persist while conditions hold** — they reflect live state. User changes options → conditions change → notice disappears naturally. |
| Q3 | "Back to previous tool" button on target page? | **Backlog** — too complex for v1. The target tool has its own set of notices. |
| Q4 | Recommendations at file-drop time or after estimate? | **After estimate** — need the delta to make informed recommendations. |
| Q5 | Recommendations in batch panel? | **Backlog** — batch doesn't use NoticeRail. Separate feature. |
| Q6 | Should recommendation chips use the shared Button component? | **Chip: no** (Button lacks chip variant; chips are semantic extensions of notice, not standalone CTAs). **Use accent-subtle styled inline buttons** like existing notice action patterns. |
| Q7 | Should notice message text also be a link to the target tool? | **No** — actions are explicit buttons. Text remains informational. |
| Q8 | How to handle recommendations when file hasn't been estimated yet? | **Silence** — don't show recommendations until estimate is available. |

---

## 9. Example scenario walkthroughs

### Scenario A: WebP lossy file dropped on webp-compress

```
1. User drops lossy WebP on /transmute/webp-compress
2. Prepare: probe_webp_format → "lossy"
3. Estimate runs → output 32.6 MB (same as input, +0%)
4. computeRecommendationNotices:
   - Rule R1 matches: lossy source + tool = webp-compress + delta ~0%
   - Generates warn notice with action chip "Try WebP → JPG"
5. User sees:
   ┌───────────────────────────────────────────────────┐
   │ ⚠ Lossy WebP detected. Re-encoding as lossless     │
   │   VP8L won't reduce file size.                     │
   │   ┌──────────────────────────┐                    │
   │   │ Try WebP → JPG  →        │                    │
   │   └──────────────────────────┘                    │
   └───────────────────────────────────────────────────┘
6. User clicks chip:
   - stageFileHandoffFromFile(webpFile) → handoffId
   - router.push("/transmute/webp-to-jpg?handoff=ID")
7. webp-to-jpg page loads, consumes handoff, file is pre-loaded
```

### Scenario B: JPEG dropped on jpg-to-webp with 4.6→15.1 MB delta

```
1. User drops JPEG on /transmute/jpg-to-webp
2. Estimate runs → output 15.1 MB (+228%, size increase)
3. computeRecommendationNotices:
   - Rule R1 matches: lossy source + jpg-to-webp + delta > 10%
   - Generates warn notice with 2 action chips:
     "Compress JPEG instead" (→ jpg-compress)
     "Keep as JPEG" (informational, no action)
4. User sees chip: "Compress JPEG instead →"
5. Clicks → navigates to jpg-compress with file pre-loaded
```

### Scenario C: PNG photo dropped on png-compress with delta ~0%

```
1. User drops PNG photo on /transmute/png-compress
2. Estimate runs → output ~same size (already optimized PNG)
3. computeRecommendationNotices:
   - Rule R2 matches: lossless + compress + delta ~0%
   - Generates info notice with chips:
     "Try Full optimization" (toggles optimizationLevel to 1)
     "Try JPEG for web" (→ png-to-jpg)
4. First chip adjusts options in-place. Second navigates.
```

---

## 10. References

| Doc | Role |
|-----|------|
| `lib/notices/types.ts` | Notice type definition |
| `lib/notices/compute-staged-notices.ts` | Notice computation orchestrator |
| `lib/notices/compute-fidelity-notices.ts` | Fidelity notice rules |
| `components/transmute/NoticePanel.tsx` | Notice renderer |
| `components/transmute/NoticeRail.tsx` | Notice list renderer |
| `lib/transmutation/file-handoff.ts` | File handoff system (cross-tool transfer) |
| `components/transmute/UniversalTransmutator.tsx` | Cross-tool navigation with handoff (pattern to reuse) |
| `components/ui/Button.tsx` | Shared button component |
| `docs/SPEC.md` §7.4 | Verde Camaleón design system |
| `docs/planning/pre_tier3_ui_ux_plan.md` | UI/UX philosophy |
| `app/globals.css:1647-1848` | Notice/Toast CSS tokens and styles |
| `lib/toast/` | Independent toast system (not affected) |

---

*Technical investigation for the Smart Notice Recommendations system. Core idea: extend the Notice type with action chips, create a recommendation rules engine, and reuse the existing file handoff system for cross-tool navigation. 8 files, 0 new deps, entirely TypeScript. Builds on infrastructure already shipped in Tier 3.5 (file handoff) and Tier 2.3 (Notice Rail).*
