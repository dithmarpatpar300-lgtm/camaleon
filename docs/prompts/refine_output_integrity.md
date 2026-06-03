SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project, specialized in Rust, image processing, and memory-safe systems.
Read `docs/SPEC.md` (**§5.4**, **§5.5**, **§5.7**, **§5.10**, **§5.11**, **§6.1–§6.3**, **§8** NFRs) and `docs/ROADMAP.md` before any action.
All source code, comments, and the technical report must be strictly in English.
Do not substitute the technology stack (Rust + `image` crate v0.25 + `wasm-bindgen`). Do not modify `docs/ROADMAP.md`.

> **PREREQUISITE:** Backend complete through **v0.5.6**. This is a backend-only hardening task; **no frontend, no Wasm protocol signature changes** (exports keep `u8` params). Confirm `core_utils`, `transmutador_jpg`, `transmutador_png` build before starting.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read SPEC §5.11 (Output Integrity Protocol — the authoritative spec for this task), §5.7 (existing input/memory guards you must mirror in style), §6.1 (`core_utils` capabilities), §5.10 (StripAll — your changes must not alter metadata behavior).
2. Inspect the current pipeline wrappers: `transmutar_jpg_a_png_inner` and `transmutar_png_a_jpg_inner`. Both call `validate_input` **before** encode but perform **no output validation after** encode. This is the gap (§5.11.1).
3. Inspect the existing free-function validators: `validate_compression` (transmutador_jpg) and `validate_quality` (transmutador_png). These are correct but not type-enforced — a caller can still pass a raw out-of-range `u8` to internal functions.
4. Plan two complementary layers: **(a)** post-encode output validation in `core_utils`; **(b)** bounded newtypes that make out-of-range parameters unrepresentable (§5.11.4). Keep the hot path cheap (O(1) checks); make round-trip validation an **opt-in** helper, never default (cost on large rasters).
5. Preserve all existing behavior: same Wasm export signatures, same default quality 85 / compression 6, same StripAll, same error-string contract (NFR-4). All existing tests must still pass.
6. State assumptions and decisions in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `refine_output_integrity`
PHASE: Backend engine hardening (pre-v1.0.0, §5.8)
OBJECTIVE: Close the output-validation gap (§5.11) by adding post-encode integrity checks (non-empty + destination magic bytes, mandatory; round-trip decode, opt-in) and bounded-parameter newtypes (`Quality`, `Compression`) so no configuration or encoder edge case can yield an empty, truncated, or unreadable output — with zero changes to Wasm export signatures or frontend.

---

CONTEXT

- **§5.11** defines the normative protocol; implement it faithfully.
- Current validators reject bad **input** and bad **parameters at the export boundary**, but the **output buffer is returned unverified**.
- The three exposed levers (quality 1–100, compression 1–9, background RGB) are orthogonal and individually bounded; background channels are `u8` (always valid). The remaining risk is an encoder producing an empty/truncated/wrong-format buffer.
- Magic signatures: PNG = `89 50 4E 47 0D 0A 1A 0A`; JPEG = `FF D8` (and well-formed JPEG ends `FF D9`).

---

REQUIREMENTS

### R1 — `core_utils`: output validation API

Add to `motor_transmutacion/core_utils/src/lib.rs`:

```rust
/// Target container format for output validation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputFormat {
    Png,
    Jpeg,
}

/// Mandatory, O(1) post-encode validation: non-empty + correct magic bytes.
pub fn validate_output(bytes: &[u8], format: OutputFormat) -> Result<(), String>;
```

Behavior:

- Empty output → `ConversionFailed("encoder produced empty output")` (use the existing `TransmutationError::ConversionFailed` variant via its `Display`).
- PNG: must start with the 8-byte PNG signature, else `ConversionFailed("output is not a valid PNG (missing signature)")`.
- JPEG: must start with `FF D8`, else `ConversionFailed("output is not a valid JPEG (missing SOI)")`. Optionally also assert it ends with `FF D9` (EOI) — if you add this, document it and cover with a test.
- Reuse `TransmutationError` for message construction; do **not** invent a parallel error channel.

Extend the `TransmutationError` enum only if necessary; prefer reusing `ConversionFailed(String)` to keep the Wasm boundary contract stable.

### R2 — `core_utils`: optional round-trip validation (opt-in, not default)

Add a separate, **opt-in** helper (must NOT run in the default hot path due to cost on large images):

```rust
/// Strict sanity check: re-decode the output and confirm dimensions are non-zero
/// and within MAX_PIXELS. Intended for tests / a future strict mode, NOT the
/// default pipeline. Requires the `image` crate (so this lives behind a function
/// callers opt into; core_utils must remain decode-free in its default path).
```

Design decision to document: `core_utils` currently has **no `image` dependency** (pure byte parsing, §6.1). Do **not** add an `image` dependency to `core_utils` if it would break that boundary. Instead, implement the opt-in round-trip check **inside each transmutator crate** (which already depends on `image`) as a private helper used only by tests, OR expose a generic `validate_roundtrip_dimensions` that takes a decode closure. Choose the cleaner option and justify it in the report. **Mandatory checks (R1) stay in `core_utils`; round-trip may live in the transmutator crates.**

### R3 — Bounded-parameter newtypes (§5.11.4)

Make out-of-range parameters unrepresentable.

