SYSTEM DIRECTIVE: Act as a Senior Frontend Engineer for the Camaleon project.
Read `docs/SPEC.md` (**§7.1–§7.8**, **§8** NFRs), `docs/planning/metrics_estimation_plan.md` (full architecture), and `docs/ROADMAP.md` before any action.
All source code, comments, and the technical report must be strictly in English.
Do not substitute the technology stack (Next.js App Router + TypeScript + Tailwind v4). Do not add new npm dependencies (no Zustand). Do not modify `docs/ROADMAP.md`.

> **PREREQUISITE:** v1.2.0 present. The Architect has pre-fixed three issues (TransparencyNotice baseline, the `0 B` original-size bug via `file.size`, Command Palette chip overflow). **Do not revert those.** This task builds the centralized metrics module + real-time estimation on top. Confirm `npm run build` passes before starting. **No Rust/Wasm changes.**

---

COGNITIVE DIRECTIVE — THINK BEFORE ACTING

Before writing or modifying any file:

1. Read `docs/planning/metrics_estimation_plan.md` §3–§4 fully. The architecture is final.
2. Understand the **2A root cause**: `useTransmutationWorker.transmutate` transfers the `ArrayBuffer` (`postMessage(..., [bytes])`), which DETACHES it. Any read of `byteLength` after transfer is `0`. Original size MUST come from `File.size`.
3. Therefore estimation must NEVER transfer the staged buffer. Read bytes fresh via `await file.arrayBuffer()` for each estimate (the `File` is not consumed).
4. Plan stale-response cancellation: rapid slider drags fire many estimates; only the latest must update the UI.
5. State management: local hook state only. No Zustand, no Context (single-panel scope — see plan §4).

Do not skip this reasoning phase. Document key decisions in the report.

---

TASK ID: `metrics_estimation_engine`
PHASE: Frontend v1.3.0 — centralized file-metrics module + real-time size estimation
OBJECTIVE: Deliver a DRY metrics engine (`computeSizeDelta` + `useFileMetrics`) shared by both conversion directions, plus a debounced, Web-Worker-based "Peso estimado" preview that reacts to quality/compression/background changes.

---

REQUIREMENTS

### R1 — Pure metrics function (`lib/format/metrics.ts`)

```typescript
import { formatBytes } from "./bytes";

export type SizeDelta = {
  originalSize: number;
  finalSize: number;
  deltaPct: number;
  deltaLabel: string;   // "+17%" / "-77%" / "+0%"
  formatted: string;    // "15.7 KB → 18.3 KB (+17%)"
};

export function computeSizeDelta(originalSize: number, finalSize: number): SizeDelta {
  const deltaPct =
    originalSize > 0
      ? Math.round(((finalSize - originalSize) / originalSize) * 100)
      : 0;
  const sign = deltaPct >= 0 ? "+" : "";
  const deltaLabel = `${sign}${deltaPct}%`;
  return {
    originalSize,
    finalSize,
    deltaPct,
    deltaLabel,
    formatted: `${formatBytes(originalSize)} → ${formatBytes(finalSize)} (${deltaLabel})`,
  };
}
```

This is the **single** delta source for both the estimate preview and the final result. No inline percentage math anywhere else.

### R2 — Worker protocol: estimate path

`workers/types.ts`:
```typescript
export type WorkerPurpose = "transmute" | "estimate";

export type WorkerRequest = {
  id: string;
  module: TransmutationModule;
  bytes: ArrayBuffer;
  options?: TransmutationOptions;
  purpose?: WorkerPurpose;   // default "transmute"
};

export type WorkerResponseSuccess = {
  id: string;
  ok: true;
  purpose: WorkerPurpose;
  outputSize: number;        // always present
  bytes?: ArrayBuffer;       // present only for "transmute"
  mime?: string;
  extension?: string;
};
// WorkerResponseError unchanged
```

`workers/transmutation.worker.ts`:
- Compute `result` as today.
- `outputSize = result.byteLength`.
- If `purpose === "estimate"`: return `{ id, ok: true, purpose: "estimate", outputSize }` — **no `bytes`**, post without transfer list.
- If `purpose === "transmute"` (default): return current shape **plus** `purpose: "transmute"` and `outputSize`; keep transferring `bytes`.

### R3 — `useTransmutationWorker`: add `estimate`

```typescript
type EstimateFn = (
  module: TransmutationModule,
  bytes: ArrayBuffer,
  options?: TransmutationOptions
) => Promise<number>;   // resolves outputSize
```
- Reuse the same worker + pending-promise map.
- `estimate` posts `{ id, module, bytes, options, purpose: "estimate" }`. **Transfer `bytes`** here is fine because the caller passes a throwaway fresh buffer from `file.arrayBuffer()` (NOT the staged buffer).
- `transmutate` unchanged (still `purpose` defaults to "transmute"; still transfers).
- Return `{ transmutate, estimate, ready }`.

### R4 — `useFileMetrics` hook (`hooks/useFileMetrics.ts`)

```typescript
type UseFileMetricsArgs = {
  file: File | null;
  module: TransmutationModule;
  options: TransmutationOptions;
  ready: boolean;
  estimate: EstimateFn;
  debounceMs?: number;   // default 400
};

type FileMetrics = {
  originalSize: number;
  estimatedSize: number | null;
  estimating: boolean;
  estimateDelta: SizeDelta | null;
  finalDelta: SizeDelta | null;
  setFinalSize: (bytes: number) => void;
  resetMetrics: () => void;
};

export function useFileMetrics(args: UseFileMetricsArgs): FileMetrics;
```

