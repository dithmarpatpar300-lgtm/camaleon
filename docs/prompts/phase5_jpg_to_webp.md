SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project.
Read docs/SPEC.md (full document, paying special attention to §5.10, §5.11, §5.12.3, §5.12.4, §6.5) and docs/ROADMAP.md Phase 5.4 before any action.
Read docs/reports/phase5_png_to_webp_done.md and docs/reports/phase5_webp_to_jpg_done.md for Architect review lessons — **do not** mark incomplete work as "follow-up" and claim done.
Read docs/prompts/phase5_png_to_webp.md for encode-crate patterns already shipped in v1.7.3.
All outputs strictly in English. No stack substitutions. No scope creep beyond Phase 5.4.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:
1. Read docs/SPEC.md §5.12.3 (encode-side WebP policies), §5.12.4 (size honesty — **JPEG→WebP inflation**), §6.5 (`transmutador_encode` API contract).
2. Read docs/planning/v1_7_x_format_expansion_tier1.md §3.6 (options matrix) and §7 (Phase 5.4 full spec).
3. Read `motor_transmutacion/transmutador_encode/src/lib.rs` — PNG→WebP pipeline and `count_webp_bytes` usage in `core_utils`.
4. Read `motor_transmutacion/core_utils/src/counting_writer.rs` — **`count_webp_bytes`** is the canonical WebP size estimator (do NOT call `write_to` on `CountingWriter` from `transmutador_encode`).
5. Read `frontend/src/workers/transmutation.worker.ts` — **`isEncode` currently routes only to `transmutar_png_a_webp`**. Phase 5.4 **must** add dual encode routing (PNG vs JPEG source).
6. Read `frontend/src/components/transmute/TransmutationPanel.tsx` — v1.7.4 hotfix shows `MetricsPanel` for zero-option tools; do not regress this.
7. Read **Frontend UX context (v1.7.5)** below — bounded scroll, theme fade, and header controls shipped; do not break during Phase 5.4 wiring.
8. List every file you will create or modify before touching anything.
8. Verify `image` crate keeps `default-features = false` (no `rayon`).
9. Execute in this order: (a) Rust exports + tests → `cargo test --workspace`; (b) rebuild Wasm; (c) Frontend worker dual-route + registry + i18n; (d) `npm run build`.
10. If any SPEC constraint conflicts with implementation reality, document the conflict explicitly in your report — do not silently deviate.

---

### Frontend UX context (v1.7.5 — do not regress)

Shipped on `master` before Phase 5.4. Full report: `docs/reports/v1_7_5_ux_polish_done.md`.

| Area | What shipped | Your constraint |
|------|----------------|-----------------|
| **Tool grid** | `ToolGrid` wraps cards in `ScrollVeil` (`variant="main"`, max ~440px) | Adding `jpg-to-webp` makes six tools — verify veils still appear; do not remove `ScrollVeil` |
| **Command Palette** | Active tools list uses `ScrollVeil` (`variant="palette"`) | Sixth tool must scroll inside palette without layout break |
| **Scroll lock** | `useScrollLock` on Command Palette + Keyboard Shortcuts dialog | Do not re-enable page scroll behind modals |
| **Overlay scrollbar** | Green thumb synced via rAF; hidden when scroll locked | Do not revert to React-state-only thumb positioning |
| **Theme crossfade** | `ThemeProvider` adds `html.camaleon-theme-fade` (~350ms) on user toggle | Veils use `background-color: var(--color-bg-base)` — **never** revert veils to hardcoded `background: linear-gradient(...)` only |
| **Language selector** | Animated circular pill; `LOCALES` array in `LanguageSelector.tsx` | i18n keys only — no layout changes unless adding locale |
| **Theme toggle** | `!rounded-full` + `theme-icon-in` entrance | Keep circular border; do not change `UtilityCluster` pill shape |
| **Metrics (v1.7.4)** | `MetricsPanel` visible for tools with **no** `optionSpecs` (e.g. `png-to-webp`) | `jpg-to-webp` is also zero-option — must show estimate before Transmute |

