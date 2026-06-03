SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§5.5**, **§5.8**, **§5.10**, **§6.3**) and `docs/ROADMAP.md` before any action.
All source code, comments, and outputs must be strictly in English.
Do not substitute the technology stack. Do not modify `docs/ROADMAP.md`.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/SPEC.md` §5.5 (PNG→JPEG objectives, alpha flatten, quality, subsampling).
2. Inspect how the `image` crate v0.25 handles RGBA→JPEG today (default background risk).
3. Plan alpha compositing math and quality validation before touching Wasm exports.
4. Ensure default behavior remains backward-compatible for existing Worker/UI calls.
5. Preserve StripAll metadata policy (§5.10) — do not copy EXIF/tEXt.
6. Document chroma subsampling behavior explicitly in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `refine_transmutador_png`
PHASE: Backend refinement (pre–v1.0.0) — `v0.5.4`
OBJECTIVE: Harden `transmutador_png` with explicit **alpha flatten onto white** (§5.5.2), **configurable JPEG quality** (§5.5.3), documented **chroma subsampling**, and regression-safe tests — without UI changes.

---

CONTEXT

- Phase 3 delivered working PNG→JPEG at fixed quality 85.
- SPEC gaps (§5.5.5): alpha flatten relies on implicit `image` behavior; quality not parameterized; subsampling undocumented.
- `refine_metadata_policy` (v0.5.3) verified StripAll — **must not regress**.
- Worker currently calls `transmutar_png_a_jpg` with bytes only — **default Wasm entry must keep working unchanged**.

---

REQUIREMENTS

### R1 — Options types (Rust, native + Wasm-ready)

In `motor_transmutacion/transmutador_png/src/lib.rs` (or `options.rs` if cleaner):

```rust
pub const DEFAULT_JPEG_QUALITY: u8 = 85;
pub const MIN_JPEG_QUALITY: u8 = 1;
pub const MAX_JPEG_QUALITY: u8 = 100;

