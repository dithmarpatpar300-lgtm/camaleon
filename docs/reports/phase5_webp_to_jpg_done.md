# Technical Report: Phase 5.2 — WebP → JPEG Transmutation

**Task ID:** phase5_webp_to_jpg
**Status:** done (Architect patches applied)
**Date:** 2026-06-07
**Agent:** OpenCode + Chief Architect (Cursor)
**Model:** deepseek-v4-pro

## 1. Pre-Execution Analysis

### Options doctrine (§3.6)
WebP→JPG is the **lossy-output twin** of PNG→JPG: quality slider (1–100) + background color for alpha flatten. No chroma subsampling, progressive JPEG, or lossy WebP encode knobs — deferred per SPEC §5.5.6 and §5.12.3.

### Worker dual-route design
Both `webp-to-png` and `webp-to-jpg` share `transmutador_webp`. Routing requires `outputExtension` on `WorkerRequest` — inferring from options alone is unsafe (compression vs quality keys differ).

### Alpha detection
`detect-webp-alpha.ts` scans RIFF/VP8X for the alpha bit (0x10). Wired in `TransmutationPanel` to show `TransparencyNotice` only when alpha is present — parity with `png-to-jpg`.

### Fixture strategy
`image` 0.25 has no lossy WebP encoder. Integration tests use lossless WebP fixtures; real lossy WebP decodes at runtime.

---

## 2. Work Performed

### Files Created

| File | Purpose |
|------|---------|
| `frontend/src/lib/format/detect-webp-alpha.ts` | VP8X alpha-bit scanner for UI |
| `docs/prompts/phase5_webp_to_jpg.md` | Phase 5.2 execution prompt |

### Files Modified

| File | Change |
|------|--------|
| `motor_transmutacion/Cargo.toml` | Workspace version **1.3.1** |
| `motor_transmutacion/transmutador_webp/Cargo.toml` | Added `jpeg` feature |
| `motor_transmutacion/transmutador_webp/src/lib.rs` | JPEG exports + alpha flatten + estimate |
| `motor_transmutacion/transmutador_webp/tests/integration_test.rs` | +6 tests (#14–19) |
| `frontend/src/workers/types.ts` | `OutputExtension`, `outputExtension` on `WorkerRequest` |
| `frontend/src/workers/transmutation.worker.ts` | Dual-route `webp-to-png` / `webp-to-jpg` |
| `frontend/src/workers/result-cache.ts` | Fingerprint includes `outputExtension` |
| `frontend/src/providers/TransmutationWorkerProvider.tsx` | Passes `outputExtension` to worker |
| `frontend/src/lib/transmutation/fingerprint.ts` | Fingerprint includes `outputExtension` |
| `frontend/src/hooks/useFileMetrics.ts` | Accepts/passes `outputExtension` |
| `frontend/src/components/transmute/TransmutationPanel.tsx` | `detectWebpAlpha`, `outputExtension` wiring |
| `frontend/src/lib/tools/tool-registry.ts` | `webp-to-jpg` active |
| `frontend/src/types/wasm-modules.d.ts` | 3 new JPEG Wasm exports |
| `frontend/src/lib/i18n/dictionaries/en.ts` | `webp-to-jpg` meta + tools + two-gen lossy hint |
| `frontend/src/lib/i18n/dictionaries/es.ts` | Spanish equivalent |
| `frontend/package.json` | **1.7.2** |
| `docs/planning/v1_7_x_format_expansion_tier1.md` | §3.6 options matrix; Phase 5.2 status |

---

## 3. Verification

| Check | Result |
|-------|--------|
| `cargo test --workspace` | **96/96 PASS** (33 + 21 + 23 + 19) |
| `npm run build` | PASS — 8 static pages including `/transmute/webp-to-jpg` |
| `transmutador_webp_bg.wasm` | **626 KB** (≤ 3 MB, NFR-7) |
| Regression `webp-to-png` | All 13 Phase 5.1 tests green; worker routes PNG path via `outputExtension: "png"` |

---

## 4. Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Copy flatten formula into `transmutador_webp` | Avoid cross-crate refactor in Tier 1; identical math to `transmutador_png` §5.5.2 |
| `outputExtension` on worker protocol | Only reliable disambiguator for dual-output Wasm module |
| Background UI gated on alpha detection | UX parity with `png-to-jpg`; engine always receives bg RGB |
| Lossless WebP fixtures in tests | `image` crate limitation; documented, not a runtime gap |

---

## 5. Known Gaps / Follow-ups

| Item | Phase |
|------|-------|
| Lossy WebP integration test fixture | When `image` adds lossy encode or external fixture adopted |
| Chroma subsampling UI | `refine_jpeg_encoder_swap` |
| PNG→WebP / JPG→WebP | Phase 5.3–5.4 — **zero option sliders** in v1.7.x (lossless only) |

---

## 6. Chief Architect Review (Second Filter)

**Verdict:** **Approved with patches** (applied before v1.7.2 commit)

OpenCode delivered Rust crate, tests, registry, i18n, and `detect-webp-alpha.ts` correctly. OpenCode **did not** complete three critical frontend requirements and marked them as "follow-up" in its own report — unacceptable for Phase gate:

| Requirement | OpenCode | Architect patch |
|-------------|----------|-----------------|
| Worker dual-route via `outputExtension` | ❌ Still routed all WebP → PNG | ✅ `resolveRoute()` + `runFullEncode`/`runSizeEstimate` refactor |
| `outputExtension` through provider/metrics/fingerprint | ❌ Not wired | ✅ Full pipeline wired |
| `detectWebpAlpha` in `TransmutationPanel` | ❌ File created, not integrated | ✅ Staging logic + `TransparencyNotice` parity |
| Workspace version 1.3.1 | ❌ Left at 1.3.0 | ✅ Bumped |
| Report completeness | ⚠️ Incomplete; admitted gaps as done | ✅ Rewritten with verification table |

**Cognitive directive assessment:** OpenCode read the Rust path well but **stopped early on frontend integration** despite the prompt explicitly flagging worker routing as **critical**. Documenting incomplete work as "Known Gaps" does not satisfy the QA gate.

---

## 7. Regression Checklist (post-patch)

- [x] `webp-to-png`: compression slider + estimate + transmute → `.png`
- [x] `webp-to-jpg`: quality slider + estimate + transmute → `.jpg`
- [x] Alpha WebP on `webp-to-jpg` shows `TransparencyNotice`
- [x] Same `.webp` on both routes → different cache fingerprints (`outputExtension` + options)
