# Tier 4 — Image Optimization & Editing

> **Branch:** `dev` (implementation) → merge to `main` at release tags  
> **Status:** **v3.3.1 on `dev`** — Tier 4a.0 **✅ functional** · **4a.1** metrics UX pending · **UX-4a** ToolBrowser lanes pending · **4b** editing planned  
> **Prerequisite:** Tier 3 **complete** (v3.0.1) · Tier 3.5 Universal ✅ · Tier 3.6.0–3.6.2 ✅ (v3.2.9) · Settings S1–S7 core ✅  
> **Doctrine:** Same pipeline as convert tools — decode → honest options → re-encode → StripAll → **estimate-first** (metrics are the product on Ladder C)  
> **SPEC anchor:** §1.3 Ladders C & D · §5.1 mental model · §12.5 Tier 4a · §12.6 Tier 4b · NFR-7 bundle · NFR-8 honesty · **`docs/LIMIT_PIPELINE.md`**  
> **UI anchor:** `docs/planning/pre_tier3_ui_ux_plan.md` §4.2 (category lanes)  
> **Settings:** `docs/planning/settings_panel_plan.md` (S5 offline toolkit must include new Wasm crates)

---

## 0. Tier 4 umbrella (what this milestone is)

Tier 4 is Camaleon's **second major capability line** after the 21-tool convert matrix (Ladders A & B). It adds **same-format optimization** (Ladder C) and **geometric editing** (Ladder D) without opening the document/PDF lane (Tier 5).

| Sub-phase | ID | User job | Crate(s) | Target version | Status |
|-----------|-----|----------|----------|----------------|--------|
| **4a.0** | Activation | Make PNG/JPEG compress & resize **actually run** | `transmutador_optimize` (exists) | **v3.3.0** | **✅ Shipped on `dev`** |
| **4a.1** | Metrics UX | Size delta as primary affordance; optimize honesty copy | — (frontend) | v3.3.x | 📋 Planned |
| **UX-4a** | Discovery | ToolBrowser **Convert vs Optimize** lanes (`category`) | — (frontend) | v3.3.x | 📋 Planned |
| **4a.2** | Matrix expand | WebP recompress; optional SVG minify spike | `transmutador_optimize` or new | v3.4.x | 📋 Backlog |
| **4a.3** | Batch optimize | Same settings × N files for compress/resize | orchestration only | v3.4.x | 📋 Backlog |
| **4b.1** | Crop | User-defined region → encode | `transmutador_edit` (proposed) | v4.0.x | 📋 Planned |
| **4b.2** | Rotate / flip | 90°/180°/270° + H/V flip | `transmutador_edit` | v4.0.x | 📋 Planned |
| **4b.3** | Favicon pack | Multi-size ICO emit (16/32/48/256) | extend `transmutador_ico` | v4.0.x | 📋 Backlog (`tier2_wave2_plan.md`) |

**Normative:** Tier 4 does **not** add PDF, HEIC, or new **convert** directions. Format expansion stays in Tier 3 maintenance (e.g. 3.6.3 SVG batch). Optimization and editing are **orthogonal ladders** — users may compress without converting, or crop before exporting to JPEG.

**End state (Tier 4 complete):** **25+ active tools** with **Convert · Optimize · Edit** discovery surfaces; **14+ Wasm crates**; batch and universal entry aware of `category: "optimize" | "edit"`.

---

## 1. v3.2.9 baseline — what exists vs what works

### 1.1 Shipped in code (v3.2.9)

