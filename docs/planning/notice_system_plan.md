# Operational Notice Rail — System Plan

> **Status:** Shipped **v2.3.0** on `main`  
> **Scope:** All 19 active transmutation tools  
> **Doctrine:** NFR-8 honesty — operational context without invasiveness  
> **SPEC anchor:** §7.12 Operational Notice Rail

---

## 1. Purpose

Centralize **non-blocking** contextual messages in the staged transmutation panel. Blocking flows (oversize consent, pixel block, astro resize) remain dedicated panels.

The **Notice Rail** sits between **OptionsControls** and **MetricsPanel** in `StagedWorkspace`, showing at most **2** notices ranked by priority.

---

## 2. Taxonomy

| Severity | Role | Blocks transmute? | Example |
|----------|------|-------------------|---------|
| `error` | Failure user should see | Often | Estimate failed, corrupt input |
| `warn` | Proceed with caution | No | Slow encode expected, BMP growth |
| `info` | Educational context | No | Large output size, astro guidance |
| `status` | Transient operational | No | Still calculating (shown in metrics/rail) |

**Not surfaced:** `superseded`, `worker-recycled` (unless manual estimate interrupted).

---

## 3. Data contract

```typescript
type NoticeSeverity = "error" | "warn" | "info" | "status";
type NoticePhase = "staged" | "estimating" | "transmuting";

type Notice = {
  id: string;
  severity: NoticeSeverity;
  messageKey: string;
  params?: Record<string, string | number>;
  priority: number;
  phase?: NoticePhase;
};

type CostTier = "L0" | "L1" | "L2" | "L3";

type ToolNoticeProfile = {
  estimateCost: "cheap" | "moderate" | "expensive";
  transmuteCost: "cheap" | "moderate" | "expensive";
  costFactors?: Array<"speed" | "compression" | "quality" | "frameIndex" | "pageIndex" | "entryIndex">;
};
```

**Priority defaults:** error 100 > warn limit 80 > warn fidelity 70 > warn perf 60 > info 40.

---

## 4. Tool profiles

Profiles live in `frontend/src/lib/notices/tool-notice-profiles.ts` (decoupled from `ToolRegistry`).

| Group | Tools | estimate / transmute |
|-------|-------|----------------------|
| Raster classic | jpg↔png, tga→png, ico→png, png→ico | cheap / cheap |
| WebP | webp→*, png/jpg→webp | moderate / moderate |
| GIF/BMP/TIFF | gif→*, bmp→*, tiff→* | moderate; GIF animated → expensive estimate |
| AVIF decode | avif→png/jpg | expensive / expensive |
| AVIF encode | png/jpg→avif | expensive / expensive; factors: speed, quality |

Dynamic overrides via `getToolNoticeProfile(toolId, context)`.

---

## 5. Performance cost tiers (L0–L3)

| Tier | Conditions (any match escalates) |
|------|----------------------------------|
| **L0** | cheap profile + MP < 2 + no extreme options |
| **L1** | moderate profile OR MP 2–8 |
| **L2** | expensive OR speed ≤ 5 (AVIF) OR compression ≥ 8 OR MP > 8 |
| **L3** | expensive AND (MP > 20 OR zone elevated OR device tier low) |

L0 suppresses performance rail notice. L1–L3 emit `notices.performance.L1` … `L3`.

---

## 6. Resolvers

| Module | Source |
|--------|--------|
| `compute-limit-notices.ts` | `limitContext`, output size, near pixel, RAM peak |
| `compute-fidelity-notices.ts` | BMP growth, format honesty |
| `compute-performance-notices.ts` | Profile + MP + options + zone + tier |
| `compute-estimate-notices.ts` | Elapsed > 3s, estimate errors |
| `compute-transmute-notices.ts` | Transmute gate detail copy |
| `compute-staged-notices.ts` | Merges staged-phase notices |

---

## 7. UI components

- `NoticePanel` — unified visual primitive (severity tokens)
- `NoticeRail` — renders 0–2 panels
- `MetricsPanel` — cache ready slow label, no duplicate estimate errors
- `FilePrepareGate` — optional `detailLabel` during transmute

---

## 8. Phase E (Tier 3.3 SVG — deferred)

See `docs/planning/tier3_3_svg_analysis.md` §16. SVG tools will register:

- `estimateCost/transmuteCost: expensive`
- Factors: output dimensions, filters, embedded rasters

---

## 9. QA checklist

- [ ] JPG→PNG: no perf warn (L0)
- [ ] PNG→AVIF speed ≤ 5: L2+ warn in rail
- [ ] Estimate > 3s on expensive tools: status copy
- [ ] BMP→PNG growth: fidelity warn in rail
- [ ] Elevated file post-consent: RAM peak warn
- [ ] EN + ES keys complete
- [ ] `npx tsc --noEmit`

---

## 10. Related documents

| Doc | Role |
|-----|------|
| `docs/SPEC.md` §7.12 | Normative stub |
| `docs/planning/tier3_plan.md` | Tier 3 backlog pointer |
| `docs/LIMIT_PIPELINE.md` | Limit warnings source |
