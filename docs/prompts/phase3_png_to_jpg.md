SYSTEM DIRECTIVE: Act as a Senior Implementation Engineer for the Camaleon project.
Read `docs/SPEC.md` and `docs/ROADMAP.md` in full before any action.
All source code, comments, and outputs must be strictly in English.
Do not substitute the technology stack. Do not modify `docs/ROADMAP.md`.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/SPEC.md` and `docs/ROADMAP.md`. Identify which phase and acceptance criteria apply.
2. List dependencies, risks, and edge cases for this task.
3. Draft a mental execution plan and validate it against SPEC constraints.
4. Execute incrementally; after each major step, self-check against the plan.
5. Prefer correctness and SPEC compliance over speed.
6. If ambiguity exists, state your assumption explicitly in the technical report — do not silently guess on architectural decisions.

Do not skip this reasoning phase. Document key decisions in your technical report.

---

TASK ID: `phase3_png_to_jpg`
PHASE: Phase 3 — PNG → JPG (`v0.4.0`)
OBJECTIVE: Scaffold the independent `transmutador_png` crate with real PNG → JPEG conversion, extend the Wasm build pipeline and Web Worker to load both modules, and update the dropzone UI to auto-route `.png` vs `.jpg`/`.jpeg` files to the correct transmutator.

---

CONTEXT

- Phase 2 (`v0.3.0`) delivers working JPEG → PNG via `transmutador_jpg` only.
- `transmutador_png` is a **separate crate** with distinct logic (SPEC §5.3, principle P2).
- Manual E2E validation by the Product Owner confirmed JPG → PNG works (large PNG output from JPEG source is acceptable for now; lossless PNG expansion is expected).
- MVP polish (accessibility, unified UX refinements) remains **Phase 4 / v1.0.0** — do not implement Phase 4 scope here.

---

REQUIREMENTS

### R1 — Scaffold `transmutador_png` (Rust workspace)

Add crate under `motor_transmutacion/transmutador_png/`:

| File | Requirement |
|------|-------------|
| `Cargo.toml` | Mirror `transmutador_jpg`: `crate-type = ["cdylib", "rlib"]`; deps: `wasm-bindgen`, `image`, `core_utils` |
| `src/lib.rs` | Conversion logic + Wasm export |

Register `transmutador_png` as a workspace member in `motor_transmutacion/Cargo.toml`.

**Rule:** `transmutador_png` MUST NOT depend on `transmutador_jpg` (or vice versa). Shared code only via `core_utils`.

### R2 — PNG → JPEG conversion logic

Implement per SPEC §5.3:

```rust
#[wasm_bindgen]
pub fn transmutar_png_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String>
```

**Recommended structure (mirror Phase 2):**

- `pub fn png_bytes_to_jpg_bytes(input: &[u8]) -> Result<Vec<u8>, String>` — pure logic, testable natively.
- `pub fn transmutar_png_a_jpg_inner(input: &[u8]) -> Result<Vec<u8>, String>` — calls `validate_input` then `png_bytes_to_jpg_bytes`.
- `#[wasm_bindgen] pub fn transmutar_png_a_jpg` — delegates to `_inner`.

**Behavior:**

1. `core_utils::validate_input` first.
2. Decode PNG via `image` crate (`ImageReader` or equivalent).
3. Encode JPEG with **default quality `85`** (named constant e.g. `DEFAULT_JPEG_QUALITY: u8 = 85` in crate).
4. Return JPEG bytes or descriptive English `String` errors (corrupt PNG, decode/encode failures).

**Error mapping (minimum):**

| Condition | Message intent |
|-----------|----------------|
| Empty / oversized | Via `core_utils` |
| Invalid/corrupt PNG | e.g. `"Invalid or corrupt PNG data"` |
| Encode failure | e.g. `"Failed to encode JPEG: {detail}"` |

### R3 — Unit tests (`transmutador_png/tests/integration.rs`)

Mirror `transmutador_jpg` test strategy (in-memory fixtures via `image` crate):

| Test | Expectation |
|------|-------------|
| `converts_valid_png_to_jpg` | Valid PNG → output starts with JPEG SOI `0xFF 0xD8` |
| `rejects_empty_input` | `transmutar_png_a_jpg_inner(&[])` → `Err` mentioning empty |
| `rejects_corrupt_bytes` | Garbage bytes → `Err` with descriptive message |
| At least one truncated/invalid PNG test | Invalid header/body → `Err` |

Target: **4+ integration tests** passing under `cargo test --workspace`.

### R4 — Wasm build pipeline (both modules)

Extend build tooling to compile **both** transmutators:

| Artifact path | Crate |
|---------------|-------|
| `frontend/public/wasm/transmutador_jpg/` | existing |
| `frontend/public/wasm/transmutador_png/` | **new** |

**Update:**

- `scripts/build-wasm.ps1` — build both crates sequentially; fail fast on error.
- `scripts/build-wasm.sh` — same for Unix/CI.
- `frontend/package.json` — refactor `build:wasm` to build **both** (e.g. `build:wasm:jpg` + `build:wasm:png`, or a single script invocation). Preserve one-command developer UX: `npm run build:wasm` builds everything.