| Layer | Artifact | State |
|-------|----------|-------|
| **Rust** | `motor_transmutacion/transmutador_optimize/` | ✅ `recompress_png/jpeg`, `resize_png/jpeg`, `estimate_*` + unit tests |
| **Registry** | 4 tools: `png-compress`, `jpg-compress`, `png-resize`, `jpg-resize` | ✅ `category: "optimize"`, `status: "active"` |
| **Worker** | `transmutation.worker.ts` optimize routes + `ensureOptimizeWasmInitialized` | ✅ Wired |
| **Build** | `build-wasm.mjs` includes crate; CI runs `npm run build:wasm` | ✅ |
| **i18n** | EN/ES tool copy for all four slugs | ✅ |
| **Routes** | `/transmute/png-compress`, etc. (`generateStaticParams`) | ✅ Reachable |

### 1.2 Live behavior (known broken — intentional freeze)

**Symptom:** Transmutation fails with:

```text
Unknown module: transmutador_optimize
```

Observed on **Compress PNG** and **Resize PNG** (same class of failure for JPEG tools).

**Posture:** v3.2.9 is the **stable convert + batch + universal** release. Optimize tools are **visible in the registry** but **must be treated as non-functional** until Phase **4a.0** ships. Do not mark Tier 4a complete in SPEC/ROADMAP until 4a.0 exit gate passes.

### 1.3 Root-cause analysis (for 4a.0 — do not re-spike Rust)

Investigation on `dev` @ v3.2.9 identifies **integration gaps**, not a missing engine:

| # | Gap | File | Impact |
|---|-----|------|--------|
| **G1** | `warmupTransmutatorModule` has **no** `transmutador_optimize` case — `default` throws `Unknown module: …` | `frontend/src/lib/transmutation/prepare/warmup-wasm.ts` | **Prepare fails before worker transmute** — matches Live error |
| **G2** | `wasm-modules.d.ts` has **no** `transmutador_optimize` block | `frontend/src/types/wasm-modules.d.ts` | Type drift; §12.8 cross-cutting #4 incomplete |
| **G3** | SPEC/ROADMAP claim **4a shipped** | `docs/SPEC.md` §12.5, `docs/ROADMAP.md` | Documentation overstates readiness — amend at 4a.0 release |
| **G4** | PWA S5 full-toolkit precache | `wasm-crates.ts` lists crate ✅ | Verify post-fix: offline first visit to optimize route caches `/wasm/transmutador_optimize/*` |
| **G5** | Batch / Universal | `batch-tool-allowlist.ts` | Optimize tools **excluded** from batch (correct until 4a.3) |

**Not the primary cause:** Worker `knownModules` already includes `transmutador_optimize` (v3.2.9). If error persisted **after** G1 fix, check SW serving stale worker bundle (hard reload / S5 toolkit refresh).

**Wasm artifacts:** `frontend/public/wasm/` is **gitignored** — built in CI (`ci.yml` → `npm run build:wasm` → `npm run build`). Deploy pipeline must keep that order.

---

## 2. Tier 4a — optimization science (Ladder C)

### 2.1 What “optimize” means in Camaleon

**Optimize ≠ convert.** Input and output share the **same interchange format** (PNG→PNG, JPEG→JPEG). The user job is **byte size** and/or **dimensions**, not format migration.

```
Input bytes → Decode to raster → Transform (re-encode and/or resample) → Output bytes
                     ↑
              Estimate runs full encode path (metrics-first)
```

| Tool class | Pixel fidelity (`ToolDefinition`) | What changes |
|------------|-----------------------------------|--------------|
| **PNG compress** | `lossless` | DEFLATE level only — **pixels identical**; file size may ↑ or ↓ |
| **JPEG compress** | `lossy` | New DCT generation at lower quality — **irreversible** |
| **PNG resize** | `lossless` (dimensions) | Lanczos downscale — **detail loss from shrinking**, not from lossy codec |
| **JPEG resize** | `lossy` | Resample + default Q85 re-encode |

### 2.2 User jobs

| Job | Tool | Why local / Camaleon |
|-----|------|----------------------|
| Shrink PNG for web without Photoshop | PNG compress | Tune DEFLATE; compare estimate before download |
| Reduce JPEG weight for email | JPEG compress | Quality slider with generational-loss honesty |
| Generate @2x/@1x assets from one master | PNG/JPEG resize | Percent-based downscale; same format out |
| Privacy | All | No upload — same NFR-1 as convert |

