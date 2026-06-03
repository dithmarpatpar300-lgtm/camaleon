# Camaleon — System Specification (SPEC)

> **Authoritative source of truth** for architecture, structure, and functional / non-functional requirements.
>
> - **Chief Architect (Cursor)** owns this document.
> - **OpenCode** must read SPEC before every task and **update SPEC** at task completion to reflect any architectural or behavioral change introduced.
> - If code and SPEC disagree, **SPEC wins** until a deliberate amendment is recorded.

**Version:** 0.3.0  
**Last updated:** 2026-06-02  
**Status:** Active — JPG → PNG phase

---

## 1. Vision & Principles

### 1.1 Mission

Camaleon transmutes file formats entirely inside the user's browser. Privacy is non-negotiable: file bytes never leave the client.

### 1.2 Architectural Principles

| # | Principle | Implication |
|---|-----------|-------------|
| P1 | **Privacy by design** | No server-side conversion; no analytics on file content |
| P2 | **Modular transmutators** | One Rust crate per conversion direction; no monolithic converter |
| P3 | **Worker isolation** | All Wasm execution on Web Workers; UI thread never blocks |
| P4 | **Explicit contracts** | Wasm public APIs are typed, documented, versioned |
| P5 | **Fail loudly** | Errors return structured messages; UI never silently drops failures |
| P6 | **SPEC sync** | Every merge-worthy change updates this document |

---

## 2. System Context

```mermaid
flowchart LR
    User([User]) --> UI[Next.js UI]
    UI -->|postMessage| Worker[Web Worker]
    Worker -->|wasm-bindgen| Wasm[Rust / Wasm Module]
    Wasm --> Worker
    Worker --> UI
    UI -->|download blob| User
```

**Trust boundary:** Everything inside the browser sandbox. No external services in the conversion path.

---

## 3. Repository Structure

```
camaleon/
├── docs/
│   ├── SPEC.md              ← this document
│   ├── ROADMAP.md           ← phased delivery plan
│   ├── GOVERNANCE.md        ← roles, workflow, prompt rules
│   ├── prompts/             ← archived prompts from Chief Architect
│   └── reports/             ← OpenCode technical reports ({task}_{response}.md)
├── scripts/
│   ├── build-wasm.ps1       ← Wasm build script (Windows PowerShell)
│   └── build-wasm.sh        ← Wasm build script (Unix / CI)
├── frontend/                ← Next.js presentation + worker orchestration
│   ├── public/
│   │   └── wasm/            ← Wasm artifacts (gitignored, generated)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/           ← Shared TypeScript declarations
│   │   └── workers/
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
└── motor_transmutacion/     ← Rust workspace (Wasm engine)
    ├── Cargo.toml
    ├── core_utils/
    ├── transmutador_jpg/    ← JPEG → PNG
    └── transmutador_png/    ← PNG → JPEG (Phase 3; not yet scaffolded)
```

### 3.1 Layer Responsibilities

| Layer | Path | Responsibility |
|-------|------|----------------|
| Presentation | `frontend/src/app`, `components/` | UX, dropzone, download trigger, status display |
| Orchestration | `frontend/src/hooks/` | Worker lifecycle, message dispatch, state |
| Concurrency | `frontend/src/workers/` | Load Wasm, transfer bytes, return results |
| Shared logic | `motor_transmutacion/core_utils/` | Error types, validation, shared helpers |
| Transmutators | `motor_transmutacion/transmutador_*/` | Format-specific encode/decode + Wasm export |

**Rule:** Transmutator crates MUST NOT depend on each other. Shared code goes in `core_utils`.

---

## 4. Technology Stack (Locked)

| Concern | Choice | Notes |
|---------|--------|-------|
| UI framework | Next.js (App Router) | `src/app` layout |
| Language (UI) | TypeScript | `strict: true` |
| Styling | Tailwind CSS | v4 acceptable |
| Engine | Rust 2021 workspace | `motor_transmutacion/` |
| Wasm bridge | `wasm-bindgen` + `wasm-pack` | Target `web` |
| Image processing | `image` crate | Per transmutator |
| Concurrency | Web Workers API | Required before MVP |

**Do not substitute** stack elements without Chief Architect amendment to SPEC.

---

## 5. Module Specifications

### 5.1 `core_utils`

**Purpose:** Shared error handling and byte-level utilities.

**Status:** Implemented (Phase 1).

**Capabilities:**

- `TransmutationError` enum with variants: `EmptyInput`, `InputTooLarge { size, max }`, `ConversionFailed(String)`
- `Display` implementation for `String` conversion at Wasm boundary
- `validate_input(bytes: &[u8]) -> Result<(), String>` — rejects empty input and inputs exceeding `MAX_INPUT_BYTES`
- `MAX_INPUT_BYTES`: configurable constant, default **50 MB** (chosen as a reasonable upper bound for browser-local processing without risking main-thread memory pressure)

**Tests:** 4 unit tests covering empty input rejection, valid input acceptance, oversized input rejection, and error display formatting.

### 5.2 `transmutador_jpg`

**Purpose:** JPEG → PNG conversion.

**Crate type:** `["cdylib", "rlib"]`

**Dependencies:** `wasm-bindgen`, `image`, `core_utils` (Phase 1+)

**Public Wasm API:**

```rust
#[wasm_bindgen]
pub fn transmutar_jpg_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String>
```

**Behavior (target):**

