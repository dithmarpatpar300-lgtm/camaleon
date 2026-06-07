SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project.
Read docs/SPEC.md (full document, paying special attention to §5.12, §6.4, §12.1, §12.2) and docs/ROADMAP.md Phase 5.1 before any action.
All outputs strictly in English. No stack substitutions. No scope creep into Phase 5.2 or later.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:
1. Read docs/SPEC.md §5.12 (WebP science), §6.4 (transmutador_webp API contract), §6.1 (core_utils), §5.10 (StripAll), §5.11 (output integrity). Identify all constraints that apply.
2. Read docs/planning/v1_7_x_format_expansion_tier1.md §4 (Phase 5.1 full spec).
3. List every file you will create or modify before touching anything.
4. Verify that `image` crate feature configuration disables `rayon` (Wasm single-threaded constraint).
5. Execute in this order: (a) Rust crate → tests → cargo check; (b) Frontend types + worker + registry + i18n + hooks; (c) Build scripts; (d) Full build verification.
6. If any SPEC constraint conflicts with implementation reality, document the conflict explicitly in your report — do not silently deviate.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: phase5_webp_to_png
PHASE: Phase 5 — Format Expansion Tier 1
VERSION TARGET: Engine v1.3.0 / Frontend v1.7.0-alpha.1
OBJECTIVE: Implement the WebP → PNG transmutation path as a new `transmutador_webp` Rust crate with Wasm exports, integrate it into the Worker and ToolRegistry, and activate the `webp-to-png` tool in production.

---

REQUIREMENTS:

1. **New Rust crate `motor_transmutacion/transmutador_webp/`**

   a. `Cargo.toml`:
      - `name = "transmutador_webp"`, `version.workspace = true`, `edition.workspace = true`
      - `crate-type = ["cdylib", "rlib"]`
      - `[dependencies]`: `wasm-bindgen = "0.2"`, `core_utils = { path = "../core_utils" }`, `image = { version = "0.25", default-features = false, features = ["webp", "png"] }`
      - **Do NOT use `default-features = true`** — it enables `rayon` which panics in Wasm.

   b. Add `transmutador_webp` to `motor_transmutacion/Cargo.toml` as a workspace member.

   c. `src/lib.rs` — implement:

      ```rust
      #[wasm_bindgen]
      pub fn transmutar_webp_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String>
      // Default compression = 6. Color type: RGBA if source has alpha, RGB if not.

      #[wasm_bindgen]
      pub fn transmutar_webp_a_png_with_compression(
          input_bytes: &[u8],
          compression: u8,
      ) -> Result<Vec<u8>, String>
      // Compression 1–9. Invalid → Err. Same color-type policy.

      #[wasm_bindgen]
      pub fn estimate_webp_to_png_size(input_bytes: &[u8]) -> Result<u32, String>
      // CountingWriter pattern: encode to a sink that only counts bytes, return count as u32.
      // Use compression = 6 for the estimate.
      ```

      All three Wasm exports must delegate to an `_inner` function:
      ```rust
      fn transmutar_webp_a_png_inner(input: &[u8], compression: u8) -> Result<Vec<u8>, String>
      ```

      Pipeline inside `_inner`:
      1. `core_utils::validate_input(input)?`
      2. `image::ImageReader::new(std::io::Cursor::new(input)).with_guessed_format()?.decode()?`
      3. Detect alpha: if `DynamicImage` contains alpha channel → `to_rgba8()`; else → `to_rgb8()`
      4. Encode PNG via `PngEncoder::new_with_quality` with `CompressionType::Level(compression)`, `FilterType::Adaptive`
         - Use `ExtendedColorType::Rgba8` if RGBA, `ExtendedColorType::Rgb8` if RGB
      5. `core_utils::validate_output(&output_bytes, core_utils::OutputFormat::Png)?`
      6. Return bytes

      Use `validate_compression` from `core_utils` to check compression range.

2. **Integration tests** — create `transmutador_webp/tests/integration_test.rs` with ALL 13 tests from SPEC §6.4 and planning doc §4.3:

   Tests must use in-memory fixtures generated via the `image` crate itself (same pattern as `transmutador_jpg` and `transmutador_png` tests — look at those test files for the fixture-generation approach). Do NOT depend on external fixture files.

   | # | Test |
   |---|------|
   | 1 | `lossy_webp_produces_valid_png` |
   | 2 | `lossless_webp_produces_valid_png` |
   | 3 | `webp_with_alpha_produces_rgba_png` — verify IHDR color type byte = 6 |
   | 4 | `webp_without_alpha_produces_rgb_png` — verify IHDR color type byte = 2 |
   | 5 | `empty_input_returns_error` |
   | 6 | `corrupt_bytes_returns_error` |
   | 7 | `truncated_riff_returns_error` |
   | 8 | `strip_all_no_exif_in_output` — use `core_utils::png_contains_exif_chunk` |
   | 9 | `compression_zero_rejected` |
   | 10 | `compression_ten_rejected` |
   | 11 | `estimate_within_5pct_of_full_encode` |
   | 12 | `dimensions_preserved` |
   | 13 | `large_webp_within_limit_passes` |

   **Note on WebP fixtures:** the `image` crate can encode WebP lossless — use this to generate test input programmatically (encode a synthetic RGBA image as WebP bytes, then use those bytes as test input). For lossy WebP, check if `image` 0.25 supports lossy encode; if not, use lossless fixtures for both tests #1 and #2 and document this constraint in the report.

