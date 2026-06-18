# Advanced / Risk mode — architecture analysis (pre-implementation)

> **Date:** 2026-06-11  
> **Status:** **Implemented (v2.3.8, Settings S6)** — see `docs/releases/v2.3.8.md`  
> **Prerequisites:** v2.3.6 on `dev` (SVG→JPEG, LimitUnlockHint UI)  
> **Related:** `docs/LIMIT_PIPELINE.md`, `docs/planning/settings_panel_plan.md`, `docs/planning/astro_imagery_tier.md`, `docs/planning/adaptive_limits_proposal.md`

---

## 0. Executive summary

Camaleon uses **three independent safety layers** (bytes soft/hard, megapixels) plus **consent gates** and **astro downscale** as product-level rails. A future **Advanced / Risk mode** in Settings would let informed users opt out of **Camaleon's** limits — not the browser's.

**Critical insight:** Risk mode is not a single toggle. It must coordinate **at least six interaction surfaces** that today assume limits are always on. Implementing it without this map causes “cabos sueltos” — e.g. forcing resize when Risk would allow full resolution, or keeping 12K blocked when Risk should unlock it.

**v2.3.6 ships `LimitUnlockHint`** on all blockers with forward-looking copy. **Risk mode shipped in v2.3.8 (Settings S6).** S5 offline remains deferred.

---

## 1. Current limit architecture

### 1.1 Three independent limits

| Layer | Constant | Value | Enforced by |
|-------|----------|-------|-------------|
| Bytes (soft) | `SOFT_LIMIT_BYTES` | 50 MB | Wasm default; elevated zone |
| Bytes (hard) | 150 MB desktop / 100 MB mobile | `getHardLimitBytes()` | Drop block; `validate_input_with_limit` |
| Megapixels | `MAX_PIXELS` | 40,000,000 | `LimitContext`, Rust dimension probes |

Source of truth: `frontend/src/lib/transmutation/limit-context.ts`, `motor_transmutacion/core_utils`, `docs/LIMIT_PIPELINE.md`.

### 1.2 UI surfaces that enforce limits

| Surface | Trigger | File | User action today |
|---------|---------|------|-------------------|
| **Hard byte block** | File > hard limit at drop | `TransmutationPanel` | Cannot proceed |
| **Elevated byte consent** | 50 MB – hard limit | `OversizeConsentPanel` | Confirm to continue |
| **Pixel block (red)** | W×H > 40 MP | `DimensionsBlockPanel` | Resize (raster) or lower scale (SVG) |
| **Astro downscale** | Pixel block + `supportsClientResize` | `AstroResizePanel` | Pick 4K–12K max edge |
| **12K extended gate** | 12K preset + RAM | `AstroResizePanel` + `allowsExtendedMaxEdge` | Checkbox consent |
| **Preset disabled** | Target W×H still > 40 MP | `presetExceedsPixelLimit` | Pick smaller preset |
| **Estimate/transmute block** | `limitContext.canTransmute === false` | `useFileMetrics`, `StagedWorkspace` | Blocked button |
| **Metrics yellow line** | Same block reasons | `MetricsPanel` | Informational |

### 1.3 Tool-type matrix

| Tool category | Input limit type | Mitigation path | Risk impact if enabled |
|---------------|------------------|-----------------|------------------------|
| Raster (PNG/JPG/WebP/…) | **Input** W×H | Astro canvas downscale | Skip block → Wasm full decode at native size |
| SVG → PNG/JPG | **Output** W×H (scale presets) | Lower `outputScale` | Skip block → render at 200% / 2048 px edge even if > 40 MP |
| Animated (GIF/AVIF) | Input + frame | Frame picker | Per-frame pixel limit still applies |
| Multi-page (TIFF/ICO) | Per page/entry dimensions | Page/entry picker | Same as raster per selection |
| Encode (PNG→AVIF, etc.) | Input raster | Same as source format | Output size estimates may warn separately |

**SVG is unique:** limits apply to **chosen output dimensions**, not intrinsic vector size. Risk mode must read `outputWidth` × `outputHeight` from options, not just `sourceMeta`.

---

## 2. Case studies (user-reported scenarios)

