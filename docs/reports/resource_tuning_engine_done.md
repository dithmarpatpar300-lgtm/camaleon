# Technical Report: Adaptive Resource Tuning Engine

**Task ID:** resource_tuning_engine
**Status:** done (Phases A + B); Phase C deferred to v1.5.0
**Date:** 2026-06-06
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Work Performed

### Phase A — Adaptive Scheduling (TS)

| File | Purpose |
|------|--------|
| `frontend/src/lib/device/resource-profile.ts` | `computeResourceProfile(fileSize, signals)` — weighted scoring → tier (high/mid/low) |
| `frontend/src/hooks/useAdaptiveResourceProfile.ts` | Navigator signals + connection/visibility listeners |
| `frontend/src/workers/transmutation.worker.ts` | Serialized pipeline; estimate coalescing; transmute preemption |
| `frontend/src/hooks/useFileMetrics.ts` | Profile-aware debounce, visibility pause/resume, WeakMap input cache, `requestEstimate()` |
| `frontend/src/hooks/useTransmutationWorker.ts` | `superseded` handling |

### Phase B — Wasm Size-Only Estimate (Engine v1.2.0)

| File | Purpose |
|------|--------|
| `motor_transmutacion/core_utils/src/counting_writer.rs` | `CountingWriter` + unit tests |
| `motor_transmutacion/transmutador_png/src/lib.rs` | `estimate_png_to_jpg_size` |
| `motor_transmutacion/transmutador_jpg/src/lib.rs` | `estimate_jpg_to_png_size` |

### Phase C — Result Cache

**Deferred to v1.5.0.** `enableResultCache` fields exist on `ResourceProfile` for future integration.

## 2. Verification

| Command | Result |
|---------|--------|
| `cargo test --workspace` | PASS (OpenCode + Architect size-parity tests) |
| `scripts/build-wasm.ps1` | Both modules with estimate exports |
| `npm run build` | PASS |

## 3. Deviations from Prompt

| Item | Note |
|------|------|
| Phase C result cache | Not implemented — deferred v1.5.0 |
| Manual estimate UI + i18n | OpenCode omitted; Architect added |
| Worker `estimate_*_size` routing | OpenCode left full encode path; Architect wired CountingWriter exports |
| `superseded → 0` | OpenCode bug; Architect throws/ignores to avoid false `0 B` estimate |
| Frontend version | **v1.4.0** (A+B); v1.5.0 reserved for Phase C cache |

## 4. Chief Architect Second Pass (2026-06-06)

| Fix | Rationale |
|-----|-----------|
| Worker routes to `estimate_*_size` | Phase B RAM savings actually applied |
| Pipeline `dispatch` serializes Wasm jobs | True coalescing — one encode at a time |
| `superseded` no longer returns 0 | Prevents corrupt estimate display |
| Manual calculate button + `largeFileHint` i18n | Large-file gate UX (all environments) |
| Visibility resume schedules estimate | Tab focus recovery |
| Removed premature `cacheWarm` | Misleading without real cache |
| `estimate_size_matches_full_transmute` tests | PNG + JPG parity gate |

## 5. Version

- Frontend: **v1.4.0**
- Engine: **v1.2.0**

---

### Self-Check (Exit Gate)

- [x] Situational profile scoring (no UA / mobile-only branching)
- [x] Worker coalescing + transmute preemption
- [x] CountingWriter estimate path wired in worker
- [x] Buffer safety preserved
- [x] `computeSizeDelta` unchanged (DRY)
- [ ] Phase C result cache (deferred v1.5.0)
- [x] `cargo test --workspace` + `npm run build` pass
