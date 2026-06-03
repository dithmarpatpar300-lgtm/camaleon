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

TASK ID: `phase2_jpg_to_png`
PHASE: Phase 2 — JPG → PNG (`v0.3.0`)
OBJECTIVE: Implement real JPEG → PNG transmutation in `transmutador_jpg`, rebuild Wasm, and wire the dropzone UI to the existing Web Worker pipeline with user-visible status and automatic PNG download.

---

REQUIREMENTS

### R1 — Rust conversion logic (`transmutador_jpg`)

Implement full behavior per SPEC §5.2:

1. Call `core_utils::validate_input` first (preserve existing contract).
2. Decode input as JPEG using the `image` crate (`ImageReader` / `JpegDecoder` or equivalent).
3. Encode result as PNG bytes (in-memory; no filesystem writes in library code).
4. Return `Ok(Vec<u8>)` on success or `Err(String)` with a **clear, user-facing English message** on failure.

**Recommended structure (testability):**

- Extract pure logic into a non-`wasm_bindgen` function, e.g. `pub fn jpg_bytes_to_png_bytes(input: &[u8]) -> Result<Vec<u8>, String>`.
- `#[wasm_bindgen] pub fn transmutar_jpg_a_png` delegates to that function.

**Error mapping (minimum):**

| Condition | Error message intent |
|-----------|---------------------|
| Empty / invalid after validation | Already handled by `core_utils` |
| Not a valid JPEG / corrupt data | e.g. `"Invalid or corrupt JPEG data"` |
| Decode/encode failure | e.g. `"Failed to transmute JPEG to PNG: {detail}"` |

Use `TransmutationError::ConversionFailed` from `core_utils` where appropriate, or map to `String` at the Wasm boundary.

**Do not** add PNG→JPEG logic (Phase 3). **Do not** scaffold `transmutador_png`.

### R2 — Unit tests (`transmutador_jpg/tests/`)

Add integration/unit tests that run with `cargo test` (native `rlib`, not Wasm target):

- At least **one success test**: valid minimal JPEG bytes → output starts with PNG magic bytes `0x89 0x50 0x4E 0x47`.
- At least **one failure test**: invalid/garbage bytes → `Err` with descriptive message.
- At least **one test** confirming empty input is rejected (via validation).

**Fixture strategy:** Generate a tiny valid JPEG in-test using the `image` crate (preferred), or embed minimal binary fixtures under `transmutador_jpg/tests/fixtures/` if generation is impractical. Document choice in the report.

### R3 — Rebuild Wasm artifacts

After Rust changes:

1. Run `wasm-pack build --target web` for `transmutador_jpg` (use `scripts/build-wasm.ps1`, `scripts/build-wasm.sh`, or `npm run build:wasm`).
2. Confirm artifacts land in `frontend/public/wasm/transmutador_jpg/` per SPEC §6.3.
3. Do **not** commit generated Wasm binaries (directory is gitignored).

### R4 — Worker behavior (verify / adjust only if needed)

`frontend/src/workers/transmutation.worker.ts` should already return structured errors via `try/catch` when Wasm throws.

- On **success**, response must be `{ ok: true, bytes, mime: "image/png", extension: "png" }`.
- On **failure**, `{ ok: false, error: string }` with the Rust error message propagated.
- **Do not** break Phase 1 init-await behavior (`ensureWasmInitialized`).

Only modify the worker if required for correct success/error handling after real conversion.

### R5 — UI integration (`frontend/src/app/page.tsx`)

Wire `useTransmutationWorker` from `frontend/src/hooks/useTransmutationWorker.ts`:

| State | UX requirement |
|-------|----------------|
| `idle` | Current dropzone (drag + click-to-select for `.jpg`/`.jpeg` only) |
| `processing` | Visible loading indicator (spinner or text); disable repeated drops |
| `success` | Auto-trigger browser download of the PNG (`Blob` + temporary `<a download>`) |
| `error` | User-visible error message in the UI (not `console.log` only) |

**File handling:**

- Read dropped/selected file as `ArrayBuffer`.
- Call `transmutate("transmutador_jpg", bytes)`.
- Derive download filename: same basename as source, extension replaced with `.png` (e.g. `photo.jpg` → `photo.png`).
- Reject non-JPEG files with a visible message (e.g. `"Only .jpg and .jpeg files are supported"`).

**Optional extraction:** If `page.tsx` grows large, move dropzone + status into `frontend/src/components/Dropzone.tsx` — only if it improves clarity; not mandatory.

**Do not** add PNG input support or `transmutador_png` routing (Phase 3 / MVP).

### R6 — README

Add a short **"Development"** or **"Running locally"** subsection:

1. Build Wasm (`npm run build:wasm` or scripts).
2. `npm run dev` in `frontend/`.
3. Drop a JPEG to verify download.

Keep existing **Building Wasm** section; extend, do not duplicate unnecessarily.

### R7 — Version alignment

Bump project version markers to **v0.3.0** where applicable:

- `README.md` title version
- `frontend/package.json` `"version"`
- `motor_transmutacion/Cargo.toml` `[workspace.package] version`

### R8 — SPEC amendment

Update `docs/SPEC.md`:

- Bump SPEC **Version** to `0.3.0` and **Last updated** date.
- Update §5.2 **Current state** to fully implemented (JPEG → PNG).
- Update §6.1 to note Phase 2 UI: progress, download, visible errors (still JPEG-only input).
- Add §10 Amendment Log entry referencing `phase2_jpg_to_png_done.md`.

**Do not** modify `docs/ROADMAP.md` (Chief Architect updates after your report is validated).

### R9 — Verification

Run and report results:

| Command | Scope |
|---------|-------|
| `cargo test --workspace` | `motor_transmutacion/` |
| `cargo check --workspace` | `motor_transmutacion/` |
| Wasm build script or `npm run build:wasm` | after Rust changes |
| `npm run build` | `frontend/` |

Zero errors required. Resolve warnings where trivial.

---

CONSTRAINTS

- Comply with `docs/SPEC.md` §5.2, §6.1, §6.2, §8.
- Privacy: no upload to any server; all processing local.
- No new npm dependencies unless strictly necessary (justify in report if added).
- No `transmutador_png` crate, no PNG dropzone, no MVP auto-detect.
- English only for code, UI strings, errors, and report.

---

DELIVERABLES

1. Rust implementation + tests (R1, R2).
2. Wasm rebuild documented in report (R3).
3. UI wired to worker (R5).
4. README update (R6).
5. Version bumps (R7).
6. `docs/SPEC.md` amendments (R8).
7. `docs/reports/phase2_jpg_to_png_done.md` per `docs/GOVERNANCE.md` §5.

---

EXIT GATE (self-check before report)

- [ ] `cargo test --workspace` passes including new `transmutador_jpg` tests.
- [ ] `transmutar_jpg_a_png` converts a valid JPEG to valid PNG bytes.
- [ ] Corrupt/empty inputs return structured errors visible in the UI.
- [ ] `npm run build` passes.
- [ ] Manual E2E documented in report: dev server → drop JPEG → PNG downloads.
- [ ] SPEC v0.3.0 reflects implementation.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
