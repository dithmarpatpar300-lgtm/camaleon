SYSTEM DIRECTIVE: Act as a Senior Full-Stack Engineer for the Camaleon project (Next.js frontend + Rust/Wasm engine).
Read `docs/SPEC.md` (**§7.2**, **§7.5**, **§8** NFRs), `docs/planning/resource_tuning_adaptive_plan.md` (full architecture), and `docs/ROADMAP.md` before any action.
All source code, comments, and the technical report must be strictly in English.
Do not substitute the technology stack. Do not add new npm dependencies (no Zustand). Do not modify `docs/ROADMAP.md`.

> **PREREQUISITE:** v1.3.0 present (`computeSizeDelta`, `useFileMetrics`, worker `purpose: "estimate"`). **Do not revert buffer-safety fixes** (`file.size` canonical, never estimate via `staged.bytes`). Confirm `npm run build` passes before starting.

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/planning/resource_tuning_adaptive_plan.md` §4–§5 fully.
2. Adaptation is **situational** (score from hardware + network + file + visibility) — **never** branch on User-Agent, `pointer: coarse` alone, or a manual “mobile mode”.
3. v1.3.0 stale-ignore is **UI-only**; Phase A adds **Worker coalescing** so superseded estimates never enter Wasm.
4. Phase B + C use a **dual estimate strategy**: cache-enabled profiles run full encode and store bytes; cache-disabled profiles use CountingWriter (size only).
5. **`computeSizeDelta` stays the single delta formatter** — no duplicate percent math.
6. Execute **Phase A → Phase B → Phase C** in order; do not skip gates.

Document key decisions in the report.

---

TASK ID: `resource_tuning_engine`
PHASE: Frontend v1.5.0 + Engine v1.2.0 — adaptive resource tuning (Phases A + B + C)
OBJECTIVE: Deliver situational adaptive scheduling, Wasm size-only estimate path, and result cache so all environments (mobile, laptop, desktop) get optimal CPU/RAM tradeoffs without sacrificing output accuracy.

---

## PHASE A — Adaptive Scheduling (TypeScript only)

### A1 — `lib/device/resource-profile.ts`

Pure, testable module (no React):

```typescript
export type ResourceTier = "high" | "mid" | "low";

export type ResourceProfile = {
  score: number;                    // 0–100
  tier: ResourceTier;
  debounceMs: number;
  autoEstimate: boolean;
  maxAutoEstimateBytes: number;
  enableResultCache: boolean;
  cacheMaxOutputBytes: number;
};

export type ResourceSignals = {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  effectiveType?: string;
  saveData?: boolean;
};

export function computeResourceProfile(
  fileSize: number,
  signals: ResourceSignals
): ResourceProfile;
```

Implement scoring per plan §5.2. Defaults when signals missing: score 50 → mid tier.

### A2 — `hooks/useAdaptiveResourceProfile.ts`

- Hydrates `ResourceSignals` from `navigator` on mount.
- Listens: `connection` `change`, `visibilitychange`.
- Returns `ResourceProfile` recomputed when `fileSize` or signals change.
- SSR-safe: mid defaults until client effect.

### A3 — Worker estimate coalescing (`transmutation.worker.ts`)

- At most **one** estimate Wasm execution in flight.
- New estimate replaces pending slot; superseded request ids respond `{ ok: false, error: "superseded" }`.
- **`purpose: "transmute"` preempts** running/pending estimate immediately.
- Serialize Wasm calls (no parallel encode).

### A4 — `useTransmutationWorker`

- `estimate()` ignores/rejects `superseded` without orphan promises.
- `transmutate()` accepts optional `fingerprint` (Phase C).

### A5 — `useFileMetrics` enhancements

- Accept `profile: ResourceProfile` from `useAdaptiveResourceProfile`.
- `debounceMs` from profile.
- Visibility pause: no schedule when `document.hidden`.
- Estimate input cache: one `ArrayBuffer` per file identity (not `staged.bytes`).
- `requestEstimate()` for manual mode when `!profile.autoEstimate`.
- Slider settle: export `requestEstimate` for `pointerup`/`change` from panel.
- Clear state on file change (keep existing invalidate).

### A6 — `TransmutationPanel`

- Extract `StagedMetricsSection` (or equivalent) so metrics hooks run only when `status === "staged"` && `hasOptions` (Rules of Hooks).
- Wire `useAdaptiveResourceProfile(staged?.file.size ?? 0)`.
- Manual button + `largeFileHint` when `!autoEstimate`.
- Pass `requestEstimate` to slider `onValueCommit` if available.

### A7 — i18n (EN + ES)

```typescript
panel.metrics.calculate: "Calculate estimate" / "Calcular estimación"
panel.metrics.largeFileHint: "Large file — tap to calculate estimated size."
  / "Archivo grande — toca para calcular el peso estimado."