1. Validate non-empty input
2. Decode JPEG via `image`
3. Encode PNG to bytes
4. Return PNG bytes or descriptive `String` error

**Current state:** Fully implemented (Phase 2). `transmutar_jpg_a_png_inner` runs `core_utils::validate_input` then `jpg_bytes_to_png_bytes` (decode via `image::ImageReader`, encode PNG). Errors return descriptive English `String` messages at the Wasm boundary.

### 5.3 `transmutador_png`

**Purpose:** PNG → JPEG conversion.

**Status:** Planned — Phase 3 (see ROADMAP).

**Public Wasm API (contract, not yet implemented):**

```rust
#[wasm_bindgen]
pub fn transmutar_png_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String>
```

**Default JPEG quality:** `85` (constant in crate; expose as parameter post-MVP).

---

## 6. Frontend Specifications

### 6.1 Dropzone (Implemented — Phase 2)

- **Input:** Drag-and-drop and click-to-select
- **Format filter:** `.jpg`, `.jpeg` only (PNG input deferred to Phase 3)
- **States:**
  - `idle` — Dropzone accepts interactions
  - `processing` — Spinner with file name; repeated drops disabled
  - `success` — Auto-triggers browser download (`Blob` + `<a download>`) as `.png`
  - `error` — User-visible error message rendered in the UI (not console-only)
- Non-JPEG files produce visible rejection message: `"Only .jpg and .jpeg files are supported"`
- Download filename derived from source: `photo.jpg` → `photo.png`

### 6.2 Web Worker Protocol (Implemented — Phase 1)

Implemented in `frontend/src/workers/`:

| File | Purpose |
|------|---------|
| `types.ts` | `WorkerRequest`, `WorkerResponse`, `TransmutationModule` type definitions |
| `transmutation.worker.ts` | Loads Wasm via dynamic `import()`, handles `postMessage` dispatch, returns structured `WorkerResponse` |

Message shape (TypeScript):

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

- Uses `Transferable` objects for `ArrayBuffer` on success responses
- Worker does NOT import React or Next.js server APIs
- Wasm module loaded via `import(/* webpackIgnore: true */ "/wasm/...")` to bypass bundler
- `transmutador_png` requests return `"Module not yet available"`
- Requests for `transmutador_jpg` **await** Wasm initialization (`ensureWasmInitialized`) before invoking the transmute function, avoiding spurious race errors

### 6.3 Wasm Artifact Layout (Implemented — Phase 1)

```
frontend/public/wasm/
└── transmutador_jpg/
    ├── transmutador_jpg.js        ← JS glue (ES module)
    ├── transmutador_jpg_bg.wasm   ← Wasm binary
    ├── transmutador_jpg.d.ts      ← TypeScript declarations
    └── transmutador_jpg_bg.wasm.d.ts
```

Generated by `wasm-pack build --target web`. The `public/wasm/` directory is gitignored; developers must run `scripts/build-wasm.ps1`, `scripts/build-wasm.sh`, or `npm run build:wasm` to regenerate.

---

## 7. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Privacy | Zero network transmission of file bytes |
| NFR-2 | UI responsiveness | Main thread free during conversion; 60fps UI goal |
| NFR-3 | Build reproducibility | Documented commands; CI-ready scripts (future) |
| NFR-4 | Error clarity | User-facing errors in plain English |
| NFR-5 | Modularity | New format = new crate + Wasm export + worker route |
| NFR-6 | Code language | Source code and docs in **English** |

---

## 8. Build & Verification Commands

| Scope | Command | Must pass |
|-------|---------|-----------|
| Rust workspace | `cargo check --workspace` (in `motor_transmutacion/`) | Before every report |
| Rust tests | `cargo test --workspace` (in `motor_transmutacion/`) | When tests exist |
| Wasm build | `wasm-pack build --target web` for each transmutator crate | Before frontend build if Wasm API changed |
| Frontend build | `npm run build` (in `/frontend`) | Before every report |

Warnings should be resolved or explicitly documented in OpenCode report.

---

## 9. SPEC Amendment Protocol

When OpenCode completes a task that changes architecture, APIs, paths, or behavior:

1. Update the relevant SPEC section(s)
2. Bump **Last updated** date
3. Increment SPEC **Version** if API or structure changed (`PATCH` for docs/clarifications, `MINOR` for new modules/APIs)
4. Add entry to **Amendment Log** below
5. Reference the OpenCode report filename in the log entry

Chief Architect validates SPEC diff during second-pass review.

---

## 10. Amendment Log

| Version | Date | Author | Summary | Report ref |
|---------|------|--------|---------|------------|
| 0.3.0-patch | 2026-06-02 | Chief Architect | `transmutar_jpg_a_png_inner` + empty-input test; UI `ready` guard | — |
| 0.3.0 | 2026-06-02 | OpenCode | Phase 2: Real JPEG→PNG + tests + UI wired with states + auto-download | `phase2_jpg_to_png_done.md` |
| 0.2.0-patch | 2026-06-02 | Chief Architect | Worker init race fix; hook `ready` state; Unix build script | — |
| 0.2.0 | 2026-06-02 | OpenCode | Phase 1: Wasm pipeline + Worker bridge + core_utils implementation | `phase1_wasm_pipeline_done.md` |
| 0.1.0 | 2026-06-02 | Chief Architect | Initial SPEC from v0.1.0 bootstrap | — |
