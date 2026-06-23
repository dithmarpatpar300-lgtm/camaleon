# Resize Advanced Processing — UI/UX Investigation

> **Date:** 2026-06-23 · **Author:** OpenCode  
> **Status:** Investigation · **Phase:** 4a.0 expansion (current: v3.6.1)  
> **Scope:** UX architecture for integrating sharpen, brighten, contrast, denoise, grayscale, and other processing parameters into Camaleon's Resize panel — without cluttering the interface or overwhelming users.  
> **Parent docs:** `resize_advanced_processing_investigation.md` · `resize_advanced_processing_ROADMAP.md`  
> **UI anchor:** `OptionsControls.tsx` · `StagedWorkspace.tsx` · `ResizeFilterControl` (inline in OptionsControls)

---

## 0. Design challenge

Camaleon's Resize panel currently has a clean, minimal layout:

```
┌────────────────────────────────┐
│  Output scale                   │
│  ──────●──────  75%            │
│  4000×3000 → 3000×2250         │
│                                 │
│  Resampling filter              │
│  [Sharp] [Sharpest] [Smooth]   │
│                                 │
│  [Notice Rail]                  │
│  [Estimated output]             │
│  [Transmutar]                   │
└────────────────────────────────┘
```

Adding 5–7 new controls (sharpen, brighten, contrast, grayscale, blur, median, bilateral) risks turning this into a cluttered settings page. The challenge is: **how do we offer desktop-grade image processing without desktop-grade complexity?**

---

## 1. Design principles

