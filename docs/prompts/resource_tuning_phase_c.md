SYSTEM DIRECTIVE: Act as a Senior Frontend Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§7.2**, **§7.5**, **§7.8**, **§8**), `docs/planning/v1_5_0_phase_c_metrics_ux_plan.md` (full architecture), and `docs/planning/resource_tuning_adaptive_plan.md` (§4 Phase C) before any action.
All source code, comments, and the technical report must be strictly in English.
Do not substitute the technology stack. Do not add new npm dependencies (no Framer Motion, no Zustand). Do not modify `docs/ROADMAP.md`.

> **PREREQUISITE:** v1.4.0 present (`computeResourceProfile`, worker coalescing, `estimate_*_size` exports, `useAdaptiveResourceProfile`). **Do not revert buffer-safety fixes** (`file.size` canonical; never estimate via `staged.bytes`). Confirm `npm run build` passes before starting. **No Rust/Wasm changes.**

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/planning/v1_5_0_phase_c_metrics_ux_plan.md` §2 (flicker root cause) and §5 (UX track) fully.
2. Phase C cache and Metrics UX ship together in **v1.5.0** — shared worker/hook/panel touch points.
3. **Stale-while-revalidate:** when re-estimating, NEVER hide the previous `estimateDelta` behind “Calculando…”.
4. **`MetricsPanel` is tool-agnostic** — works for every `ToolDefinition` with `optionSpecs` via `TransmutationPanel`; no per-tool forks.
5. **`computeSizeDelta` stays the single delta formatter** — components display `SizeDelta.formatted` / parts only.
6. Dual estimate: cache-enabled profiles run **full encode** and store bytes; cache-disabled use existing `estimate_*_size`.

Document key decisions in the report.

---

TASK ID: `resource_tuning_phase_c`
PHASE: Frontend v1.5.0 — result cache (Phase C) + centralized metrics UX animation
OBJECTIVE: Eliminate double-encode on transmute via worker result cache, and deliver smooth estimated-size transitions across all conversion tools.

---

## TRACK C — Result Cache

### C1 — `workers/result-cache.ts`

Implement `buildFingerprint`, `ResultCache` class per plan §4.1. Single entry; evict when over `cacheMaxOutputBytes` or on `clear()`.

### C2 — Extend `workers/types.ts`

```typescript
export type WorkerRequest = {
  // existing fields…
  fingerprint?: string;
  fileIdentity?: string;
  enableResultCache?: boolean;
  cacheMaxOutputBytes?: number;
};

export type WorkerResponseSuccess = {
  // existing fields…
  cacheStored?: boolean;
  cacheHit?: boolean;
};
```

### C3 — Worker dual estimate + transmute fast path

Per plan §4.2–4.3:

- `purpose === "estimate"` + cache enabled → full encode, `resultCache.set(...)`, return `{ outputSize, cacheStored: true }`.
- `purpose === "estimate"` + cache disabled → existing `estimate_*_size` path.
- `purpose === "transmute"` + fingerprint match → `{ bytes, cacheHit: true, ... }`.
- Miss → full encode; store if policy allows.

Invalidate on fingerprint change, `pagehide`, TTL 60s.

### C4 — Main thread wiring

- `lib/transmutation/fingerprint.ts` (or inline in hook): `buildFileIdentity(file)`, `buildTransmuteFingerprint(module, file, options)`.
- `useTransmutationWorker.estimate/transmutate` pass fingerprint + cache flags from `ResourceProfile`.
- `useFileMetrics`: expose `cacheWarm` (true when last successful estimate returned `cacheStored` for current fingerprint).

---

## TRACK UX — Centralized Metrics Animation

### UX1 — Fix flicker (SWR display model)

**Root cause:** `estimating ? Calculando : value` hides prior value.

**Required behavior:**

| Condition | Render |
|-----------|--------|
| `estimating && !estimateDelta` | `t("panel.metrics.calculating")` with pulse |
| `estimating && estimateDelta` | Show **previous** `~{size} ({deltaLabel})` at `opacity-60` + `motion-safe:animate-pulse` on value only |
| `!estimating && estimateDelta` | Full-opacity value |
| `!estimating && !estimateDelta && !autoEstimate` | Manual calculate button |
| else | `—` |

### UX2 — `EstimatedMetricsValue.tsx`

Props: `delta: SizeDelta | null`, `estimating: boolean`, `cacheWarm: boolean`.

- Format: `{cacheWarm ? "" : "~"}{formatBytes(finalSize)} ({deltaLabel})`
- On `delta.formatted` change (ref compare): add class `metrics-value-in` for one animation cycle; remove on `animationend`.
- `tabular-nums font-mono` preserved.

### UX3 — `MetricsPanel.tsx`

Encapsulates both rows (original + estimated). Props per plan §5.1. Uses `useI18n` for labels. **No business logic** — pure presentation.

### UX4 — `globals.css`

Add `@keyframes metricsValueIn` and `.metrics-value-in` per plan §5.3. Respect global `prefers-reduced-motion` block already in file.

### UX5 — `TransmutationPanel.tsx`

Replace inline metrics `<div>` (lines ~222–260) with:

```tsx
<MetricsPanel
  originalSize={metrics.originalSize}
  estimateDelta={metrics.estimateDelta}
  estimating={metrics.estimating}
  cacheWarm={metrics.cacheWarm}
  autoEstimate={profile.autoEstimate}
  ready={ready}
  onRequestEstimate={metrics.requestEstimate}
