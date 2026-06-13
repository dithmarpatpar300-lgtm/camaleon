# Tier 3 Phase 3.2.0 — AVIF Encode Spike Results

> **Date:** 2026-06-11  
> **Encode crate:** `motor_transmutacion/transmutador_avif_encode`  
> **Encode backend:** **ravif 0.13** (`default-features = false`; rav1e `wasm` on `wasm32-unknown-unknown`)  
> **Decode round-trip:** `transmutador_avif` / zenavif (test-only dev-dep)  
> **Gate:** NFR-7 Wasm ≤ 3 MB per module · §12.4 go/no-go ≤ 4 MB

---

## 1. Verdict: **ravif adopted — split crate architecture**

All Phase 3.2.0 spike gates **pass**. Proceed to **3.2.1** (PNG → AVIF tool) and **3.2.2** (JPEG → AVIF).

| Gate | Result |
|------|--------|
| `wasm-pack build --target web --release` (encode crate) | ✅ |
| Encode-only `.wasm` size | **1,750,509 B (~1.67 MB)** — ✅ NFR-7 |
| Decode crate unchanged budget | **1,991,263 B (~1.90 MB)** — ✅ NFR-7 |
| Combined single crate (experiment) | **3,621,064 B (~3.45 MB)** — ❌ NFR-7 (split required) |
| PNG/JPEG → AVIF round-trip (zenavif decode) | ✅ |
| Quality + speed validation | ✅ |
| Meaningful alpha preserved on PNG → AVIF | ✅ |
| Speed 10 ≤ 2× latency of speed 4 (256×256) | ✅ |

Build commands:

```bash
cd motor_transmutacion/transmutador_avif_encode
wasm-pack build --target web --release --out-dir spike-wasm-encode-out --out-name transmutador_avif_encode

cd ../transmutador_avif
wasm-pack build --target web --release --out-dir spike-wasm-decode-out --out-name transmutador_avif
```

Artifacts (gitignored): `spike-wasm-encode-out/`, `spike-wasm-decode-out/`

---

## 2. Wasm size comparison

| Module | `.wasm` (release + wasm-opt) | NFR-7 | Role |
|--------|-------------------------------|-------|------|
| **`transmutador_avif`** (decode) | **1.90 MB** | ✅ | AVIF → PNG/JPEG (shipped v2.1.1) |
| **`transmutador_avif_encode`** (new) | **1.67 MB** | ✅ | PNG/JPEG → AVIF (3.2.1+) |
| **Hypothetical merged crate** | **3.45 MB** | ❌ | Rejected — lazy-load split |

**Aggregate `public/wasm/`:** +~1.67 MB when encode tools ship (still within 12 MB budget with headroom).

**Architecture decision:** Keep **two Wasm modules** — same pattern as `transmutador_webp` (decode) + `transmutador_encode` (WebP encode). Worker lazy-loads `transmutador_avif_encode` only for inbound AVIF tools.

---

## 3. Encode API (spike exports)

Crate: `transmutador_avif_encode`

```rust
transmutar_png_a_avif(bytes)                           // quality 60, speed 6
transmutar_png_a_avif_with_options(bytes, quality, speed)
transmutar_jpg_a_avif(bytes)
transmutar_jpg_a_avif_with_options(bytes, quality, speed)
set_session_input_limit / reset_session_input_limit
```

| Parameter | Range | Default | Notes |
|-----------|-------|---------|-------|
| **quality** | 1–100 | **60** | ravif `with_quality(f32)` — lossy AVIF |
| **speed** | 1–10 | **6** | Higher = faster encode, lower density; UI slider in 3.2.1 |

**Alpha policy (PNG → AVIF):** Semantic Alpha Engine — meaningful alpha → `with_alpha_quality`; structural-only → RGB path (no false alpha plane).

**JPEG → AVIF:** RGB raster only; generational loss (NFR-8) — two lossy codecs.

**Metadata:** StripAll on output — no EXIF/XMP/ICC from source copied into AVIF container.

**Estimate:** ⏳ **Deferred to 3.2.1** — ravif has no CountingWriter; MVP = full encode for estimate (document latency; same class as slow encode UX).

---

## 4. Speed / quality observations (native tests, 256×256 gradient)

| speed | Relative encode time | Use case |
|-------|---------------------|----------|
| **4** | Slowest (baseline in test) | Max density / offline batch |
| **6** | Default — balanced | **Recommended UI default** |
| **8** | Faster | Large images / responsive UI |
| **10** | Fastest (≤2× speed 4 in spike test) | Wasm worker time budget |

**Wasm UX doctrine (locked for 3.2.x):** Expose **quality** + **speed** sliders; default speed **6**; honesty copy that AVIF encode is CPU-heavy and may take seconds on large images.

---

## 5. Round-trip fixture matrix

Tests: `transmutador_avif_encode/tests/encode_spike_test.rs`

| Fixture | Encode | zenavif decode | Notes |
|---------|--------|----------------|-------|
| PNG rgb8 gradient 128×128 | ✅ | ✅ | `ftyp` valid; dimensions match |
| PNG meaningful alpha 64×64 | ✅ | ✅ | `has_alpha_channel` true |
| JPEG 96×96 | ✅ | ✅ | Opaque path |
| Lossy AVIF smaller than source PNG | ✅ | — | 256×256 gradient |
| Empty input | error | — | `validate_input` |

---

## 6. Open decisions resolved (3.2.0)

| # | Question | Outcome |
|---|----------|---------|
| **E1** | Encode backend | **ravif 0.13** — pure Rust, Wasm-proven |
| **E2** | Same crate as decode? | **No** — split `transmutador_avif_encode` (NFR-7) |
| **E3** | Default quality | **60** (lossy delivery; not “lossless AVIF”) |
| **E4** | Default speed | **6** (balance); expose 1–10 in UI |
| **E5** | Lossless AVIF in MVP? | **No** — lossy only; honesty `fidelity: lossy` |
| **E6** | `estimate_*_size` | Full encode in 3.2.1; optimize later if needed |

---

## 7. Deferred to 3.2.1 / 3.2.2

- [x] `estimate_png_to_avif_size` (full encode parity — 3.2.1)
- [ ] `estimate_jpg_to_avif_size` (3.2.2)
- [x] Worker route + `TransmutationModule` += `transmutador_avif_encode` (3.2.1)
- [x] `tool-registry` `png-to-avif` → `active` (3.2.1)
- [ ] `tool-registry` `jpg-to-avif` → `active` (3.2.2)
- [ ] i18n EN/ES + NFR-8 fidelity hints (generational loss on JPG path)
- [ ] `wasm-modules.d.ts` + `build:wasm` CI (crate already in `build-wasm.mjs`)
- [ ] SPEC §6.10 amendment + `OutputFormat::Avif` (core_utils ✅)
- [ ] Manual smoke + release version (target v2.2.0)

---

## Related

- `docs/planning/tier3_plan.md` §7.5
- `motor_transmutacion/transmutador_avif_encode/`
- `docs/planning/tier3_1_avif_spike_results.md` (decode spike)