Behavior:
- `originalSize = file?.size ?? 0`.
- Debounce `options` (and `file` identity) by `debounceMs`. Use a small internal `useDebouncedValue` or inline `setTimeout` cleanup.
- On debounced trigger, if `file && ready`: set `estimating = true`, read `const buf = await file.arrayBuffer()`, call `estimate(module, buf, options)`, then `setEstimatedSize(size)` and `estimating = false`.
- **Stale cancellation:** keep a `latestEstimateId` ref (incrementing counter). Capture the id before awaiting; on resolve, ignore if a newer estimate has started.
- `estimateDelta = estimatedSize != null ? computeSizeDelta(originalSize, estimatedSize) : null`.
- `setFinalSize(bytes)` → `finalDelta = computeSizeDelta(originalSize, bytes)`.
- `resetMetrics()` → clear estimated/final/estimating (called on file change/reset).

### R5 — `TransmutationPanel` wiring

- Replace the inline `sizeDelta` useMemo with `useFileMetrics`.
- Pass `file: staged?.file ?? null`, `module: tool.module`, `options`, `ready`, `estimate`.
- **Staged view** (below `OptionsControls`, above the Transmute button):
  ```
  Peso original:  15.7 KB
  Peso estimado:  ~18.3 KB  (+17%)
  ```
  - `t("panel.metrics.original")`, `t("panel.metrics.estimated")`.
  - Prefix estimate with `~`. Show `estimateDelta.deltaLabel`.
  - While `estimating`: show `~…` or a subtle pulse (use `motion-safe:animate-pulse`; respect reduced motion).
  - Only render the estimate row when the tool has `optionSpecs` (otherwise default output is fixed; still optional to show).
- On successful transmute: call `metrics.setFinalSize(response.bytes.byteLength)` and render `finalDelta.formatted` in the result view (exact, no `~`). Keep `inputSize: staged.file.size` (Architect 2A fix) — or migrate that read fully into the hook via `originalSize`.
- On `handleReset`: call `metrics.resetMetrics()`.

### R6 — i18n (both EN + ES)

```typescript
panel: {
  metrics: {
    original: "Original size",      // ES: "Peso original"
    estimated: "Estimated size",    // ES: "Peso estimado"
    calculating: "Calculating…",    // ES: "Calculando…"
  },
}
```

### R7 — Version & SPEC

Bump frontend to **v1.3.0** (`package.json`, `Footer.tsx`).
Update `docs/SPEC.md`:
- **§7.2:** Worker protocol — document `purpose` + `outputSize` + estimate path (no bytes returned for estimate).
- **§7.5:** Add `lib/format/metrics.ts`, `hooks/useFileMetrics.ts`, `hooks/useDebouncedValue.ts`.
- **§7.8:** Add row for this delivery (size estimation engine).
- Bump SPEC version; Amendment Log → `metrics_estimation_engine_done.md`.

Do not modify `docs/ROADMAP.md`.

### R8 — Verification

| Check | Must pass |
|-------|-----------|
| `npm run build` | Production build succeeds |
| Original size | Result shows real input size, never `0 B` |
| Estimate reacts | Quality / compression / background change → updates `~XX KB` after ~400ms |
| Worker isolation | Estimating does not block main thread |
| Buffer safety | After several estimates, the real Transmute still succeeds (buffer not detached) |
| Stale handling | Rapid slider drag → only latest estimate shown |
| DRY | Both estimate and final delta use `computeSizeDelta` |
| Exact final | Final delta matches strict formula |

---

CONSTRAINTS

- **No Rust/Wasm changes.** Worker WASM calls identical; only the TS message protocol + an estimate branch change.
- **No new npm dependencies.** No Zustand. Local hook state only (plan §4).
- **Never transfer the staged buffer for estimation** — read fresh via `file.arrayBuffer()`.
- **`File.size` is the canonical original size** (do not reintroduce the detached-buffer read).
- **NFR-2:** main thread responsive — estimation runs in the worker.
- **NFR-1:** estimation is fully local; no network.
- Tokens only; i18n for every new string (EN + ES).
- English for code/comments/report.

---

DELIVERABLES

1. `lib/format/metrics.ts` — `computeSizeDelta` (R1).
2. Worker protocol + estimate handler (R2).
3. `useTransmutationWorker.estimate` + stale handling (R3).
4. `useFileMetrics` (+ optional `useDebouncedValue`) (R4).
5. `TransmutationPanel` wiring: estimate row + exact final delta (R5).
6. i18n `panel.metrics.*` EN + ES (R6).
7. SPEC §7.2/§7.5/§7.8 + v1.3.0 (R7).
8. `docs/reports/metrics_estimation_engine_done.md` per GOVERNANCE §5.

---

DEFERRALS (document in report §6)

- Large-file (50 MB) estimation throttling / input-buffer caching
- Shared metrics store (only if batch queue lands later)
- Command Palette search (UI-8); Playwright; encoder swap

---

EXIT GATE (self-check before report)

- [ ] `computeSizeDelta` is the single delta source (DRY)
- [ ] Estimate reacts to all reactive options with 400ms debounce, in the worker
- [ ] Real transmute still works after estimates (no detached buffer)
- [ ] Stale estimates ignored; only latest shown
- [ ] Original size always correct; final delta exact
- [ ] `npm run build` passes; SPEC + dictionaries updated; v1.3.0

---

EXECUTION OUTPUT

Do NOT dump raw code in chat.
Submit only the completed technical report file path and a one-paragraph summary.
