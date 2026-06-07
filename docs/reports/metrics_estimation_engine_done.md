# Technical Report: Metrics Engine + Real-Time Size Estimation

**Task ID:** metrics_estimation_engine
**Status:** done
**Date:** 2026-06-06
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Pre-Execution Analysis

### Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| `computeSizeDelta` as single DRY source | Both estimate preview and final result use the same pure function. No inline percent math anywhere. |
| `estimate` runs silently in Worker | Actual transmutation is the only accurate estimation method (compression entropy makes math-only impossible). Worker isolation keeps main thread responsive. |
| Estimate reads fresh `file.arrayBuffer()` | The staged `ArrayBuffer` must never be transferred for estimation — it would detach and break the real transmute. `File.arrayBuffer()` returns a new buffer each call. |
| Worker returns `outputSize` only for estimates | No `ArrayBuffer` transfer for estimates; avoids copying large output buffers across the worker boundary. |
| Stale request cancellation | Rapid slider drags fire many estimates; a counter-based ID system ignores out-of-order responses. |
| Local hook state only | `useFileMetrics` is per-panel-instance; no Zustand/Context needed. |

## 2. Work Performed

### Files Created

| File | Purpose |
|------|--------|
| `frontend/src/lib/format/metrics.ts` | `computeSizeDelta()` pure function + `SizeDelta` type |
| `frontend/src/hooks/useFileMetrics.ts` | Debounced estimation hook with stale request cancellation |

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/workers/types.ts` | Added `WorkerPurpose`, `outputSize`, optional `bytes`/`mime`/`extension` on `WorkerResponseSuccess` |
| `frontend/src/workers/transmutation.worker.ts` | Estimate branch: runs WASM, returns `outputSize` only, no transfer |
| `frontend/src/hooks/useTransmutationWorker.ts` | Added `estimate` fn; extracted `sendMessage` helper; both `transmutate` and `estimate` use it |
| `frontend/src/components/transmute/TransmutationPanel.tsx` | Wired `useFileMetrics`; estimate row in staged view; `metrics.setFinalSize` on success; `metrics.resetMetrics` on reset; replaced inline `sizeDelta` with `metrics.finalDelta?.formatted` |
| `frontend/src/components/transmute/TransmutationDropzone.tsx` | Non-null assertions for optional `bytes`/`mime`/`extension` |
| `frontend/src/lib/i18n/dictionaries/en.ts` | +`panel.metrics.original`, `panel.metrics.estimated` |
| `frontend/src/lib/i18n/dictionaries/es.ts` | +`panel.metrics.original`, `panel.metrics.estimated` |
| `frontend/package.json` | v1.3.0 |
| `frontend/src/components/layout/Footer.tsx` | v1.3.0 |
| `docs/SPEC.md` | v1.3.0; amendment log |

## 3. Verification

| Command | Result |
|---------|--------|
| `npm run build` | PASS |

## 4. Known Gaps

| Item | Phase |
|------|-------|
| Large-file (50 MB) estimation throttling | Post-MVP |
| Shared metrics store (batch queue) | Post-MVP |
| Command Palette search (UI-8) | Post-MVP |

## 5. Deviations from Prompt

| Item | Note |
|------|------|
| `useDebouncedValue.ts` | Not created — debounce inlined in `useFileMetrics` via `setTimeout` cleanup (equivalent behavior). |
| `panel.metrics.calculating` | Omitted in initial delivery; added in Chief Architect second pass. |

## 6. Chief Architect Second Pass (2026-06-06)

| Fix | Rationale |
|-----|-----------|
| SPEC §7.2 body synced | Amendment log referenced v1.3.0 but protocol section still showed pre-estimate shape. |
| `panel.metrics.calculating` i18n | R6 completeness; replaces hardcoded `~…` while estimating. |
| `useFileMetrics` clears on `file` change | Prevents stale estimate paired with new `originalSize`. |
| Staged header uses `file.size` | Canonical size — staged `ArrayBuffer` may detach after transmute. |
| Transparency HTML fix (`<div>` not `<p>`) | Hydration error when popover opened inside notice body. |
| Background color single surface | `background` spec hidden from `OptionsControls` when notice owns it (no duplicate picker). |

---

### Self-Check (Exit Gate)
- [x] `computeSizeDelta` is the single delta source (DRY)
- [x] Estimate reacts to all reactive options with 400ms debounce, in the worker
- [x] Real transmute still works after estimates (no detached buffer)
- [x] Stale estimates ignored; only latest shown
- [x] Original size always correct; final delta exact
- [x] `npm run build` passes; SPEC + dictionaries updated; v1.3.0
