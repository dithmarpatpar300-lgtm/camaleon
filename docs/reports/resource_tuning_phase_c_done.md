# Technical Report: Phase C Result Cache + Metrics UX Animation

**Task ID:** resource_tuning_phase_c
**Status:** done (after Architect second pass)
**Date:** 2026-06-06
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Work Performed

### Track C — Result Cache

| File | Purpose |
|------|--------|
| `workers/result-cache.ts` | `ResultCache` single-entry, 60s TTL, budget eviction |
| `workers/types.ts` | `WorkerRequestMeta`, cache fields on request/response |
| `workers/transmutation.worker.ts` | Dual estimate + transmute cache fast path |
| `lib/transmutation/fingerprint.ts` | `buildFileIdentity`, `buildTransmuteFingerprint` |
| `hooks/useTransmutationWorker.ts` | Passes meta (fingerprint, cache flags) to worker |
| `hooks/useFileMetrics.ts` | `cacheWarm`, `transmuteMeta` for panel + transmute |

### Track UX — Metrics Animation

| File | Purpose |
|------|--------|
| `components/transmute/MetricsPanel.tsx` | Centralized metrics block (all tools with `optionSpecs`) |
| `app/globals.css` | `@keyframes metricsValueIn` (220ms, reduced-motion safe) |
| `components/transmute/TransmutationPanel.tsx` | Uses `<MetricsPanel>` |

## 2. Verification

| Command | Result |
|---------|--------|
| `npm run build` | PASS (v1.5.0) |

## 3. OpenCode Gaps (Architect second pass)

| Gap | Severity | Fix |
|-----|----------|-----|
| Fingerprint never sent to worker | **Critical** — cache inert | `WorkerRequestMeta` wired through `sendMessage` |
| Transmute encoded before cache lookup | **Critical** | Cache check moved before Wasm encode |
| `cacheWarm` from `profile.enableResultCache` | **High** — false positive | Set only when `cacheStored === true` |
| Pipeline coalescing regressed | **High** | Restored `dispatch` + `pendingEstimateId` |
| CountingWriter path removed on estimate | **High** | Dual strategy restored for cache-disabled tier |
| `MetricsPanel` showed "Calculating" when `!delta` always | **Medium** | SWR: only when `estimating && !delta` |
| `import` mid-file in MetricsPanel | **Low** | Moved to top |
| `largeFileHint` removed | **Low** | Restored |

## 4. Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| SWR display | Prior estimate stays visible (opacity-60) during re-estimate — no flash |
| `MetricsPanel` tool-agnostic | Any `ToolDefinition` with `optionSpecs` inherits UX |
| Dual estimate preserved | Low-tier RAM: CountingWriter; high-tier: full encode + cache |
| `transmuteMeta` from hook | Single fingerprint source for estimate + transmute |

## 5. Deferrals

| Item | Phase |
|------|-------|
| Skip processing spinner on cache hit | Post-v1.5.0 |
| Multi-entry batch cache | Point 3 roadmap |
| Odometer digit morph | Post-v1.5.0 |

## 6. Version

- Frontend: **v1.5.0**
- Engine: **v1.2.0** (unchanged)

---

### Self-Check (Exit Gate)

- [x] Fingerprint + cache flags reach worker
- [x] Transmute checks cache before encode
- [x] Dual estimate strategy (cache on/off)
- [x] SWR — no Calculando flash when prior estimate exists
- [x] `metricsValueIn` on value change (motion-safe)
- [x] All tools with options use `MetricsPanel`
- [x] `npm run build` passes; SPEC v1.5.0