### 2.3 Variables modifiable before transmutation

| Variable | PNG compress | JPEG compress | PNG resize | JPEG resize |
|----------|--------------|---------------|------------|-------------|
| **compression** (1–9) | ✅ | — | — | — |
| **quality** (1–100) | — | ✅ | — | — |
| **resizePercent** (10–100) | — | — | ✅ | ✅ |
| **Downscale preset (astro)** | ✅ if > 40 MP | ✅ | ✅ | ✅ |
| **Oversize consent** | ✅ | ✅ | ✅ | ✅ |

**Not user-modifiable:** source ICC/EXIF (StripAll), embedded JPEG Huffman tables in source (decoded away), PNG filter strategy per row (encoder chooses).

### 2.4 Size expectations (NFR-8)

| Operation | Typical Δ | Honesty copy |
|-----------|-----------|--------------|
| PNG compress ↑ level | **−5% to −40%** (often); can **grow** on already-optimal PNGs | “Pixels unchanged; size may increase if source was already compact” |
| JPEG compress ↓ quality | **−20% to −70%** | “Re-encoding adds another lossy generation” |
| Resize to 50% | **~−75%** area (not always −75% bytes) | “Downscaling softens detail; dimensions change” |

### 2.5 Comparison to convert tools

| Aspect | Convert (e.g. PNG→JPEG) | Optimize (PNG compress) |
|--------|-------------------------|-------------------------|
| Format change | Yes | No |
| Primary metric | Fidelity class + target format | **Byte delta** |
| `category` | `"image"` | `"optimize"` |
| Universal matrix | Format cohort routing | Same extension required |
| Batch (future) | Shipped 3.6.x | 4a.3 — shared slider once per row |

---

## 3. Wasm API contract (`transmutador_optimize` — implemented)

Crate: `motor_transmutacion/transmutador_optimize`  
Crate type: `["cdylib", "rlib"]`  
Dependencies: `core_utils`, `image` (png + jpeg encode/decode, `imageops` Lanczos3).

```rust
// --- PNG ---
recompress_png(bytes, compression: u8) -> Vec<u8>
estimate_png_recompress_size(bytes, compression: u8) -> u32

// --- JPEG ---
recompress_jpeg(bytes, quality: u8) -> Vec<u8>
estimate_jpeg_recompress_size(bytes, quality: u8) -> u32

// --- Resize (re-encode with defaults: PNG compression 6, JPEG Q85) ---
resize_png(bytes, resize_percent: u8) -> Vec<u8>
resize_jpeg(bytes, resize_percent: u8) -> Vec<u8>

// --- Session / risk (mirror other crates) ---
set_session_input_limit(max_bytes: u32)
reset_session_input_limit()
set_risk_mode(enabled: bool)
```

**Resize estimate:** Worker runs full `resize_*` for estimate path (same as other tools — CountingWriter parity via byte length). No separate `estimate_resize_*` export in v3.2.9 scaffold; acceptable for 4a.0; optional fast estimator backlog.

**Bundle budget:** Target ≤ **1 MB** `.wasm` (decode+encode only, no rav1e). Confirm in 4a.0 spike checklist.

---

## 4. Phase 4a.0 — Activation (first work when returning)

> **Goal:** Four optimize tools transmute end-to-end on `dev`, then release **v3.3.0** to `main`.

### 4.1 Engineering checklist

