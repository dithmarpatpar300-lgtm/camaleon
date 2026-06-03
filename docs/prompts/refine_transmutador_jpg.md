SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§5.4**, **§5.8**, **§5.10**, **§6.2**) and `docs/ROADMAP.md` before any action.
All source code, comments, and outputs must be strictly in English.
Do not substitute the technology stack. Do not modify `docs/ROADMAP.md`.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/SPEC.md` §5.4 (JPEG→PNG objectives, color-type policy P2, compression effort P4).
2. Inspect how the `image` crate v0.25 decodes JPEG and encodes PNG today (`write_to` vs `PngEncoder::new_with_quality`).
3. Verify whether default PNG encode can emit RGBA IHDR (color type 6) for JPEG sources — plan explicit RGB8 enforcement.
4. Plan compression level validation and default behavior before touching Wasm exports.
5. Ensure default behavior remains backward-compatible for existing Worker/UI calls.
6. Preserve StripAll metadata policy (§5.10) — do not copy EXIF to `eXIf` or text chunks.
7. Document PNG filter type (`FilterType::Adaptive`) and DEFLATE level semantics in the technical report.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `refine_transmutador_jpg`
PHASE: Backend refinement (pre–v1.0.0) — `v0.5.5`
OBJECTIVE: Harden `transmutador_jpg` with explicit **RGB PNG color-type policy** (§5.4.3 P2), **configurable PNG compression effort** (§5.4.3 P4), documented encoder levers, and regression-safe tests — without UI changes.

---

CONTEXT

- Phase 2 delivered working JPEG→PNG via `ImageReader` decode + `ImageFormat::Png` encode.
- SPEC gaps (§5.4.4): color-type policy assumed but not enforced/tested; compression uses implicit `image` defaults; no parameterized API.
- `refine_metadata_policy` (v0.5.3) verified StripAll — **must not regress**.
- `refine_transmutador_png` (v0.5.4) established the options + dual Wasm export pattern — **mirror that pattern here**.
- Worker currently calls `transmutar_jpg_a_png` with bytes only — **default Wasm entry must keep working unchanged**.

---

REQUIREMENTS

### R1 — Options types (Rust, native + Wasm-ready)

In `motor_transmutacion/transmutador_jpg/src/lib.rs` (or `options.rs` if cleaner):

```rust
pub const DEFAULT_PNG_COMPRESSION: u8 = 6;
pub const MIN_PNG_COMPRESSION: u8 = 1;
pub const MAX_PNG_COMPRESSION: u8 = 9;

pub struct JpgToPngOptions {
    /// DEFLATE compression level (1 = fast/smaller CPU, 9 = slow/smaller file).
    pub compression: u8,
}

impl Default for JpgToPngOptions {
    fn default() -> Self {
        Self { compression: DEFAULT_PNG_COMPRESSION }
    }
}
```

Add validation helper:

```rust
pub fn validate_compression(compression: u8) -> Result<u8, String>
// Reject 0; reject >9 with clear error (do not clamp)
```

### R2 — Explicit RGB color-type policy (critical — SPEC §5.4.3 P2)

Refactor conversion pipeline:

```rust
pub fn jpg_bytes_to_png_bytes(input: &[u8], options: &JpgToPngOptions) -> Result<Vec<u8>, String>
```

**After JPEG decode:**

1. Convert decoded raster to **`Rgb8`** explicitly via `to_rgb8()` (or equivalent) **before** PNG encode.
   - JPEG sources never carry alpha; output PNG IHDR **must** be color type **2 (Truecolor RGB)**, not **6 (RGBA)**.
   - Grayscale JPEG decodes must expand to RGB (same luminance per channel) — still color type 2.
2. **Do not** emit RGBA PNG for standard JPEG transmutation.
3. Preserve **P1 bit-exact raster fidelity** — conversion to RGB8 must not alter decoded pixel values beyond format expansion (L8→RGB replication).

**Do not** rely on `DynamicImage::write_to(..., ImageFormat::Png)` alone if it can emit RGBA or non-RGB color types.

### R3 — PNG compression via `PngEncoder` (SPEC §5.4.3 P4)

Replace implicit `write_to` PNG encoding with explicit encoder:

```rust
use image::codecs::png::{CompressionType, FilterType, PngEncoder};