**Manual regression after Phase 5.4:** toggle dark↔light while tool grid is scrolled mid-list — veils must crossfade smoothly (no white/black flash). Run palette with 6 tools — bottom veil + scroll hint behave correctly.

---

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: phase5_jpg_to_webp
PHASE: Phase 5 — Format Expansion Tier 1 (final Tier 1 encode route)
VERSION TARGET: Engine v1.4.1 / Frontend v1.7.5
PREREQUISITE: v1.7.4 hotfix + v1.7.5 UX polish shipped (`MetricsPanel` for zero-option tools; `count_webp_bytes` in `core_utils`; `ScrollVeil`, theme fade, header controls — see Frontend UX context below).
OBJECTIVE: Extend `transmutador_encode` with lossless JPEG→WebP conversion, wire dual encode routing in the worker, and activate `jpg-to-webp` in ToolRegistry with honest lossless-of-lossy inflation UI copy per §5.12.4 and NFR-8.

---

OPTIONS DOCTRINE (read before implementing UI)

Full matrix: `docs/planning/v1_7_x_format_expansion_tier1.md` §3.6.

| This task (JPEG → WebP) | Policy |
|------------------------|--------|
| User controls | **None** — one-click transmutation (no `optionSpecs`) |
| Fidelity | `lossless` — VP8L lossless via `image` 0.25 only |
| UI label | Must say **"Lossless WebP"** in copy (action title and/or fidelity hint) |
| Alpha | N/A — JPEG has no alpha channel |
| Size expectation | §5.12.4 — **output typically 2×–10× larger** than source JPEG — UI **must warn prominently** |

**Out of scope (do NOT implement):**
- Lossy WebP quality slider (requires separate library spike — §5.12.3)
- Metadata preserve toggles (StripAll §5.10 mandatory)
- Changes to `transmutador_jpg`, `transmutador_png`, or `transmutador_webp`
- New Wasm crate — extend existing `transmutador_encode` only
- Build script changes (same crate; rebuild Wasm only)

---

PHASE 0 — WASM SIZE CHECK (mandatory, lightweight)

`transmutador_encode` already exists. After adding `jpeg` feature and new exports:

1. Run `wasm-pack build --target web` for `transmutador_encode`.
2. Measure **exact uncompressed** size of `transmutador_encode_bg.wasm`.
3. **Gate decision:**
   - If `.wasm` > **3 MB** (NFR-7): **STOP**. Report spike failure only. Do not scaffold frontend. Escalate to Architect.
   - If `.wasm` ≤ 3 MB: proceed.

Document size delta vs v1.7.3 baseline (~423 KB) in report §1.

---

REQUIREMENTS:

### 1. **Extend `motor_transmutacion/transmutador_encode/`**

a. `Cargo.toml` — add `jpeg` to `image` features:
```toml
image = { version = "0.25", default-features = false, features = ["png", "jpeg", "webp"] }
```

b. Bump workspace version in `motor_transmutacion/Cargo.toml` → `version = "1.4.1"`.

c. `src/lib.rs` — implement:

```rust
pub fn transmutar_jpg_a_webp_inner(input: &[u8]) -> Result<Vec<u8>, String>

#[wasm_bindgen]
pub fn transmutar_jpg_a_webp(input_bytes: &[u8]) -> Result<Vec<u8>, String>

#[wasm_bindgen]
pub fn estimate_jpg_to_webp_size(input_bytes: &[u8]) -> Result<u32, String>
```

Pipeline inside `transmutar_jpg_a_webp_inner`:
1. `core_utils::validate_input(input)?`
2. Decode JPEG via `ImageReader::new(Cursor::new(input)).with_guessed_format()?.decode()?`
3. Color-type policy: **always RGB** (`to_rgb8()`) — JPEG has no alpha
4. Encode lossless WebP via `write_to(..., ImageFormat::WebP)` on `Cursor<Vec<u8>>` (same pattern as PNG path)
5. `core_utils::validate_output(&output, core_utils::OutputFormat::WebP)?`
6. Return bytes