/// Background used when flattening RGBA PNG onto opaque JPEG.
pub struct BackgroundFill {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl BackgroundFill {
    pub const WHITE: BackgroundFill = BackgroundFill { r: 255, g: 255, b: 255 };
}

pub struct PngToJpgOptions {
    pub quality: u8,
    pub background: BackgroundFill,
}

impl Default for PngToJpgOptions {
    fn default() -> Self { quality: 85, background: WHITE }
}
```

Add validation helper:

```rust
pub fn validate_quality(quality: u8) -> Result<u8, String>
// Reject 0; clamp or reject >100 per your documented choice (prefer reject with clear error)
```

### R2 — Alpha flatten before JPEG encode (critical)

Refactor conversion pipeline:

```rust
pub fn png_bytes_to_jpg_bytes(input: &[u8], options: &PngToJpgOptions) -> Result<Vec<u8>, String>
```

**After PNG decode:**

1. If image has alpha channel (RGBA/L16A/etc.), **explicitly flatten** each pixel onto `options.background` using standard alpha compositing:

\[
C_{out} = \frac{\alpha \cdot C_{fg} + (255 - \alpha) \cdot C_{bg}}{255}
\]

(round to nearest `u8` per channel)

2. Encode resulting **RGB** image to JPEG (no alpha in output).
3. If image is already opaque RGB, encode directly (no spurious flatten pass that alters pixels).

**Do not** rely on `to_rgb8()` or similar if it uses black as implicit background — verify and document.

### R3 — Quality parameter

- `JpegEncoder::new_with_quality(..., options.quality)` after validation.
- Default path uses `DEFAULT_JPEG_QUALITY` (85).

**Wasm API extension (backward compatible):**

Keep existing export unchanged (uses defaults):

```rust
#[wasm_bindgen]
pub fn transmutar_png_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String>
```

Add **new** export for future UI/Worker use:

```rust
#[wasm_bindgen]
pub fn transmutar_png_a_jpg_with_quality(
    input_bytes: &[u8],
    quality: u8,
) -> Result<Vec<u8>, String>
```

Uses `BackgroundFill::WHITE` + given quality. Invalid quality → descriptive `String` error.

Update `transmutar_png_a_jpg_inner` to accept `PngToJpgOptions` internally; both Wasm exports delegate to it.

**Do not** change Worker or frontend in this task — only Rust + wasm glue + `wasm-modules.d.ts` if needed.

### R4 — Chroma subsampling (document + configure if possible)

1. Investigate `image` crate `JpegEncoder` default chroma subsampling for v0.25.
2. In module docs and technical report, state explicitly (e.g. `4:2:0` vs `4:4:4`).
3. If `JpegEncoder` exposes sampling configuration, set **4:2:0** as explicit default for photographic output and document in SPEC §5.5.3.
4. If not configurable, document limitation and defer P4 subsampling toggle to post-MVP.

### R5 — Integration tests (`transmutador_png/tests/`)

Add tests (keep all 5 existing + metadata test passing):

| Test | Purpose |
|------|---------|
| `flatten_transparent_pixel_on_white` | 1×1 PNG RGBA `(255,0,0,128)` on white → output JPEG decodes to expected orange-ish red (~191,0,0) or verify channel range |
| `opaque_rgb_unchanged_by_flatten` | Opaque PNG → transmute → decode JPEG; pixel values match within JPEG loss tolerance |
| `rejects_quality_zero` | `quality: 0` → Err |
| `rejects_quality_over_100` | `quality: 101` → Err (if rejecting) |
| `lower_quality_smaller_or_equal_size` | Same PNG at q=95 vs q=50 → q=50 output bytes ≤ q=95 (allow equal on tiny images) |
| `metadata_strip_regression` | Re-run or ensure `source_png_text_not_in_output_jpeg` still passes |

Use `image` crate in tests for decode verification. Prefer deterministic tiny fixtures (16×16 or 1×1).

### R6 — Module documentation

Update crate-level docs to state:

- Alpha flatten default: **white `#FFFFFF`** (SPEC §5.5.2)
- Default quality: **85**
- StripAll metadata (§5.10)
- Chroma subsampling finding (R4)

### R7 — Wasm build artifacts

After Rust changes:

- Rebuild Wasm via `npm run build:wasm` or scripts.
- Update `frontend/src/types/wasm-modules.d.ts` with new `transmutar_png_a_jpg_with_quality` signature if generated `.d.ts` differs.

**Do not** commit `frontend/public/wasm/` binaries.

### R8 — Version alignment

Bump to **v0.5.4**:

- `motor_transmutacion/Cargo.toml` workspace version
- `frontend/package.json` version

### R9 — SPEC amendment

Update `docs/SPEC.md`:

- §5.5.2: Mark `BackgroundFill::WHITE` **implemented**; document compositing formula reference
- §5.5.3: Quality parameter + subsampling documentation
- §5.5.5: Update alignment table (gaps closed)
- §5.8: Mark `refine_transmutador_png` ✅
- §6.3: New types, dual Wasm exports, test count, alpha/quality behavior
- Bump SPEC to **0.5.4**; Amendment Log → `refine_transmutador_png_done.md`

**Do not** modify `docs/ROADMAP.md`.

### R10 — Verification

| Command | Must pass |
|---------|-----------|
| `cargo test --workspace` | All tests (including new PNG tests + full regression) |
| `cargo check --workspace` | Zero errors |
| `npm run build:wasm` | Both modules |
| `npm run build` | Frontend |

---

CONSTRAINTS

- **Scope:** `transmutador_png` only — do not modify `transmutador_jpg` unless a shared helper in `core_utils` is truly justified (unlikely).
- **Backward compatibility:** `transmutar_png_a_jpg(bytes)` behavior must remain valid for Worker; defaults = white background + Q85.
- **No UI changes.**
- **No Worker protocol changes** in this task.
- **StripAll** metadata policy must remain verified.
- **No new heavy dependencies** (no mozjpeg yet).
- English only for errors, docs, report.

---

DELIVERABLES

1. `transmutador_png` options + alpha flatten + quality (R1–R4).
2. Integration tests (R5).
3. Module docs (R6).
4. Wasm rebuild + ambient types if needed (R7).
5. Version bumps (R8).
6. `docs/SPEC.md` amendments (R9).
7. `docs/reports/refine_transmutador_png_done.md` per GOVERNANCE §5.

---

EXIT GATE (self-check before report)

- [ ] Transparent PNG pixel composites onto white, not black (tested).
- [ ] Opaque PNG transmutation still works (regression).
- [ ] Quality 0 / invalid rejected; quality 85 default unchanged on original Wasm export.
- [ ] Metadata StripAll test still passes.
- [ ] Chroma subsampling documented in report and SPEC.
- [ ] `cargo test --workspace` all green.
- [ ] SPEC v0.5.4 updated.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
