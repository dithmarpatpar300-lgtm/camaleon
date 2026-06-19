# Tier 3.6 — Multi-File Batch Transmutation (planning phases 3.6.x)

> **Status:** **3.6.0 shipped** (app **v3.2.3**) · **3.6.1 complete** (v3.2.9 Slice C) · **3.6.2 shipped** (v3.2.9) · **v3.2.9 on `main`**
> **Note:** **3.6.x** = planning phase IDs; app semver: 3.6.0 → v3.2.0–v3.2.3, 3.6.1 → v3.2.4+ (Slice C TBD)  
> **Prerequisite:** Tier 3.5 Universal Transmutator shipped (app **v3.1.x**) — single-file handoff stable  
> **Doctrine:** **Gradual rollout** — never ship full multi-file in one release; extend orchestration without breaking single-file paths  
> **Related:** `tier3_5_universal_transmutator_plan.md`, `docs/LIMIT_PIPELINE.md`, `docs/planning/risk_mode_analysis.md`, `docs/SPEC.md`

---

## 0. Executive summary

**Problem:** Users often have **many images** to convert with the **same settings** (e.g. a folder of PNGs → JPEG for web). Today Camaleon accepts **one file per session** on every route and shows a toast when multiple files are dropped.

**Solution (Tier 3.6):** **Batch transmutation** — drop or browse **N files**, configure **shared options once**, **select subset** (or all), run **sequential** prepare → transmute → download per item. Universal entry gains **cohort partitioning** when formats are mixed.

**Critical constraint:** This is **orchestration only** for early phases — same Wasm crates, same worker serialization, same per-file limit pipeline. Multi-file is a **new state layer** above `TransmutationPanel`, not a engine rewrite.

**Implementation strategy:** Advance **little by little** across 3.6.0 → 3.6.3+. Each phase has a narrow exit gate. Deferred items are explicit, not “missing features we forgot.”

---

## 1. Illustrative examples vs real-world scope

Throughout this document, scenarios like **“4 PNG + 1 SVG”** or **“5 PNG → JPEG”** are **worked examples** to explain algorithms and UX — **not** an exhaustive list of supported combinations.

**General rule:** Any drop of **multiple files** — whether:

- **Same format** (e.g. 12 `.webp`, 3 `.tif`, 8 `.jpg`), or  
- **Mixed formats** (e.g. `.png` + `.jpeg` + `.gif` + `.svg` + `.avif` in one gesture), or  
- **Same extension, wrong tool** (e.g. 5 files on PNG→JPG but one is mislabelled `.png` that is not PNG),

…must be handled by the **same cohort / compatibility / per-item limit** machinery described below. The UI copy may cite PNG/SVG because it is common; the implementation must **never hardcode** those families.

When the registry gains new tools (e.g. HEIC→JPG), batch and universal cohort logic must derive behavior from **`getActiveTools()` + `fileMatchesExtensions`**, same as Tier 3.5.

---

## 2. Product thesis

| Before (3.5.x) | After (3.6.x) |
|----------------|---------------|
| Drop 5 files → “one file at a time” toast | Drop 5 **compatible** files → batch workspace |
| One `staged` / `prepared` / `result` | **Collection** of items with shared options |
| Universal handoff: 1 file | Universal: **cohorts** → batch handoff per cohort |
| One Download click | Per-file download (early) → optional ZIP (later) |

**Not in Tier 3.6 (ever, unless a future tier says so):** server upload, cloud queue, background sync after tab close, recursive folder picker, parallel multi-worker Wasm, new output formats.

---

## 3. Viability assessment

| Question | Answer |
|----------|--------|
| **Technically viable?** | **Yes**, as orchestration over existing prepare/transmute worker. |
| **New Wasm crate required?** | **No** for 3.6.0–3.6.1. |
| **Privacy preserved?** | **Yes** — all files stay in browser; batch handoff in-tab memory (extend `file-handoff` pattern). |
| **Offline compatible?** | **Yes** after shell + tool cached — same as single-file; batch does not add network. |
| **Risk to current UX?** | **High if done in one shot.** Mitigated by **phased delivery** and **single-file path unchanged** when `items.length === 1`. |
| **Primary technical risk** | **RAM** (holding many `ArrayBuffer`s) and **limit semantics** (per-file vs aggregate warnings). |

