# Camaleon v2.1.1 — AVIF → JPEG + preview UX

> **App version:** `2.1.1` (`frontend/package.json`)  
> **Engine:** `1.5.1` (`motor_transmutacion/Cargo.toml` workspace)  
> **Tier 3:** Phase 3.1.2 complete — outbound AVIF pair

## Highlights

### New

- **AVIF → JPEG** — 17th conversion tool; quality + background; semantic alpha; honest lossy-on-lossy hint
- **Animated preview overhaul** — frames decode in a background worker; scrubbing is instant after warm-up

### Improved

- **No scrub flicker** — spinner only during warm-up, not on every frame change
- **Session cache** — decoded frames survive slider moves; freed on Transmute or idle TTL
- **Transmute + estimate** — button pauses while a visible size estimate is stale and recalculating

## Tool count

**17 active conversion tools** — adds AVIF → JPEG to the v2.0.0 AVIF → PNG pair.

## Docs

- Release notes: `docs/releases/v2.1.1.md`
- Tier 3 plan: `docs/planning/tier3_plan.md`
