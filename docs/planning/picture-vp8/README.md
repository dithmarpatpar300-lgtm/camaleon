# Picture-VP8 — Pure Rust VP8 Intra-Frame Lossy Encoder for WebP

> **Codename:** Picture-VP8
> **Full title:** Pure Rust VP8 Intra-Frame Lossy Encoder for WebP
> **Parent project:** Camaleon (browser-local image transmutation platform)
> **Status:** Research & planning phase
> **License:** MIT (same as Camaleon)
> **Engine target:** `wasm32-unknown-unknown` via `wasm-pack build --target web`

---

## What this is

Picture-VP8 is a project to build the **first production-ready pure Rust VP8 lossy encoder** — an intra-frame-only implementation of the VP8 bitstream spec (RFC 6386) that compiles to WebAssembly without any C dependencies.

Today, the Rust ecosystem has:
- `image-webp` — VP8L lossless encode + VP8 lossy **decode only**
- `webp` crate — wraps Google's `libwebp` C library via `libwebp-sys` (requires `cc` toolchain, incompatible with `wasm32-unknown-unknown`)
- **Nothing** that encodes VP8 lossy in pure Rust

Picture-VP8 fills this gap. The output is a WebP file with a `VP8 ` (lossy) chunk instead of `VP8L` (lossless), offering 25-35% smaller files than JPEG at equivalent visual quality — entirely in the browser, without uploads, without C dependencies.

---

## Name

**Picture** is a backronym:

| Letter | Component |
|--------|-----------|
| **P** | Prediction (intra-prediction, mode decision) |
| **I** | In-loop (deblocking filter) |
| **C** | Coefficient (DCT, quantization, zig-zag) |
| **T** | Transform (Walsh-Hadamard, forward DCT) |
| **U** | Utility (YUV conversion, RIFF container) |
| **R** | Rate control (entropy, arithmetic coder) |
| **E** | Encoder (bitstream writer, frame assembly) |

**VP8** suffix clarifies the target codec — distinguishing it from VP8L (lossless) and avoiding confusion with the generic word "picture."

---

## Documentation structure

This project is documented in four sequential categories. Each builds on the previous:

| # | Category | Document | Purpose |
|---|----------|----------|---------|
| 1 | **Scientific study** | [`01_scientific_study.md`](01_scientific_study.md) | Theoretical understanding of WebP format: container, VP8L, VP8, VP8X, color science, compression theory |
| 2 | **Algorithmic understanding** | [`02_algorithmic_understanding.md`](02_algorithmic_understanding.md) | Mathematical and logical deep dive: every transform, every probability table, every bitstream field |
| 3 | **Composition paper** | [`03_composition_paper.md`](03_composition_paper.md) | Synthesis of findings: complexity quantification, component breakdown, risk analysis, reusability assessment |
| 4 | **Implementation ROADMAP** | [`04_roadmap.md`](04_roadmap.md) | Phased delivery plan with sub-phases, test gates, and integration points into Camaleon |

---

## Architecture constraints

Picture-VP8 must operate within Camaleon's architectural rules:

1. **Pure Rust** — no `*-sys` crates, no `build.rs` that invokes `cc`/`cmake`, no C toolchain
2. **Single `wasm-pack build`** — no Emscripten, no dual build pipeline
3. **`wasm32-unknown-unknown` target** — no `std::os::*`, no filesystem, no threads (`rayon` forbidden)
4. **`RUSTFLAGS: -C target-feature=+simd128,+bulk-memory`** — SIMD128 is available
5. **StripAll metadata policy** — output contains pixel data and minimal RIFF structure only
6. **Honest science** — UI must communicate lossy vs lossless semantics accurately

---

## Community impact

| Stakeholder | Benefit |
|-------------|---------|
| **Camaleon** | Native WebP lossy encode — no C dependency, no app-update needed for engine changes |
| **`image-webp` crate** | PR upstream: VP8 encode completes the codec (decode + lossless encode + lossy encode) |
| **Rust ecosystem** | First pure-Rust VP8 lossy encoder; reference implementation for codec design in Rust |
| **Wasm/edge computing** | WebP lossy encode on Cloudflare Workers, Deno, Bun — no C cross-compile required |
| **Academic/education** | Readable, commented VP8 intra-frame implementation in modern Rust |

---

## References

| Source | Relevance |
|--------|-----------|
| RFC 6386 | VP8 bitstream specification (the authoritative spec) |
| `image-webp` v0.2.4 source | Existing VP8L encoder + VP8 decoder (reference for decoder-side logic) |
| Google `libwebp` source | C reference implementation (for validation, not integration) |
| `docs/planning/tier4a_2_matrix_expand_investigation.md` | Camaleon investigation that confirmed the blocker |
| `docs/SPEC.md` §5.12 | WebP format science doctrine |

---

*Last updated: 2026-06-28 · Project initiated by Chief Architect + OpenCode · Camaleon v3.9.3*