**Verdict:** Strong product win, but **Tier 3.6 must ship incrementally** — identical philosophy to Tier 3.4 PWA and Tier 3.5 universal.

---

## 4. Gradual implementation doctrine (answers open product questions)

These were raised during planning; **resolution = phased rollout**, not “all at once”:

| Question | Resolution via phases |
|----------|------------------------|
| Tool route batch first vs universal batch first? | **3.6.0:** dedicated `/transmute/[slug]` only. **3.6.1:** universal cohort + batch handoff. |
| N × Download vs ZIP from day one? | **3.6.0–3.6.1:** individual downloads only. **3.6.2:** optional ZIP export. |
| GIF / TIFF / SVG / ICO in batch v1? | **Excluded from 3.6.0** (per-row options / page index / entry index). Added in **3.6.2+** when per-row UX exists. |

**Invariant:** Single-file flow remains the default code path until batch is explicitly activated (`files.length > 1`).

---

## 5. Current architecture (what batch must respect)

### 5.1 Single-file state machine (today)

`TransmutationPanel` owns:

```text
idle → preparing → staged → processing → result | error
```

One `staged`, one `prepared`, one `result`. Options are **global to the panel**.

### 5.2 Worker

- Jobs are **serialized** in `transmutation.worker.ts` (SPEC: coalescing, transmute preempts estimate).
- Batch v1 **must not** parallelize Wasm without a new worker pool design.

### 5.3 Limits (per file — not session sum)

From `limit-context.ts` / `docs/LIMIT_PIPELINE.md`:

| Layer | Normal | Risk ON |
|-------|--------|---------|
| Soft bytes | 50 MB | bypass consent |
| Hard bytes (per file) | 150 / 100 MB | **500 / 250 MB** |
| Megapixels | 40 MP block | bypass + warnings |

**Important correction for batch planning:**  
Risk **500 MB desktop** is a **per-file hard cap**, not a “session total.” Five files of 150 MB each do **not** violate hard cap individually. The real batch constraint is **peak RAM** (decode + `ArrayBuffer` retention), not summing bytes against 500 MB.

### 5.4 Options that are not truly “universal” across files

| Option | Batch share in v1? | Why |
|--------|-------------------|-----|
| JPEG/WebP/AVIF quality, PNG compression | ✅ Shared | Same semantics for all rasters |
| Background flatten (JPG) | ✅ Shared | Same |
| GIF `frameIndex` | ❌ Per file (later) | Different frame counts |
| TIFF `pageIndex` | ❌ Per file (later) | Different page counts |
| ICO `entryIndex` | ❌ Per file (later) | Different entry counts |
| SVG `outputScale` | ❌ Per file (later) | Different output W×H |

**3.6.0 tool allowlist (batch-enabled):** raster routes without frame/page/entry pickers — e.g. PNG↔JPG↔WebP↔AVIF, BMP→PNG/JPG, TGA→PNG, and symmetric decode routes where options are global.

---

## 6. Batch domain model

### 6.1 Three independent dimensions

```text
┌──────────────── BATCH SESSION ────────────────────────────┐
│ 1. COHORT     — which files share one tool route           │
│ 2. SELECTION  — checkbox subset for this run              │
│ 3. OPTIONS    — shared transmutation settings              │
│    PER ITEM   — prepare context, limits, status, output    │
└────────────────────────────────────────────────────────────┘
```

### 6.2 Per-item state

```text
queued → reading → preparing → ready | blocked | error
ready → queued_for_transmute → processing → done | error
```

### 6.3 Batch panel state

```text
batch_idle → batch_loading → batch_staged → batch_running → batch_done
```

### 6.4 Sequential pipeline (v1 — mandatory)

