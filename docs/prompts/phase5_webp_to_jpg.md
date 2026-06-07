SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project.
Read docs/SPEC.md (full document, paying special attention to §5.5.2, §5.10, §5.11, §5.12.2, §5.12.4, §6.4) and docs/ROADMAP.md Phase 5.2 before any action.
Read docs/reports/phase5_webp_to_png_done.md for Phase 5.1 decisions and known gaps.
All outputs strictly in English. No stack substitutions. No scope creep into Phase 5.3 or later.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:
1. Read docs/SPEC.md §5.5.2 (PNG→JPEG alpha flatten), §5.12.2 (WebP→JPEG policies), §6.4 (`transmutador_webp` API contract — Phase 5.2 exports).
2. Read docs/planning/v1_7_x_format_expansion_tier1.md §3.6 (options matrix) and §5 (Phase 5.2 full spec).
3. Read `motor_transmutacion/transmutador_png/src/lib.rs` — reuse the **same** alpha-flatten formula and JPEG encode pattern (`JpegEncoder::new_with_quality`).
4. Read `motor_transmutacion/transmutador_webp/src/lib.rs` — extend in place; do not break Phase 5.1 PNG exports.
5. Read `frontend/src/workers/transmutation.worker.ts` — **critical:** both `webp-to-png` and `webp-to-jpg` share module `transmutador_webp`; worker routing must disambiguate by `outputExtension`.
6. Read `frontend/src/components/transmute/TransmutationPanel.tsx` and `png-to-jpg` tool entry — WebP→JPG must achieve **UI parity** with PNG→JPG (quality slider always visible; background color only when alpha detected via `TransparencyNotice`).
7. List every file you will create or modify before touching anything.
8. Verify `image` crate keeps `default-features = false` (no `rayon`).
9. Execute in this order: (a) Rust crate + tests → `cargo test --workspace`; (b) rebuild Wasm; (c) Frontend types + worker + registry + i18n + alpha detection; (d) `npm run build`; (e) manual regression on `webp-to-png` after worker refactor.
10. If any SPEC constraint conflicts with implementation reality, document the conflict explicitly in your report — do not silently deviate.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: phase5_webp_to_jpg
PHASE: Phase 5 — Format Expansion Tier 1
VERSION TARGET: Engine v1.3.1 / Frontend v1.7.2
OBJECTIVE: Add WebP → JPEG conversion to the existing `transmutador_webp` crate, integrate worker routing for dual-output WebP module, activate `webp-to-jpg` in ToolRegistry, and ship EN/ES UI copy with two-generation lossy warning per §5.12.2.

---

OPTIONS DOCTRINE (read before implementing UI)

Camaleon exposes user controls based on **output format science**, not route symmetry. Full matrix: `docs/planning/v1_7_x_format_expansion_tier1.md` §3.6.

| This task (WebP → JPG) | Parity reference (PNG → JPG) |
|------------------------|------------------------------|
| `fidelity: "lossy"` | Same |
| Slider key: `quality` (1–100, default 85) | Identical presets: web=60, balanced=85, high=95 |
| Color key: `background` (white/black/gray + custom) | Identical swatches and `allowCustom: true` |
| `TransparencyNotice` when alpha detected | Same UX — background **not** in main `OptionsControls` list |
| `fidelityHint` warns irreversible loss + alpha flatten | **Additionally** warn §5.12.2 two-generation lossy (WebP may already be lossy) |

**What WebP → JPG does NOT get (out of scope — do not implement):**

| Deferred lever | Why |
|----------------|-----|
| Chroma subsampling (4:2:0 vs 4:4:4) | Requires `refine_jpeg_encoder_swap` — `image::JpegEncoder` has no API |
| Optimized / progressive JPEG | Same encoder limitation |
| Lossy WebP re-encode knobs | N/A — we are **decoding** WebP, not encoding it |
| User-selectable RGB vs RGBA output | JPEG has no alpha — engine always flattens or drops alpha |
| Metadata preserve toggles | StripAll (§5.10) is mandatory |

**Engine auto-decisions (no UI):** decode WebP → detect alpha via `img.color().has_alpha()` → flatten if needed → `JpegEncoder` at 4:2:0 default → `validate_output(Jpeg)` → StripAll.

---

REQUIREMENTS:

