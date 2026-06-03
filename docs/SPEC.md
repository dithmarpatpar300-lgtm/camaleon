# Camaleon — System Specification (SPEC)

> **Authoritative source of truth** for architecture, structure, and functional / non-functional requirements.
>
> - **Chief Architect (Cursor)** owns this document.
> - **OpenCode** must read SPEC before every task and **update SPEC** at task completion to reflect any architectural or behavioral change introduced.
> - If code and SPEC disagree, **SPEC wins** until a deliberate amendment is recorded.

**Version:** 0.1.0  
**Last updated:** 2026-06-02  
**Status:** Active — Foundation phase

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
├── frontend/                ← Next.js presentation + worker orchestration
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
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

**Current state:** Stub (`v0.1.0`).

**Target capabilities (Phase 1):**

- Common error enum convertible to `String` for Wasm boundary
- Helpers: empty-input check, max-size guard (configurable constant)
- No format-specific decode logic

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

**Current state:** Stub returns `Err("Not yet implemented")`.

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

### 6.1 Dropzone (Functional)

- Accept drag-and-drop and click-to-select
- **Phase 0 (current):** filter `.jpg`, `.jpeg` only
- **MVP target:** auto-detect `.jpg`/`.jpeg`/`.png` and route to correct module
- Reject unsupported types with user-visible message (not console-only)

### 6.2 Web Worker Protocol (Target — Phase 1)

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

- Use `Transferable` objects for `ArrayBuffer` where possible
- Worker MUST NOT import React or Next.js server APIs

### 6.3 Wasm Artifact Layout (Target — Phase 1)

```
frontend/public/wasm/
├── transmutador_jpg/
│   ├── transmutador_jpg_bg.wasm
│   └── transmutador_jpg.js
└── transmutador_png/
    ├── transmutador_png_bg.wasm
    └── transmutador_png.js
```

Exact paths may be amended here before implementation; OpenCode must not invent undocumented paths.

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
| Rust workspace | `cargo check --workspace` | Before every report |
| Rust tests | `cargo test --workspace` | When tests exist |
| Frontend types | `npm run build` (in `/frontend`) | Before every report |

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
| 0.1.0 | 2026-06-02 | Chief Architect | Initial SPEC from v0.1.0 bootstrap | — |