```typescript
// Pseudocode — one prepared context at a time in memory
for (const item of selectedItemsInStableOrder) {
  if (item.status !== "ready") continue;
  await transmutateOne(item);           // existing worker API
  offerDownload(item.output);
  releasePreparedContext(item.prepared);
  item.status = "done";
}
```

**Why sequential:** matches worker design, minimizes mobile OOM, aligns with honest “one peak at a time” messaging.

---

## 7. User scenario A — same tool, multiple files (tool route)

**Example (illustrative):** User drops 5 `.png` on **PNG → JPEG**. Any count and any batch-eligible raster route behaves the same.

### 7.1 Expected UX

1. Drop/browse **multiple** files (same extensions accepted by tool).
2. **Batch workspace** replaces single-file staged view when `count > 1`.
3. **Shared options** panel at top (quality, etc.) — changes apply to **all selected** items on transmute.
4. **File list:** thumbnail stub, name, size, status, checkbox.
5. **Selection:** select all / none / individual rows.
6. **Actions:**
   - **Transmute** — only **checked** items in `ready` state.
   - **Transmute all** — all items in `ready` (ignores unchecked; does not include `blocked` / `error`).
7. **Progress:** global “2 / 5” + current file name while running.
8. **Output:** one download per completed file (3.6.0); ZIP later (3.6.2).

### 7.2 Strict tool contract — homogeneous batch only (dedicated routes)

**Dedicated tool routes** (e.g. `/transmute/png-to-jpg`) and **Universal Transmutator** serve **different contracts**:

| Surface | Multi-format in one drop? | Behaviour |
|---------|---------------------------|-----------|
| **Universal Transmutator** | ✅ Yes (3.6.1+) | Partition into **cohorts**; user picks output per group |
| **Dedicated tool route** | ❌ No | **Homogeneous batch only** — same `tool.acceptExtensions` |

When the user drops **multiple files on a dedicated route**, including files this tool **cannot** accept (e.g. 4 PNG + 1 SVG on **PNG → JPEG**):

1. **Partition at the gate** with `fileMatchesExtensions(file.name, tool.acceptExtensions)`.
2. **Accepted files** (4 PNG) → continue into batch (or single-file if count === 1).
3. **Rejected files** (1 SVG) → **never** enter the batch list, **never** process silently, **never** show as a row that will inevitably fail.
4. Show a **graceful notice** (toast or dismissible banner), e.g.  
   *“`icon.svg` is not PNG — skipped for this transmutator. To convert **mixed formats** in one go, use the **Universal transmutator** on the home page.”*
5. Link / CTA: `/#universal-transmutator` (when anchor exists) or home.

| Drop on png-to-jpg | Result |
|--------------------|--------|
| 5 PNG | Batch 5 |
| 4 PNG + 1 SVG | Notice + batch 4 PNG |
| 4 PNG + 1 JPEG | Notice + batch 4 PNG (JPEG not accepted on this route) |
| Only SVG | No batch; format error + suggest Universal |
| 0 accepted after filter | No batch; message + suggest Universal if mix was the cause |

**Algorithm:**

```typescript
function partitionFilesForTool(files: File[], tool: ToolDefinition) {
  const accepted: File[] = [];
  const rejected: File[] = [];
  for (const file of files) {
    if (fileMatchesExtensions(file.name, tool.acceptExtensions)) accepted.push(file);
    else rejected.push(file);
  }
  return { accepted, rejected };
}
```

**i18n:** `panel.batch.skippedIncompatible` (with `{names}`, `{count}`), `panel.batch.noneCompatible`, `panel.batch.useUniversal`.

**Non-allowlisted tools** (GIF, TIFF, …): multi-drop still shows “batch not supported for this tool” (single file only) — unchanged until later phases.

### 7.3 Rows in non-ready states

| Row status | Checkbox | Transmute all |
|------------|----------|---------------|
| `ready` | Enabled | Included |
| `blocked` (hard limit, pixels) | Disabled, visible | Skipped |
| `error` (prepare failed) | Disabled | Skipped |
| `needs consent` (elevated bytes) | After batch or per-row consent | Skipped until consented |