StripAll (§5.10): decode→encode does not copy source EXIF/ICC metadata.

**Estimate path:** use `core_utils::counting_writer::count_webp_bytes(&rgb)` — **do not** duplicate `write_to` + `CountingWriter` in this crate.

Refactor shared encode helper if useful (e.g. `rgb_image_to_webp_bytes`) to DRY with PNG opaque path — keep scope minimal.

### 2. **Integration tests** — append to `transmutador_encode/tests/integration_test.rs` (tests #27–31):

Use in-memory JPEG fixtures via `image` crate (same pattern as `transmutador_jpg/tests/integration.rs`). Do NOT depend on external fixture files.

| # | Test | Assertion |
|---|------|-----------|
| 27 | `jpeg_to_webp_produces_valid_riff` | RIFF + WEBP FourCC; decodable |
| 28 | `jpeg_to_webp_dimensions_preserved` | Output WebP W×H matches source JPEG |
| 29 | `strip_all_no_exif_in_output` | Source JPEG with EXIF APP1 (`core_utils::jpeg_contains_exif_app1`); output WebP does not propagate EXIF (encode path strips by not copying metadata) |
| 30 | `estimate_jpg_to_webp_within_10pct` | `\|estimate - actual\| / actual < 0.10` |
| 31 | `size_inflation_observed` | Synthetic photo-like JPEG: `output.len() > input.len()` (documents §5.12.4 expectation) |

Reuse `core_utils` JPEG-with-EXIF fixture patterns from `core_utils` tests or `transmutador_jpg` integration tests where applicable.

### 3. **`cargo test --workspace`** must pass before touching frontend.

### 4. **Rebuild Wasm** — `npm run build:wasm` (no script list changes; same crate).

---

### 5. **Frontend: dual encode routing (CRITICAL)**

Both `png-to-webp` and `jpg-to-webp` use `module: "transmutador_encode"` and `outputExtension: "webp"`. **`outputExtension` alone cannot disambiguate.** You must add an encode-source discriminator.

**Recommended approach** (mirror `outputExtension` pattern for `transmutador_webp`):

a. `frontend/src/workers/types.ts`:
```typescript
export type EncodeSource = "png" | "jpeg";

export type WorkerRequest = {
  // ...existing fields...
  /** Required when module is transmutador_encode — which encode export to call. */
  encodeSource?: EncodeSource;
};
```

b. `frontend/src/lib/transmutation/fingerprint.ts` — include `encodeSource` in fingerprint when `module === "transmutador_encode"` (extend `buildFingerprint` in `result-cache.ts` if needed).

c. `frontend/src/providers/TransmutationWorkerProvider.tsx` — thread `encodeSource` through `transmutate` / `estimate` / `sendMessage`.

d. `frontend/src/components/transmute/TransmutationPanel.tsx` — derive and pass:
```typescript
const encodeSource: EncodeSource | undefined =
  tool.module === "transmutador_encode"
    ? tool.fromFormat === "PNG"
      ? "png"
      : "jpeg"
    : undefined;
```
Pass to `useFileMetrics`, `transmutate`, and fingerprint builder.

e. `frontend/src/workers/transmutation.worker.ts`:
- Bind `transmutar_jpg_a_webp` and `estimate_jpg_to_webp_size` in `initEncodeWasm`.
- Extend `RouteFlags` with `encodeSource?: EncodeSource` (from request).
- In `runFullEncode` / `runSizeEstimate` when `route.isEncode`:
  - `encodeSource === "jpeg"` → `transmutar_jpg_a_webp` / `estimate_jpg_to_webp_size`
  - `encodeSource === "png"` (default for backward compat) → existing PNG exports
