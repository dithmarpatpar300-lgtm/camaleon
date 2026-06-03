# Technical Report: Output Integrity Protocol — Post-Encode Validation & Bounded Parameters

**Task ID:** refine_output_integrity
**Status:** done
**Date:** 2026-06-03
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Pre-Execution Analysis

### Validation Asymmetry (the gap)

Before this task, every transmutator validated the **input** (non-empty, ≤50 MB, ≤40 MP) but performed **zero output validation**. If an encoder produced a zero-byte or truncated buffer, the user would download a corrupt file with no error. SPEC §5.11.1 identified this as the highest-priority integrity gap.

### Defense-in-Depth Strategy

| Layer | Before | After |
|-------|--------|-------|
| Input validation | ✅ `validate_input` with dimension probes | Unchanged |
| Parameter validation | ✅ runtime `validate_quality` / `validate_compression` | Now also type-level via `Quality` / `Compression` newtypes |
| **Output validation** | ❌ None | ✅ `validate_output` (non-empty + magic bytes) in both `_inner` pipelines |

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| `validate_output` in `core_utils` (not transmutators) | Pure byte parsing, no `image` dependency — preserves `core_utils`' decode-free boundary |
| Round-trip deferred to transmutator crates | Requires `image::ImageReader`; transmutators already have that dependency |
| Newtypes keep `u8` Wasm export signatures | Wasm exports receive raw `u8`, validate via `try_new`, then pass guaranteed-valid values to internal functions |
| Free functions `validate_quality`/`validate_compression` preserved | Backward compatibility for existing callers and tests; delegate to `try_new` |

## 2. Work Performed

### Files Modified

| File | Change |
|------|--------|
| `motor_transmutacion/core_utils/src/lib.rs` | Added `OutputFormat` enum, `validate_output()` function; +5 output validation tests (31 total) |
| `motor_transmutacion/transmutador_png/src/lib.rs` | Added `Quality(u8)` newtype with `try_new`/`DEFAULT`; `validate_quality` delegates to `try_new`; `validate_output(OutputFormat::Jpeg)` in `_inner` |
| `motor_transmutacion/transmutador_png/tests/integration.rs` | +4 quality newtype tests (21 total) |
| `motor_transmutacion/transmutador_jpg/src/lib.rs` | Added `Compression(u8)` newtype with `try_new`/`DEFAULT`; `validate_compression` delegates to `try_new`; `validate_output(OutputFormat::Png)` in `_inner` |
| `motor_transmutacion/transmutador_jpg/tests/integration.rs` | +4 compression newtype tests (19 total) |
| `motor_transmutacion/Cargo.toml` | Version `0.5.6` → `0.6.6` |
| `docs/SPEC.md` | §5.11.3/§5.11.4/§5.11.5 implemented; §5.8 ✅; §6.1/§6.3 updated |

### New API Surface

```rust
// core_utils
pub enum OutputFormat { Png, Jpeg }
pub fn validate_output(bytes: &[u8], format: OutputFormat) -> Result<(), String>;

// transmutador_png
pub struct Quality(u8);  // private field
impl Quality {
    pub const DEFAULT: Quality;
    pub fn try_new(value: u8) -> Result<Self, String>;
    pub fn value(&self) -> u8;
}

// transmutador_jpg
pub struct Compression(u8);  // private field
impl Compression {
    pub const DEFAULT: Compression;
    pub fn try_new(value: u8) -> Result<Self, String>;
    pub fn value(&self) -> u8;
}
```

### Pipeline Wiring

```rust
// transmutar_jpg_a_png_inner
pub fn transmutar_jpg_a_png_inner(input: &[u8], options: &JpgToPngOptions) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    let output = jpg_bytes_to_png_bytes(input, options)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

// transmutar_png_a_jpg_inner
pub fn transmutar_png_a_jpg_inner(input: &[u8], options: &PngToJpgOptions) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    let output = png_bytes_to_jpg_bytes(input, options)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?;
    Ok(output)
}
```