// After validate_compression(options.compression):
let encoder = PngEncoder::new_with_quality(
    &mut buf,
    CompressionType::Level(options.compression),
    FilterType::Adaptive,  // default; document in module docs
);
encoder.encode_image(&rgb_image) // or write_image per image 0.25 API
```

- Default compression level: **6** (balanced CPU/size tradeoff).
- Document in module docs and report:
  - `FilterType::Adaptive` is the default filter strategy.
  - Higher compression level → smaller files at cost of CPU (not guaranteed byte-identical across `image` patch versions — document as hint semantics per crate docs).
- Palette/indexed PNG (P5) remains **deferred**.

### R4 — Wasm API extension (backward compatible)

Keep existing export unchanged (uses defaults):

```rust
#[wasm_bindgen]
pub fn transmutar_jpg_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String>
```

Add **new** export for future UI/Worker use:

```rust
#[wasm_bindgen]
pub fn transmutar_jpg_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
) -> Result<Vec<u8>, String>
```

Uses `JpgToPngOptions { compression }`. Invalid compression → descriptive `String` error.

Update `transmutar_jpg_a_png_inner` to accept `&JpgToPngOptions` internally; both Wasm exports delegate to it.

**Do not** change Worker or frontend in this task — only Rust + wasm glue + `wasm-modules.d.ts` if needed.

### R5 — Integration tests (`transmutador_jpg/tests/`)

Add tests (keep all 5 existing + metadata test passing). Adapt existing tests to pass `&JpgToPngOptions`.

| Test | Purpose |
|------|---------|
| `output_png_ihdr_is_rgb_not_rgba` | Transmute valid JPEG → parse IHDR color type byte; assert **2** (RGB), not **6** (RGBA) |
| `grayscale_jpeg_outputs_rgb_png` | 1×1 grayscale JPEG fixture → IHDR color type **2** |
| `pixel_values_preserved_after_rgb_conversion` | Known-color JPEG → decode output PNG → pixel within lossless tolerance |
| `rejects_compression_zero` | `validate_compression(0)` → Err |
| `rejects_compression_over_nine` | `validate_compression(10)` → Err |
| `higher_compression_smaller_or_equal_output` | Same JPEG at level 1 vs 9 → level 9 bytes ≤ level 1 (allow equal on tiny fixtures) |
| `default_options_compression_is_six` | `JpgToPngOptions::default()` → compression 6 |
| `metadata_strip_regression` | Ensure `source_jpeg_exif_not_in_output_png` still passes |

**IHDR color type helper:** implement a small test helper (or public `png_ihdr_color_type` in the crate) that reads byte at PNG IHDR offset (after 8-byte signature + 4 length + 4 `"IHDR"` + 8 width/height + 1 bit depth). PNG spec color types: **2 = RGB**, **6 = RGBA**.

Use `image` crate in tests for decode verification. Prefer deterministic tiny fixtures (16×16 or 1×1).

### R6 — Module documentation

Update crate-level docs to state:

- Color-type policy: **RGB PNG only** for JPEG sources (§5.4.3 P2)
- Default compression: **6**; range **1–9**
- Filter: **Adaptive** (§5.4.3 P4)
- StripAll metadata (§5.10)
- Size explosion expectation for photos (§5.4.2) — informational, not a bug

### R7 — Wasm build artifacts

After Rust changes:

- Rebuild Wasm via `npm run build:wasm` or scripts.
- Update `frontend/src/types/wasm-modules.d.ts` with new `transmutar_jpg_a_png_with_compression` signature if generated `.d.ts` differs.

**Do not** commit `frontend/public/wasm/` binaries.

### R8 — Version alignment

Bump to **v0.5.5**:

- `motor_transmutacion/Cargo.toml` workspace version
- `frontend/package.json` version

### R9 — SPEC amendment

Update `docs/SPEC.md`:

- §5.4.3 P2: Mark explicit RGB enforcement **implemented**
- §5.4.3 P4: Compression level parameter documented; filter type documented
- §5.4.4: Update alignment table (gaps closed); bump section to v0.5.5
- §5.8: Mark `refine_transmutador_jpg` ✅
- §6.2: New types, dual Wasm exports, test count, color-type/compression behavior
- Bump SPEC to **0.5.5**; Amendment Log → `refine_transmutador_jpg_done.md`

**Do not** modify `docs/ROADMAP.md`.

### R10 — Verification

| Command | Must pass |
|---------|-----------|
| `cargo test --workspace` | All tests (including new JPG tests + full regression) |
| `cargo check --workspace` | Zero errors |
| `npm run build:wasm` | Both modules |
| `npm run build` | Frontend |

---

CONSTRAINTS

- **Scope:** `transmutador_jpg` only — do not modify `transmutador_png` unless a shared helper in `core_utils` is truly justified (e.g. IHDR color-type reader shared with future tests — optional, document if added).
- **Backward compatibility:** `transmutar_jpg_a_png(bytes)` behavior must remain valid for Worker; defaults = RGB output + compression 6.
- **No UI changes.**
- **No Worker protocol changes** in this task.
- **StripAll** metadata policy must remain verified.
- **No palette/indexed PNG** (P5 deferred).
- **No lossy PNG modes** (§5.4.3 future flag deferred).
- English only for errors, docs, report.

---

DELIVERABLES

1. `transmutador_jpg` options + RGB enforcement + compression encoder (R1–R3).
2. Integration tests (R5).
3. Module docs (R6).
4. Wasm rebuild + ambient types if needed (R7).
5. Version bumps (R8).
6. `docs/SPEC.md` amendments (R9).
7. `docs/reports/refine_transmutador_jpg_done.md` per GOVERNANCE §5.

---

EXIT GATE (self-check before report)

- [ ] Output PNG IHDR color type is **2 (RGB)**, never **6 (RGBA)** for JPEG sources (tested).
- [ ] Grayscale JPEG → RGB PNG (tested).
- [ ] Compression 0 / invalid rejected; compression 6 default unchanged on original Wasm export.
- [ ] Metadata StripAll test still passes.
- [ ] Filter type and compression semantics documented in report and SPEC.
- [ ] `cargo test --workspace` all green.
- [ ] SPEC v0.5.5 updated.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
