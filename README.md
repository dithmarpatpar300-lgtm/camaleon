# 🦎 Camaleon

> **"Matter is neither created nor destroyed, it is only transmuted."**

**v3.2.9** (App) · Engine v1.6.0 · **Live:** [camaleon.bckthead3001.workers.dev](https://camaleon.bckthead3001.workers.dev) · [GitHub](https://github.com/dithmarpatpar300-lgtm/camaleon) · [ARCHITECTURE](ARCHITECTURE.md) · [SPEC](docs/SPEC.md) · [ROADMAP](docs/ROADMAP.md)

Camaleon is an open-source, browser-local platform for **privacy-first** image format transmutation. Conversion runs entirely on your device via Rust/WebAssembly in Web Workers — no file bytes are uploaded to any server.

## What works today (v3.2.9)

| Capability | Status |
|------------|--------|
| **Twenty-five active tools** | Tiers 1–2 + AVIF + SVG + **optimize** (compress/resize) — `/transmute/[slug]` |
| **Universal transmutator** | Home-page drop zone — pick output format, handoff to any tool (**v3.1.x**, Tier 3.5) |
| **Mixed-format cohorts** | Drop mixed formats on home → per-group picker; remaining cohorts persist (**v3.2.9**, Tier 3.6.1 C) |
| **Multi-file batch** | Drop N images on **19 batch routes** — shared options, ZIP or individual download (**v3.2.0–3.2.9**, Tier 3.6) |
| **Universal homogeneous batch** | Drop N files of the **same format** on home → batch handoff to matching tool (**v3.2.4**, Tier 3.6.1 A+B) |
| **JPG / JPEG ↔ PNG** | Lossless PNG compression (1–9); JPEG quality (1–100); alpha flatten |
| **WebP suite** | WebP→PNG/JPG; PNG/JPEG→WebP (lossless WebP) |
| **GIF suite** | GIF→PNG/JPG; frame scrubber; GIF89a compositing; animated preview |
| **BMP suite** | BMP→PNG/JPG; semantic alpha; growth warnings via Notice Rail |
| **TIFF suite** | TIFF→PNG/JPG; multi-page picker; 16-bit normalization; palette/CMYK rejection |
| **ICO suite** | ICO/CUR→PNG (multi-size picker); PNG→ICO (16/32/48/256, downscale only) |
| **TGA suite** | TGA→PNG; raw/RLE; indexed + 32-bit alpha |
| **AVIF suite** | AVIF→PNG/JPEG decode; PNG/JPEG→AVIF encode; animated frame scrubber |
| **SVG → PNG / JPEG** | Vector rasterize (resvg); output scale presets; alpha-aware PNG |
| **Semantic Alpha Engine** | Honest transparency detection across lossy → JPEG tools (**v1.11.0**) |
| **Operational Notice Rail** | Adaptive context for all tools — slow-path, limits, fidelity (**v2.3.0**) |
| **Adaptive limits** | Byte zones (50 MB soft / 150 MB hard), 40 MP pixel cap, oversize consent |
| **Risk mode (S6)** | Settings opt-out for soft limits and consent prompts (**v2.3.8**) |
| **Settings panel** | S1–S4 (defaults, performance, notices/prepare) · **S5** offline cache · **S6** risk · **S7** batch & universal prefs (**v3.2.9**) |
| **PWA / offline shell** | Serwist SW, installable app, opt-in Wasm toolkit download (**v3.0.0**) |
| **Smart app updates** | Background version beacon, deep refresh on Live deploys (**v3.2.5–3.2.6**) |
| **Toast notifications** | FIFO queue, responsive cap (3 desktop / 2 mobile), modal-safe stacking (**v3.2.7**) |
| **Science imagery** | Client-side downscale (4K–12K presets) for images >40 MP before Wasm |
| **Memory lifecycle** | Wasm worker recycled when leaving any transmute route (SPA-safe) |
| **Staged transmutation flow** | Drop → prepare → adjust options → Transmutar → preview + delta → download |
| **EN / ES** | Full UI i18n with persisted locale |
| **Legal pages** | `/about`, `/contact`, `/privacy`, `/terms` (bilingual) |
| **Dark / light theme** | Design tokens, no-FOUC persistence |
| **Production** | Cloudflare Workers + OpenNext ([docs/DEPLOY.md](docs/DEPLOY.md)) |
| **CI** | GitHub Actions: `cargo test --workspace` + `build:wasm` + `npm run build` |
| **Tests** | 121 Vitest unit tests |

**Latest (v3.2.9):** Universal **mixed-format cohort picker**; batch **ZIP/individual** delivery in Settings; **GIF/TIFF/ICO** per-row batch; **compress & resize** tools (Tier 4a); smarter batch re-download and contextual cancel. See [docs/releases/v3.2.9.md](docs/releases/v3.2.9.md). **Next:** ToolBrowser lanes (Convert vs Optimize). [ROADMAP](docs/ROADMAP.md) · [Tier 3.6 plan](docs/planning/tier3_6_multi_file_plan.md).

## Core principles

- **Privacy by design:** Zero external servers. Zero logs. Files never leave the browser.
- **Native performance:** Core engine in Rust, compiled to Wasm.
- **Modular architecture:** One Rust crate per transmutation direction; shared `core_utils`.
- **Honest science:** UI copy reflects lossless vs lossy semantics (no false "quality" on PNG).

## Technology stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind v4 |
| Engine | Rust workspace (`image` crate, `wasm-bindgen`) — **12 Wasm crates** |
| Bridge | `wasm-pack` → `frontend/public/wasm/` |
| Concurrency | Web Workers |
| Offline | Serwist Service Worker (`@serwist/next`) |

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

Artifacts: `frontend/public/wasm/transmutador_*/` (gitignored; rebuild after engine changes).

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
cd frontend && npm test && npm run build
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
├── frontend/              # Next.js app (v3.2.9)
├── motor_transmutacion/   # Rust workspace (v1.6.0)
│   ├── core_utils/
│   ├── transmutador_jpg/         # JPEG → PNG
│   ├── transmutador_png/         # PNG → JPEG
│   ├── transmutador_webp/        # WebP → PNG / JPEG
│   ├── transmutador_encode/      # PNG / JPEG → WebP
│   ├── transmutador_gif/         # GIF → PNG / JPEG
│   ├── transmutador_bmp/         # BMP → PNG / JPEG
│   ├── transmutador_tiff/        # TIFF → PNG / JPEG
│   ├── transmutador_ico/         # ICO ↔ PNG
│   ├── transmutador_tga/         # TGA → PNG
│   ├── transmutador_avif/        # AVIF → PNG / JPEG
│   ├── transmutador_avif_encode/ # PNG / JPEG → AVIF
│   └── transmutador_svg/         # SVG → PNG / JPEG
├── docs/
│   ├── SPEC.md
│   ├── ROADMAP.md
│   ├── DEPLOY.md
│   ├── releases/                 # Per-version release notes (v3.2.x)
│   └── planning/                 # Tier roadmaps & spike results
├── CONTRIBUTING.md
└── scripts/
```

## Roadmap summary

| Phase | Version | Status |
|-------|---------|--------|
| **MVP** | v1.0.0 | ✅ JPEG ↔ PNG |
| **Tier 1 WebP suite** | v1.7.6 | ✅ Six tools |
| **Tier 2 Wave 1** | v1.8.3–v1.9.0 | ✅ GIF, BMP, limits, astro downscale |
| **Tier 2 Wave 2** | v1.10.4 | ✅ TIFF, ICO↔PNG, TGA→PNG |
| **Semantic Alpha Engine** | v1.11.0 | ✅ Honest transparency |
| **Visual Identity & UX shell** | v1.12.0 | ✅ ToolBrowser, Command Palette |
| **Tier 3 — modern formats + PWA** | v3.0.1 | ✅ AVIF, SVG, offline shell (21 tools) |
| **Tier 3.5 — Universal transmutator** | v3.1.x | ✅ Home-page format picker + handoff |
| **Tier 3.6.0 — tool-route batch** | v3.2.0–v3.2.3 | ✅ 14 raster slugs, sequential batch |
| **Tier 3.6.1 — universal batch** | v3.2.4+ | 🔄 Slice A+B ✅ · **Slice C** (mixed cohorts) ⏳ |
| **Tier 4a — optimization** | TBD | 📋 Compress, resize (metrics-first) |

Full detail: **[docs/ROADMAP.md](docs/ROADMAP.md)** · Architecture atlas: **[ARCHITECTURE.md](ARCHITECTURE.md)** · Multi-file plan: **[docs/planning/tier3_6_multi_file_plan.md](docs/planning/tier3_6_multi_file_plan.md)**

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