### Case A — Hubble-scale PNG → JPG (14575×8441, 123 MP)

**Today:**
1. `DimensionsBlockPanel` (red) — “Image too large…”
2. User taps **Resize to continue**
3. `AstroResizePanel` — 4K/6K/8K; **12K disabled** if aspect ratio would exceed 40 MP OR device RAM ≤ 4 GB hides 12K entirely
4. User picks 8K → 8192×4744 (39 MP) → transmute proceeds

**With Risk mode (expected behavior):**
- **No forced resize** — original dimensions proceed to estimate/transmute (if user accepts OOM risk)
- **OR** optional downscale still offered as convenience, not requirement
- **12K preset** enabled when Risk on (subject to browser canvas limits, not 40 MP product cap)
- **Elevated byte consent** (124.7 MB file) may still need explicit Risk acknowledgment — separate from pixels

**Files to change:**
- `computeLimitContext` — accept `riskModeEnabled` → skip `blockReason: "pixels"`
- `supportsClientResize` path — don't auto-enter block when Risk on
- `AstroResizePanel` — `presetExceedsPixelLimit` bypass; `allowsExtendedMaxEdge` bypass
- `useFileMetrics` — allow estimate when Risk on
- Rust `validate_output_dimensions` / `validate_input` — **requires Risk flag passed to Wasm OR TS-only bypass with documented OOM acceptance** (SPEC decision)

### Case B — SVG 4K at 200% output (13824×9216, 127 MP)

**Today:**
1. Red block + **output scale presets still visible** (SVG-specific)
2. User lowers scale to 100% or smaller px preset

**With Risk mode:**
- Allow transmute at 200% despite > 40 MP
- Worker + Rust must accept output W×H without `validate_output_dimensions` failure
- Notice Rail `expensive` + Risk banner mandatory

### Case C — 50–150 MB file (elevated zone)

**Today:** `OversizeConsentPanel` before estimate/transmute

**With Risk mode options:**
- **Option A:** Auto-consent elevated zone (Risk subsumes oversize consent)
- **Option B:** Keep separate — Risk only affects pixels, not bytes
- **Recommendation:** Risk disables **all** Camaleon limits including elevated consent — single coherent “I accept responsibility”

### Case D — Hard limit drop (> 150 MB)

**Today:** Error at drop, no prepare

**With Risk mode:** Controversial — may allow prepare with session limit = file size. Requires Wasm `set_session_input_limit(file.size)` and peak RAM warnings. **Recommend:** Risk raises hard limit to a higher cap (e.g. 500 MB) rather than infinite — still bounded.

---

## 3. Proposed Risk mode design (S6)

### 3.1 Settings placement

- **Section:** Settings → **Advanced / Risk** (new, after S4, before or after S5 offline)
- **NOT** in S2–S4 — settings plan §4 explicitly excludes limit overrides today
- **Persistence:** `camaleon-user-settings-v1` → `riskMode: { enabled: boolean, acknowledgedAt: string }`

### 3.2 Activation UX (multi-step)

1. Collapsed section at bottom of Settings drawer
2. Expand → read-only warning wall (OOM, tab crash, data loss)
3. Checkbox: “I understand and accept”
4. Toggle **Enable Risk mode**
5. **Persistent banner** in transmute workspace while enabled: “Risk mode active — Camaleon limits disabled”

### 3.3 Scope when enabled

| Limit | Bypass? | Notes |
|-------|---------|-------|
| `MAX_PIXELS` (40 MP) | Yes | TS `LimitContext` + Rust dimension validation |
| Astro forced resize | Yes | `canTransmute` true without downscale |
| 12K preset hidden/disabled | Yes | Show + allow unless browser canvas fails |
| Extended 12K consent | Yes | Risk implies consent |
| Elevated byte consent | Yes (recommended) | Auto `oversizeConsented` |
| Hard byte drop | Partial | Raise cap, don't remove entirely |
| SVG output scale block | Yes | Allow any preset |
| Security (SVG external href) | **No** | Never bypass |
| Worker recycle | **No** | Memory lifecycle unchanged |

### 3.4 Single flag vs granular

**Recommendation:** One global `riskModeEnabled` for v1. Granular per-limit toggles add complexity without user benefit. Document in SPEC.