| # | Principle | Implication |
|---|-----------|-------------|
| **P1** | **Progressive disclosure** | 95% of users only need % + filter. Processing controls are hidden behind a single expandable section. |
| **P2** | **Semantic grouping** | Processing controls are grouped by intent: "Sharpness", "Exposure", "Color", "Noise". Not a flat list of sliders. |
| **P3** | **Estimate-first continuity** | Every processing parameter change triggers a new estimate. The size delta is always visible — the user decides based on numbers. |
| **P4** | **Desktop-grade, not desktop-complex** | Each control has exactly ONE parameter. No curves, levels, or multi-point adjustments. Professional results with simple inputs. |
| **P5** | **Camaleon visual identity** | Green accent (#22C55E), dark elevated surfaces, rounded-md controls, 12/24px rhythm, mono numeric readouts. Zero new patterns — extend existing ones. |
| **P6** | **Mobile-first resilience** | Controls stack vertically on narrow viewports. Single column. No horizontal scroll. No side-by-side sliders on mobile. |
| **P7** | **Honest defaults** | All processing off by default (sigma=0, brighten=0, contrast=1.0). User opts in explicitly. No silent modifications. |

---

## 2. Current UI component analysis

### 2.1 Existing visual language (extracted from codebase)

| Element | Pattern | Used in |
|---------|---------|---------|
| **Slider control** | `<input type="range">` styled: `h-2 w-full rounded-full bg-bg-elevated accent-accent` | All tools |
| **Preset pills** | `<button>` `rounded-md px-3 py-1.5 text-xs font-medium`. Active: `bg-accent text-white`. Idle: `bg-bg-elevated text-text-muted` | Slider presets |
| **Info boxes** | `rounded-md bg-bg-elevated/50 px-3 py-2` with `text-xs text-text-muted` | Dimensions display, filter descriptions |
| **Collapsible toggles** | Chevron SVG `transition-transform` + `rotate-180`, `aria-expanded`, conditional `{open && <Content/>}` | Filter "Advanced" toggle, TechnicalDisclosure |
| **Sections** | `border-t border-border pt-4` separator between major areas | OptionsControls → NoticeRail boundary |
| **Advanced pill** | `rounded-md px-2 py-0.5 text-[10px] font-medium`. Active: `bg-[#F59E0B]/20 text-[#F59E0B]` | Scale >200% toggle |
| **Notice rail** | Vertical list of `NoticePanel` with severity-colored left border | Contextual warnings |
| **MetricsPanel** | Size delta with before/after bytes | Below Notices, above Transmutar |

### 2.2 Component hierarchy (current)

```
OptionsControls
├── SliderControl (compression / quality / resizePercent)
│   ├── Label + Value readout
│   ├── Preset pills
│   ├── Range input
│   ├── Dimensions box (resize only)
│   └── Advanced scale toggle (resize only)
├── SliderControl (JPEG quality on jpg-resize)
└── ResizeFilterControl
    ├── 3 visible filter buttons
    ├── Advanced toggle + 2 hidden filter buttons
    └── Filter description box
```

**Key insight:** `ResizeFilterControl` is rendered as a **sibling** in the flat `space-y-6` list, not nested inside the resize slider. This means the new `ProcessingPanel` can follow the exact same pattern — placed below `ResizeFilterControl`, maintaining the 24px vertical rhythm.

---

## 3. Proposed component architecture

### 3.1 New component: `ProcessingPanel`

```
ProcessingPanel (collapsible)
├── Header row: "Fine-tuning" + chevron + "Reset" link
├── [EXPANDED CONTENT — hidden when collapsed]
│   ├── Sharpness group
│   │   ├── Label: "Sharpness"
│   │   ├── Slider: sharpen_sigma (0.0–4.0, step 0.1, default 0)
│   │   ├── Presets: Off / Subtle (0.4) / Medium (0.8) / Strong (1.5)
│   │   └── Hint: "Restores detail lost during downscaling"
│   ├── Pre-blur group
│   │   ├── Label: "Pre-blur (anti-aliasing)"
│   │   ├── Slider: pre_blur_sigma (0.0–4.0, step 0.1, default 0)
│   │   ├── Presets: Off / Light (0.3) / Medium (0.7) / Strong (1.2)
│   │   └── Hint: "Applies Gaussian blur before resize to reduce Moiré patterns"
│   ├── Exposure group
│   │   ├── Label: "Brightness"
│   │   ├── Slider: brighten (−100 to 100, step 1, default 0)
│   │   ├── Presets: −30 / 0 / +30
│   │   ├── Label: "Contrast"
│   │   ├── Slider: contrast (0.25–4.0, step 0.05, default 1.0)
│   │   └── Presets: 0.75 / 1.0 / 1.25 / 1.5
│   └── Color group
│       ├── Toggle: grayscale (checkbox or pill toggle)
│       └── Hint: "Converts to black & white after resize"
│
└── [Phases C+ — Denoiser group, if imageproc spike passes]
    ├── Denoise radio: None / Median / Bilateral
    └── Conditional sliders for radius / sigma
```

### 3.2 Integration point in OptionsControls

```
OptionsControls
├── SliderControl (resizePercent)
├── SliderControl (JPEG quality — jpg-resize only)
├── ResizeFilterControl
└── ProcessingPanel          ← NEW — rendered when hasResize && hasProcessingSpecs
```

**Logic:** `ProcessingPanel` renders only for resize tools (`png-resize`, `jpg-resize`). It is always rendered, but starts **collapsed** (`open={false}`). User clicks "Fine-tuning" header to expand.

---

## 4. Layout spec — Desktop (≥768px)

```
┌──────────────────────────────────────────────────────────────┐
│  Output scale                                                  │
│  ─────────────────────●─────────────  75%                     │
│  1%                             [200%]                         │
│                                                      [Advanced]│
│  ┌ 25% ┐ ┌ 33% ┐ ┌ 50% ┐ ┌ 66% ┐ ┌ 75% ┐                    │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  4000 × 3000  →  3000 × 2250                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Resampling filter                                             │
│  ┌ Sharp ┐ ┌ Sharpest ┐ ┌ Smooth ┐          [Advanced ▾]     │
│  ┌ Pixel Perfect ┐ ┌ Anti-alias ┐           ...               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Sharp (CatmullRom) — Recommended. Good balance of...    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ─────────────────────────────────────────────────────        │
│                                                               │
│  Fine-tuning                              [Reset defaults] ▾   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  Sharpness                                               │  │
│  │  ─────────────○────────────  0.8                         │  │
│  │  Off        Subtle   Medium   Strong                     │  │
│  │  Restores detail lost during downscaling                 │  │
│  │                                                           │  │
│  │  Pre-blur (anti-aliasing)                                 │  │
│  │  ○──────────────○───────────  0.0                         │  │
│  │  Off         Light   Medium  Strong                      │  │
│  │                                                           │  │
│  │  Exposure                                                │  │
│  │  Brightness    ──────○──────  +15                        │  │
│  │                −30        0        +30                   │  │
│  │                                                           │  │
│  │  Contrast      ─────────○───  1.15                        │  │
│  │                0.75    1.0    1.25    1.5                │  │
│  │                                                           │  │
│  │  Color                                                   │  │
│  │  ┌☐ Grayscale ┐  Converts to black & white after resize │  │
│  │                                                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ─────────────────────────────────────────────────────        │
│                                                               │
│  ⚠ Re-encoding a JPEG adds another lossy generation.          │
│  ℹ Sharpening applied (σ=0.8). Edges will be emphasized.      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Estimated output       1.18 MB         (−34%)           │  │
│  │  Original: 1.8 MB  ──▶  Resized: ~1.2 MB               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                     Transmutar                           │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 4.1 Spacing specification

| Element | Spacing |
|---------|---------|
| OptionsControls outer | `space-y-6` (24px between all children) |
| Between ResizeFilterControl and ProcessingPanel | 24px (from parent `space-y-6`) |
| ProcessingPanel header row | `pb-2` (8px between header and content) |
| Between processing groups (Sharpness, Exposure, Color) | `space-y-4` (16px) |
| Within a processing group (label, slider, presets, hint) | `space-y-2` (8px) |
| ProcessingPanel outer border | `rounded-lg border border-border p-4` |
| ProcessingPanel inner bg | `bg-bg-elevated/30` (subtle elevation within section) |

### 4.2 Color specification

| Element | Class |
|---------|-------|
| ProcessingPanel container | `rounded-lg border border-border bg-bg-elevated/30` |
| Header text | `text-sm font-medium text-text-secondary` |
| "Reset" link | `text-xs text-accent hover:text-accent-hover cursor-pointer` |
| Slider labels | `text-xs text-text-muted` |
| Slider value readout | `text-xs font-mono tabular-nums text-text-secondary` |
| Preset pills | Same as existing: `rounded-md px-2.5 py-1 text-xs` |
| Group hints | `text-[11px] text-text-muted leading-relaxed` |
| Group separator | `border-t border-border/50 pt-4` (between Exposure and Color) |
| Chevron | `h-4 w-4 text-text-muted transition-transform` + `rotate-180` when open |

---

## 5. Layout spec — Mobile (<768px)

```
┌──────────────────────────────┐
│  Output scale                 │
│  ──────●──────  75%          │
│  [25] [33] [50] [66] [75]   │
│  4000×3000 → 3000×2250       │
│                               │
│  Resampling filter            │
│  [Sharp] [Sharpest]           │
│  [Smooth]         [Adv ▾]    │
│                               │
│  Fine-tuning           [▾]    │
│  ┌─────────────────────────┐  │
│  │  Sharpness              │  │
│  │  ────○────────  0.8     │  │
│  │  Off  Subtle Med Strong │  │
│  │                          │  │
│  │  Pre-blur               │  │
│  │  ○────────────  0.0     │  │
│  │                          │  │
│  │  Brightness             │  │
│  │  ────○──────  +15       │  │
│  │                          │  │
│  │  Contrast               │  │
│  │  ────○──────  1.15      │  │
│  │                          │  │
│  │  ☐ Grayscale            │  │
│  └─────────────────────────┘  │
│                               │
│  ⚠ Generational loss          │
│  Est: 1.2 MB (−34%)           │
│  [Transmutar]                 │
└──────────────────────────────┘
```

**Mobile adaptations:**
- Filter buttons wrap to 2 columns (3 buttons → 2+1 layout)
- ProcessingPanel full-width (no side margins within workspace)
- Preset pills reduce to 3 per row (from 5 on desktop) via `flex-wrap`
- Slider labels stack above sliders (not side-by-side) — already the pattern
- "Reset defaults" moves to header right (same row as chevron, text-only)
- Group hints hide on mobile (descriptions shown on desktop via `hidden sm:block`)

---

## 6. Premium UX patterns (design rationale)

### 6.1 Why collapse by default

**Data:** 95% of users never touch optional controls in web image tools. Users who need sharpening know what they're looking for and will expand a clearly labeled section. Users who don't need it won't be confused by 7 unfamiliar sliders.

**Precedent:** Photoshop's "Image Size" dialog hides "Resample" options behind a checkbox. Photopea's "Image Size" has a simple dialog with an "Advanced" expander for DPI/channels. Squoosh keeps everything visible but has so few options it doesn't matter.

**Camaleon approach:** "Fine-tuning" — semantic, inviting, non-technical. Not "Advanced" (implies difficulty) or "More options" (vague). I18n key: `resize.panel.fineTuning`.

### 6.2 Why preset pills for sliders

**Consistency:** Every existing slider in Camaleon uses preset pills (compression, quality, resizePercent). Processing sliders must follow the same pattern — users already know how to interact with them.

**Semantic presets:** Instead of numbers, presets use words the user understands:
- Sharpen: "Subtle" (0.4), "Medium" (0.8), "Strong" (1.5)
- Blur: "Light" (0.3), "Medium" (0.7), "Strong" (1.2)
- Brightness: "−30", "0", "+30" (numeric labels are clearer for exposure)
- Contrast: "Flat" (0.75), "Normal" (1.0), "Rich" (1.25), "Vivid" (1.5)

### 6.3 Why groups with semantic labels

**Mental model:** "Sharpness" is a concept. "Brightness" is a concept. The user thinks in terms of "make this sharper and a bit brighter", not "set sigma to 0.8 and brighten to +15". The group label bridges the gap between the user's intent and the technical parameter.

**Precedent:** Photopea uses "Adjustments" as a category. Lightroom uses semantic sliders ("Exposure", "Contrast", "Highlights", "Shadows"). Photoshop's "Smart Sharpen" exposes "Amount" and "Radius" — semantic, not technical.

### 6.4 Why "Reset defaults" is always visible

**Safety net:** Users experiment. They try sharpen=1.5, contrast=2.0, brighten=-30 — then realize it looks bad. A one-click reset to factory defaults reduces frustration. No need to manually slide each control back to zero.

**Position:** Top-right of the ProcessingPanel header, visible only when panel is expanded. Text link, not a button — low visual weight, high utility.

---

## 7. State management

### 7.1 Processing state shape

```typescript
// workers/types.ts — additive to existing TransmutationOptions
interface ProcessingOptions {
  preBlurSigma: number;           // 0.0 = off, range [0.0, 10.0]
  postSharpenSigma: number;       // 0.0 = off, range [0.0, 10.0]
  postSharpenThreshold: number;   // 0, range [0, 255]
  postBrighten: number;           // 0 = off, range [-255, 255]
  postContrast: number;           // 1.0 = no change, range (0.0, ∞)
  postGrayscale: boolean;         // false
}
```

### 7.2 Panel open state

```typescript
// ProcessingPanel internal state — NOT persisted, session-only
const [isOpen, setIsOpen] = useState(false);
```

The panel collapse/expand is session-level, not per-file. If the user expands "Fine-tuning" once, it stays expanded for the session. This avoids the frustration of re-expanding on every file drop.

### 7.3 Estimate invalidation

All processing params are included in the estimate fingerprint. Changing any processing slider triggers a new estimate debounce (same 400ms as resizePercent). The `useFileMetrics` hook already handles this — only `TransmutationOptions` fields need to be added to the dependency array.

---

## 8. Mobile considerations

### 8.1 Touch targets

All preset pills and the chevron toggle must meet 44×44px minimum touch target (WCAG 2.1). Current pills are `px-3 py-1.5 text-xs` (~36px tall) — bump to `py-2` (44px) on mobile via `sm:py-1.5`.

### 8.2 Slider usability

`<input type="range">` on mobile Safari has a smaller thumb. The existing slider pattern (`h-2 w-full`) already works well on mobile. No change needed.

### 8.3 Viewport

ProcessingPanel must not extend beyond viewport on 375px width. The outer `p-5` on StagedWorkspace leaves 335px for controls. ProcessingPanel `p-4` leaves 303px. All sliders, labels, and preset pills fit within 303px single-column. Test on Chrome DevTools iPhone SE (375px).

### 8.4 Collapse on file drop

When a new file is dropped (panel resets to prepare state), the ProcessingPanel should collapse back to its default state (`isOpen = false`). The processing params should also reset. The user starts fresh per file.

---

## 9. Notice rail integration

New notices appear BELOW ProcessingPanel (inside the existing NoticeRail in StagedWorkspace), never inside ProcessingPanel. This maintains the existing pattern where OptionsControls renders controls and StagedWorkspace renders notices.

| Notice | Trigger | Severity | I18n key |
|--------|---------|----------|----------|
| Sharpen warning | `postSharpenSigma > 2.0` | warn | `notices.sharpenHighSigma` |
| Pre-blur active | `preBlurSigma > 0` | info | `notices.preBlurActive` |
| Grayscale active | `postGrayscale === true` | info | `notices.grayscaleActive` |
| Denoiser slow | `postMedianRadius > 0 && sourcePixels > 10_000_000` | info | `notices.denoiseSlow` |

---

## 10. Accessibility checklist

| # | Requirement | Implementation |
|---|-------------|----------------|
| A1 | `aria-expanded` on Fine-tuning toggle | `aria-expanded={isOpen}` on header button |
| A2 | `aria-controls` linking toggle to content | `aria-controls="processing-panel-content"` |
| A3 | `role="region"` on ProcessingPanel | `<section role="region" aria-label="Fine-tuning">` |
| A4 | All sliders have `<label>` association | `<label htmlFor="sharpen-slider">` with matching `id` |
| A5 | Preset pills are keyboard-focusable | `<button>` — already focusable by default |
| A6 | Focus ring visible | `focus-visible:ring-2 focus-visible:ring-accent` — existing pattern |
| A7 | Color is not the only indicator | Preset pills use text labels, not just color |
| A8 | Reduced motion respects OS preference | `motion-reduce:` on collapse animation |
| A9 | Touch targets ≥44px | `py-2` on mobile preset pills |
| A10 | Screen reader announces collapse/expand | `aria-expanded` + `aria-controls` is sufficient |

---

## 11. Implementation notes

### 11.1 New component file

**File:** `frontend/src/components/transmute/ProcessingPanel.tsx`

**Props interface:**
```typescript
interface ProcessingPanelProps {
  values: ProcessingOptions;
  onChange: (next: Partial<ProcessingOptions>) => void;
}
```

**Exports:** Default export `ProcessingPanel`.

### 11.2 Integration in OptionsControls

```typescript
// OptionsControls.tsx — after ResizeFilterControl, before closing </div>
import { ProcessingPanel } from "./ProcessingPanel";

// ... inside JSX ...
{hasResize && (
  <ProcessingPanel
    values={processingOptions(values)}
    onChange={onProcessingChange}
  />
)}
```

### 11.3 Helper to extract processing subset

```typescript
// OptionsControls.tsx or lib/transmutation/processing.ts
function processingOptions(opts: TransmutationOptions): ProcessingOptions {
  return {
    preBlurSigma: opts.preBlurSigma ?? 0,
    postSharpenSigma: opts.postSharpenSigma ?? 0,
    postSharpenThreshold: opts.postSharpenThreshold ?? 0,
    postBrighten: opts.postBrighten ?? 0,
    postContrast: opts.postContrast ?? 1.0,
    postGrayscale: opts.postGrayscale ?? false,
  };
}
```

### 11.4 Tailwind classes reference (for implementation)

```
Panel container:    rounded-lg border border-border bg-bg-elevated/30
Header row:         flex items-center justify-between px-4 py-3 cursor-pointer select-none
Header text:        text-sm font-medium text-text-secondary
Chevron:            h-4 w-4 text-text-muted transition-transform duration-200
Chevron open:       rotate-180
Content wrapper:    border-t border-border/50 px-4 py-3 space-y-4
Group:              space-y-2
Group label:        text-xs font-medium text-text-muted uppercase tracking-wider
Slider row:         flex items-center gap-3
Slider range:       h-2 w-full rounded-full bg-bg-elevated accent-accent
Slider value:       text-xs font-mono tabular-nums text-text-secondary min-w-[3ch] text-right
Presets row:        flex flex-wrap gap-1.5
Preset pill active: rounded-md px-2.5 py-1.5 sm:py-1 text-xs font-medium bg-accent text-white
Preset pill idle:   rounded-md px-2.5 py-1.5 sm:py-1 text-xs font-medium bg-bg-elevated text-text-muted hover:text-text-secondary
Hint text:          text-[11px] text-text-muted leading-relaxed
Reset link:         text-xs text-accent hover:text-accent-hover cursor-pointer
Group separator:    border-t border-border/50 pt-4
Toggler container:  flex items-center gap-3
Toggler:            h-6 w-11 rounded-full transition-colors duration-200
Toggler on:         bg-accent
Toggler off:        bg-bg-elevated border border-border
Toggler knob:       h-5 w-5 rounded-full bg-white shadow-sm transition-transform
Toggler knob on:    translate-x-5
```

---

## 12. Competitor UX comparison

| Tool | Resize UX pattern | Processing integration | Camaleon opportunity |
|------|-------------------|------------------------|---------------------|
| **Squoosh** | Slider % with WxH display | No processing — just resize + codec options | Camaleon offers more filters AND processing |
| **Photopea** | Dialog with W/H inputs, % chain link, resample dropdown | Full Image→Adjustments menu (separate from resize dialog) | Camaleon integrates both in one panel |
| **Photoshop** | Image Size dialog (W/H, %, resample, "Preserve Details 2.0") | Separate Filter→Sharpen menu; adjustment layers | Camaleon collapses the workflow gap |
| **GIMP** | Scale Image dialog (W/H, %, interpolation dropdown) | Separate Filters menu (Blur, Enhance, etc.) | Same as Photoshop — Camaleon unifies |
| **photon-rs** | Slider-based with live preview | Filter panel with checkboxes for each effect | Camaleon adds estimate-first + notices + collapsible |

**Camaleon's unique UX advantage:** No other browser tool combines resize parameters AND processing in a single, collapsible, estimate-first panel. Desktop apps require navigating multiple menus/dialogs. Camaleon offers it in one scrollable view with live size estimates.

---

## 13. References

| Doc | Role |
|-----|------|
| `OptionsControls.tsx` | Current resize UI (lines 66-338) |
| `StagedWorkspace.tsx` | Layout hierarchy (lines 225-427) |
| `globals.css` | Design tokens |
| `TechnicalDisclosure.tsx` | Collapsible pattern reference |
| `resize_advanced_processing_investigation.md` | Technical capabilities |
| `resize_advanced_processing_ROADMAP.md` | Implementation phases |
| `resize_premium_roadmap.md` | Phases A-E reference (v3.6.0) |

---

*UI/UX investigation for integrating advanced image processing controls into Camaleon's Resize panel. Design principles center on progressive disclosure, semantic grouping, and estimate-first continuity — offering desktop-grade capabilities without desktop-grade complexity.*
