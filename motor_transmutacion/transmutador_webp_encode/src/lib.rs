//! Picture-VP8 — Pure Rust VP8 intra-frame lossy encoder for WebP.
//!
//! Implements the VP8 keyframe (intra-frame) encoding subset of RFC 6386
//! to produce WebP lossy files. No C dependencies — pure Rust, compiled
//! to `wasm32-unknown-unknown` via `wasm-pack build --target web`.
//!
//! ## Pipeline
//!
//! ```text
//! RGB → YUV 4:2:0 → Macroblock partition → Intra prediction →
//! Residual → Forward DCT 4×4 → WHT 4×4 (luma DC) → Quantization →
//! Zig-zag scan → Boolean arithmetic coder → Bitstream → RIFF container
//! ```
//!
//! ## Phase 0 status
//!
//! Phase 0 implements and validates the two hardest components:
//! - `bac.rs` — Boolean arithmetic encoder (BAC)
//! - `fdct.rs` — Forward DCT 4×4 + Walsh-Hadamard Transform 4×4
//! - `probabilities.rs` — RFC 6386 §19 constant probability tables
//!
//! The full encoding pipeline is stubbed and will be implemented in
//! Phase 1 (MVP: DC_PRED encoder).

pub mod bac;
pub mod fdct;
pub mod probabilities;

// --- Phase 1+ modules (stubbed for now) ---
pub mod error;

// ---------------------------------------------------------------------------
// Wasm exports (Phase 4 — Camaleon integration)
// ---------------------------------------------------------------------------

use wasm_bindgen::prelude::*;

/// Placeholder Wasm export. Will be implemented in Phase 4.
#[wasm_bindgen]
pub fn set_session_input_limit(_max_bytes: u32) {}

/// Placeholder Wasm export. Will be implemented in Phase 4.
#[wasm_bindgen]
pub fn reset_session_input_limit() {}

/// Placeholder Wasm export. Will be implemented in Phase 4.
#[wasm_bindgen]
pub fn set_risk_mode(_enabled: bool) {}