1. **Extend `motor_transmutacion/transmutador_webp/`**

   a. `Cargo.toml`:
      - Add `"jpeg"` to `image` features: `features = ["webp", "png", "jpeg"]`
      - Keep `default-features = false`

   b. Bump workspace version in `motor_transmutacion/Cargo.toml` `[workspace.package]` → `version = "1.3.1"`

   c. `src/lib.rs` — add Wasm exports (delegate to `_inner` functions):

      ```rust
      #[wasm_bindgen]
      pub fn transmutar_webp_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String>
      // Default: quality 85, white background (255,255,255) — mirror transmutador_png defaults.

      #[wasm_bindgen]
      pub fn transmutar_webp_a_jpg_with_options(
          input_bytes: &[u8],
          quality: u8,        // 1–100
          bg_r: u8,
          bg_g: u8,
          bg_b: u8,
      ) -> Result<Vec<u8>, String>

      #[wasm_bindgen]
      pub fn estimate_webp_to_jpg_size(
          input_bytes: &[u8],
          quality: u8,
          bg_r: u8,
          bg_g: u8,
          bg_b: u8,
      ) -> Result<u32, String>
      // CountingWriter pattern — same as estimate_png_to_jpg_size
      ```

      Pipeline inside `transmutar_webp_a_jpg_inner`:
      1. `core_utils::validate_input(input)?`
      2. Decode WebP via `ImageReader` (same as PNG path)
      3. If alpha present → `flatten_rgba_on_background` (copy formula from `transmutador_png` §5.5.2); else → `to_rgb8()`
      4. Encode JPEG via `image::codecs::jpeg::JpegEncoder::new_with_quality`
      5. `core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?`
      6. Return bytes

      Quality validation: reuse `Quality::try_new` from `core_utils` or copy `validate_quality` pattern from `transmutador_png` (reject 0 and >100).

      **Do NOT modify** existing PNG exports (`transmutar_webp_a_png*`, `estimate_webp_to_png_size`).

