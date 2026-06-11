//! Prepare-time alpha hints for the estimate path (E0.5).

use image::DynamicImage;

use super::assessment::{AlphaAssessment, AlphaConfidence};
use super::probe::dynamic_image_has_meaningful_alpha;

/// Sentinel `alpha_confidence` from Wasm/JS meaning “no hint — full raster scan”.
pub const WASM_ALPHA_HINT_NONE: u8 = 255;

/// Decode optional alpha hint passed from the frontend prepare phase.
pub fn assessment_from_wasm_hint(confidence: u8, meaningful: u8) -> Option<AlphaAssessment> {
    if confidence == WASM_ALPHA_HINT_NONE {
        return None;
    }
    let confidence = match confidence {
        0 => AlphaConfidence::None,
        1 => AlphaConfidence::Structural,
        2 => AlphaConfidence::Sampled,
        3 => AlphaConfidence::Full,
        _ => return None,
    };
    Some(AlphaAssessment {
        has_alpha_channel: confidence != AlphaConfidence::None,
        has_meaningful_alpha: meaningful != 0,
        confidence,
    })
}

/// Resolve whether meaningful alpha flattening is needed for **estimate** encoding.
///
/// Trusts prepare-time `sampled` / `full` assessments to skip a full raster scan.
/// Transmute paths must continue calling `dynamic_image_has_meaningful_alpha` directly.
pub fn meaningful_alpha_for_estimate(img: &DynamicImage, hint: Option<AlphaAssessment>) -> bool {
    if let Some(h) = hint {
        match h.confidence {
            AlphaConfidence::Sampled | AlphaConfidence::Full => return h.has_meaningful_alpha,
            AlphaConfidence::None => return false,
            AlphaConfidence::Structural => {}
        }
    }
    dynamic_image_has_meaningful_alpha(img)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba};

    #[test]
    fn none_hint_means_full_scan() {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_fn(4, 4, |x, _| {
                if x == 0 {
                    Rgba([0, 0, 0, 0])
                } else {
                    Rgba([255, 255, 255, 255])
                }
            });
        let dynamic = DynamicImage::ImageRgba8(img);
        assert!(meaningful_alpha_for_estimate(&dynamic, None));
    }

    #[test]
    fn sampled_opaque_hint_skips_scan() {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_fn(4, 4, |x, _| {
                if x == 0 {
                    Rgba([0, 0, 0, 0])
                } else {
                    Rgba([255, 255, 255, 255])
                }
            });
        let dynamic = DynamicImage::ImageRgba8(img);
        let hint = AlphaAssessment::sampled(true, false);
        assert!(!meaningful_alpha_for_estimate(&dynamic, Some(hint)));
    }
}