Output naming per SPEC §6.3 pattern: `transmutador_png.js`, `transmutador_png_bg.wasm`, etc.

Do **not** commit generated Wasm binaries.

### R5 — Web Worker dual-module support

Refactor `frontend/src/workers/transmutation.worker.ts`:

- Load **both** Wasm modules (`transmutador_jpg` and `transmutador_png`) with separate init promises (e.g. `ensureJpgWasmInitialized`, `ensurePngWasmInitialized`).
- Route `WorkerRequest.module` to the correct function:
  - `transmutador_jpg` → `transmutar_jpg_a_png` → success `{ mime: "image/png", extension: "png" }`
  - `transmutador_png` → `transmutar_png_a_jpg` → success `{ mime: "image/jpeg", extension: "jpg" }`
- Preserve `ensureWasmInitialized`-style await-before-invoke pattern (no race errors).
- Remove `"Module not yet available"` stub for `transmutador_png`.
- Keep try/catch for wasm-bindgen thrown errors.

Update `frontend/src/types/wasm-modules.d.ts` with ambient declaration for `transmutador_png` glue (mirror jpg module).

**Do not** merge both crates into one Wasm binary.

### R6 — UI format auto-routing (`frontend/src/app/page.tsx`)

Extend dropzone for **bidirectional** input (Phase 3 scope only — not full MVP polish):

| Source extension | Module | Output download |
|------------------|--------|-----------------|
| `.jpg`, `.jpeg` | `transmutador_jpg` | `.png` (`image/png`) |
| `.png` | `transmutador_png` | `.jpg` (`image/jpeg`) |

**UX requirements:**

- Update hero copy to mention both input types and both output formats.
- `<input accept="...">` includes `.png` in addition to `.jpg`/`.jpeg`.
- Reject unsupported extensions with visible message, e.g. `"Supported formats: .jpg, .jpeg, .png"`.
- Keep existing states: `idle`, `processing`, `success`, `error`.
- Keep `ready` guard before transmutation.
- Refactor download helper to be format-agnostic (e.g. `downloadResult(bytes, fileName, mime, extension)`).
- Success banner text reflects actual output (PNG vs JPEG downloaded).
- Processing spinner shows source filename (unchanged behavior).

**Do not** add quality sliders, batch mode, or Phase 4 accessibility work.

### R7 — README & versions

- Bump **v0.4.0** in: `README.md` title, `frontend/package.json`, `motor_transmutacion/Cargo.toml` workspace version.
- Update **Building Wasm** / **Development** sections: `npm run build:wasm` builds both modules; dev flow supports dropping PNG or JPEG.
- Roadmap summary table in README: mark JPG→PNG ✅; PNG→JPG row reflects v0.4.0 when done (OpenCode updates table text only — Chief Architect owns ROADMAP checkbox updates after validation).

### R8 — SPEC amendment

Update `docs/SPEC.md`:

- Version **0.4.0**, last updated date, status (PNG → JPG phase).
- §3 repository tree: add `transmutador_png/`.
- §5.3: Implemented with API, quality constant, test note.
- §6.1: Document dual-format auto-routing and download behavior.
- §6.2: Document dual Wasm init in worker.
- §6.3: Add `transmutador_png/` artifact tree.
- §10 Amendment Log entry → `phase3_png_to_jpg_done.md`.

**Do not** modify `docs/ROADMAP.md`.

### R9 — Verification

| Command | Must pass |
|---------|-----------|
| `cargo test --workspace` | All tests (core_utils + both transmutators) |
| `cargo check --workspace` | Zero errors |
| `npm run build:wasm` (or scripts) | Both modules |
| `npm run build` | Frontend |

Document manual E2E in report:

1. Drop `.jpg` → `.png` download still works (regression check).
2. Drop `.png` → `.jpg` download works (new path).

---

CONSTRAINTS

- Comply with SPEC §3, §5, §6, §8.
- Privacy: no server uploads.
- No new npm deps unless strictly required (justify in report).
- Do not implement WebP, batch, compression presets, or PWA (post-MVP).
- English only for code, UI strings, errors, report.
- Preserve existing `transmutador_jpg` behavior — regression-free.

---

DELIVERABLES

1. `transmutador_png` crate + tests (R1–R3).
2. Dual Wasm build scripts (R4).
3. Worker + types (R5).
4. UI routing (R6).
5. README + version bumps (R7).
6. SPEC v0.4.0 (R8).
7. `docs/reports/phase3_png_to_jpg_done.md` per GOVERNANCE §5.

---

EXIT GATE (self-check before report)

- [ ] `cargo test --workspace` passes (both transmutator integration suites + core_utils).
- [ ] PNG → valid JPEG bytes (SOI `FF D8`) in tests.
- [ ] Worker routes both modules with correct mime/extension.
- [ ] UI auto-routes by file extension; errors visible in UI.
- [ ] JPEG → PNG regression still works (manual E2E #1).
- [ ] PNG → JPEG works (manual E2E #2).
- [ ] SPEC v0.4.0 updated.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
