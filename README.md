# 🦎 Camaleon

> **"Matter is neither created nor destroyed, it is only transmuted."**

**v1.7.8** (App) · Engine v1.4.1 · [SPEC](docs/SPEC.md) · [ROADMAP](docs/ROADMAP.md)

Camaleon is an open-source, browser-local platform for **privacy-first** image format transmutation. Conversion runs entirely on your device via Rust/WebAssembly in Web Workers — no file bytes are uploaded to any server.

## What works today (v1.7.8)

| Capability | Status |
|------------|--------|
| **JPG / JPEG ↔ PNG** | Lossless PNG compression (1–9); JPEG quality (1–100); alpha flatten |
| **WebP suite** | WebP→PNG/JPG; PNG/JPEG→WebP (lossless WebP) |
| **Six active tools** | Landing grid + `/transmute/[slug]` per conversion |
| **Staged transmutation flow** | Drop → adjust options → Transmutar → preview + size delta → download |
| **EN / ES** | Full UI i18n with persisted locale |
| **Legal pages** | `/about`, `/contact`, `/privacy`, `/terms` (bilingual) |
| **Dark / light theme** | Design tokens, no-FOUC persistence |
| **CI** | GitHub Actions: `cargo test --workspace` + `build:wasm` + `npm run build` |
| **Privacy** | StripAll metadata default; 100% local processing |

Next: public deploy, Tier 2 formats (v1.8.x). See [docs/ROADMAP.md](docs/ROADMAP.md).

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

Artifacts: `frontend/public/wasm/transmutador_{jpg,png,webp,encode}/` (gitignored; rebuild after engine changes).

## Development

```bash
# 1. Build both Wasm modules (required after motor_transmutacion changes)
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

## Repository layout

```
camaleon/
├── frontend/              # Next.js app (v1.7.8)
├── motor_transmutacion/     # Rust workspace (v1.4.1)
│   ├── core_utils/          # Validation, output integrity, metadata scanners
│   ├── transmutador_jpg/    # JPEG → PNG
│   ├── transmutador_png/    # PNG → JPEG
│   ├── transmutador_webp/   # WebP → PNG / JPEG
│   └── transmutador_encode/ # PNG / JPEG → WebP
├── docs/
│   ├── SPEC.md              # Architecture bible (v1.7.0)
│   ├── ROADMAP.md           # Phases + MVP criteria
│   ├── GOVERNANCE.md        # Agent workflow
│   ├── prompts/             # OpenCode task prompts
│   └── reports/             # OpenCode technical reports
└── scripts/                 # build-wasm.ps1 / .sh
```

## Roadmap summary

| Phase | Version | Status |
|-------|---------|--------|
| Foundation | v0.1.0 | ✅ |
| Build & Bridge | v0.2.0 | ✅ |
| JPG → PNG | v0.3.0 | ✅ |
| PNG → JPG | v0.4.0 | ✅ |
| Engine hardening | v0.5.1–v0.6.6 | ✅ |
| UI track (UI-1..UI-4) | v0.6.1–v0.6.4 | ✅ |
| **MVP** | **v1.0.0** | ✅ Shipped (UI-5 baseline + CI) |
| **Tier 1 WebP suite** | **v1.7.6** | ✅ Six active tools |
| **Launch baseline** | **v1.7.8** | ✅ Legal pages + footer |

Full detail: **[docs/ROADMAP.md](docs/ROADMAP.md)**

## Contributing

The project is modular by design: a new format = one registry entry + one Rust crate + one Worker route + Wasm build. Contribution guidelines (`CONTRIBUTING.md`) are planned post-v1.0.0.

---

License: MIT
