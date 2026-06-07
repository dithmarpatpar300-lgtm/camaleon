# Metrics Engine + Real-Time Size Estimation

> **Author:** Chief Architect (Cursor)  
> **Date:** 2026-06-06  
> **Status:** Planned — ready for OpenCode execution  
> **Target release:** Frontend **v1.3.0** (engine stays **v1.1.0** — no Wasm changes)

---

## 1. Context & Trigger

Review of v1.2.0 surfaced three issues. **Two were trivial/visible and have been pre-fixed by the Architect** (see §2). The third — a real-time size estimation engine — is a genuine new feature and is the subject of the OpenCode prompt.

| # | Problem | Disposition |
|---|---------|-------------|
| 1 | TransparencyNotice color chip breaks text baseline | **Architect pre-fix** (committed) |
| 2A | Result view shows `0 B → 18.3 KB (+0%)` (original size lost) | **Architect pre-fix** (committed) |
| 2B | No pre-transmutation size estimation | **OpenCode — this plan** |
| 3 | Command Palette format chips overflow on `WEBP` | **Architect pre-fix** (committed) |

---

## 2. Architect Pre-Fixes (already committed)

### Problem 1 — Inline-flex baseline (TransparencyNotice)
Root cause: the `ColorDisplay` inline-flex wrapper inflated the line box, breaking baseline when wrapping. Fix: isolated wrapper `inline-flex items-center gap-1 align-middle leading-none`, circle reduced `h-3 w-3`. The `leading-none` prevents the swatch from forcing a taller line box — the actual cause of the "salto de altura."

### Problem 2A — Lost original size (the 0 B bug) — ROOT CAUSE
`useTransmutationWorker.transmutate` transfers the `ArrayBuffer` via `postMessage({...}, [bytes])`. Transfer **detaches** (neuters) the buffer; afterwards `staged.bytes.byteLength === 0`. `TransmutationPanel` read `inputSize: staged.bytes.byteLength` **after** the transfer → always 0 → `(+0%)`.

Fix: read `inputSize: staged.file.size` — the `File.size` property is stable and never detached. **This is the canonical source of original size and must be preserved when OpenCode centralizes metrics.**

### Problem 3 — Format chip overflow (CommandPalette)
Root cause: fixed-width chip `h-10 w-14` could not fit `WEBP → PNG`. Fix (Vía A): `w-auto px-2`, `text-[10px] font-bold uppercase tracking-tight`, `rounded-md`, arrow `shrink-0`. Padding-driven width, no overflow.

---

## 3. OpenCode Scope (v1.3.0) — Metrics Engine + Estimation

**Frontend-only.** No Rust/Wasm/Worker-WASM-API changes. Worker **protocol** (TS message shape) is extended for an estimate path.

### 3.1 Centralized metrics module (DRY)

Two layers:

**Layer 1 — Pure functions (`lib/format/metrics.ts`):**
```typescript
export type SizeDelta = {
  originalSize: number;
  finalSize: number;
  deltaPct: number;       // rounded integer
  deltaLabel: string;     // "+520%" / "-77%" / "+0%"
  formatted: string;      // "2.1 MB → 480 KB (-77%)"
};

export function computeSizeDelta(originalSize: number, finalSize: number): SizeDelta;
```
Strict formula (per directive):
```
deltaPct = round((finalSize - originalSize) / originalSize * 100)
```
Guard: if `originalSize <= 0` → `deltaPct = 0` (avoid div-by-zero), but with the 2A fix this should never happen.

**Layer 2 — Custom hook (`hooks/useFileMetrics.ts`):**
Owns reactive metrics state for one panel instance. Local state only — **no Zustand/Context** (metrics are scoped to a single `TransmutationPanel`; global store would be over-engineering and a new dependency, violating project precedent).