Wasm exports unchanged — they delegate to `_inner` as before.

## 3. Verification Results

| Command | Result | Notes |
|---------|--------|-------|
| `cargo test --workspace` | PASS | 71/71 tests (31 core_utils + 19 transmutador_jpg + 21 transmutador_png) |
| `cargo check --workspace` | PASS | 0 errors, 0 warnings |

### New Test Results

| Test | Assertion |
|------|-----------|
| `validate_output_rejects_empty` | Empty → "empty" |
| `validate_output_png_ok` | Minimal PNG → Ok |
| `validate_output_png_bad_magic` | Garbage bytes → "PNG" error |
| `validate_output_jpeg_ok` | Minimal JPEG → Ok |
| `validate_output_jpeg_bad_magic` | Garbage bytes → "JPEG" error |
| `quality_try_new_rejects_zero` | Quality(0) → Err |
| `quality_try_new_accepts_range` | Quality(1/85/100) → Ok |
| `quality_try_new_rejects_over_100` | Quality(101) → Err |
| `quality_default_is_85` | Quality::DEFAULT = 85 |
| `compression_try_new_rejects_zero` | Compression(0) → Err |
| `compression_try_new_accepts_range` | Compression(1/6/9) → Ok |
| `compression_try_new_rejects_over_9` | Compression(10) → Err |
| `compression_default_is_6` | Compression::DEFAULT = 6 |

## 4. SPEC Amendments

**Version:** 0.6.5 → 0.6.6 (MINOR bump — new `core_utils` API + bounded newtypes, backward-compatible exports).

**Sections updated:**
- §5.11.3: Output validations marked ✅ with status column; round-trip/size-coherence noted deferred
- §5.11.4: Bounded newtypes marked implemented; `ChromaSubsampling` deferred to §5.5.6
- §5.11.5: OUTPUT row changed from ❌ gap to ✅ implemented
- §5.8: `refine_output_integrity` marked v0.6.6 ✅
- §6.1: `validate_output`, `OutputFormat` documented; test count 26→31
- §6.3: `Quality`/`Compression` newtypes documented
- §11: Amendment log entry

## 5. Known Gaps / Follow-ups

| Item | Phase | Notes |
|------|-------|-------|
| `refine_jpeg_encoder_swap` | §5.5.6 | Prerequisite for chroma subsampling UI |
| Round-trip dimension validation | Post-MVP | Opt-in; requires `image` re-decode in transmutator crates |
| Size coherence heuristic | Post-MVP | Low priority; `validate_output` covers the critical gap |
| Pre-transmute transparency UX notice | UI-5 | Frontend follow-up per §5.11.6 |

## 6. Deviations from Prompt

None. All requirements R1–R7 satisfied. Wasm export signatures unchanged. `core_utils` retains decode-free boundary. All existing tests pass. StripAll and defaults preserved.

## 7. Architect Review (Cursor)

| Item | Fix applied |
|------|-------------|
| SPEC §5.11.1 | Rewritten as resolved (v0.6.6); no longer describes a live gap |
| SPEC §5.11.2 | Output break-point rows marked ✅ |
| SPEC §5.11.5 / §6.1 cross-ref | PARAMETERS + §5.11.6 table synced to implemented state |
| SPEC §5.8 / header | Version 0.6.6; next backend task = `refine_jpeg_encoder_swap` |
| README / frontend version | Unchanged at v0.6.4 (backend-only; no Wasm rebuild required for UI) |

Verified after corrections: `cargo test --workspace` PASS (71/71).

---

### Self-Check (Exit Gate)
- [x] Every encode path validates its output (non-empty + magic bytes) before returning
- [x] `Quality` / `Compression` cannot be constructed out of range
- [x] Wasm export signatures unchanged; defaults + StripAll preserved
- [x] `core_utils` retains decode-free default path
- [x] `cargo test --workspace` passes (71/71)
- [x] SPEC §5.11 / §6.1 / §5.8 updated; version bumped; amendment logged
