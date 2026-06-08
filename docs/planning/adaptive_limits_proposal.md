# Adaptive File Size Limits — Proposal (refined)

> Status: **Implemented** (v1.8.6).  
> Applies to: all transmutators, desktop + mobile.

---

## What iloveimg observed (190 MB PNG)

User baseline: Chrome ~**1.8 GB** → spike ~**3.0 GB** → stable ~**2.24 GB** after loading a **190 MB PNG**.

| Phase | What happens |
|-------|----------------|
| **Upload/read** | Browser holds file bytes (`ArrayBuffer`) ≈ 190 MB |
| **Decode spike** | Full raster allocated: e.g. 8000×6000×4 ≈ **183 MB** + working buffers |
| **Peak (~3 GB)** | Original file + decoded bitmap + encode buffers + Chrome overhead + other tabs |
| **Stable (~2.24 GB)** | GC frees transient encode buffers; file + decoded image may remain cached |

**Takeaway:** A 190 MB *file* can cost **~400–600 MB+ working set** in the browser. That matches a **+1.2 GB spike** on an already-loaded browser. This is expected, not a leak — but it **will crash weak devices** if unchecked.

Camaleon must never silently replicate this on mobile or low-RAM desktops.

---

## Three-zone model (final)

```
0 ─────── 50 MB ─────── soft ceiling ─────── 150 MB ─────── ∞
         default OK    consent required      hard block
```

### Zone 1 — ≤ 50 MB (default)

- Normal flow: prepare, estimate, transmute.
- No extra friction.

### Zone 2 — 50 MB < file ≤ 150 MB (elevated, opt-in)

- **Prepare allowed** (read file, show metadata).
- **Transmute/estimate blocked** until user confirms.
- Show **OversizeConsentPanel** with:
  - File size and estimated peak RAM (see formula below).
  - Effects: RAM, CPU time, possible tab slowdown.
  - Explicit action: *"I understand — process this file anyway"*.
- Override is **session-only** (cleared on reset / new file).
- Effective limit passed to Wasm for that session.

### Zone 3 — > 150 MB (hard block)

- Reject at drop/select **before** heavy work.
- Message: file exceeds maximum supported size; suggest resize or desktop tool.
- **No override** — protects users and brand.

---

## Mobile adjustments

When `deviceMemory ≤ 4` (or `tier === "low"`):

| Limit | Desktop | Mobile/low-RAM |
|-------|---------|----------------|
| Soft (consent) | 50 MB | 50 MB |
| Hard block | 150 MB | **100 MB** |
| Elevated ceiling after consent | 150 MB | **100 MB** |

Optional: disable elevated mode entirely on `deviceMemory ≤ 2`.

---

## Non-negotiable guards (never overridden)

| Guard | Value | Reason |
|-------|-------|--------|
| `MAX_PIXELS` | 40 M | Raster memory cap (~153 MB RGBA alone) |
| Hard file ceiling | 150 MB (100 MB mobile) | Tab stability |
| GIF frame cache | Count toward memory estimate | Multi-frame decode |

---

## Peak RAM estimate (for consent copy)

```
peakMb ≈ fileSizeMb + (width × height × 4 / 1_048_576) × 2.2
```

The **2.2×** factor covers decode + encode + worker copies. Show rounded value:

> "This may use about **420 MB** of browser memory temporarily."

---

## Architecture touchpoints

1. `core_utils::validate_input(bytes, limit: usize)` — configurable per request.
2. Worker protocol: `effectiveMaxBytes` + `userConsentedOversize: boolean`.
3. `limits.ts`: `SOFT_LIMIT`, `HARD_LIMIT`, `getLimitZone(fileSize)`.
4. UI: `OversizeConsentPanel` replaces `LargeFileNotice` in zone 2.
5. i18n EN/ES for all messages.

**Complexity:** ~2–3 days, one-time for all formats.

---

## UX copy principles

- Short, contundente, no alarmism.
- Always state **what** (RAM/CPU) and **what we won't do** (upload data).
- Hard block ≠ user fault — suggest actionable alternatives.

---

## Decision log

| Question | Answer |
|----------|--------|
| Remove 50 MB limit? | **No** — becomes soft limit |
| User override > 150 MB? | **Never** |
| Persist consent in localStorage? | **No** — session only |
| Server-side processing fallback? | **Out of scope** (privacy model) |
