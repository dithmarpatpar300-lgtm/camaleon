# Camaleon v2.3.0 — Operational Notice Rail

> **App version:** `2.3.0` (`frontend/package.json`)  
> **Engine:** `1.6.0` (unchanged — frontend UX release)  
> **Tags:** **NEW** · **PERFORMANCE**

## Highlights

### New

- **Operational Notice Rail** — contextual warnings and info for all 19 conversion tools
- **Adaptive per-tool profiles** — cheap / moderate / expensive estimate & transmute cost models
- **Unified limit & fidelity messages** — BMP growth, large output, near 40 MP, elevated RAM

### Performance / UX

- **L0–L3 cost tiers** — non-invasive guidance when encode or estimate may take minutes
- **Slow estimate copy** — appears after 3 seconds on heavy tools (e.g. AVIF encode estimate = full encode)
- **Smarter “Ready to transmute”** — slow-path variant when settings imply long conversion
- **Transmute gate hints** — extra line under spinner on heavy workloads

### Cleanup

- Removed unused `OutputSizeNotice`, `BmpPngGrowthNotice`, `LargeFileNotice`, `TransmutationDropzone`

## Tool count

**19 active conversion tools** — unchanged; UX applies to entire matrix.

## Docs

- Release notes: `docs/releases/v2.3.0.md`
- System plan: `docs/planning/notice_system_plan.md`
