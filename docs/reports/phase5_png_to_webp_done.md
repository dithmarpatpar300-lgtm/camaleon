# Technical Report: Phase 5.3 — PNG → WebP Transmutation

**Task ID:** phase5_png_to_webp
**Status:** done (Architect patches applied)
**Date:** 2026-06-07
**Agent:** OpenCode + Chief Architect (Cursor)
**Model:** deepseek-v4-pro

## 1. Spike Gate Results

| Metric | Result |
|--------|--------|
| `transmutador_encode_bg.wasm` size | **423 KB** (≤ 3 MB) ✅ |
| 1024×768 encode | Dimensions preserved (OpenCode) |
| RIFF/WEBP validation | Magic bytes verified |
| **Gate decision** | **PASS** — proceed with full implementation |

`image` 0.25 encodes lossless VP8L via `ImageFormat::WebP`. Lossy WebP encode is out of scope (§5.12.3).

---

## 2. Work Performed

### Files Created

| File | Purpose |
|------|---------|
| `motor_transmutacion/transmutador_encode/Cargo.toml` | New encode crate: `png+webp` features, no rayon |
| `motor_transmutacion/transmutador_encode/src/lib.rs` | `transmutar_png_a_webp`, `estimate_png_to_webp_size`, `_inner` pipeline |
| `motor_transmutacion/transmutador_encode/tests/integration_test.rs` | 7 integration tests (#20–26) |
| `docs/prompts/phase5_png_to_webp.md` | Phase 5.3 execution prompt |

### Files Modified

| File | Change |
|------|--------|
| `motor_transmutacion/Cargo.toml` | Workspace **v1.4.0**; `transmutador_encode` member |
| `motor_transmutacion/core_utils/src/lib.rs` | `OutputFormat::WebP`; RIFF/WEBP `validate_output` |
| `motor_transmutacion/core_utils/src/counting_writer.rs` | `Seek` impl for WebP encoder compatibility |
| `frontend/src/workers/types.ts` | `transmutador_encode` module; `OutputExtension` includes `"webp"` |
| `frontend/src/workers/transmutation.worker.ts` | `initEncodeWasm`, `isEncode` routing, mime/extension |
| `frontend/src/types/wasm-modules.d.ts` | `transmutador_encode` declarations |
| `frontend/src/lib/tools/tool-registry.ts` | `png-to-webp` active; no `optionSpecs` |
| `frontend/src/lib/i18n/dictionaries/en.ts` | Lossless WebP copy + photographic inflation hint |
| `frontend/src/lib/i18n/dictionaries/es.ts` | Spanish equivalent |
| `frontend/src/components/transmute/TransmutationPanel.tsx` | `OutputExtension` includes `webp` |
| `scripts/build-wasm.ps1` | `transmutador_encode` added |
| `scripts/build-wasm.sh` | `transmutador_encode` added (Architect patch) |
| `frontend/package.json` | **v1.7.3**; `build:wasm` extended (Architect patch) |

---

## 3. Verification

| Check | Result |
|-------|--------|
| `cargo test --workspace` | **105/105 PASS** (35 + 21 + 23 + 19 + 7) |
| `npm run build` | PASS — 9 static pages including `/transmute/png-to-webp` |
| `transmutador_encode_bg.wasm` | **423 KB** (NFR-7) |
| Regression (4 prior tools) | All existing tests green |

---

## 4. Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Lossless only via `write_to(WebP)` | `image` 0.25 constraint; UI labeled "Lossless WebP" (NFR-8) |
| `CountingWriter` + `Seek` | WebP encoder requires `Write + Seek`; added no-op `Seek` to counting sink |
| Zero UI options | §3.6 — encode-side lossless has no user knobs |
| Lazy-load fourth Wasm module | Same pattern as `transmutador_webp`; no startup preload |

---

## 5. Known Gaps / Follow-ups

| Item | Phase |
|------|-------|
| Lossy WebP encode | Separate library spike — not v1.7.x |
| JPEG → WebP | Phase 5.4 (`transmutar_jpg_a_webp`) |

---

## 6. Chief Architect Review (Second Filter)

**Verdict:** **Approved with patches** (applied before v1.7.3 commit)

OpenCode delivered spike, Rust crate, core_utils WebP validation, registry, and i18n. Critical gaps — same class as Phase 5.2:

| Requirement | OpenCode | Architect patch |
|-------------|----------|-----------------|
| Worker routes `transmutador_encode` | ❌ `initEncodeWasm` declared but never called in `handleRequest`/`runFullEncode` | ✅ `isEncode` route + lazy init |
| `validate_output(WebP)` in pipeline | ❌ Missing | ✅ Added to `_inner` |
| `CountingWriter` estimate | ❌ Full buffer allocation | ✅ CountingWriter (+ `Seek` on sink) |
| Workspace v1.4.0 | ❌ Left at 1.3.1 | ✅ Bumped |
| `build-wasm.sh` + `package.json build:wasm` | ❌ Only `.ps1` updated | ✅ Both scripts |
| `OutputExtension: "webp"` | ❌ Not in types | ✅ Extended |
| Report completeness | ⚠️ Minimal | ✅ Rewritten with review section |

**Cognitive assessment:** OpenCode repeated the Phase 5.2 pattern — solid Rust scaffolding, worker integration left incomplete despite prompt explicitly listing `initEncodeWasm` routing as a requirement.

---

## 7. Regression Checklist (post-patch)

- [x] `png-to-webp`: transmute → `.webp`; metrics estimate works
- [x] `jpg-to-png`, `png-to-jpg`, `webp-to-png`, `webp-to-jpg` unchanged
- [x] No option sliders on `png-to-webp` page
- [x] EN/ES copy includes "Lossless WebP"