```typescript
type UseFileMetricsArgs = {
  file: File | null;
  module: TransmutationModule;
  options: TransmutationOptions;
  ready: boolean;
  estimate: EstimateFn;     // injected from useTransmutationWorker
  debounceMs?: number;      // default 400
};

type FileMetrics = {
  originalSize: number;            // file?.size ?? 0
  estimatedSize: number | null;    // null until first estimate resolves
  estimating: boolean;             // true while a debounced estimate is in flight
  estimateDelta: SizeDelta | null; // computeSizeDelta(originalSize, estimatedSize)
  finalDelta: SizeDelta | null;    // set after the real transmute
  setFinalSize: (bytes: number) => void;
  resetMetrics: () => void;
};

export function useFileMetrics(args: UseFileMetricsArgs): FileMetrics;
```

Responsibilities:
- `originalSize` from `file.size`.
- Debounced estimation: when `options` change while a file is staged, run a silent estimate; expose `estimating` + `estimatedSize`.
- `finalDelta`: after the real transmute resolves, `setFinalSize(outputBytes.byteLength)` → exact delta.
- Cancel stale estimates (ignore out-of-order responses; track latest request id).

### 3.2 Estimation strategy — silent worker pre-calc

Because compression entropy makes math-only estimation impossible, run the **actual** transmutation silently and read output length.

**Worker protocol extension (`workers/types.ts`):**
```typescript
export type WorkerRequest = {
  id: string;
  module: TransmutationModule;
  bytes: ArrayBuffer;
  options?: TransmutationOptions;
  purpose?: "transmute" | "estimate";   // NEW — default "transmute"
};

export type WorkerResponseSuccess = {
  id: string;
  ok: true;
  purpose: "transmute" | "estimate";     // echo back
  outputSize: number;                    // NEW — always present
  bytes?: ArrayBuffer;                    // omitted for "estimate" (perf)
  mime?: string;
  extension?: string;
};
```

**Worker handler:** for `purpose: "estimate"`, run the same WASM call, compute `outputSize = result.byteLength`, and return **only** `outputSize` (do not transfer the output bytes back — avoids copying large buffers for a throwaway preview).

**Critical — buffer lifetime (learned from the 2A bug):**
- The real `transmute` may keep transferring (one-shot, buffer consumed → fine).
- **Estimation must NOT transfer the staged buffer** (it would detach `staged.bytes` and break the subsequent real transmute, AND each estimate needs the bytes again).
- Strategy: estimation reads bytes fresh from the `File` each call: `const buf = await file.arrayBuffer();` then pass `buf` (transferring this throwaway copy is fine). `File.arrayBuffer()` returns a new buffer each call; the `File` is never consumed.

**`useTransmutationWorker` extension:**
```typescript
type EstimateFn = (
  module: TransmutationModule,
  bytes: ArrayBuffer,
  options?: TransmutationOptions
) => Promise<number>;   // resolves outputSize

// returns { transmutate, estimate, ready }
```
`estimate` sends `purpose: "estimate"`, resolves `response.outputSize`. Reuses the same pending-promise map + worker. Add request-cancellation: the hook tracks the latest estimate id and ignores earlier resolutions.

### 3.3 Debounce

`hooks/useDebouncedValue.ts` (or inline in `useFileMetrics`):
- Debounce the `options` object by **400ms**.
- On debounced change AND `file` staged AND `ready`: trigger estimate.
- Set `estimating = true` immediately on raw change (so UI can show a spinner/"calculando…"); clear when the latest estimate resolves.

### 3.4 UI wiring (`TransmutationPanel` + result view)

**Staged view** — below `OptionsControls`, above the Transmute button:
```
Peso original: 15.7 KB
Peso estimado: ~18.3 KB  (+17%)        [estimating → ~… / shimmer]
```
- Use `t("panel.metrics.original")`, `t("panel.metrics.estimated")`.
- `~` prefix signals estimate; show `estimateDelta.deltaLabel`.
- While `estimating`, show a subtle pulse or "~…" placeholder (respect `prefers-reduced-motion`).

