SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§5.7**, **§5.8**, **§6.1**) and `docs/ROADMAP.md` before any action.
All source code, comments, and outputs must be strictly in English.
Do not substitute the technology stack. Do not modify `docs/ROADMAP.md`.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/SPEC.md` §5 (Transmutation Science) and §5.7–5.8 in full. Understand why `MAX_INPUT_BYTES` alone is insufficient.
2. List decompression-bomb edge cases (tiny file, huge dimensions; JPEG SOF variants; corrupt headers).
3. Draft a mental execution plan and validate it against SPEC constraints.
4. Execute incrementally; self-check after each step.
5. Prefer correctness and SPEC compliance over speed.
6. State assumptions explicitly in the technical report (e.g. chosen `MAX_PIXELS` value).

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `refine_core_utils_dimensions`
PHASE: Backend refinement (pre–v1.0.0) — `v0.5.1`
OBJECTIVE: Harden `core_utils` against decompression bombs by adding `MAX_PIXELS`, lightweight dimension probing from PNG/JPEG headers **before** full decode, and integrating both guards into `validate_input` so all transmutators inherit protection automatically.

---

CONTEXT

- SPEC §5.7 documents that peak memory ≈ `width × height × channels`, not compressed file size.
- Empirical benchmark: 1.24 MB JPEG decoded to ~11 MB PNG (~5–7 MP photo). A small PNG with extreme IHDR dimensions could allocate far more.
- Both `transmutador_jpg` and `transmutador_png` call `core_utils::validate_input` at the start of their `_inner` pipelines — extending `validate_input` is the correct integration point.
- **Do not** add the `image` crate to `core_utils` (keep header parsing lightweight and dependency-free).

---

REQUIREMENTS

### R1 — New constants and error variant

In `motor_transmutacion/core_utils/src/lib.rs`:

1. Add `pub const MAX_PIXELS: u64` — default **40_000_000** (40 megapixels). Document rationale in report (balances ~8K×5K workflows vs browser Wasm memory). Chief Architect may adjust if justified.
2. Add `TransmutationError` variant:

```rust
DimensionsTooLarge {
    width: u32,
    height: u32,
    pixel_count: u64,
    max_pixels: u64,
}
```

3. `Display` message must be clear English, e.g. intent: `"Image dimensions {width}×{height} ({pixel_count} pixels) exceed maximum allowed ({max_pixels} pixels)"`.

Optional additional variant if useful:

```rust
InvalidDimensions { reason: String }  // zero width/height, unprobeable corrupt header for known format
```

### R2 — Dimension probing (no full decode)

Implement **public** functions in `core_utils`:

```rust
/// Returns (width, height) from PNG IHDR or JPEG SOF without decoding the full image.
pub fn probe_dimensions(bytes: &[u8]) -> Result<(u32, u32), String>