- Reject encode requests missing `encodeSource` with clear error (fail loud in dev).

f. `frontend/src/types/wasm-modules.d.ts` — declare new exports on `transmutador_encode`.

**Architect gate:** OpenCode historically leaves worker routing incomplete. Verify both encode routes manually before marking done.

### 6. **Frontend: `frontend/src/lib/tools/tool-registry.ts`**

Add new tool entry:
```typescript
{
  id: "jpg-to-webp",
  slug: "jpg-to-webp",
  title: "JPEG → WebP",
  fromFormat: "JPEG",
  toFormat: "WEBP",
  module: "transmutador_encode",
  category: "image",
  fidelity: "lossless",
  status: "active",
  acceptExtensions: [".jpg", ".jpeg"],
  outputExtension: "webp",
  // NO optionSpecs — lossless one-click per §3.6
}
```

### 7. **Frontend: i18n strings**

`frontend/src/lib/i18n/dictionaries/en.ts`:
```typescript
// meta.tools
"jpg-to-webp": {
  title: "JPEG to WebP — Camaleon",
  description: "Convert JPEG to lossless WebP in your browser. Local and private — note output may be larger than the source.",
},

// tools
"jpg-to-webp": {
  actionTitle: "Convert to Lossless WebP",
  description: "Lossless WebP from JPEG — every decoded pixel preserved in VP8L format.",
  fidelityHint:
    "Lossless WebP from an already-compressed JPEG usually produces a significantly larger file (often 2×–10×). Best for archival round-trips, not for shrinking photos.",
},
```

`frontend/src/lib/i18n/dictionaries/es.ts` — equivalent Spanish copy (natural phrasing; mirror tone of `png-to-webp`).

### 8. **Version bump**

`frontend/package.json` → `"version": "1.7.5"` on completion.

### 9. **`npm run build`** must pass. Verify `/transmute/jpg-to-webp` in static params (9 → 10 routes).

### 10. **Regression verification**

Confirm all six tools unaffected:
- `jpg-to-png`, `png-to-jpg`, `webp-to-png`, `webp-to-jpg`, `png-to-webp` still build and route correctly.
- `transmutador_encode` lazy-loads on first visit to either encode route.
- `MetricsPanel` shows estimate before Transmute on `jpg-to-webp` (v1.7.4 behavior — no sliders).

---

CONSTRAINTS:
- MUST comply with SPEC §5.10 (StripAll), §5.11 (output integrity), §5.12.3 (lossless only), §5.12.4 (JPEG inflation honesty), §6.5, NFR-1, NFR-7, NFR-8
- Do NOT add lossy WebP encode or quality sliders
- Do NOT enable `rayon` in `image`
- Do NOT call `write_to` on `CountingWriter` from `transmutador_encode` — use `count_webp_bytes`
- Do NOT mark incomplete worker/registry routing as "known gaps" — Phase gate requires full delivery
- Wasm size gate failure (> 3 MB) is a valid **stopped** outcome — report only, no partial frontend

---

DELIVERABLES:
1. All code changes as specified (or wasm-size-only report if NFR-7 gate fails)
2. `docs/reports/phase5_jpg_to_webp_done.md` with:
   - §1 Wasm size check (delta vs v1.7.3 baseline, pass/fail)
   - Pre-execution analysis (dual-route design, RGB-only policy)
   - Work performed (files created/modified)
   - Architectural decisions
   - Verification: `cargo test --workspace`, `npm run build`
   - **Exact Wasm binary size** `transmutador_encode_bg.wasm`
   - Regression checklist (all six tools)
   - SPEC amendments (if any)
   - Tier 1 completion note (four WebP suite routes done)

---

EXECUTION OUTPUT:
Do NOT dump raw code in chat. Output the technical report file only (`docs/reports/phase5_jpg_to_webp_done.md`).
All implementation changes go directly into the repository files.
