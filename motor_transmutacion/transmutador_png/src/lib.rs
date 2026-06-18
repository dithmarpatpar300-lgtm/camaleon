//! PNG → JPEG transmutator. Decodes PNG, re-encodes as JPEG.
//!
//! ## Alpha flatten policy
//!
//! Default background: **white `#FFFFFF`** (SPEC §5.5.2).
//! RGBA pixels are composited onto the background using standard
//! alpha blending before JPEG encode (JPEG has no alpha channel).
//! Opaque RGB sources are encoded directly without a flatten pass.
//!
//! ## Quality
//!
//! Default JPEG quality: **85** (SPEC §5.5.3). Configurable via
//! `transmutar_png_a_jpg_with_quality` (1–100). The original
//! `transmutar_png_a_jpg` export uses defaults (white background + Q85).
//!
//! ## Background selection
//!
//! Background color for alpha flatten is selectable via
//! `transmutar_png_a_jpg_with_options(bytes, quality, r, g, b)`.
//! Each channel is `u8` (0–255). Default remains white `#FFFFFF`.
//!
//! ## Chroma subsampling
//!
//! The `image` crate `JpegEncoder` (v0.25) defaults to **4:2:0**
//! chroma subsampling, which is appropriate for photographic content
//! (SPEC §5.5.3). A `4:4:4` toggle is deferred post-MVP.
//!
//! ## Metadata
//!
//! StripAll (SPEC §5.10). Decode→encode does not copy source
//! tEXt/eXIf/iCCP chunks.

use std::io::Cursor;

use core_utils::semantic_alpha::{
    assess_dynamic_image_probe, assessment_from_wasm_hint, dynamic_image_has_meaningful_alpha,
    meaningful_alpha_for_estimate, png_has_alpha_channel,
    AlphaAssessment, AlphaAssessmentJs,
};
use image::codecs::jpeg::JpegEncoder;
use image::ImageReader;
use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

pub const DEFAULT_JPEG_QUALITY: u8 = 85;
pub const MIN_JPEG_QUALITY: u8 = 1;
pub const MAX_JPEG_QUALITY: u8 = 100;

// ---------------------------------------------------------------------------
// Bounded newtypes (§5.11.4)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Quality(u8);

impl Quality {
    pub const DEFAULT: Quality = Quality(DEFAULT_JPEG_QUALITY);

    pub fn try_new(value: u8) -> Result<Self, String> {
        if value == 0 {
            return Err("JPEG quality must be at least 1".into());
        }
        if value > MAX_JPEG_QUALITY {
            return Err(format!(
                "JPEG quality {} exceeds maximum ({})",
                value, MAX_JPEG_QUALITY
            ));
        }
        Ok(Quality(value))
    }

    pub fn value(&self) -> u8 {
        self.0
    }
}

// ---------------------------------------------------------------------------
// Options types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BackgroundFill {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl BackgroundFill {
    pub const WHITE: BackgroundFill = BackgroundFill {
        r: 255,
        g: 255,
        b: 255,
    };
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PngToJpgOptions {
    pub quality: u8,
    pub background: BackgroundFill,
}

impl Default for PngToJpgOptions {
    fn default() -> Self {
        Self {
            quality: Quality::DEFAULT.value(),
            background: BackgroundFill::WHITE,
        }
    }
}

// ---------------------------------------------------------------------------
// Validation (kept for backward compat; newtype is preferred constructor)
// ---------------------------------------------------------------------------

pub fn validate_quality(quality: u8) -> Result<u8, String> {
    Quality::try_new(quality)?;
    Ok(quality)
}

// ---------------------------------------------------------------------------
// Core conversion
// ---------------------------------------------------------------------------

pub fn png_bytes_to_jpg_bytes(
    input: &[u8],
    options: &PngToJpgOptions,
) -> Result<Vec<u8>, String> {
    validate_quality(options.quality)?;

    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode PNG: {}", e))?;

    let encoded = if dynamic_image_has_meaningful_alpha(&img) {
        let rgba = img.to_rgba8();
        let bg = options.background;
        let rgb = core_utils::flatten_rgba::flatten_rgba_on_background(
            &rgba, bg.r, bg.g, bg.b,
        );
        encode_rgb_to_jpeg(&rgb, options.quality)?
    } else {
        encode_rgb_to_jpeg(&img.to_rgb8(), options.quality)?
    };

    Ok(encoded)
}

