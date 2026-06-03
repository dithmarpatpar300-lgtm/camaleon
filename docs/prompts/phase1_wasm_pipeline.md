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

TASK ID: `phase1_wasm_pipeline`
PHASE: Phase 1 — Build & Bridge (`v0.2.0`)
OBJECTIVE: Establish a reproducible Wasm build pipeline and a Web Worker bridge that loads the `transmutador_jpg` stub and round-trips bytes with a structured error response.

---

REQUIREMENTS

### R1 — `core_utils` (Rust)

Implement shared utilities per SPEC §5.1:

- A common error type (enum) convertible to `String` for the Wasm boundary.
- `validate_input(bytes: &[u8]) -> Result<(), String>` — reject empty input.
- A configurable `MAX_INPUT_BYTES` constant (document the chosen default in the report; suggest 50 MB unless you justify otherwise).
- No format-specific decode logic.
- Wire `transmutador_jpg` to depend on `core_utils` and call `validate_input` before returning the existing stub error.

### R2 — Wasm build pipeline

- Add a root-level or workspace-level build script (e.g. `scripts/build-wasm.sh` and/or npm script in `frontend/package.json`) that runs `wasm-pack build` for `transmutador_jpg` with target `web`.
- Output artifacts to `frontend/public/wasm/transmutador_jpg/` per SPEC §6.3:
  - `transmutador_jpg_bg.wasm`
  - `transmutador_jpg.js`
- Document the build command in `README.md` (short "Building Wasm" subsection).
- Add `frontend/public/wasm/` to `.gitignore` if generated artifacts should not be committed; if you choose to commit them, justify in the report. Default preference: **gitignore generated wasm**, document build step.

### R3 — Shared TypeScript types

Create `frontend/src/workers/types.ts` implementing the protocol from SPEC §6.2:

```typescript
type WorkerRequest = {
  id: string;
  module: "transmutador_jpg" | "transmutador_png";
  bytes: ArrayBuffer;
};

type WorkerResponse =
  | { id: string; ok: true; bytes: ArrayBuffer; mime: string; extension: string }
  | { id: string; ok: false; error: string };
```

Export types for use by hooks (Phase 2+). `transmutador_png` module value is reserved for future use; worker may return `"Module not yet available"` for that module.

### R4 — Web Worker

Create `frontend/src/workers/transmutation.worker.ts`:

- Load Wasm from `/wasm/transmutador_jpg/transmutador_jpg.js` (dynamic import or equivalent compatible with Next.js bundling).
- Listen for `WorkerRequest` via `postMessage`.
- Call `transmutar_jpg_a_png` with input bytes.
- Post `WorkerResponse` back; use `Transferable` for `ArrayBuffer` where safe.
- Handle load failures and Wasm errors with `{ ok: false, error: string }`.
- MUST NOT import React or Next.js server APIs.

### R5 — Hook scaffold (minimal)

Create `frontend/src/hooks/useTransmutationWorker.ts`:

- Spawn worker on mount; terminate on unmount.
- Expose `transmutate(module, bytes): Promise<WorkerResponse>` that assigns a UUID/`crypto.randomUUID()` id.
- No UI changes required in `page.tsx` beyond optional dev-only test hook — **do not redesign the dropzone**.

### R6 — Verification

Run and report results:

| Command | Scope |
|---------|-------|
| `cargo check --workspace` | `motor_transmutacion/` |
| `cargo test --workspace` | if tests added |
| `wasm-pack build ...` | build script |
| `npm run build` | `frontend/` |

Resolve compiler warnings where trivial (e.g. prefix unused stub args with `_` only if still stub).

### R7 — SPEC amendment

Update `docs/SPEC.md`:

- Bump **Last updated** and SPEC **Version** (minor bump to `0.2.0` if contracts/paths finalized).
- Update §5.1 `core_utils` from "Stub" to current capabilities.
- Mark §6.2 and §6.3 as **Implemented** (Phase 1) with any path/script amendments.
- Add row to §10 Amendment Log referencing this task.

---

CONSTRAINTS

- Comply with `docs/SPEC.md` §3 (structure), §5 (modules), §6 (frontend), §8 (verification).
- Do **not** implement real JPEG→PNG conversion (Phase 2).
- Do **not** scaffold `transmutador_png` crate (Phase 3).
- Do **not** modify `docs/ROADMAP.md`.
- Do **not** commit `node_modules/`, `target/`, or secrets.

---

DELIVERABLES

1. All code and config changes per R1–R5.
2. `docs/SPEC.md` amendments per R7.
3. `docs/reports/phase1_wasm_pipeline_done.md` (or `_partial` / `_blocked`) per `docs/GOVERNANCE.md` §5.

---

EXIT GATE (self-check before report)

- [ ] Worker loads Wasm stub successfully in a browser-compatible build.
- [ ] Sending bytes to worker returns `{ ok: false, error: "..." }` from placeholder (structured, not a crash).
- [ ] `cargo check --workspace` and `npm run build` pass.
- [ ] SPEC reflects all architectural decisions.

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
