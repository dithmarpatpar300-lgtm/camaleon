SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project.
Read docs/SPEC.md (full document, paying special attention to §5.10, §5.11, §5.12.3, §5.12.4, §6.1, §6.5) and docs/ROADMAP.md Phase 5.3 before any action.
Read docs/reports/phase5_webp_to_jpg_done.md for Phase 5.2 Architect review lessons — **do not** mark incomplete work as "follow-up" and claim done.
All outputs strictly in English. No stack substitutions. No scope creep into Phase 5.4 or later.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:
1. Read docs/SPEC.md §5.12.3 (encode-side WebP policies), §6.5 (`transmutador_encode` API contract).
2. Read docs/planning/v1_7_x_format_expansion_tier1.md §3.6 (options matrix) and §6 (Phase 5.3 full spec).
3. Read `motor_transmutacion/transmutador_webp/tests/integration_test.rs` — WebP **encode** fixtures use `img.write_to(&mut buf, image::ImageFormat::WebP)` (lossless only in `image` 0.25).
4. Read `motor_transmutacion/core_utils/src/lib.rs` — `OutputFormat` and `validate_output` must be extended for WebP RIFF magic.
5. Read `frontend/src/workers/transmutation.worker.ts` — fourth Wasm module pattern (`initEncodeWasm`, lazy-load, no startup preload).
6. List every file you will create or modify before touching anything.
7. Verify `image` crate keeps `default-features = false` (no `rayon`).
8. Execute in this order: (a) **Spike gate** → wasm-pack size check; (b) `core_utils` extension → tests; (c) `transmutador_encode` crate → tests → `cargo test --workspace`; (d) rebuild Wasm; (e) Frontend types + worker + registry + i18n; (f) `npm run build`.
9. If spike fails NFR-7 (> 3 MB `.wasm`), **STOP** — report only, do not scaffold frontend.
10. If any SPEC constraint conflicts with implementation reality, document the conflict explicitly in your report — do not silently deviate.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: phase5_png_to_webp
PHASE: Phase 5 — Format Expansion Tier 1
VERSION TARGET: Engine v1.4.0 / Frontend v1.7.3
OBJECTIVE: Scaffold the new `transmutador_encode` crate with lossless PNG→WebP conversion, extend `core_utils` for WebP output validation, integrate the fourth Wasm module into the worker, and activate `png-to-webp` in ToolRegistry with honest lossless-only UI copy per §5.12.3 and NFR-8.

---

OPTIONS DOCTRINE (read before implementing UI)

Full matrix: `docs/planning/v1_7_x_format_expansion_tier1.md` §3.6.

| This task (PNG → WebP) | Policy |
|------------------------|--------|
| User controls | **None** — one-click transmutation (no `optionSpecs`) |
| Fidelity | `lossless` — VP8L lossless via `image` 0.25 only |
| UI label | Must say **"Lossless WebP"** in copy (action title and/or fidelity hint) |
| Alpha | Preserved automatically (RGBA lossless when source has alpha) |
| Size expectation | §5.12.4 — often −20–30% on graphics; **can be larger** on photographic PNGs — UI must warn |

**Out of scope (do NOT implement):**
- Lossy WebP quality slider (requires separate library spike — §5.12.3)
- Metadata preserve toggles (StripAll §5.10 mandatory)
- JPEG→WebP (Phase 5.4)
- Any changes to `transmutador_jpg`, `transmutador_png`, or `transmutador_webp`

---

PHASE 0 — SPIKE GATE (mandatory before full implementation)

Before adding integration tests or frontend code:

1. Scaffold **minimal** `motor_transmutacion/transmutador_encode/` with:
   - `Cargo.toml`: `cdylib + rlib`, `image = { version = "0.25", default-features = false, features = ["png", "webp"] }`, `wasm-bindgen`, `core_utils`
   - `src/lib.rs`: single export `transmutar_png_a_webp` (can be minimal pipeline)

2. Run `wasm-pack build --target web` and measure **exact uncompressed** size of `transmutador_encode_bg.wasm`.

3. Encode a **1024×768** synthetic PNG in a native unit test or `#[test]` and verify:
   - Output decodes as WebP
   - Dimensions match source (1024×768)
   - Output is valid RIFF WEBP

4. **Gate decision:**
   - If `.wasm` > **3 MB** (NFR-7): **STOP**. Report spike failure only. Do not implement frontend. Escalate to Architect.
   - If `.wasm` ≤ 3 MB: proceed with full requirements below.

Document spike results in report §1 (size, dimensions check, compile notes).

---

REQUIREMENTS:

1. **Extend `motor_transmutacion/core_utils/`**

   a. Add `WebP` variant to `OutputFormat` enum.

   b. Extend `validate_output` for `OutputFormat::WebP`:
      - Reject empty output
      - Verify RIFF header: bytes `0..4` = `52 49 46 46` (`"RIFF"`)
      - Verify WebP FourCC at bytes `8..12` = `57 45 42 50` (`"WEBP"`)

   c. Add unit tests:
      - `validate_output_webp_ok` — minimal valid RIFF WEBP bytes → Ok
      - `validate_output_webp_bad_magic` — garbage bytes → Err

   **Do not** break existing Png/Jpeg validation tests.

2. **New crate `motor_transmutacion/transmutador_encode/`**

   a. `Cargo.toml`:
      ```toml
      name = "transmutador_encode"
      version.workspace = true
      crate-type = ["cdylib", "rlib"]
      image = { version = "0.25", default-features = false, features = ["png", "webp"] }
      ```

   b. Add `transmutador_encode` to `motor_transmutacion/Cargo.toml` workspace members.

   c. Bump workspace version → `version = "1.4.0"`.

   d. `src/lib.rs` — implement:

      ```rust
      #[wasm_bindgen]
      pub fn transmutar_png_a_webp(input_bytes: &[u8]) -> Result<Vec<u8>, String>

      #[wasm_bindgen]
      pub fn estimate_png_to_webp_size(input_bytes: &[u8]) -> Result<u32, String>
      // CountingWriter pattern — encode to counter, return byte count as u32
      ```

      Pipeline inside `transmutar_png_a_webp_inner`:
      1. `core_utils::validate_input(input)?`
      2. Decode PNG via `ImageReader::new(Cursor::new(input)).with_guessed_format()?.decode()?`
      3. Color-type policy: if `img.color().has_alpha()` → encode from `to_rgba8()`; else → `to_rgb8()`
      4. Encode lossless WebP via `DynamicImage::write_to(&mut buf, image::ImageFormat::WebP)` (or equivalent `image` 0.25 API)
      5. `core_utils::validate_output(&output, core_utils::OutputFormat::WebP)?`
      6. Return bytes

      StripAll (§5.10): decode→encode does not copy source ICC/EXIF/tEXt chunks.

