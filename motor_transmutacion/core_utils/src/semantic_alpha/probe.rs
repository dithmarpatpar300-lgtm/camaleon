//! Prepare-time probe: downscale + sampled semantic scan.

use image::imageops::FilterType;
use image::{DynamicImage, RgbaImage};

use super::assessment::{AlphaAssessment, AlphaConfidence};
use super::raster::{
    rgba_has_meaningful_alpha, rgba_has_meaningful_alpha_sampled, MAX_ALPHA_PROBE_SAMPLES,
    MAX_PROBE_EDGE,
};

pub fn resize_rgba_for_probe(rgba: &RgbaImage) -> RgbaImage {
    let (w, h) = rgba.dimensions();
    let max_edge = w.max(h);
    if max_edge <= MAX_PROBE_EDGE {
        return rgba.clone();
    }
    let scale = MAX_PROBE_EDGE as f32 / max_edge as f32;
    let nw = ((w as f32 * scale).round() as u32).max(1);
    let nh = ((h as f32 * scale).round() as u32).max(1);
    image::imageops::resize(rgba, nw, nh, FilterType::Triangle)
}

pub fn assess_rgba_probe(rgba: &RgbaImage, has_alpha_channel: bool) -> AlphaAssessment {
    if !has_alpha_channel {
        return AlphaAssessment::OPAQUE;
    }
    let probe = resize_rgba_for_probe(rgba);
    let meaningful =
        rgba_has_meaningful_alpha_sampled(&probe, MAX_ALPHA_PROBE_SAMPLES);
    AlphaAssessment {
        has_alpha_channel: true,
        has_meaningful_alpha: meaningful,
        confidence: AlphaConfidence::Sampled,
    }
}

/// Probe assessment from a decoded image (prepare phase).
pub fn assess_dynamic_image_probe(
    img: &DynamicImage,
    has_alpha_channel: bool,
) -> AlphaAssessment {
    if !has_alpha_channel {
        return AlphaAssessment::OPAQUE;
    }
    assess_rgba_probe(&img.to_rgba8(), true)
}

/// Full-raster semantic check (encode phase).
pub fn dynamic_image_has_meaningful_alpha(img: &DynamicImage) -> bool {
    if !img.color().has_alpha() {
        return false;
    }
    rgba_has_meaningful_alpha(&img.to_rgba8())
}