3. **`cargo test --workspace`** must pass before touching any frontend file.

4. **Frontend: `frontend/src/workers/types.ts`**
   - Extend `TransmutationModule` union to include `"transmutador_webp"`.

5. **Frontend: `frontend/src/types/wasm-modules.d.ts`**
   - Add module declaration for `transmutador_webp` matching the three Wasm exports.

6. **Frontend: `frontend/src/workers/transmutation.worker.ts`**
   - Add lazy-load pattern for `transmutador_webp` (same structure as `initJpgWasm` / `initPngWasm`).
   - Add routing: `module === "transmutador_webp"` → call `transmutar_webp_a_png_with_compression` or `transmutar_webp_a_png` per options.
   - Add estimate routing: `purpose === "estimate"` + `module === "transmutador_webp"` → call `estimate_webp_to_png_size`.
   - Output mime: `"image/png"`, extension: `"png"`.

7. **Frontend: `frontend/src/lib/tools/tool-registry.ts`**
   - Update `webp-to-png` entry: `status: "active"`.
   - Add `optionSpecs` for compression slider (1–9, default 6, presets: fast=1, balanced=6, minimal=9).
   - Ensure `module: "transmutador_webp"` and `acceptExtensions: [".webp"]`, `outputExtension: "png"`.

8. **Frontend: i18n strings**

   `frontend/src/lib/i18n/dictionaries/en.ts` — add to `tools`:
   ```typescript
   "webp-to-png": {
     actionTitle: "Convert to PNG",
     description: "Lossless raster storage — preserves every pixel from the WebP source.",
     fidelityHint: "Output PNG will be larger than the WebP source — PNG stores the full uncompressed raster.",
     options: {
       compression: {
         label: "PNG Compression",
         hint: "Always lossless — higher compression = smaller file + slower processing.",
         lowerLabel: "Faster",
         upperLabel: "Smaller",
         presets: { fast: "Fast", balanced: "Balanced", minimal: "Minimal" },
       },
     },
   }
   ```

   `frontend/src/lib/i18n/dictionaries/es.ts` — add to `tools`:
   ```typescript
   "webp-to-png": {
     actionTitle: "Convertir a PNG",
     description: "Almacenamiento sin pérdida — preserva cada píxel del WebP original.",
     fidelityHint: "El PNG resultante será más grande que el WebP fuente — PNG almacena el ráster sin comprimir.",
     options: {
       compression: {
         label: "Compresión PNG",
         hint: "Siempre sin pérdida — más compresión = archivo más pequeño + proceso más lento.",
         lowerLabel: "Más rápido",
         upperLabel: "Más pequeño",
         presets: { fast: "Rápido", balanced: "Balanceado", minimal: "Mínimo" },
       },
     },
   }
   ```

9. **Frontend: `frontend/src/hooks/useFileMetrics.ts`**
   - Extend estimate dispatch to handle `"transmutador_webp"` module → call `estimate_webp_to_png_size`.
   - Pattern identical to existing `transmutador_jpg` estimate path.

10. **Build scripts**

    `scripts/build-wasm.ps1` — add:
    ```powershell
    wasm-pack build --target web --out-dir ../public/wasm/transmutador_webp --out-name transmutador_webp ../motor_transmutacion/transmutador_webp
    ```

    `scripts/build-wasm.sh` — add equivalent Unix command.

    `frontend/package.json` — extend `build:wasm` script to include `transmutador_webp` invocation.

11. **`npm run build`** must pass with zero TypeScript errors before submitting the report.

---

CONSTRAINTS:
- MUST comply with docs/SPEC.md §5.10 (StripAll), §5.11 (output integrity), §5.12 (WebP science), §6.4 (exact API contract), §12.1 (expansion principles), NFR-1 (privacy), NFR-7 (bundle size ≤ 3 MB)
- Do NOT implement Phase 5.2 (WebP → JPEG) in this task — that is a separate prompt
- Do NOT modify `transmutador_jpg`, `transmutador_png`, or `core_utils` except to add `transmutador_webp` as a workspace member in `motor_transmutacion/Cargo.toml`
- Do NOT enable `rayon` or any threading feature in `image` dependency
- Do NOT add Wasm exports that are not listed above
- Update docs/SPEC.md if the implementation reveals any gap between the planned API (§6.4) and what was actually built — document the deviation clearly

---

DELIVERABLES:
1. All code changes as specified above
2. `docs/reports/phase5_webp_to_png_done.md` with:
   - Pre-execution analysis (risks, assumptions about WebP fixture generation)
   - Work performed (files created/modified)
   - Architectural decisions (especially: how alpha detection works; how fixtures were generated)
   - Verification results: `cargo test --workspace` output, `npm run build` output
   - **Wasm binary size** — exact uncompressed size of `transmutador_webp_bg.wasm`
   - SPEC amendments (if any gaps found)
   - Known gaps / follow-ups for Phase 5.2

---

EXECUTION OUTPUT:
Do NOT dump raw code in chat. Output the technical report file only (`docs/reports/phase5_webp_to_png_done.md`).
All implementation changes go directly into the repository files.
