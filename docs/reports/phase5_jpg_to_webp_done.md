# Technical Report: Phase 5.4 — JPEG → WebP Transmutation

**Task ID:** phase5_jpg_to_webp  
**Status:** done (Architect patches applied)  
**Date:** 2026-06-07  
**Agent:** OpenCode + Chief Architect (Cursor)  
**Model:** deepseek-v4-pro  
**Version:** Engine v1.4.1 / Frontend v1.7.6

---

## 1. Wasm Size Check

| Metric | v1.7.3 (PNG only) | v1.7.6 (+JPEG) | Δ |
|--------|-------------------|----------------|----|
| `transmutador_encode_bg.wasm` | ~423 KB | **649 KB** | +226 KB |
| Gate (NFR-7) | — | **PASS** (≤ 3 MB) | — |

The 226 KB increase is from the `jpeg` decoder feature in `image` crate — expected and within budget.

---

## 2. Pre-Execution Analysis

| Topic | Decision |
|-------|----------|
| **Dual-route problem** | `png-to-webp` and `jpg-to-webp` share `module: "transmutador_encode"` and `outputExtension: "webp"`. `outputExtension` cannot disambiguate — **`encodeSource: "png" \| "jpeg"`** required on worker requests, fingerprints, and panel wiring. |
| **RGB-only policy** | JPEG has no alpha; pipeline always `to_rgb8()` before VP8L lossless encode. |
| **Estimate path** | `core_utils::counting_writer::count_webp_bytes(&rgb)` — no `CountingWriter` usage in `transmutador_encode`. |
| **UI options** | Zero `optionSpecs` per §3.6; `MetricsPanel` estimate before Transmute (v1.7.4 behavior). |
| **Inflation honesty** | §5.12.4 — fidelity hint warns 2×–10× larger output; action title says "Lossless WebP". |

---

## 3. Work Performed

### Rust

| File | Change |
|------|--------|
| `motor_transmutacion/Cargo.toml` | Workspace **v1.4.1** (Architect patch — OpenCode left at 1.4.0) |
| `motor_transmutacion/transmutador_encode/Cargo.toml` | Added `"jpeg"` to `image` features |
| `motor_transmutacion/transmutador_encode/src/lib.rs` | `jpg_bytes_to_webp_bytes`, `transmutar_jpg_a_webp_inner`, `transmutar_jpg_a_webp`, `estimate_jpg_to_webp_size` |
| `motor_transmutacion/transmutador_encode/tests/integration_test.rs` | +5 tests (#27–31): RIFF, dimensions, StripAll, estimate ±10%, size inflation |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/workers/types.ts` | `EncodeSource` type; `encodeSource` on `WorkerRequest` (Architect patch) |
| `frontend/src/workers/transmutation.worker.ts` | Bind JPEG exports; route by `encodeSource` in `runFullEncode` / `runSizeEstimate` (Architect patch) |
| `frontend/src/workers/result-cache.ts` | `encodeSource` in `buildFingerprint` (Architect patch) |
| `frontend/src/lib/transmutation/fingerprint.ts` | Thread `encodeSource` (Architect patch) |
| `frontend/src/providers/TransmutationWorkerProvider.tsx` | Pass `encodeSource` to worker (Architect patch) |
| `frontend/src/hooks/useFileMetrics.ts` | `encodeSource` in fingerprint + estimate (Architect patch) |
| `frontend/src/components/transmute/TransmutationPanel.tsx` | Derive `encodeSource` from `tool.fromFormat`; pass to metrics + transmute (Architect patch) |
| `frontend/src/types/wasm-modules.d.ts` | `transmutar_jpg_a_webp`, `estimate_jpg_to_webp_size` |
| `frontend/src/lib/tools/tool-registry.ts` | `jpg-to-webp` active; no `optionSpecs` |
| `frontend/src/lib/i18n/dictionaries/en.ts` | Lossless WebP copy + §5.12.4 inflation warning |
| `frontend/src/lib/i18n/dictionaries/es.ts` | Spanish equivalent |
| `frontend/package.json` | **v1.7.6** |

---

## 4. Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| `encodeSource` discriminator | Same pattern as `outputExtension` for `transmutador_webp`; scales if more encode routes share one crate |
| Always RGB for JPEG path | No alpha in JPEG; simpler pipeline, matches §3.6 |
| `count_webp_bytes` in `core_utils` | Centralized estimator; satisfies rust-analyzer + prompt constraint |
| Fail loud without `encodeSource` | Prevents silent mis-route to PNG encoder on JPEG input |
| Frontend v1.7.6 (not 1.7.5) | v1.7.5 already shipped UX polish; Phase 5.4 gets next semver |

---

## 5. Verification

| Check | Result |
|-------|--------|
| `cargo test --workspace` | **112/112 PASS** |
| `transmutador_encode_bg.wasm` | **649 KB** (NFR-7) |
| `npm run build` | PASS — **10** static pages including `/transmute/jpg-to-webp` |
| Regression (5 prior tools) | All routes unchanged |
| `MetricsPanel` on `jpg-to-webp` | Estimate before Transmute; no sliders |
| v1.7.5 UX (ScrollVeil, theme fade) | Not regressed |

### Tier 1 WebP Suite — Complete

| Direction | Crate | Version |
|-----------|-------|---------|
| WebP → PNG | `transmutador_webp` | v1.7.1 |
| WebP → JPEG | `transmutador_webp` | v1.7.2 |
| PNG → WebP | `transmutador_encode` | v1.7.3 |
| JPEG → WebP | `transmutador_encode` | v1.7.6 |

---

## 6. Chief Architect Review (Second Filter)

**Verdict:** **Approved with patches** (applied before v1.7.6 commit)

OpenCode delivered Rust exports, integration tests, registry, i18n, and Wasm bindings — but **repeated the Phase 5.2/5.3 failure mode**: worker integration left incomplete despite the prompt marking dual encode routing as **CRITICAL**.

| Requirement | OpenCode | Architect patch |
|-------------|----------|-----------------|
| `encodeSource` on `WorkerRequest` | ❌ Not added | ✅ `types.ts` |
| Worker routes JPEG vs PNG encode | ❌ `runFullEncode` always called `transmutarPngToWebp` | ✅ `encodeSource` branch in worker |
| Fingerprint includes `encodeSource` | ❌ Missing | ✅ `result-cache.ts` + `fingerprint.ts` |
| Provider threads `encodeSource` | ❌ Missing | ✅ `TransmutationWorkerProvider.tsx` |
| Panel derives + passes `encodeSource` | ❌ Missing | ✅ `TransmutationPanel.tsx` + `useFileMetrics.ts` |
| Workspace v1.4.1 | ❌ Left at 1.4.0 | ✅ Bumped |
| Frontend version | ⚠️ Would collide with v1.7.5 UX | ✅ **v1.7.6** |
| Report completeness | ❌ 54-line stub; claimed "All green" with broken JPEG route | ✅ Rewritten with review section |

**Cognitive assessment:** OpenCode read the cognitive directive (step 5: dual encode routing) and bound JPEG Wasm exports in `initEncodeWasm`, but never wired `runFullEncode` / `runSizeEstimate` to use them. JPEG→WebP would have silently run the PNG encoder path — producing corrupt output or decode errors. This is the same class of incomplete worker wiring flagged in `phase5_png_to_webp_done.md` §6.

---

## 7. SPEC Amendments

- §6.5 `transmutador_encode`: Phase 5.4 exports marked implemented (v1.7.6)
- §12.2 Phase 5.4: ✅ v1.7.6 — Tier 1 complete
- Amendment log: 1.7.6 entry added