---

## 4. Implementation touch list (when building S6)

### Frontend

```
frontend/src/lib/prefs/user-settings.ts          # riskMode field
frontend/src/lib/transmutation/limit-context.ts  # skip blocks when risk
frontend/src/lib/transmutation/limits.ts         # optional raised hard cap
frontend/src/hooks/useFileMetrics.ts             # canTransmute / canEstimate
frontend/src/lib/imaging/downscale/dimensions.ts # presetExceedsPixelLimit bypass
frontend/src/lib/imaging/downscale/presets.ts    # allowsExtendedMaxEdge bypass
frontend/src/components/settings/RiskSettingsSection.tsx  # new
frontend/src/components/transmute/StagedWorkspace.tsx     # risk banner
frontend/src/components/transmute/TransmutationPanel.tsx  # hard limit + auto consent
frontend/src/components/transmute/LimitUnlockHint.tsx     # hide when risk on OR link active
frontend/src/workers/transmutation.worker.ts     # pass risk to Wasm if needed
```

### Rust (if TS-only bypass insufficient)

```
motor_transmutacion/core_utils/src/lib.rs        # optional risk flag in validate_input
motor_transmutacion/transmutador_svg/src/svg_validate.rs  # output dimension bypass
```

**Decision needed:** TS can bypass UI blocks but Wasm still rejects > 40 MP unless Rust accepts a session flag `set_risk_mode(true)` — **must implement both sides**.

### i18n

- Settings risk section copy (EN/ES)
- Workspace banner
- Update `LimitUnlockHint` to hide when Risk already enabled

---

## 5. Testing matrix (Risk mode QA)

| Scenario | Risk off | Risk on |
|----------|----------|---------|
| 123 MP PNG → JPG | Red block → resize | Direct transmute (or warn only) |
| 124 MB PNG elevated | Consent panel | No consent required |
| 160 MB file drop | Hard block | Allowed if raised cap |
| SVG 200% > 40 MP | Block + scale hint | Transmute at 200% |
| 12K astro on wide image | Preset disabled | Preset enabled (may still fail at canvas) |
| Low RAM mobile 12K | 12K hidden | Show with extra warning |

---

## 6. Open decisions (resolve before S6 coding)

| ID | Question | Proposal |
|----|----------|----------|
| R1 | Hard byte cap when Risk on | 500 MB desktop / 250 MB mobile — not unlimited |
| R2 | Wasm API for Risk | `set_risk_mode(bool)` in `core_utils`, read in all validators |
| R3 | Persist Risk across sessions | Yes, with easy disable in Settings |
| R4 | Auto-disable on tab crash | No (impossible reliably) — user re-enables |
| R5 | Notice Rail when Risk | Force L2/L3 warnings always visible |

---

## 7. Deliverables

### v2.3.6
- ✅ **SVG → JPEG** tool (Tier 3.3.2)
- ✅ **`LimitUnlockHint`** on pixel block, oversize consent, astro resize, hard limit error
- ✅ This analysis document

### v2.3.8 (Settings S6 — Risk mode + hotfixes)
- ✅ **Settings → Advanced / Risk** — acknowledge + enable toggle (`RiskModeProvider`)
- ✅ **`computeLimitContext({ riskModeEnabled })`** — bypass pixel/consent blocks; raised hard cap 500/250 MB
- ✅ **Wasm `set_risk_mode`** on all transmutation crates; worker + prepare sync
- ✅ **`AstroResizePanel`** — 12K visible; preset pixel gate bypass when Risk on
- ✅ **`LimitUnlockHint`** hidden when Risk active; workspace banner when active
- ⏳ **Settings S5** offline toolkit — deferred

---

## 8. Related documents

- `docs/LIMIT_PIPELINE.md` — regression reference
- `docs/planning/settings_panel_plan.md` — S1–S5 scope; Risk explicitly excluded until now
- `docs/planning/tier3_3_svg_implementation_plan.md` — Phase 3.3.2 complete at v2.3.6
- `docs/planning/astro_imagery_tier.md` — science imagery doctrine
- `docs/SPEC.md` §7.13 — amend when Risk ships