panel.metrics.cacheReady: "Ready to transmute" / "Listo para transmutar"
```

Keep existing `original`, `estimated`, `calculating`.

**Phase A gate:** `npm run build` passes; coalescing + visibility + profile debounce verified.

---

## PHASE B — Wasm Size-Only Estimate (Engine v1.2.0)

### B1 — `motor_transmutacion/core_utils/src/counting_writer.rs`

```rust
pub struct CountingWriter { pub bytes_written: u64 }
impl Write for CountingWriter { /* count, discard payload */ }
```

Export in `core_utils`; add unit test.

### B2 — Estimate exports (both crates)

PNG module — add alongside existing exports:

```rust
#[wasm_bindgen]
pub fn estimate_png_to_jpg_size(input_bytes: &[u8], quality: u8, bg_r: u8, bg_g: u8, bg_b: u8) -> Result<u32, String>
```

JPG module:

```rust
#[wasm_bindgen]
pub fn estimate_jpg_to_png_size(input_bytes: &[u8], compression: u8) -> Result<u32, String>
```

Use same decode/flatten/encode pipeline as full transmute; sink = `CountingWriter` instead of `Vec<u8>`. Run `validate_input`; skip `validate_output` on empty buffer (or validate format via minimal header check — document choice).

### B3 — Worker routing

When `purpose === "estimate"` AND cache disabled (profile passed from main or worker policy flag):

- Call `estimate_*_size` exports → return `{ outputSize }`.

Rebuild Wasm: `npm run build:wasm` (or project scripts). Update `.d.ts` if generated.

### B4 — Tests

`cargo test --workspace`: size estimate matches full transmute `byteLength` for representative fixtures (opaque PNG, alpha PNG, JPG photo).

**Phase B gate:** `cargo test --workspace` + `npm run build` pass; size parity tests green.

---

## PHASE C — Result Cache (TypeScript + Worker)

### C1 — `workers/result-cache.ts`

```typescript
export type CacheEntry = {
  fingerprint: string;
  bytes: ArrayBuffer;
  outputSize: number;
  mime: string;
  extension: string;
  createdAt: number;
};

export function buildFingerprint(
  module: string,
  fileIdentity: string,
  options: TransmutationOptions
): string;

export class ResultCache {
  get(fingerprint: string): CacheEntry | null;
  set(entry: CacheEntry, maxBytes: number): void;
  clear(): void;
}
```

`fileIdentity`: `${file.size}:${file.lastModified}:${file.name}` passed from main thread.

### C2 — Dual estimate strategy (Worker)

On `purpose === "estimate"`:

| Condition | Path |
|-----------|------|
| `enableResultCache && output fits cacheMaxOutputBytes` | Full encode → store in `ResultCache` → return `{ outputSize }` only (no bytes transfer) |
| Otherwise | `estimate_*_size` (Phase B) → return `{ outputSize }` |

Pass `enableResultCache` + `cacheMaxOutputBytes` + `fingerprint` on `WorkerRequest` (extend types).

### C3 — Transmute fast path

On `purpose === "transmute"`:

- If `fingerprint` matches cache → `postMessage` with cached bytes (transfer).
- Else → full encode; optionally populate cache if policy allows.

### C4 — Invalidation

Clear cache on: new fingerprint, `resetMetrics`, `pagehide` listener in worker or main, TTL > 60s, output > tier budget.

### C5 — Hook + UI

- `useFileMetrics` exposes `cacheWarm: boolean` when last estimate populated cache.
- Estimated row: show `~` only when `!cacheWarm`; when warm show exact size + optional `cacheReady` hint.
- Transmute button: brief “instant” feedback on cache hit (no spinner).

### C6 — Version & SPEC

- Frontend **v1.5.0** (`package.json`, `Footer.tsx`).
- Engine **v1.2.0** (`motor_transmutacion/Cargo.toml` workspace version if tracked; document in report).
- Update `docs/SPEC.md`:
  - **§7.2:** coalescing, dual estimate, cache, transmute preemption.
  - **§7.5:** `lib/device/*`, `workers/result-cache.ts`.
  - **§7.8:** Adaptive resource tuning row.
  - **§8:** Note on adaptive NFR (responsive + memory-aware).
- Amendment Log → `resource_tuning_engine_done.md`.

**Phase C gate:** cache hit/miss scenarios verified; bit-identical output test documented.

---

REQUIREMENTS SUMMARY

| ID | Requirement |
|----|-------------|
| R1 | Situational `computeResourceProfile` — no device-type branching |
| R2 | Worker coalescing + transmute preemption |
| R3 | Visibility pause + adaptive debounce |
| R4 | Manual estimate for oversized files (all environments) |
| R5 | CountingWriter + estimate Wasm exports |
| R6 | Dual estimate + single-entry result cache |
| R7 | `computeSizeDelta` unchanged (DRY) |
| R8 | Buffer safety regression clear |
| R9 | `cargo test --workspace` + `npm run build` pass |
| R10 | SPEC + versions + report |

---

CONSTRAINTS

- No Zustand / new npm dependencies.
- Never transfer `staged.bytes` for estimation.
- `File.size` remains canonical original size.
- English for code, comments, report.
- Do not modify `docs/ROADMAP.md`.

---

DELIVERABLES

1. Phase A: `resource-profile.ts`, `useAdaptiveResourceProfile.ts`, worker coalescing, hook/panel wiring, i18n.
2. Phase B: `CountingWriter`, estimate exports, Wasm rebuild, Rust tests.
3. Phase C: `result-cache.ts`, cache integration, UI `cacheWarm`, SPEC v1.5.0.
4. `docs/reports/resource_tuning_engine_done.md` per GOVERNANCE §5.

---

DEFERRALS (document in report §6)

- Multi-entry cache (batch queue)
- `navigator.getBattery()` integration
- Playwright perf budgets per tier
- Client Hints `Sec-CH-Device-Memory` server path (no server today)

---

EXIT GATE (self-check before report)

- [ ] Profile scoring works for high/mid/low without UA sniffing
- [ ] Desktop 4 GB laptop gets conservative tier (not desktop-default)
- [ ] iPhone Safari (no deviceMemory) gets safe mid defaults
- [ ] Coalescing + visibility + manual large-file path
- [ ] CountingWriter size === full transmute size (tests)
- [ ] Cache hit: one encode on estimate+transmute; cache miss: correct output
- [ ] `computeSizeDelta` sole formatter; buffer safety intact
- [ ] `cargo test --workspace` + `npm run build`; v1.5.0 + engine v1.2.0

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
