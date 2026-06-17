# 🦎 Camaleon

> **"Matter is neither created nor destroyed, it is only transmuted."**

**v2.3.3** (App) · Engine v1.6.0 · **Live:** [camaleon.bckthead3001.workers.dev](https://camaleon.bckthead3001.workers.dev) · [GitHub](https://github.com/dithmarpatpar300-lgtm/camaleon) · [SPEC](docs/SPEC.md) · [ROADMAP](docs/ROADMAP.md)

Camaleon is an open-source, browser-local platform for **privacy-first** image format transmutation. Conversion runs entirely on your device via Rust/WebAssembly in Web Workers — no file bytes are uploaded to any server.

## What works today (v2.3.3)

| Capability | Status |
|------------|--------|
| **JPG / JPEG ↔ PNG** | Lossless PNG compression (1–9); JPEG quality (1–100); alpha flatten |
| **WebP suite** | WebP→PNG/JPG; PNG/JPEG→WebP (lossless WebP) |
| **GIF suite** | GIF→PNG/JPG; frame scrubber; GIF89a compositing; animated preview |
| **BMP suite** | BMP→PNG/JPG; semantic alpha; growth warnings via Notice Rail |
| **Settings panel** | S1 drawer + **S2 transmutation defaults** + **S3 performance overrides** (**v2.3.1–2.3.3**) |
| **Operational Notice Rail** | Adaptive context for all 19 tools — slow-path, limits, fidelity (**v2.3.0**) |
| **TIFF suite** | TIFF→PNG/JPG; multi-page picker; 16-bit normalization; palette/CMYK rejection |
| **ICO suite** | ICO/CUR→PNG (multi-size picker); PNG→ICO (16/32/48/256, downscale only) |
| **TGA suite** | TGA→PNG; raw/RLE; indexed + 32-bit alpha |
| **AVIF suite** | AVIF→PNG/JPEG decode; PNG/JPEG→AVIF encode; animated frame scrubber; split encode Wasm (**Tier 3**) |
| **Nineteen active tools** | Tiers 1–2 + full AVIF matrix — `/transmute/[slug]` per conversion |
| **Adaptive limits** | Byte zones (50 MB soft / 150 MB hard), 40 MP pixel cap, oversize consent |
| **Science imagery** | Client-side downscale (4K–12K presets) for images >40 MP before Wasm |
| **Memory lifecycle** | Wasm worker recycled when leaving any transmute route (SPA-safe) |
| **Staged transmutation flow** | Drop → prepare → adjust options → Transmutar → preview + delta → download |
| **EN / ES** | Full UI i18n with persisted locale |
| **Legal pages** | `/about`, `/contact`, `/privacy`, `/terms` (bilingual) |
| **Dark / light theme** | Design tokens, no-FOUC persistence |
| **Production** | Cloudflare Workers + OpenNext ([docs/DEPLOY.md](docs/DEPLOY.md)) |
| **CI** | GitHub Actions: `cargo test --workspace` + `build:wasm` + `npm run build` |

**Shipped on `dev` (v2.3.3):** Settings S3 performance overrides. **`main` (v2.3.0):** Notice Rail + AVIF encode. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Core principles

- **Privacy by design:** Zero external servers. Zero logs. Files never leave the browser.
- **Native performance:** Core engine in Rust, compiled to Wasm.
- **Modular architecture:** One Rust crate per transmutation direction; shared `core_utils`.
- **Honest science:** UI copy reflects lossless vs lossy semantics (no false "quality" on PNG).

## Technology stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind v4 |
| Engine | Rust workspace (`image` crate, `wasm-bindgen`) |
| Bridge | `wasm-pack` → `frontend/public/wasm/` |
| Concurrency | Web Workers |

## Building Wasm

**Prerequisites:** [Rust](https://rustup.rs) and [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/).

```bash
# From repository root (PowerShell)
.\scripts\build-wasm.ps1

# From repository root (Unix / CI)
./scripts/build-wasm.sh

# Or from the frontend directory
cd frontend && npm run build:wasm
```

Artifacts: `frontend/public/wasm/transmutador_{jpg,png,webp,encode,gif,bmp}/` (gitignored; rebuild after engine changes).

## Development

```bash
# 1. Build Wasm modules (required after motor_transmutacion changes)
cd frontend && npm run build:wasm

# 2. Install dependencies (first time)
npm install

# 3. Start Next.js dev server
npm run dev

# 4. Open http://localhost:3000
```

**Verify engine:**

```bash
cd motor_transmutacion && cargo test --workspace
```

**Verify frontend:**

```bash
cd frontend && npm run build
```

## Deploy to Cloudflare

Configured for [@opennextjs/cloudflare](https://opennext.js.org/cloudflare). Full steps: **[docs/DEPLOY.md](docs/DEPLOY.md)**.

```bash
cd frontend
npm run preview:cf   # local Workers preview (builds Wasm + Next)
npm run deploy:cf    # manual deploy (requires wrangler login)
```

## Repository layout

```
camaleon/
├── frontend/              # Next.js app (v1.9.0)
├── motor_transmutacion/   # Rust workspace (v1.4.2)
│   ├── core_utils/
│   ├── transmutador_jpg/    # JPEG → PNG
│   ├── transmutador_png/    # PNG → JPEG
│   ├── transmutador_webp/   # WebP → PNG / JPEG
│   ├── transmutador_encode/ # PNG / JPEG → WebP
│   ├── transmutador_gif/    # GIF → PNG / JPEG
│   └── transmutador_bmp/    # BMP → PNG / JPEG
├── docs/
│   ├── SPEC.md
│   ├── ROADMAP.md
│   ├── DEPLOY.md
│   └── planning/            # Tier 2 + astro roadmaps
├── CONTRIBUTING.md
└── scripts/
```

## Roadmap summary

| Phase | Version | Status |
|-------|---------|--------|
| **MVP** | v1.0.0 | ✅ |
| **Tier 1 WebP suite** | v1.7.6 | ✅ Six tools |
| **Launch baseline** | v1.7.9 | ✅ Legal + deploy |
| **Tier 2 Wave 1** | v1.8.3–v1.8.7 | ✅ GIF + BMP + limits polish |
| **Astro downscale + memory** | **v1.9.0** | ✅ **Shipped on `main`** |
| **Tier 2 Wave 2** | v1.10.4 (`main`) | ✅ Shipped — TIFF, ICO↔PNG, TGA→PNG (five new tools) |
| **Semantic Alpha Engine** | v1.11.0 (`main`) | ✅ Shipped — honest transparency across lossy → JPEG tools |

Full detail: **[docs/ROADMAP.md](docs/ROADMAP.md)** · Engine plan: **[docs/planning/semantic_alpha_engine_plan.md](docs/planning/semantic_alpha_engine_plan.md)**

## Contributing

The project is modular by design: a new format = one registry entry + one Rust crate + one Worker route + Wasm build.

See **[CONTRIBUTING.md](CONTRIBUTING.md)** — open PRs against the `contrib` branch. Branch strategy: **[docs/BRANCHING.md](docs/BRANCHING.md)**.

## Security & operations

- **[SECURITY.md](SECURITY.md)** — report vulnerabilities responsibly
- **[docs/OPERATIONS.md](docs/OPERATIONS.md)** — monitoring playbook
- **[docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md)** — pre-release audit
- **Feedback:** [GitHub Issues](https://github.com/dithmarpatpar300-lgtm/camaleon/issues/new/choose)

---

License: MIT