3. **Integration tests** — `transmutador_encode/tests/integration_test.rs` (tests #20–26):

   Use in-memory PNG fixtures generated via the `image` crate (same pattern as other crates). Do NOT depend on external fixture files.

   | # | Test | Assertion |
   |---|------|-----------|
   | 20 | `opaque_png_to_webp_produces_valid_riff` | RIFF + WEBP FourCC; decodable |
   | 21 | `png_with_alpha_to_webp_rgba_preserved` | Round-trip decode → pixel has alpha channel |
   | 22 | `dimensions_preserved_after_encode` | Output WebP W×H matches source PNG |
   | 23 | `strip_all_no_icc_in_output` | Use `core_utils::png_contains_iccp_chunk` on **source**; output WebP has no propagated ICC (encode path strips by not copying metadata) |
   | 24 | `estimate_png_to_webp_within_10pct` | `\|estimate - actual\| / actual < 0.10` |
   | 25 | `empty_input_returns_error` | `Err(...)`, not panic |
   | 26 | `corrupt_png_returns_error` | `Err(...)` |

   **Note:** Test #23 validates StripAll policy — output WebP must not embed source PNG metadata chunks. If `image` crate embeds ICC in WebP output, document in report and add validation that output does not contain ICC chunk if detectable.

4. **`cargo test --workspace`** must pass before touching frontend.

5. **Rebuild Wasm** — add `transmutador_encode` to build scripts (see §10).

6. **Frontend: `frontend/src/workers/types.ts`**
   - Extend `TransmutationModule` union: `"transmutador_encode"`
   - Extend `OutputExtension`: `"webp"` (for fingerprint consistency on encode routes)

7. **Frontend: `frontend/src/types/wasm-modules.d.ts`**
   - Declare `transmutador_encode` module with `transmutar_png_a_webp` and `estimate_png_to_webp_size`.

8. **Frontend: `frontend/src/workers/transmutation.worker.ts`**
   - Add `initEncodeWasm` / `ensureEncodeWasmInitialized` (lazy-load pattern — **do not** add to startup `Promise.all` preload).
   - Bind `transmutar_png_a_webp` and `estimate_png_to_webp_size` in init.
   - Route `module === "transmutador_encode"`:
     - `runFullEncode` → `transmutar_png_a_webp(input)`
     - `runSizeEstimate` → `estimate_png_to_webp_size(input)`
     - Response: `mime: "image/webp"`, `extension: "webp"`
   - Add `"transmutador_encode"` to `knownModules` list.
   - Extend `resolveRoute` / `resolveMimeExtension` accordingly.

9. **Frontend: `frontend/src/providers/TransmutationWorkerProvider.tsx`**
   - No signature change required if `outputExtension` is already optional — pass `tool.outputExtension` from panel when `"webp"`.

10. **Frontend: `frontend/src/lib/transmutation/fingerprint.ts`**
    - Already supports `outputExtension` — ensure `"webp"` flows through for `png-to-webp`.

11. **Frontend: `frontend/src/hooks/useFileMetrics.ts`**
    - Pass `outputExtension: "webp"` from tool definition (already wired in Phase 5.2 pattern).

12. **Frontend: `frontend/src/components/transmute/TransmutationPanel.tsx`**
    - Pass `tool.outputExtension` to `transmutate()` and `useFileMetrics` (should already work if `outputExtension` is `"webp"`).
    - **No** `optionSpecs` for this tool — `OptionsControls` hidden.
    - **No** alpha detection branch needed (lossless alpha preserved in WebP).

13. **Frontend: `frontend/src/lib/tools/tool-registry.ts`**

    Add new tool entry:
    ```typescript
    {
      id: "png-to-webp",
      slug: "png-to-webp",
      title: "PNG → WebP",
      fromFormat: "PNG",
      toFormat: "WEBP",
      module: "transmutador_encode",
      category: "image",
      fidelity: "lossless",
      status: "active",
      acceptExtensions: [".png"],
      outputExtension: "webp",
      // NO optionSpecs — lossless one-click per §3.6
    }
    ```

14. **Frontend: i18n strings**

    `frontend/src/lib/i18n/dictionaries/en.ts`:
    ```typescript
    // meta.tools
    "png-to-webp": {
      title: "PNG to WebP — Camaleon",
      description: "Convert PNG to lossless WebP in your browser. Smaller files for web graphics — local and private.",
    },

    // tools
    "png-to-webp": {
      actionTitle: "Convert to Lossless WebP",
      description: "Lossless WebP — preserves every pixel including transparency.",
      fidelityHint:
        "Output is lossless VP8L WebP. Graphics and screenshots often shrink 20–30%; photographic PNGs may end up larger than the source.",
    },
    ```

    `frontend/src/lib/i18n/dictionaries/es.ts` — equivalent Spanish copy (natural phrasing; mirror tone of `webp-to-png`).

15. **Build scripts**

    `scripts/build-wasm.ps1` — add `transmutador_encode` to crate list.

    `scripts/build-wasm.sh` — add equivalent Unix entry.

    `frontend/package.json` — extend `build:wasm` script to include `transmutador_encode`.

16. **Version bump**

    `frontend/package.json` → `"version": "1.7.3"` on completion.

17. **`npm run build`** must pass. Verify `/transmute/png-to-webp` in static params (8 → 9 routes).

18. **Regression verification**

    Confirm existing tools unaffected:
    - `jpg-to-png`, `png-to-jpg`, `webp-to-png`, `webp-to-jpg` still build and route correctly.
    - No startup preload regression — `transmutador_encode` lazy-loads on first `/transmute/png-to-webp` visit.

---

CONSTRAINTS:
- MUST comply with SPEC §5.10 (StripAll), §5.11 (output integrity + `OutputFormat::WebP`), §5.12.3 (lossless only), §5.12.4 (size honesty), §6.5, NFR-1, NFR-7, NFR-8 (no false lossy claims)
- Do NOT implement Phase 5.4 (`transmutar_jpg_a_webp`) in this task
- Do NOT add lossy WebP encode or quality sliders
- Do NOT enable `rayon` in `image`
- Do NOT mark incomplete worker/registry/build-script work as "known gaps" — Phase gate requires full delivery
- Spike failure (> 3 MB wasm) is a valid **stopped** outcome — report only, no partial frontend

---

DELIVERABLES:
1. All code changes as specified (or spike-only report if NFR-7 gate fails)
2. `docs/reports/phase5_png_to_webp_done.md` with:
   - §1 Spike gate results (wasm size, 1024×768 dimension check, pass/fail decision)
   - Pre-execution analysis (encode API choice, color-type policy)
   - Work performed (files created/modified)
   - Architectural decisions
   - Verification: `cargo test --workspace`, `npm run build` (if implemented)
   - **Exact Wasm binary size** `transmutador_encode_bg.wasm`
   - Regression checklist (existing four tools)
   - SPEC amendments (if any)
   - Known gaps / follow-ups for Phase 5.4

---

EXECUTION OUTPUT:
Do NOT dump raw code in chat. Output the technical report file only (`docs/reports/phase5_png_to_webp_done.md`).
All implementation changes go directly into the repository files.