/// Returns width × height as u64, or error.
pub fn pixel_count(width: u32, height: u32) -> Result<u64, String>  // guard u32 overflow on multiply
```

**PNG probing (minimum):**

- Verify signature: `89 50 4E 47 0D 0A 1A 0A`
- IHDR chunk begins at byte offset 16 (after 8-byte signature + 4-byte length + 4-byte `"IHDR"` type)
- Read width and height as **big-endian u32** at offsets 16 and 20
- Reject `width == 0` or `height == 0`

**JPEG probing (minimum):**

- Verify SOI: `FF D8`
- Scan marker segments for SOF markers that encode dimensions:
  - SOF0 (`FF C0`), SOF1 (`FF C1`), SOF2 (`FF C2`), SOF3 (`FF C3`)
  - SOF5 (`FF C5`) … SOF7 (`FF C7`), SOF9 (`FF C9`) … SOF11 (`FF CB`), SOF13 (`FF CD`) … SOF15 (`FF CF`)
- For first valid SOF found: height = big-endian u16 at SOF+5, width = big-endian u16 at SOF+7 (per JFIF structure)
- Reject zero width or height
- Bound scan length (e.g. first 64 KB of file) to avoid pathological loops on corrupt input

**Format detection policy for `validate_input`:**

| Input magic | Action |
|-------------|--------|
| PNG signature | `probe_dimensions` must succeed; enforce `MAX_PIXELS` |
| JPEG SOI | `probe_dimensions` must succeed; enforce `MAX_PIXELS` |
| Neither (unknown/garbage) | **Do not** block on dimensions — existing byte-size check only; let transmutator decode fail with format error |

This avoids breaking non-standard inputs while protecting the two supported Camaleon formats.

### R3 — Extend `validate_input`

Update `validate_input(bytes: &[u8]) -> Result<(), String>`:

1. Existing: reject empty, reject `len > MAX_INPUT_BYTES`
2. **New:** if PNG or JPEG magic detected, call `probe_dimensions`, compute `pixel_count`, reject if `pixel_count > MAX_PIXELS`
3. If probe fails for PNG/JPEG magic (truncated/corrupt header), return descriptive error (not silent pass)

**Do not** change the public signature of `validate_input` — transmutators depend on it.

### R4 — Transmutator integration (verify only)

- **No logic changes required** in `transmutador_jpg` / `transmutador_png` **if** they already call `validate_input` first.
- Verify both `_inner` functions still call `validate_input` before decode.
- If any transmutator bypasses validation, fix it.

### R5 — Unit tests (`core_utils` — target 10+ tests total)

Add tests covering (names illustrative):

| Test | Expectation |
|------|-------------|
| `probe_dimensions_valid_minimal_png` | Tiny valid IHDR → correct WxH |
| `probe_dimensions_valid_minimal_jpeg` | Minimal JPEG with SOF0 → correct WxH |
| `rejects_png_dimensions_over_max_pixels` | IHDR with 65535×65535 or similar → `validate_input` Err |
| `rejects_jpeg_dimensions_over_max_pixels` | Crafted SOF with huge dimensions → Err |
| `rejects_png_zero_dimensions` | IHDR 0×N → Err |
| `rejects_truncated_png_header` | PNG magic + partial IHDR → Err |
| `rejects_truncated_jpeg_no_sof` | `FF D8` only → Err |
| `unknown_magic_skips_dimension_check` | Random bytes under MAX_INPUT_BYTES → Ok (if non-empty) |
| `existing tests still pass` | empty, oversized bytes, etc. |

Use **inline byte fixtures** in test code (no binary files required). Generate minimal valid PNG/JPEG headers programmatically or as const byte arrays.

### R6 — Version alignment

Bump to **v0.5.1**:

- `motor_transmutacion/Cargo.toml` `[workspace.package] version`
- `frontend/package.json` `"version"` (keep in sync with workspace convention)
- Do **not** change README title version unless Chief Architect does so later — optional one-line note in report only

### R7 — SPEC amendment

Update `docs/SPEC.md`:

- §5.7.2: Mark dimension guards as **Implemented** with chosen `MAX_PIXELS` value
- §5.8: Mark `refine_core_utils_dimensions` row as complete (or note delivered — ROADMAP checkbox is Chief Architect)
- §6.1: Document `probe_dimensions`, `MAX_PIXELS`, new error variants, updated `validate_input` behavior
- Bump SPEC version to **0.5.1**; Amendment Log entry → `refine_core_utils_dimensions_done.md`

**Do not** modify `docs/ROADMAP.md`.

### R8 — Verification

| Command | Must pass |
|---------|-----------|
| `cargo test --workspace` | All tests (core_utils expanded + transmutator regression) |
| `cargo check --workspace` | Zero errors; resolve warnings if trivial |
| `npm run build` | Frontend unchanged but must still pass |

---

CONSTRAINTS

- **No new dependencies** in `core_utils` unless absolutely required (justify in report).
- **No UI changes.**
- **No Wasm API changes** on transmutator exports.
- **No** changes to conversion algorithms (JPG/PNG encode-decode logic untouched).
- English only for errors, code comments, report.
- Privacy unchanged.

---

DELIVERABLES

1. `core_utils` implementation + tests (R1–R3, R5).
2. Transmutator verification note (R4).
3. Version bumps (R6).
4. `docs/SPEC.md` amendments (R7).
5. `docs/reports/refine_core_utils_dimensions_done.md` per GOVERNANCE §5.

---

EXIT GATE (self-check before report)

- [ ] PNG with 1×1 pixel passes; PNG with dimensions exceeding `MAX_PIXELS` fails before decode.
- [ ] JPEG with normal SOF passes; oversized SOF dimensions fail.
- [ ] Corrupt PNG/JPEG magic with truncated header fails with clear error (not panic).
- [ ] `transmutador_jpg` and `transmutador_png` integration tests still pass (regression).
- [ ] `cargo test --workspace` all green.
- [ ] SPEC §5.7 / §6.1 updated.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