- In `transmutador_png`: introduce `Quality(u8)` with a private field and `Quality::try_new(value: u8) -> Result<Self, String>` as the **only** public constructor (reuses the `validate_quality` bounds: reject 0, reject >100). Add `Quality::value()` accessor and a `DEFAULT` const (85).
- In `transmutador_jpg`: introduce `Compression(u8)` analogously (reject 0, reject >9; `DEFAULT` = 6).
- Refactor `PngToJpgOptions.quality` and `JpgToPngOptions.compression` to use the newtypes (or keep the struct fields but funnel all construction through `try_new`). The internal encode functions must receive a value that is **guaranteed valid by type**, not a raw `u8`.
- Keep the free functions `validate_quality` / `validate_compression` (or re-express them via the newtype `try_new`) so existing tests and call sites do not break — document whichever path you choose.

### R4 — Wire validation into the pipeline (no signature changes)

In **both** `transmutar_jpg_a_png_inner` and `transmutar_png_a_jpg_inner`:

1. Keep `core_utils::validate_input(...)` at the start (unchanged).
2. Parse parameters through the newtype `try_new` (surfacing the same bounds errors as today).
3. After encode, call `core_utils::validate_output(&bytes, OutputFormat::Png | OutputFormat::Jpeg)` **before returning**.
4. Return the validated bytes.

**Wasm exports keep identical signatures** (`u8` params, `Result<Vec<u8>, String>`). Defaults preserved (Q85 / compression 6, white background). StripAll unchanged.

### R5 — Tests (both crates + core_utils)

Add unit/integration tests proving:

| Test | Assertion |
|------|-----------|
| `validate_output` empty | empty slice → error containing "empty" |
| `validate_output` PNG ok | real PNG bytes → `Ok` |
| `validate_output` PNG bad magic | JPEG/garbage bytes as PNG → error |
| `validate_output` JPEG ok | real JPEG bytes → `Ok` |
| `validate_output` JPEG bad magic | PNG/garbage as JPEG → error |
| `Quality::try_new` bounds | 0 → err; 1, 85, 100 → ok; 101 → err |
| `Compression::try_new` bounds | 0 → err; 1, 6, 9 → ok; 10 → err |
| Pipeline JPG→PNG | output passes `validate_output(Png)`; real fixture round-trips (opt-in helper) |
| Pipeline PNG→JPG | output passes `validate_output(Jpeg)`; alpha fixture flattens + validates |
| Round-trip (opt-in) | re-decoded output dimensions match input; non-zero |
| Regression | all existing `core_utils` (26) + transmutator tests still pass |

### R6 — Verification

| Command | Must pass |
|---------|-----------|
| `cargo check --workspace` | Compiles |
| `cargo test --workspace` | All tests green (existing + new) |
| `cargo clippy --workspace` (if configured) | No new warnings introduced by this task |

Do **not** rebuild Wasm artifacts as part of this task unless trivial; note in the report whether `npm run build:wasm` is required before frontend can consume (it should NOT be, since signatures are unchanged).

### R7 — Version & SPEC amendment

Bump to **v0.6.6** (backend-only; MINOR — new `core_utils` API + newtypes, backward-compatible exports):

- Do **not** bump `frontend/package.json` / `Footer` (no frontend change). You **may** align the `README.md` project version header to v0.6.6 if the repo convention tracks a single running number — state your choice.

Update `docs/SPEC.md`:

- **§5.11.3:** mark non-empty + magic-byte checks **implemented**; note round-trip as opt-in implemented helper.
- **§5.11.4:** mark `Quality` / `Compression` newtypes **implemented**.
- **§5.11.1 / §5.11.5:** update the OUTPUT row from gap (❌) to implemented (✅).
- **§6.1:** document `validate_output`, `OutputFormat`, and (if added there) the round-trip helper; bump test count.
- **§6.2 / §6.3:** note bounded newtypes in each transmutator.
- **§5.8:** mark `refine_output_integrity` ✅ with version.
- Bump SPEC version + `Last updated`; Amendment Log → `refine_output_integrity_done.md`.

**Do not** modify `docs/ROADMAP.md`.

### R8 — Report follow-ups

In "Known Gaps / Follow-ups":

- `refine_jpeg_encoder_swap` (§5.5.6) remains the prerequisite for any chroma-subsampling UI.
- Size-coherence heuristic (§5.11.3) deferred unless trivially added.
- Pre-transmute "transparency detected" UX notice (§5.11.6) is a frontend follow-up, not this task.

---

CONSTRAINTS

- **Backend only** — no frontend, no Wasm export signature changes, no worker/protocol changes.
- **Preserve the `core_utils` decode-free boundary** (§6.1) — mandatory checks must not pull `image` into `core_utils`; round-trip (decode-based) lives in the transmutator crates or behind an injected closure.
- **Reuse `TransmutationError`** — do not create a parallel error type; keep the `Result<_, String>` Wasm contract.
- **Defaults and StripAll unchanged** (Q85, compression 6, white background, no metadata copy).
- **All existing tests must pass** — this is hardening, not a behavior change for valid inputs.
- English for code, comments, report.

---

DELIVERABLES

1. `core_utils::validate_output` + `OutputFormat` + tests (R1).
2. Opt-in round-trip validation helper + tests (R2).
3. `Quality` / `Compression` bounded newtypes + tests (R3).
4. Pipeline wiring in both `_inner` functions (R4).
5. `docs/SPEC.md` amendments (R7).
6. `docs/reports/refine_output_integrity_done.md` per GOVERNANCE §5 (incl. R8 follow-ups).

---

EXIT GATE (self-check before report)

- [ ] Every encode path validates its output (non-empty + magic bytes) before returning.
- [ ] `Quality` / `Compression` cannot be constructed out of range; internal encode receives type-guaranteed-valid values.
- [ ] Wasm export signatures unchanged; defaults + StripAll preserved.
- [ ] `core_utils` retains its decode-free default path; round-trip is opt-in.
- [ ] `cargo test --workspace` passes (existing + new).
- [ ] SPEC §5.11 / §6.1 / §5.8 updated; version bumped; amendment logged.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
