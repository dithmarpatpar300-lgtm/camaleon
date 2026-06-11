//! Semantic Alpha Engine — shared types and pixel policy (SPEC §5.5.3).

mod alpha_scan;
mod assessment;
mod channels;
mod hint;
mod probe;
mod raster;

pub use assessment::{AlphaAssessment, AlphaConfidence};
pub use hint::{
    assessment_from_wasm_hint, meaningful_alpha_for_estimate, WASM_ALPHA_HINT_NONE,
};
pub use channels::{gif_has_alpha_channel, png_has_alpha_channel, webp_has_alpha_channel};
pub use probe::{
    assess_dynamic_image_probe, assess_rgba_probe, dynamic_image_has_meaningful_alpha,
    resize_rgba_for_probe,
};
pub use raster::{
    rgba_has_meaningful_alpha, rgba_has_meaningful_alpha_sampled,
    sample_bgra_bytes_meaningful_alpha, MAX_ALPHA_PROBE_SAMPLES, MAX_PROBE_EDGE,
};

#[cfg(feature = "wasm")]
pub mod wasm;
#[cfg(feature = "wasm")]
pub use wasm::AlphaAssessmentJs;