2. **Integration tests** — append to `transmutador_webp/tests/integration_test.rs` (tests #14–19; keep all Phase 5.1 tests green):

   | # | Test | Assertion |
   |---|------|-----------|
   | 14 | `lossy_webp_to_jpg_produces_valid_jpeg` | JPEG magic `FF D8`; decodable; dimensions preserved |
   | 15 | `webp_with_alpha_flattened_on_white` | Semi-transparent pixel on white bg → expected RGB after flatten |
   | 16 | `webp_with_alpha_custom_background_red` | Same pixel flattened on red (255,0,0) bg → expected RGB |
   | 17 | `quality_zero_rejected` | `Err(...)`, not panic |
   | 18 | `quality_over_100_rejected` | `Err(...)` |
   | 19 | `estimate_webp_to_jpg_within_5pct` | `\|estimate - actual\| / actual < 0.05` |

   **Fixture note:** `image` 0.25 has no lossy WebP encoder — use lossless WebP fixtures (same as Phase 5.1). Document in report. Real lossy WebP files still decode at runtime.

   For tests #15–16, mirror the pixel-math assertions in `transmutador_png/tests/integration.rs` (`custom_background_red_flattens_correctly` pattern).

3. **`cargo test --workspace`** must pass before touching frontend.

4. **Rebuild Wasm** — `wasm-pack build` for `transmutador_webp` (existing build scripts already include this crate; no new crate needed).

5. **Frontend: `frontend/src/workers/types.ts`**

   Extend `WorkerRequest`:
   ```typescript
   outputExtension?: "png" | "jpg";
   ```
   Required whenever `module === "transmutador_webp"` so the worker knows PNG vs JPEG path.

6. **Frontend: `frontend/src/types/wasm-modules.d.ts`**

   Add declarations for the three new Wasm exports on `transmutador_webp`.

7. **Frontend: `frontend/src/workers/transmutation.worker.ts`**

   a. In `initWebpWasm`, also bind:
      - `transmutar_webp_a_jpg_with_options`
      - `estimate_webp_to_jpg_size`

   b. Refactor routing — replace naive `isWebp → always PNG` with:
      ```typescript
      const isWebpToPng = req.module === "transmutador_webp" && (req.outputExtension ?? "png") === "png";
      const isWebpToJpg = req.module === "transmutador_webp" && req.outputExtension === "jpg";
      ```

   c. `runFullEncode`:
      - `isWebpToPng` → existing PNG path (`transmutar_webp_a_png_with_compression` / default)
      - `isWebpToJpg` → `transmutar_webp_a_jpg_with_options(input, quality, bg.r, bg.g, bg.b)`

   d. `runSizeEstimate`:
      - `isWebpToJpg` → `estimate_webp_to_jpg_size(input, quality, bg.r, bg.g, bg.b)`
      - `isWebpToPng` → existing `estimate_webp_to_png_size`

   e. Mime/extension response:
      - `webp-to-png`: `image/png` / `png`
      - `webp-to-jpg`: `image/jpeg` / `jpg`

8. **Frontend: `frontend/src/providers/TransmutationWorkerProvider.tsx`**

   Extend `transmutate` and `estimate` signatures to accept `outputExtension?: "png" | "jpg"` and pass it in `postMessage` payload.

9. **Frontend: `frontend/src/lib/transmutation/fingerprint.ts`**

   Include `outputExtension` in `buildTransmuteFingerprint` so result-cache keys differ between `webp-to-png` and `webp-to-jpg` on the same file.

10. **Frontend: `frontend/src/hooks/useFileMetrics.ts`**

    a. Accept `outputExtension` parameter (from tool definition).

    b. Pass `outputExtension` through to `estimate()` calls so `transmutador_webp` routes to the correct Wasm export.

    c. Include `outputExtension` in the estimate dependency array / fingerprint inputs (via updated `buildTransmuteFingerprint`).

11. **Frontend: `frontend/src/components/transmute/TransmutationPanel.tsx`**

    a. Pass `tool.outputExtension` to `transmutate()` and wire `outputExtension` into `useFileMetrics({ outputExtension: tool.outputExtension, ... })`.

    b. Alpha detection for background UI — refactor staging logic to avoid a growing `if (tool.id === …)` chain. Preferred pattern:
       ```typescript
       const hasBackgroundOption = tool.optionSpecs?.some(
         (s) => s.kind === "color" && s.key === "background"
       );

       if (hasBackgroundOption && tool.id === "png-to-jpg") {
         setHasAlpha(detectPngAlpha(bytes).hasAlpha);
       } else if (hasBackgroundOption && tool.id === "webp-to-jpg") {
         setHasAlpha(detectWebpAlpha(bytes).hasAlpha);
       } else {
         setHasAlpha(false);
       }
       ```

    c. **UI parity with `png-to-jpg` (mandatory):**
       - Quality slider always shown in `OptionsControls` (via `panelOptionSpecs` — background filtered out).
       - `TransparencyNotice` + background swatches shown **only** when `hasAlpha === true`.
       - Default background remains white `{ r: 255, g: 255, b: 255 }` even when notice is hidden (engine still receives bg RGB on every encode).
       - Changing background or quality must trigger metrics re-estimate (existing `useFileMetrics` behavior — verify it still fires for `webp-to-jpg`).

    d. Do **not** add tool-specific branches in `OptionsControls` or `BackgroundColorPill` — reuse generic `toolId`-keyed i18n (`tools["webp-to-jpg"].options.*`).

12. **Frontend: `frontend/src/lib/format/detect-webp-alpha.ts`** (new)

    Lightweight RIFF/VP8X scan: if `VP8X` chunk present and alpha bit (byte 20, bit 0x10) set → `hasAlpha: true`. No full decode. Pattern mirrors `detect-png-alpha.ts`.

13. **Frontend: `frontend/src/lib/tools/tool-registry.ts`**

    Add new tool entry (after `webp-to-png`):
    ```typescript
    {
      id: "webp-to-jpg",
      slug: "webp-to-jpg",
      title: "WebP → JPG",
      fromFormat: "WEBP",
      toFormat: "JPG",
      module: "transmutador_webp",
      category: "image",
      fidelity: "lossy",
      status: "active",
      acceptExtensions: [".webp"],
      outputExtension: "jpg",
      optionSpecs: [
        { kind: "slider", key: "quality", min: 1, max: 100, step: 1, defaultValue: 85,
          presets: [{ label: "web", value: 60 }, { label: "balanced", value: 85 }, { label: "high", value: 95 }] },
        { kind: "color", key: "background", defaultValue: { r: 255, g: 255, b: 255 },
          swatches: [white, black, gray], allowCustom: true },
      ],
    }
    ```

14. **Frontend: i18n strings**

    `frontend/src/lib/i18n/dictionaries/en.ts`:
    ```typescript
    // meta.tools
    "webp-to-jpg": {
      title: "WebP to JPG — Camaleon",
      description: "Convert WebP to JPG in your browser. Compressed for web — local and private.",
    },

    // tools
    "webp-to-jpg": {
      actionTitle: "Compress for Web",
      description: "Convert WebP to JPEG — smaller files at your chosen quality.",
      fidelityHint:
        "JPEG is lossy — quality loss is irreversible. WebP was likely already compressed; re-encoding adds a second lossy generation. Transparency is flattened to your chosen background.",
      options: {
        quality: {
          label: "JPEG Quality",
          hint: "Higher quality = larger file. Quality loss is always irreversible.",
          lowerLabel: "Lighter",
          upperLabel: "Faithful",
          presets: { web: "Web", balanced: "Balanced", high: "High" },
        },
        background: {
          label: "Background color",
          hint: "Only affects images with transparency.",
          customAria: "Custom background color",
          swatches: { white: "White", black: "Black", gray: "Gray" },
        },
      },
    },
    ```

    `frontend/src/lib/i18n/dictionaries/es.ts` — equivalent Spanish copy (review for natural phrasing; mirror `png-to-jpg` tone).

15. **Version bump**

    `frontend/package.json` → `"version": "1.7.2"` on completion.

16. **`npm run build`** must pass with zero TypeScript errors. Verify `/transmute/webp-to-jpg` appears in static params.

17. **Regression verification (manual + automated)**

    After worker refactor, confirm Phase 5.1 is unaffected:
    - All 13 existing `transmutador_webp` PNG integration tests still pass.
    - `/transmute/webp-to-png`: compression slider works; metrics estimate updates; transmute outputs valid `.png`.
    - `/transmute/webp-to-jpg`: quality slider works; alpha WebP shows `TransparencyNotice`; transmute outputs valid `.jpg`.
    - Same `.webp` file on both routes produces different fingerprints / cache keys (PNG compression opts vs JPEG quality opts + `outputExtension`).

---

CONSTRAINTS:
- MUST comply with SPEC §5.5.2 (alpha flatten), §5.10 (StripAll), §5.11 (output integrity), §5.12.2 (two-generation lossy UI warning), §6.4 (API contract), NFR-1 (privacy), NFR-7 (bundle ≤ 3 MB)
- Do NOT implement Phase 5.3 (PNG → WebP) or any `transmutador_encode` work
- Do NOT modify `transmutador_jpg`, `transmutador_png`, or `core_utils` unless strictly required (prefer copying flatten logic into `transmutador_webp` over refactoring shared crate in this phase)
- Do NOT enable `rayon` or threading in `image`
- Do NOT break Phase 5.1 `webp-to-png` behavior — regression-test manually and via existing tests
- Worker must NOT assume `transmutador_webp` always outputs PNG after this phase
- Do NOT add chroma subsampling, progressive JPEG, lossy WebP encode, or metadata preserve toggles — see OPTIONS DOCTRINE above
- `webp-to-jpg` optionSpecs must match `png-to-jpg` structure exactly (same keys, ranges, presets, swatches) — only i18n strings and `fidelityHint` differ
- Do NOT duplicate `BackgroundColorPill` aria-label logic per tool — use existing `tools.{toolId}.options.background.*` dictionary keys

---

DELIVERABLES:
1. All code changes as specified above
2. `docs/reports/phase5_webp_to_jpg_done.md` with:
   - Pre-execution analysis (worker dual-route design, alpha detection approach, options parity vs `png-to-jpg`)
   - Work performed (files created/modified)
   - Architectural decisions (flatten reuse, fixture limitations, why deferred levers were not added)
   - Verification: `cargo test --workspace` output, `npm run build` output
   - **Regression checklist** — `webp-to-png` still works after worker changes
   - **Updated Wasm binary size** for `transmutador_webp_bg.wasm` (must still be ≤ 3 MB)
   - SPEC amendments (if any gaps found)
   - Known gaps / follow-ups for Phase 5.3 (note: PNG→WebP and JPG→WebP will ship with **zero** option sliders in v1.7.x per §3.6)

---

EXECUTION OUTPUT:
Do NOT dump raw code in chat. Output the technical report file only (`docs/reports/phase5_webp_to_jpg_done.md`).
All implementation changes go directly into the repository files.
