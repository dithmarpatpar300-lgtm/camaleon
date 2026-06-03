SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§5.5.2**, **§5.5.3**, **§5.8**, **§5.10**, **§6.3**) and `docs/ROADMAP.md` before any action.
All source code, comments, and outputs must be strictly in English.
Do not substitute the technology stack. Do not modify `docs/ROADMAP.md`.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read SPEC §5.5.2 (alpha flatten onto `BackgroundFill`). The Rust core already composites onto `options.background` — this task only exposes that capability through a new Wasm export.
2. Inspect `motor_transmutacion/transmutador_png/src/lib.rs`: `BackgroundFill { r, g, b }`, `PngToJpgOptions { quality, background }`, `validate_quality`, `transmutar_png_a_jpg_inner(input, &options)` — all already exist (v0.5.4).
3. Confirm the only gap: there is no Wasm export that accepts a custom background color; `transmutar_png_a_jpg_with_quality` hardcodes `BackgroundFill::WHITE`.
4. Plan the new export to delegate to `_inner` with `PngToJpgOptions { quality, background }`, validating quality and treating `r,g,b: u8` as inherently valid (0–255).
5. Preserve backward compatibility and StripAll (§5.10).

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `refine_png_background_option`
PHASE: Backend refinement (enables UI-3 background control) — `v0.5.6`
OBJECTIVE: Expose the existing Rust `BackgroundFill` through a new backward-compatible Wasm export `transmutar_png_a_jpg_with_options(bytes, quality, bg_r, bg_g, bg_b)`, so the frontend can let users choose the alpha-flatten background — without changing core compositing logic.

---

CONTEXT

- `transmutador_png` (v0.5.4) already flattens RGBA onto `options.background` via `flatten_rgba_on_background` and `png_bytes_to_jpg_bytes(input, &options)`. The core fully supports arbitrary backgrounds.
- Existing Wasm exports:
  - `transmutar_png_a_jpg(bytes)` — defaults: Q85 + WHITE
  - `transmutar_png_a_jpg_with_quality(bytes, quality)` — quality 1–100, WHITE
- Missing: a Wasm export that passes a custom `BackgroundFill`. This task adds exactly that.
- UI-3 (frontend) will consume this to offer a background-color control for PNG→JPG (only meaningful for images with transparency; harmless on opaque sources).

---

REQUIREMENTS

### R1 — New Wasm export (`transmutador_png/src/lib.rs`)

Add, keeping all existing exports unchanged:

```rust
#[wasm_bindgen]
pub fn transmutar_png_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    validate_quality(quality)?;
    let options = PngToJpgOptions {
        quality,
        background: BackgroundFill { r: bg_r, g: bg_g, b: bg_b },
    };
    transmutar_png_a_jpg_inner(input_bytes, &options)
}
```

- `r,g,b` are `u8` → inherently 0–255, no extra validation needed (document this).
- Quality validated via existing `validate_quality` (rejects 0 and >100).
- Delegates to `transmutar_png_a_jpg_inner` — no new compositing code.
- Do NOT alter `transmutar_png_a_jpg` or `transmutar_png_a_jpg_with_quality`.

### R2 — Tests (`transmutador_png/tests/`)

Add integration tests (keep all existing 14 passing):

| Test | Purpose |
|------|---------|
| `custom_background_black_flattens_correctly` | Transparent red `(255,0,0,128)` with `BackgroundFill {0,0,0}` via `png_bytes_to_jpg_bytes`/options → decoded pixel matches black-flatten expectation (mirror existing white test, custom bg) |
| `custom_background_opaque_image_unaffected` | Fully opaque PNG → choosing a non-white background does not change opaque pixels (only alpha pixels composite) |
| `with_options_path_rejects_quality_zero` | Building options with quality 0 → `validate_quality` rejects (assert via the validation helper / inner path) |

Use deterministic tiny fixtures (1×1 / 16×16) decoded with the `image` crate. (Wasm `#[wasm_bindgen]` fns aren't unit-tested directly; exercise the same `PngToJpgOptions` path the export builds.)

### R3 — Ambient types (`frontend/src/types/wasm-modules.d.ts`)

Add the new export signature to the `transmutador_png` module declaration:

```typescript
export function transmutar_png_a_jpg_with_options(
  input_bytes: Uint8Array,
  quality: number,
  bg_r: number,
  bg_g: number,
  bg_b: number
): Uint8Array;
```

### R4 — Module docs

Update crate-level docs: note that the background is now selectable via `transmutar_png_a_jpg_with_options`; default remains white (§5.5.2); StripAll unchanged (§5.10).

### R5 — Wasm rebuild

Rebuild via `npm run build:wasm` (or scripts). Confirm the new export appears in generated glue. Do NOT commit `frontend/public/wasm/` binaries.

### R6 — Version & SPEC amendment

Bump to **v0.5.6**:
- `motor_transmutacion/Cargo.toml` workspace version
- `frontend/package.json` version

Update `docs/SPEC.md`:
- §5.5.3 / §6.3: document the new `transmutar_png_a_jpg_with_options` export (quality + background); note background default white, components 0–255.
- §6.3: update test count for `transmutador_png`.
- §5.8: optional note that background-color export is delivered (enables UI-3 control).
- Bump SPEC version; Amendment Log → `refine_png_background_option_done.md`.

**Do not** modify `docs/ROADMAP.md`.

### R7 — Verification

| Command | Must pass |
|---------|-----------|
| `cargo test --workspace` | All tests (existing + new) |
| `cargo check --workspace` | Zero errors |
| `npm run build:wasm` | Both modules; new export present |
| `npm run build` | Frontend (ambient types compile) |

---

CONSTRAINTS

- **Scope:** `transmutador_png` Wasm surface + tests + types + docs only. No changes to compositing math, `transmutador_jpg`, or `core_utils`.
- **Backward compatibility:** existing exports unchanged; defaults preserved.
- **No UI changes** (UI-3 consumes this separately).
- **StripAll** metadata policy intact (§5.10).
- **No new dependencies.**
- English for code, comments, report.

---

DELIVERABLES

1. `transmutar_png_a_jpg_with_options` export (R1).
2. Integration tests (R2).
3. Ambient type declaration (R3).
4. Module docs (R4) + Wasm rebuild (R5).
5. Version bumps + SPEC amendments (R6).
6. `docs/reports/refine_png_background_option_done.md` per GOVERNANCE §5.

---

EXIT GATE (self-check before report)

- [ ] New export delegates to `_inner` with a custom `BackgroundFill`; existing exports untouched.
- [ ] Custom (non-white) background composites correctly; opaque images unaffected.
- [ ] Quality still validated (0/>100 rejected).
- [ ] Ambient types updated; `npm run build` compiles.
- [ ] StripAll intact.
- [ ] `cargo test --workspace` green.
- [ ] SPEC v0.5.6 updated.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