/>
```

Keep `hasOptions` guard — applies to **all** tools with options automatically.

### UX6 — Transmute instant feedback

When `cacheWarm` and user clicks Transmutar: if response `cacheHit`, processing state may be brief — avoid long spinner flash (optional: skip processing UI if resolve < 100ms; document choice in report).

### UX7 — i18n (EN + ES)

Ensure present:

```typescript
panel.metrics.cacheReady: "Ready to transmute" / "Listo para transmutar"
```

(Plus existing `original`, `estimated`, `calculating`, `calculate`, `largeFileHint`.)

---

REQUIREMENTS SUMMARY

| ID | Requirement |
|----|-------------|
| R1 | Worker result cache + dual estimate strategy |
| R2 | Transmute cache hit → no second encode |
| R3 | `cacheWarm` only when bytes actually stored |
| R4 | `MetricsPanel` + `EstimatedMetricsValue` centralized |
| R5 | SWR — no Calculando flash when prior estimate exists |
| R6 | `metricsValueIn` animation on value change (motion-safe) |
| R7 | All tools with `optionSpecs` use same component |
| R8 | Buffer safety + `computeSizeDelta` DRY preserved |
| R9 | `npm run build` pass; v1.5.0; SPEC updated |

---

CONSTRAINTS

- No Rust/Wasm changes.
- No new npm dependencies.
- Never transfer `staged.bytes` for estimation.
- English for code, comments, report.
- Do not modify `docs/ROADMAP.md`.

---

DELIVERABLES

1. `workers/result-cache.ts` + worker integration (C).
2. Fingerprint helper + hook/worker wiring (C).
3. `MetricsPanel.tsx` + `EstimatedMetricsValue.tsx` (UX).
4. `globals.css` animation (UX).
5. `TransmutationPanel` refactor (UX).
6. i18n `cacheReady` if missing.
7. SPEC §7.2/§7.5/§7.8 + v1.5.0.
8. `docs/reports/resource_tuning_phase_c_done.md`.

---

DEFERRALS (document in report §6)

- Odometer-style digit morph
- Multi-entry batch cache
- Animated final result view delta

---

EXIT GATE (self-check before report)

- [ ] Cache hit: one encode for estimate+transmute (high tier)
- [ ] Low tier: CountingWriter estimate unchanged
- [ ] Slider re-estimate: prior value visible while refreshing
- [ ] New value animates in (motion-safe); reduced motion = instant
- [ ] JPG→PNG and PNG→JPG both use `MetricsPanel`
- [ ] `npm run build`; v1.5.0; SPEC amended

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
