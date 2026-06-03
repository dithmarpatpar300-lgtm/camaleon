# 🦎 Camaleon (v0.5.5)

> **"Matter is neither created nor destroyed, it is only transmuted."**

Camaleon is an open-source web platform engineered for ultra-fast, modular, and **100% private** file format transmutation. 

Bypassing traditional server-side processing, Camaleon executes computationally intensive conversions directly within the browser. It leverages local hardware via high-performance **WebAssembly** modules running asynchronously on Web Workers.

## 🚀 Core Features
- **Privacy by Design:** Zero external servers. Zero logs. Absolute security.
- **Native Performance:** Core engine written in Rust, compiled to WebAssembly (Wasm).
- **Immersive UI:** Modern, fluid interface built with Next.js, TypeScript, and Tailwind CSS.
- **Asynchronous Architecture:** Heavy processing is delegated to Web Workers, guaranteeing a locked 60fps UI.

## 🛠️ Technology Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Core Engine:** Rust (Modular Workspace).
- **High-Performance Bridge:** WebAssembly (`wasm-bindgen` / `wasm-pack`).
- **Concurrency:** Web Workers API.

## 🔧 Building Wasm

The core transmutation engine is compiled to WebAssembly via `wasm-pack`.

**Prerequisites:** [Rust](https://rustup.rs) and [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/).

```bash
# From repository root (PowerShell)
.\scripts\build-wasm.ps1

# From repository root (Unix / CI)
./scripts/build-wasm.sh

# Or from the frontend directory via npm
cd frontend && npm run build:wasm
```

Artifacts are written to `frontend/public/wasm/transmutador_jpg/` and served as static assets by Next.js.

## 🖥️ Development

```bash
# 1. Build both Wasm modules
npm run build:wasm        # from frontend/
# or
.\scripts\build-wasm.ps1  # from repo root (PowerShell)
./scripts/build-wasm.sh   # from repo root (Unix)

# 2. Start the Next.js dev server
cd frontend && npm run dev

# 3. Open http://localhost:3000 — drop a .jpg, .jpeg, or .png to transmute it
```

## 📂 Ecosystem Architecture
- `/frontend`: Presentation layer and browser thread management.
- `/motor_transmutacion`: Isolated native modules bounded by responsibility.
  - `core_utils`: Global error handling and shared utilities.
  - `transmutador_jpg`: `.jpg`/`.jpeg` → `.png` transmutation.
  - `transmutador_png`: `.png` → `.jpg`/`.jpeg` transmutation.
- `/docs`: Project governance — **[SPEC](docs/SPEC.md)** (§5 Science, §5.10 Metadata Policy), **[ROADMAP](docs/ROADMAP.md)**, **[GOVERNANCE](docs/GOVERNANCE.md)**.

## 🗺️ Roadmap — Summary

Full phased plan: **[docs/ROADMAP.md](docs/ROADMAP.md)**

| Phase | Version | Goal |
|-------|---------|------|
| Foundation | v0.1.0 ✅ | Monorepo bootstrap |
| Build & Bridge | v0.2.0 ✅ | `wasm-pack` pipeline + Web Workers |
| JPG → PNG | v0.3.0 ✅ | `transmutador_jpg` functional |
| PNG → JPG | v0.4.0 ✅ | `transmutador_png` functional |
| **MVP** | **v1.0.0** | **Bidirectional JPEG ↔ PNG in browser** |

## 🤝 Contributing
Designed modularly from Day 0, adding a new format requires only generating a new crate within the Rust Workspace and exposing its Wasm interface. Contribution guidelines to follow.

---
License: MIT
