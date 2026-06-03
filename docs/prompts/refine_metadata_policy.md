SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§5.10**, **§5.8**, **§6.2**, **§6.3**) and `docs/ROADMAP.md` before any action.
All source code, comments, and outputs must be strictly in English.
Do not substitute the technology stack. Do not modify `docs/ROADMAP.md`.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/SPEC.md` §5.10 in full. Understand StripAll default and why preservation ≠ privacy.
2. List what metadata markers exist in JPEG (APP1 EXIF) and PNG (`tEXt`, `iTXt`, `eXIf`, `iCCP`) and what minimal encoder output is acceptable.
3. Draft a test strategy using synthetic fixtures (inline bytes, no binary fixtures repo).
4. Validate that tests prove **source metadata is not propagated**, not merely that output is smaller.
5. If `image` encoder reintroduces sensitive segments, document and harden without adding heavy EXIF crates to `core_utils`.
6. State assumptions in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `refine_metadata_policy`
PHASE: Backend refinement (pre–v1.0.0) — `v0.5.3`
OBJECTIVE: Verify and lock in **StripAll** metadata behavior with byte-level inspection helpers, integration tests on both transmutators, and SPEC confirmation — without changing the public Wasm API.

---

CONTEXT

- SPEC §5.10 (v0.5.2) documents that decode→re-encode via `image` **de facto** strips source metadata, but this is **not test-verified**.
- Principle **P7**: metadata strip by default; PreserveExif is forbidden without explicit future opt-in.
- Transmutators must remain: `transmutar_jpg_a_png_inner`, `transmutar_png_a_jpg_inner` pipelines unchanged in signature.
- **Do not** implement PreserveExif, PreserveColorProfile, or user-facing toggles in this task.

---

REQUIREMENTS

### R1 — Metadata inspection helpers (`core_utils`)

Add lightweight, **dependency-free** byte scanners in `motor_transmutacion/core_utils/src/lib.rs` (new module `metadata` or inline functions — your choice):

| Function | Purpose |
|----------|---------|
| `jpeg_contains_exif_app1(bytes: &[u8]) -> bool` | Returns `true` if JPEG contains an `APP1` segment with `Exif\0\0` header (EXIF per JEITA CP-3451) |
| `jpeg_contains_gps_exif(bytes: &[u8]) -> bool` | Optional: scan APP1 for GPS IFD tag `0x8825` — stronger privacy assertion |
| `png_contains_text_chunk(bytes: &[u8]) -> bool` | Returns `true` if PNG has `tEXt` or `iTXt` chunk |
| `png_contains_exif_chunk(bytes: &[u8]) -> bool` | Returns `true` if PNG has `eXIf` chunk |
| `png_contains_iccp_chunk(bytes: &[u8]) -> bool` | Returns `true` if PNG has `iCCP` chunk (document in report if treated as sensitive) |

**Implementation notes:**

- JPEG: iterate marker segments (similar scan pattern to dimension probe; reuse bounds / safety).
- PNG: walk chunks after 8-byte signature (length + type + data + CRC); bound total walk to prevent loops on corrupt input.
- These functions inspect **container bytes only** — no full decode, no `image` crate in `core_utils`.

Export helpers as `pub` for use in transmutator integration tests.

### R2 — Unit tests for helpers (`core_utils`)

Add tests proving scanners detect synthetic metadata:

| Test | Expectation |
|------|-------------|
| `detects_exif_app1_in_jpeg` | Crafted JPEG with APP1 Exif → `jpeg_contains_exif_app1` true |
| `detects_no_exif_in_minimal_jpeg` | Minimal JPEG from existing test helpers → false |
| `detects_text_chunk_in_png` | PNG with `tEXt` chunk → `png_contains_text_chunk` true |
| `detects_exif_chunk_in_png` | PNG with `eXIf` chunk → `png_contains_exif_chunk` true |
| `minimal_png_no_sensitive_chunks` | IHDR-only minimal PNG → all false |

Reuse or extend `make_minimal_jpeg` / `make_minimal_png` patterns from `core_utils` tests where possible.

### R3 — Transmutator integration tests (StripAll verification)

#### R3a — `transmutador_jpg` (`tests/metadata.rs` or extend `integration.rs`)

1. Build a **valid JPEG** (use `image` crate in test dev-dependencies if needed, or byte-craft APP1) that **contains EXIF APP1** with a recognizable string (e.g. `Camera: CamaleonTest` in TIFF IFD or ASCII EXIF payload).
2. Run `transmutar_jpg_a_png_inner(&jpeg_with_exif)`.
3. Assert output is valid PNG (PNG magic bytes).
4. Assert `jpeg_contains_exif_app1(&input)` is **true** (sanity: source has metadata).
5. Assert output PNG has **no** `eXIf` chunk: `png_contains_exif_chunk(&output) == false`.
6. Assert output PNG has **no** `tEXt`/`iTXt` carrying source string (if you embed `CamaleonTest` in source, assert it does **not** appear in output bytes).

#### R3b — `transmutador_png` (`tests/metadata.rs` or extend `integration.rs`)

1. Build a **valid PNG** with `tEXt` chunk (keyword `Author`, text `CamaleonTest`) and optionally small `eXIf` chunk (can be minimal fake eXIf bytes).
2. Run `transmutar_png_a_jpg_inner(&png_with_metadata)`.
3. Assert output starts with JPEG SOI `FF D8`.
4. Assert `png_contains_text_chunk(&input)` is **true**.
5. Assert `jpeg_contains_exif_app1(&output)` is **false** (no EXIF copied from source).
6. Assert output bytes do **not** contain literal `CamaleonTest` from source text chunk.

**Regression:** all existing integration tests in both crates must still pass.

### R4 — Encoder audit (no API change unless required)

1. Review `transmutador_jpg` and `transmutador_png` encode paths (`image::ImageFormat::Png`, `JpegEncoder`).
2. Confirm no API flags enable EXIF embedding.
3. If encoder introduces APP1 EXIF by default (unlikely), document and apply minimal fix (e.g. encoder settings, post-encode strip of APP1 only if absolutely necessary — justify in report).
4. **Do not** add `rexif`, `little_exif`, or similar unless Chief Architect amends SPEC; prefer byte-level strip of known APP1 only as last resort.

### R5 — Document policy in code

Add brief module-level doc comments in both transmutators:

```rust
//! Metadata policy: StripAll (SPEC §5.10). Decode→encode does not copy source EXIF/XMP/PNG text chunks.
```

### R6 — Version alignment

Bump to **v0.5.3**:

- `motor_transmutacion/Cargo.toml` workspace version
- `frontend/package.json` version (sync convention)

Do **not** change README title unless adding one line under Development about metadata strip.

### R7 — SPEC amendment

Update `docs/SPEC.md`:

- §5.10.7: Change status from "not yet verified" to **Implemented (v0.5.3)** with test references.
- §5.8: Mark `refine_metadata_policy` row ✅
- §6.2 / §6.3: Update metadata line to "StripAll verified by integration tests"
- Bump SPEC version to **0.5.3**; Amendment Log → `refine_metadata_policy_done.md`

**Do not** modify `docs/ROADMAP.md`.

### R8 — Verification

| Command | Must pass |
|---------|-----------|
| `cargo test --workspace` | All tests including new metadata suites |
| `cargo check --workspace` | Zero errors |
| `npm run build` | Frontend unchanged |

---

CONSTRAINTS

- **StripAll only** — no PreserveExif, no opt-in UI, no new Wasm parameters.
- **No new required dependencies** in `core_utils`. `image` in transmutator **dev-dependencies** for test fixtures only is acceptable.
- **No UI changes.**
- **No changes** to `validate_input`, dimension probing, or conversion algorithms unless required for metadata strip hardening.
- English only for errors, comments, report.
- Privacy: do not log or transmit metadata contents in errors (no dumping EXIF GPS into user-facing strings).

---

DELIVERABLES

1. `core_utils` metadata scanners + tests (R1, R2).
2. Transmutator metadata integration tests (R3).
3. Encoder audit notes in report (R4).
4. Module doc comments (R5).
5. Version bumps (R6).
6. `docs/SPEC.md` amendments (R7).
7. `docs/reports/refine_metadata_policy_done.md` per GOVERNANCE §5.

---

EXIT GATE (self-check before report)

- [ ] Source JPEG with EXIF → output PNG without `eXIf`/source EXIF propagation (tested).
- [ ] Source PNG with `tEXt`/`eXIf` → output JPEG without EXIF APP1 / source text string (tested).
- [ ] Helper unit tests pass for detection true/false cases.
- [ ] All pre-existing workspace tests pass (regression).
- [ ] SPEC §5.10.7 marked implemented; §5.8 task noted complete in SPEC only.
- [ ] Report documents what minimal metadata output encoders still produce (e.g. JFIF APP0).

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