fn encode_rgb_to_jpeg(rgb: &image::RgbImage, quality: u8) -> Result<Vec<u8>, String> {
    let mut buf = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut buf, quality);
    encoder
        .encode_image(rgb)
        .map_err(|e| format!("Failed to encode JPEG: {}", e))?;
    Ok(buf.into_inner())
}

// ---------------------------------------------------------------------------
// Pipeline wrappers (validation + conversion)
// ---------------------------------------------------------------------------

pub fn transmutar_png_a_jpg_inner(
    input_bytes: &[u8],
    options: &PngToJpgOptions,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input_bytes)?;
    let output = png_bytes_to_jpg_bytes(input_bytes, options)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?;
    Ok(output)
}

// ---------------------------------------------------------------------------
// Wasm exports (backward-compatible)
// ---------------------------------------------------------------------------

pub fn assess_png_alpha(input: &[u8]) -> Result<AlphaAssessment, String> {
    core_utils::validate_input(input)?;
    let has_channel = png_has_alpha_channel(input);
    if !has_channel {
        return Ok(AlphaAssessment::OPAQUE);
    }
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode PNG: {}", e))?;
    Ok(assess_dynamic_image_probe(&img, true))
}

#[wasm_bindgen]
pub fn assess_alpha(input_bytes: &[u8]) -> Result<AlphaAssessmentJs, String> {
    Ok(AlphaAssessmentJs::from_assessment(assess_png_alpha(input_bytes)?))
}

#[wasm_bindgen]
pub fn transmutar_png_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_png_a_jpg_inner(input_bytes, &PngToJpgOptions::default())
}

#[wasm_bindgen]
pub fn transmutar_png_a_jpg_with_quality(
    input_bytes: &[u8],
    quality: u8,
) -> Result<Vec<u8>, String> {
    validate_quality(quality)?;
    let options = PngToJpgOptions {
        quality,
        background: BackgroundFill::WHITE,
    };
    transmutar_png_a_jpg_inner(input_bytes, &options)
}

#[wasm_bindgen]
pub fn transmutar_png_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    validate_quality(quality)?;
    let options = PngToJpgOptions {
        quality,
        background: BackgroundFill {
            r: bg_r,
            g: bg_g,
            b: bg_b,
        },
    };
    transmutar_png_a_jpg_inner(input_bytes, &options)
}

// ---------------------------------------------------------------------------
// Size-only estimate (Phase B — CountingWriter, no output allocation)
// ---------------------------------------------------------------------------

use core_utils::counting_writer::CountingWriter;

#[wasm_bindgen]
pub fn estimate_png_to_jpg_size(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    alpha_confidence: u8,
    alpha_meaningful: u8,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_quality(quality)?;

    let img = ImageReader::new(Cursor::new(input_bytes))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode PNG: {}", e))?;

    let alpha_hint = assessment_from_wasm_hint(alpha_confidence, alpha_meaningful);
    let bg = BackgroundFill { r: bg_r, g: bg_g, b: bg_b };
    let rgb = if meaningful_alpha_for_estimate(&img, alpha_hint) {
        let rgba = img.to_rgba8();
        core_utils::flatten_rgba::flatten_rgba_on_background(&rgba, bg.r, bg.g, bg.b)
    } else {
        img.to_rgb8()
    };

    let mut writer = CountingWriter::default();
    let mut encoder = JpegEncoder::new_with_quality(&mut writer, quality);
    encoder
        .encode_image(&rgb)
        .map_err(|e| format!("Failed to encode JPEG: {}", e))?;

    Ok(writer.bytes_written as u32)
}

#[wasm_bindgen]
pub fn set_session_input_limit(max_bytes: u32) {
    core_utils::set_session_max_input_bytes(max_bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}

#[wasm_bindgen]
pub fn set_risk_mode(enabled: bool) {
    core_utils::set_risk_mode(enabled);
}