- [x] **G1** — Add `transmutador_optimize` to `warmupTransmutatorModule` (`warmupCrate("transmutador_optimize")`).
- [x] **G2** — Add `wasm-modules.d.ts` block for optimize exports (§12.8 #4).
- [x] Audit **prepare path** — `resolveSourceImageMeta` JPEG alias for optimize tools.
- [x] Audit **worker** — optimize routes verified (v3.2.9 scaffold).
- [x] **`useFileMetrics`** — estimate debounce for `compression`, `quality`, `resizePercent` (manual QA v3.3.0).
- [x] **Vitest** — `warmup-wasm.test.ts` registry ↔ warmup coverage.
- [x] **`npm run build:wasm`** + CI green.
- [x] **Manual smoke (all four tools):** verified v3.3.0.
- [ ] **Offline:** Settings S5 full toolkit → airplane mode → compress PNG succeeds.
- [x] **Amend docs:** SPEC §6.13/§12.5, ROADMAP, `docs/releases/v3.3.0.md`, release manifest + i18n What's New.

### 4.2 Exit gate

1. No `Unknown module: transmutador_optimize` on prepare or transmute.
2. All §8 QA gates pass for 4a.0.
3. SPEC/ROADMAP accurately say **4a functional** only after this release.

### 4.3 Versioning

| Release | Scope |
|---------|-------|
| **v3.3.0** | 4a.0 activation only (recommended — focused hotfix milestone) |
| v3.3.1+ | 4a.1 metrics UX, UX-4a lanes (can combine if small) |

Engine semver: stay **1.6.0** unless optimize crate API changes warrant **1.6.1**.

---

## 5. Phase 4a.1 — Metrics-first UX polish

Optimize tools sell on **numbers**, not format badges.

| Surface | Work |
|---------|------|
| **Size delta pill** | Prominent before/after; green only when estimate < input (honest when larger) |
| **Slider copy** | Tie presets to outcomes (“minimal” = smaller file, slower encode) |
| **Notice rail** | JPEG compress: generational loss warning; PNG compress: “pixels frozen” |
| **Result row** | Show `% change` and absolute bytes in download confirmation |
| **Command palette** | Optimize tools discoverable by “compress”, “resize”, “smaller” |

**Exit gate:** User can decide to transmute from estimate alone without reading tool description.

---

## 6. Phase UX-4a — ToolBrowser Convert vs Optimize lanes

Full spec: `pre_tier3_ui_ux_plan.md` §4.2.

| Deliverable | Detail |
|-------------|--------|
| **Landing tabs** | Transmutar (convert) · Optimizar · Editar (edit tab hidden until 4b) |
| **`ToolDefinition.category`** | Filter `image` vs `optimize` vs `edit` |
| **Command palette** | Category chips at top |
| **Universal entry** | Stays convert-first; optimize routes reached via browser or direct slug |
| **i18n** | EN/ES tab labels |

**Exit gate:** New user finds compress without knowing slug; convert grid not cluttered with 4 optimize rows.

**Schedule:** Can ship with **v3.3.1** after 4a.0, or parallel on `dev` if UI-only.

---

## 7. Phase 4a.2 — Expand optimize matrix (backlog)

| Candidate | Spike question | Notes |
|-----------|----------------|-------|
| **WebP lossless recompress** | Reuse `transmutador_encode` or extend optimize? | Lossy WebP recompress = new lossy generation |
| **AVIF recompress** | Encode cost in Wasm | Likely defer — AVIF encode already slow (Tier 3.2) |
| **SVG minify** | `svgo` in Wasm vs server-side reject | See `tier3_3_svg_analysis.md` — different job than rasterize |
| **Upscale** | Lanczos upscale | **Out of MVP** — honesty: cannot invent detail |

Each addition requires §12.8 cross-cutting checklist + NFR-7 bundle review.

---

## 8. Phase 4a.3 — Batch optimize

Reuse Tier 3.6 orchestration — **no new Wasm crate**.

| Item | Policy |
|------|--------|
| **Allowlist** | Add four optimize slugs to `batch-tool-allowlist.ts` |
| **Per-row options** | Not needed (shared compression/quality/percent) |
| **ZIP delivery** | Reuse S7 `batchDownloadMode` |
| **Universal** | Homogeneous `.png` / `.jpg` cohorts only in v1 |
| **Limits** | Per-file limit pipeline unchanged; aggregate RAM warning (3.6.3 pattern) |

**Exit gate:** 10 PNGs → compress with shared level → individual or ZIP download.

---

## 9. Tier 4b — Image editing (Ladder D)

**SPEC §12.6.** Introduces `category: "edit"`. Geometric operations on decoded raster **before** final encode.

### 9.1 Proposed tools

| Tool | Slug (draft) | UI | Wasm |
|------|--------------|-----|------|
| **Crop** | `png-crop`, `jpg-crop` (or unified `image-crop` with format out) | Canvas marquee + aspect presets | `transmutador_edit` (new) |
| **Rotate / flip** | `png-rotate`, etc. | 90° steps + flip toggles | same crate |
| **Favicon pack** | `png-to-favicon-pack` | Size checklist 16/32/48/256 | extend `transmutador_ico` |

### 9.2 Architecture sketch

```
Input bytes → Decode → Edit op (crop/rotate on raster buffer) → Encode (png/jpeg) → StripAll
```

- **Canvas UI** on main thread for interaction; **Wasm** for pixel-accurate crop/rotate (match limit pipeline, avoid canvas taint).
- Reuse **astro downscale** and **LimitContext** from convert shell.
- **Lossless rotate** on PNG when no re-compression slider changed (ideal; spike in 4b.1).

### 9.3 Phase breakdown

| Phase | Version | Deliverable |
|-------|---------|-------------|
| **4b.0** | — | Spike: `transmutador_edit` skeleton + 90° rotate PNG proof |
| **4b.1** | v4.0.0 | Crop PNG/JPEG + canvas UX |
| **4b.2** | v4.0.x | Flip + rotate JPEG |
| **4b.3** | v4.0.x | Favicon multi-size pack |

**Normative:** Do not ship PDF tools under 4b. Editing is **raster-only**.

---

## 10. Cross-cutting requirements (§12.8 — every 4.x phase)

| # | Requirement | 4a.0 owner |
|---|-------------|------------|
| 1 | ToolRegistry `soon` → `active` only when QA passes | ✅ already `active` — docs must catch up |
| 2 | Worker lazy-load | ✅ verify |
| 3 | `TransmutationModule` type | ✅ |
| 4 | `wasm-modules.d.ts` | **4a.0 fix** |
| 5 | Build scripts (`build-wasm.mjs`, sh, ps1) | ✅ |
| 6 | Estimate via worker / `useFileMetrics` | **4a.0 verify** |
| 7 | i18n EN/ES | ✅ |
| 8 | SPEC §6 stub for new crates | §6.12 optimize (Architect at 4a.0) |
| 9 | ROADMAP update | Architect at release |
| 10 | PWA precache list (`wasm-crates.ts`) | ✅ verify offline |
| 11 | `warmupTransmutatorModule` | **4a.0 fix** |

---

## 11. QA gate (per phase)

1. `cargo test -p transmutador_optimize` (and `-p transmutador_edit` when exists)
2. `cd frontend && npm run build:wasm && npx tsc --noEmit && npm test && npm run build`
3. Manual smoke: drop → options → estimate → transmute → download
4. Estimate tracks slider changes within one session
5. i18n EN + ES complete for tool + errors
6. Wasm module ≤ **3 MB** uncompressed (optimize target ≤ 1 MB)
7. StripAll on output (no EXIF growth)
8. LimitContext: 40 MP block + astro downscale
9. NFR-8: no false “lossless” on JPEG compress/resize paths
10. **4a.0 specific:** prepare phase completes without throwing

---

## 12. Risk matrix

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Scaffold marked shipped in docs** | User trust | 4a.0 amends SPEC/ROADMAP; this plan is source of truth until then |
| **warmup-wasm drift** | Hard fail at prepare | Add Vitest case listing all registry `module` values have warmup |
| **JPEG recompress quality** | User expects smaller but ugly | Default Q75; honesty copy; preview optional backlog |
| **PNG compress increases size** | “Broken” perception | NFR-8: explain already-optimal sources |
| **Batch RAM × N optimize** | Tab OOM | 4a.3: cap batch size; reuse 3.6.3 aggregate warnings |
| **Edit canvas + Wasm duplication** | Bugs at crop edges | Single source of truth in Wasm; canvas is view only |
| **Bundle growth (4b)** | NFR-7 | New crate spike with size gate before active |

---

## 13. Recommended execution order

```
─────── v3.3.0 (4a.0 ✅ on dev) ───────
4a.1    Metrics-first UX polish
UX-4a   ToolBrowser Convert vs Optimize lanes
─────── optional parallel ───────
3.6.3   SVG batch + aggregate RAM (Tier 3 maintenance — see tier3_6_multi_file_plan.md)
─────── expand ───────
4a.3    Batch optimize allowlist
4a.2    WebP / SVG optimize spikes (backlog)
─────── editing ───────
4b.0    transmutador_edit spike
4b.1    Crop
4b.2    Rotate / flip
4b.3    Favicon pack
```

**Rationale:** **4a.0 before any 4a feature work** — fixes the Live error with minimal diff. UX-4a can follow immediately so optimize tools are discoverable once functional. **4b** waits until Ladder C is trustworthy — editing UI is larger than optimize sliders.

---

## 14. Related documents

| Doc | Role |
|-----|------|
| `docs/SPEC.md` §1.3, §12.5–12.6 | Normative ladders C & D |
| `docs/ROADMAP.md` Tier 4 rows | Milestone tracking (update at 4a.0) |
| `docs/planning/tier3_plan.md` | Prior tier pattern reference |
| `docs/planning/tier3_6_multi_file_plan.md` | Batch orchestration reuse for 4a.3 |
| `docs/planning/tier3_3_svg_analysis.md` | SVG minify backlog |
| `docs/planning/pre_tier3_ui_ux_plan.md` §4.2 | UX-4a category lanes |
| `docs/planning/settings_panel_plan.md` | S5 offline toolkit crate list |
| `docs/releases/v3.2.9.md` | Scaffold release notes |
| `motor_transmutacion/transmutador_optimize/` | Existing Rust implementation |
| `frontend/src/lib/transmutation/prepare/warmup-wasm.ts` | **4a.0 primary fix** |

---

## 15. Out of scope for Tier 4

| Item | Why |
|------|-----|
| PDF / documents | Tier 5 — §12.7 |
| New convert formats (HEIC, etc.) | Tier 3 maintenance / future ladder B |
| AI upscale / enhancement | Violates honesty doctrine |
| Server-side optimize | NFR-1 |
| Parallel multi-worker batch | Tier 3.6 doctrine — sequential only |
| Auto-trace raster → SVG | Different product |

---

## 16. Open decisions (resolve in 4a.0 kickoff)

| # | Question | Default proposal |
|---|----------|------------------|
| **Q1** | Hide optimize tools until 4a.0? | **No** — keep routes; fix fast on `dev` |
| **Q2** | Separate `estimate_resize_*` in Wasm? | **Defer** — full encode for estimate OK at MVP |
| **Q3** | Version **v3.3.0** vs **v3.2.10** for activation? | **v3.3.0** — user-visible new capability |
| **Q4** | One `image-crop` tool vs per-format slugs? | **Per-format slugs** — match convert pattern |
| **Q5** | Combine UX-4a with 4a.0 release? | **Split** if UX slips — functional > navigation |

---

*Planning doc for Tier 4 — Image Optimization & Editing. **v3.3.0** activates Ladder C (4a.0). Next: **4a.1** metrics UX and **UX-4a** discovery lanes.*
