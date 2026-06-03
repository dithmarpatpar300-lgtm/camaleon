# 🦎 Camaleon (v0.1.0)

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

## 📂 Ecosystem Architecture
- `/frontend`: Presentation layer and browser thread management.
- `/motor_transmutacion`: Isolated native modules bounded by responsibility.
  - `core_utils`: Global error handling and shared utilities.
  - `transmutador_jpg`: Dedicated logic for `.jpg`/`.jpeg` to `.png` mutation.

## 🗺️ Roadmap - Initial Phase
- [x] Monorepo Architecture Base (v0.1.0)
- [ ] Wasm Build Pipeline Implementation (`wasm-pack`)
- [ ] Web Worker Integration in Next.js for Byte Communication
- [ ] Functional MVP: Local Transmutation of `.jpg` to `.png`
- [ ] Advanced Modules: Format Inversion (`png2jpg`), WebP, and Adaptive Compression.

## 🤝 Contributing
Designed modularly from Day 0, adding a new format requires only generating a new crate within the Rust Workspace and exposing its Wasm interface. Contribution guidelines to follow.

---
License: MIT