**Result view** — replace the current `sizeDelta` string with `finalDelta.formatted` from the metrics module (exact, no `~`).

### 3.5 Files

| File | Action |
|------|--------|
| `lib/format/metrics.ts` | New — `computeSizeDelta` pure fn |
| `hooks/useFileMetrics.ts` | New — reactive metrics + debounced estimate |
| `hooks/useDebouncedValue.ts` | New (optional) — generic debounce |
| `workers/types.ts` | Add `purpose`, `outputSize`, optional `bytes` |
| `workers/transmutation.worker.ts` | Handle `estimate` (return size only, no transfer) |
| `hooks/useTransmutationWorker.ts` | Add `estimate` fn + stale-response handling |
| `components/transmute/TransmutationPanel.tsx` | Use `useFileMetrics`; render estimate + exact delta |
| `lib/i18n/dictionaries/en.ts` + `es.ts` | `panel.metrics.*` keys |
| `frontend/package.json` + `Footer.tsx` | v1.3.0 |
| `docs/SPEC.md` | §7.2 (worker protocol), §7.5, §7.8 |

---

## 4. State Management Decision

**Local state via `useFileMetrics` hook. No Zustand, no Context.**

Rationale:
- Metrics are scoped to a single `TransmutationPanel` mounted per route. No cross-component or cross-route sharing.
- Adding Zustand introduces a dependency the project has deliberately avoided (precedent: toasts, i18n, theme all use Context/local only where shared, local where not).
- Context would only be justified if estimation state needed to be read by Header/Footer — it does not.

If a future multi-file batch queue (Point 3 roadmap) needs shared metrics across many files, revisit with a store then — documented as a future trigger, not now.

---

## 5. Acceptance Criteria (Architect validation)

### Pre-fixes (verify still correct)
- [ ] TransparencyNotice: swatch + "este color" on one baseline, no height jump, wraps cleanly
- [ ] Result view: original size correct (e.g. `15.7 KB → 18.3 KB (+17%)`), never `0 B`
- [ ] Command Palette: `WEBP → PNG` chip has no text overflow; padding-based width

### Estimation engine
- [ ] Changing quality slider updates "Peso estimado: ~XX KB" after ~400ms debounce
- [ ] Changing background swatch re-estimates (png-to-jpg)
- [ ] Changing compression preset/slider re-estimates (jpg-to-png)
- [ ] `estimating` indicator shows during in-flight estimate; clears on resolve
- [ ] Estimate runs in the Web Worker — main thread stays responsive (no jank)
- [ ] Estimating does NOT break the subsequent real transmute (buffer not detached)
- [ ] Out-of-order estimates: only the latest result is shown (rapid slider drags)
- [ ] Exact delta after transmute matches the strict formula
- [ ] `computeSizeDelta` is the single source for both estimate and final delta (DRY)

### General
- [ ] No Wasm/engine changes
- [ ] All new strings EN + ES
- [ ] `npm run build` passes; no type errors

---

## 6. Performance Notes / Tradeoffs (document in report)

- Estimation = a full silent transmute. For 50 MB inputs each debounced estimate is as costly as a real conversion. Mitigation: 400ms debounce + Web Worker isolation + cancel stale requests. Acceptable for MVP image sizes; revisit if large-file UX suffers.
- Returning only `outputSize` (not bytes) for estimates avoids copying large output buffers back across the worker boundary.
- Reading `file.arrayBuffer()` per estimate re-copies the input; for very large files consider caching one detached-safe copy. Document, do not pre-optimize.

---

## 7. What Comes After

| Track | Contents |
|-------|----------|
| Command Palette search + arrow-key nav | UI-8 |
| Engine v1.1.0 | Playwright E2E, `refine_jpeg_encoder_swap` |
| Point 3 — Features | WebP crate, batch queue (would justify a shared metrics store) |