**Partial batch is allowed** — user can transmute 3/5 without failing the whole drop.

---

## 8. User scenario B — mixed formats (Universal entry)

**Example (illustrative):** 4 PNG + 1 SVG. Real drops may be **any** mix: JPEG+WebP, GIF+PNG+AVIF, three families at once, etc.

### 8.1 Policy: cohort partition — never silent discard

| Approach | Verdict |
|----------|---------|
| Hard error on mixed drop | ❌ Punishes valid files |
| Silently ignore incompatible files | ❌ Opaque (NFR-8 violation) |
| Auto-split and navigate without user choice | ❌ Confusing |
| **Partition → show cohorts → user picks which group to continue** | ✅ Default |

### 8.2 Cohort algorithm (registry-driven)

```typescript
type InputCohort = {
  cohortId: string;
  familyLabel: ImageFormat;              // from first matching tool's fromFormat
  files: File[];
  matchingTools: ToolDefinition[];       // intersection across all files in cohort
};

function buildCohorts(files: File[]): InputCohort[] {
  // 1. Group files by resolved input family (extension → getToolsForFileName)
  // 2. For each group, compute tools common to EVERY file in the group:
  //    commonTools = intersection of getToolsForFileName(file) for file in group
  // 3. Drop empty groups; surface unsupported extensions separately
}

function toolsForBatch(cohort: InputCohort, targetTool: ToolDefinition): boolean {
  return cohort.files.every(f => fileMatchesExtensions(f.name, targetTool.acceptExtensions));
}
```

**Mixed-family UI (Universal):**

```text
┌─ Batch: 5 files in 2 groups ──────────────────────────────┐
│ PNG · 4 files    [Choose output →]  (JPG, WebP, AVIF…)   │
│ SVG · 1 file     [Choose output →]  (PNG, JPG)             │
│                                                          │
│ ⓘ Each group converts separately. Pick one to continue.  │
│   Other groups stay here until you process or remove them. │
└──────────────────────────────────────────────────────────┘
```

User picks **PNG → JPEG** for cohort A:

- Stage **batch handoff** with **4 PNG only**.
- Navigate `/transmute/png-to-jpg?batch=<uuid>` (or extend `handoff` param — see §10).
- Cohort B (SVG) **remains** on universal UI — not lost, not auto-processed.

### 8.3 Same extension, different real format

Mislabelled files: row-level `error` at prepare; other rows unaffected.

### 8.4 N families, N cohorts

One UI section per cohort; order stable (e.g. by family name, then count). No limit on cohort count beyond **batch file cap** (§9).

---

## 9. Limits, Risk mode, and aggregate memory

### 9.1 Per-file limits (unchanged)

Each item runs `computeLimitContext({ fileSize, sourceMeta, riskModeEnabled, … })` independently.

### 9.2 New batch-level policies

| Policy | Purpose | v1 default |
|--------|---------|------------|
| `maxFilesPerBatch` | UX + handoff size | 50 desktop / 20 mobile |
| `maxConcurrentPrepared` | RAM | **1** (sequential) |
| `aggregateByteWarningThreshold` | Honest copy | e.g. warn when `sum(selected.size) > 200 MB` on mobile |
| `batchElevatedConsent` | UX | Single panel: “N files need elevated-size confirmation” |

### 9.3 Risk mode + batch (illustrative)

User drops 5 × 150 MB PNG with Risk ON:

- Each file **≤ 500 MB** hard cap → **not** hard-blocked individually.
- UI warns: **“~750 MB total; processing one file at a time; peak ~150–200 MB per step.”**
- **Do not** invent a 500 MB **session sum** limit without SPEC amendment.

### 9.4 Astro / 40 MP in batch

Row-level block + per-row resize path (future) or skip in 3.6.0 allowlist. One huge TIFF must not block five small PNGs in the same batch.

---

## 10. Handoff architecture (batch extension)

Extend `file-handoff.ts` (or `batch-handoff.ts`):

```typescript
type BatchHandoffItem = {
  fileName: string;
  bytes: ArrayBuffer;
  lastModified: number;
};

type BatchHandoffPayload = {
  toolSlug: string;           // implied by route, redundant guard
  items: BatchHandoffItem[];
};

async function stageBatchHandoffFromFiles(files: File[]): Promise<string>;
function consumeBatchHandoff(id: string): BatchHandoffPayload | null;
```

- Same TTL, same-tab, single-use consume as Tier 3.5.
- **Size guard:** reject staging if total bytes or count exceeds cap before navigation.
- URL: `/transmute/png-to-jpg?batch=<uuid>` (distinct from single `handoff=` for clarity).

Single-file handoff **unchanged** for backward compatibility.

---

## 11. UI/UX specification (batch workspace)

### 11.1 Layout (when `items.length > 1`)

```text
┌─ Batch toolbar ───────────────────────────────────────────┐
│ N files · M selected · [tool title]                        │
│ [Select all] [Select none]   [Transmute M] [Transmute all] │
└────────────────────────────────────────────────────────────┘
┌─ Shared options (sticky) ───────────────────────────────────┐
│  Same controls as today's StagedWorkspace                   │
└────────────────────────────────────────────────────────────┘
┌─ File list (scroll) ──────────────────────────────────────┐
│ ☑  photo1.png    2.1 MB   Ready                             │
│ ☑  photo2.png   18 MB    Ready · elevated                   │
│ ☐  huge.png    180 MB    Blocked — over limit                 │
│ ☑  a.png         4 MB    Ready                              │
└────────────────────────────────────────────────────────────┘
┌─ Batch progress (visible while batch_running) ──────────────┤
│ ████████░░  2 / 3 · Processing photo2.png…                  │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Single-file regression

When `items.length === 1`, render **existing** `StagedWorkspace` / flow — no batch chrome.

### 11.3 i18n keys (prefix)

`panel.batch.*`, `landing.universal.batch.*` — EN/ES required per phase that ships UI.

---

## 12. Edge cases & QA matrix

| Case | Expected |
|------|----------|
| Drop 1 file on tool route | Unchanged single-file UX |
| Drop 5 same-format rasters on PNG→JPG | Batch workspace; 5 prepares |
| Drop 4 PNG + 1 SVG on png-to-jpg | Grace notice + batch 4 PNG only (§7.2) |
| Select 3 of 5 → Transmute | Exactly 3 transmute + download |
| Transmute all with 2 blocked | Only 3 `ready` run; blocked rows explained |
| Mixed PNG+SVG on universal | 2 cohort cards; no auto-navigation |
| Mixed PNG+JPEG on universal | 2 cohorts (different families) |
| 4 PNG + 1 `.heic` | Supported cohort + unsupported bucket with message |
| Duplicate filenames | Output names dedupe: `name (2).jpg` |
| 0 selected → Transmute | Toast: select at least one |
| Cancel mid-batch | Stop queue; keep completed downloads |
| Add files after staged | Prepare new rows only |
| Remove row mid-staged | `releasePreparedContext` for that item |
| Offline + batch | Works if tool route cached; same as single-file |
| Risk + elevated batch | One consent for all elevated rows (3.6.1 polish) |
| Handoff TTL expired | Idle + toast; same as 3.5 |
| Worker error on item 3 of 5 | Item 3 `error`; continue 4–5 if user retries |
| Registry adds new tool | Cohort outputs update via matrix — no code change |

---

## 13. Version plan (Tier 3.6 phases vs app semver)

| Phase | App tag (TBD) | Deliverable | Exit gate |
|-------|---------------|-------------|-----------|
| **3.6.0** | **v3.2.3** ✅ | Multi-drop on **tool routes** only; batch workspace; shared options; select / Transmute / Transmute all; **sequential** transmute; **per-file download**; raster allowlist; batch UX polish + cache redownload | 5 PNG on png-to-jpg → select 3 → 3 downloads |
| **3.6.1** | **v3.2.9** ✅ | **Slice C:** cohort picker UI + session store. **Slices A+B:** v3.2.4 | Mixed drop → cohort cards → per-group handoff |
| **3.6.2** | **v3.2.9** ✅ | ZIP export via Settings pref; GIF/TIFF/ICO per-row pickers | ZIP 5 files; TIFF batch with page picker per row |
| **3.6.2** | v3.2.x (TBD) | ZIP export of batch results; begin GIF/TIFF/ICO **per-row** options | ZIP 5 files; TIFF batch with page picker per row |
| **3.6.3** | v3.2.x (TBD) | SVG batch; aggregate RAM warnings; mobile batch caps; Risk copy polish | 5× large files sequential on mobile without tab kill |
| **3.6.4+** | v3.2.x | Optional: drag-reorder, retry failed only, IndexedDB handoff | Product-led |

**SPEC / ROADMAP:** Add Tier 3.6 row — “Multi-file batch orchestration.”

---

## 14. New code map (by phase)

### 14.1 Phase 3.6.0

| File | Action |
|------|--------|
| `lib/batch/batch-types.ts` | `BatchItem`, `BatchSession`, status enums |
| `lib/batch/batch-limits.ts` | `maxFilesPerBatch`, aggregate warnings |
| `lib/batch/batch-prepare-queue.ts` | Sequential prepare + release |
| `lib/batch/batch-tool-allowlist.ts` | Which slugs enable multi-drop |
| `lib/batch/partition-for-tool.ts` | `partitionFilesForTool` + strict gate |
| `lib/batch/batch-handoff.ts` | Stage/consume batch payload |
| `lib/batch/*.test.ts` | Cohort + limit unit tests |
| `components/transmute/BatchWorkspace.tsx` | Toolbar + list + progress |
| `components/transmute/BatchFileRow.tsx` | Row UI |
| `components/transmute/TransmutationPanel.tsx` | Branch: 1 vs N files |
| `lib/i18n/dictionaries/en.ts`, `es.ts` | `panel.batch.*` |
| `docs/releases/v3.2.0.md` | Release notes |

### 14.2 Phase 3.6.1

**3.6.1 is split into implementation slices** (not separate tier phases):

| Slice | Scope | Status | App version |
|-------|--------|--------|-------------|
| **A** | `buildCohorts`, `batch-handoff` (`?batch=`), `TransmutationPanel` batch consumer, `universal-matrix` cohort types | ✅ Shipped | **v3.2.4** |
| **B** | Universal **homogeneous** multi-drop (same format → output picker → batch handoff); mixed-format **toast hint** (no picker) | ✅ Shipped | **v3.2.4** |
| **C** | Universal **mixed-format cohort picker** (`UniversalCohortPicker`); remaining cohorts stay on home; session store | ⏳ Pending | TBD |

Slice **C** completes phase **3.6.1**. Until then, 3.6.1 exit gate (§13) is **not** fully met.

#### Slice A+B (shipped)

| File | Action |
|------|--------|
| `lib/tools/universal-matrix.ts` | `buildCohorts(files)`, `toolsForCohortOutput`, `intersectToolsForFiles` |
| `lib/tools/universal-matrix.test.ts` | Cohort + batch filter fixtures |
| `lib/batch/batch-handoff.ts` | Stage/consume multi-file handoff |
| `lib/universal/universal-drop.ts` | `resolveUniversalDrop`, `batchOutputToolsForCohort` |
| `components/transmute/UniversalTransmutator.tsx` | Multi-drop homogeneous + mixed hint |
| `components/transmute/TransmutationPanel.tsx` | Consume `?batch=` |

#### Slice C (pending)

| File | Action |
|------|--------|
| `components/transmute/UniversalCohortPicker.tsx` | New — card per cohort |
| `components/transmute/UniversalTransmutator.tsx` | Mixed drop → picker (not toast-only) |
| `lib/universal/` or session store | Remaining cohorts on home after handoff |

### 14.3 Phase 3.6.2+

| File | Action |
|------|--------|
| `lib/batch/batch-zip-export.ts` | Client-side ZIP (e.g. fflate) |
| `BatchFileRow.tsx` | Per-row GIF/TIFF/ICO/SVG controls |

**Reuse:** `prepareFileForTool`, `computeLimitContext`, `useTransmutationWorker`, `downloadResult`, `Dropzone` patterns, `fileMatchesExtensions`.

---

## 15. Explicit non-goals (all of Tier 3.6 unless marked phase)

- Parallel Wasm encodes across workers  
- Upload to server / share link  
- Background batch after closing tab  
- Recursive directory drop (thousands of files)  
- Batch across **different output tools** in one run (always one `tool.slug` per batch session)  
- Replacing per-file hard limits with a single “session quota” without SPEC change  

---

## 16. Implementation order (3.6.0 first slice)

1. `batch-types.ts` + `batch-limits.ts` + tests  
2. `batch-tool-allowlist.ts` (start with PNG→JPG, PNG→WebP, JPG→PNG)  
3. `BatchFileRow` + `BatchWorkspace` (mock data)  
4. `TransmutationPanel` multi-drop + sequential prepare queue  
5. Wire transmute loop + per-file download  
6. QA matrix §12 on `preview:cf`  
7. Release v3.2.0 + What's New  

**Do not start** universal cohorts until 3.6.0 exit gate passes.

---

## 17. Open decisions (defaults locked by gradual doctrine)

| Decision | Default |
|----------|---------|
| Tool route before universal? | **Yes** — 3.6.0 before 3.6.1 |
| ZIP on day one? | **No** — 3.6.2 |
| GIF/TIFF/SVG/ICO in first slice? | **No** — 3.6.0 raster allowlist only |
| Parallel prepare? | **No** — sequential only until proven safe |
| Session sum vs 500 MB Risk cap? | **Per-file only**; warn on aggregate RAM |

---

## 18. Relationship to Tier 3.5

Tier 3.5 explicitly deferred multi-file:

> *“Multi-file drop: First file only + optional toast ‘one file at a time’”*

Tier 3.6 **supersedes** that behavior in controlled phases on batch-enabled tool routes. Single-file and non-allowlisted routes still use one file per session.

---

## 19. Shipping log

| App version | Tier phase | Branch | Notes |
|-------------|------------|--------|-------|
| **v3.2.9** | 3.6.1 **C** + **3.6.2** + 4a | `main` | UniversalCohortPicker; cohort-session; batch ZIP pref; GIF/TIFF/ICO per-row; transmutador_optimize; batch re-download fixes; contextual cancel |
| **v3.2.8** | — | `main` | S7 Priority A (batch select-all default); adaptive toasts; responsive toast cap (2 mobile / 3 desktop); Universal cohort file list UI |
| **v3.2.7** | — | `dev` | App updates (3.2.5–3.2.6), toast system, floating notices, modal blur/toast veil hotfixes |
| **v3.2.6** | — | `dev` | Settings auto-detect updates + Check now |
| **v3.2.5** | — | `dev` | App update module, AppUpdateNotice pill, deep refresh |
| **v3.2.4** | 3.6.1 **A+B** | `dev` | Universal homogeneous multi-drop; batch-handoff; buildCohorts; mixed-format hint |
| **v3.2.3** | 3.6.0 **complete** | `dev` | Batch UX (initial gate, encode-only rerun, cache redownload, hints); `commitItems` sync fix |
| **v3.2.1** | 3.6.0 core | `dev` | 14 raster slugs; camera JPEG 512 KiB scan; batch decode validation |

**Next:** **3.6.3** SVG batch; aggregate RAM warnings; mobile caps. **UX-4a** ToolBrowser Convert vs Optimize lanes.

---

*Planning doc — Multi-file batch transmutation Tier 3.6.x. Orchestration layer; phased delivery mandatory.*
