//! HEIC/HEIF → PNG/JPEG transmutator (Tier 3 Phase 3.4).
//!
//! Decode via pure-Rust `heic` crate; re-encode with `image` PNG/JPEG encoders.
//! Spike backend: `heic` 0.1.6 (`default-features = false`, `std` only).

mod heic_decode;
mod heic_probe;
mod heic_validate;

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use core_utils::flatten_rgba::flatten_rgba_on_background;
use core_utils::semantic_alpha::{
    assess_dynamic_image_probe, assessment_from_wasm_hint, dynamic_image_has_meaningful_alpha,
    meaningful_alpha_for_estimate, AlphaAssessment, AlphaAssessmentJs,
};
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{DynamicImage, ExtendedColorType, ImageEncoder, RgbImage};
use wasm_bindgen::prelude::*;

pub use heic_decode::{decode_heic_to_dynamic, verify_heic_decodable};
pub use heic_probe::{inspect_and_validate, inspect_heic, HeicInfo};
pub use heic_validate::{looks_like_heif, validate_heic_input};

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

pub const DEFAULT_QUALITY: u8 = 85;
pub const MIN_QUALITY: u8 = 1;
pub const MAX_QUALITY: u8 = 100;

#[wasm_bindgen]
pub struct HeicMeta {
    inner: HeicInfo,
}

#[wasm_bindgen]
impl HeicMeta {
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.inner.width
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.inner.height
    }

    #[wasm_bindgen(getter)]
    pub fn bit_depth(&self) -> u8 {
        self.inner.bit_depth
    }

    #[wasm_bindgen(getter)]
    pub fn has_alpha_channel(&self) -> bool {
        self.inner.has_alpha_channel
    }

    #[wasm_bindgen(getter)]
    pub fn has_thumbnail(&self) -> bool {
        self.inner.has_thumbnail
    }

    #[wasm_bindgen(getter)]
    pub fn has_depth_aux(&self) -> bool {
        self.inner.has_depth_aux
    }

    #[wasm_bindgen(getter)]
    pub fn has_hdr_gain_map(&self) -> bool {
        self.inner.has_hdr_gain_map
    }

    #[wasm_bindgen(getter)]
    pub fn has_exif(&self) -> bool {
        self.inner.has_exif
    }

    #[wasm_bindgen(getter)]
    pub fn brand(&self) -> String {
        self.inner.brand.clone()
    }
}

fn validate_compression(c: u8) -> Result<u8, String> {
    if c < MIN_COMPRESSION {
        return Err(format!("PNG compression level must be at least {}", MIN_COMPRESSION));
    }
    if c > MAX_COMPRESSION {
        return Err(format!(
            "PNG compression level {} exceeds maximum ({})",
            c, MAX_COMPRESSION
        ));
    }
    Ok(c)
}

fn validate_quality(q: u8) -> Result<u8, String> {
    if q < MIN_QUALITY {
        return Err(format!("JPEG quality must be at least {}", MIN_QUALITY));
    }
    if q > MAX_QUALITY {
        return Err(format!(
            "JPEG quality {} exceeds maximum ({})",
            q, MAX_QUALITY
        ));
    }
    Ok(q)
}

fn encode_png_from_dynamic(img: &DynamicImage, compression: u8) -> Result<Vec<u8>, String> {
    let meaningful_alpha = dynamic_image_has_meaningful_alpha(img);

    let mut buf = Cursor::new(Vec::new());
    let encoder = PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if meaningful_alpha {
        let rgba = img.to_rgba8();
        encoder
            .write_image(
                rgba.as_raw(),
                rgba.width(),
                rgba.height(),
                ExtendedColorType::Rgba8,
            )
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    } else {
        let rgb = img.to_rgb8();
        encoder
            .write_image(
                rgb.as_raw(),
                rgb.width(),
                rgb.height(),
                ExtendedColorType::Rgb8,
            )
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    }

    Ok(buf.into_inner())
}

fn encode_rgb_to_jpeg(rgb: &RgbImage, quality: u8) -> Result<Vec<u8>, String> {
    let mut buf = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut buf, quality);
    encoder
        .encode_image(rgb)
        .map_err(|e| format!("Failed to encode JPEG: {}", e))?;
    Ok(buf.into_inner())
}

pub fn transmutar_heic_a_png_inner(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    validate_heic_input(input)?;
    validate_compression(compression)?;
    inspect_and_validate(input)?;

    let img = decode_heic_to_dynamic(input)?;
    let output = encode_png_from_dynamic(&img, compression)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

pub fn transmutar_heic_a_jpg_inner(
    input: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    validate_heic_input(input)?;
    validate_quality(quality)?;
    inspect_and_validate(input)?;

    let img = decode_heic_to_dynamic(input)?;
    let rgb = if dynamic_image_has_meaningful_alpha(&img) {
        flatten_rgba_on_background(&img.to_rgba8(), bg_r, bg_g, bg_b)
    } else {
        img.to_rgb8()
    };

    let output = encode_rgb_to_jpeg(&rgb, quality)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?;
    Ok(output)
}

pub fn estimate_heic_to_png_inner(
    input: &[u8],
    compression: u8,
    alpha_confidence: u8,
    alpha_meaningful: u8,
) -> Result<u32, String> {
    validate_heic_input(input)?;
    validate_compression(compression)?;
    inspect_and_validate(input)?;

    let img = decode_heic_to_dynamic(input)?;
    let alpha_hint = assessment_from_wasm_hint(alpha_confidence, alpha_meaningful);
    let has_alpha = meaningful_alpha_for_estimate(&img, alpha_hint);

    let mut counter = CountingWriter::default();
    let encoder = PngEncoder::new_with_quality(
        &mut counter,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if has_alpha {
        let rgba = img.to_rgba8();
        encoder
            .write_image(
                rgba.as_raw(),
                rgba.width(),
                rgba.height(),
                ExtendedColorType::Rgba8,
            )
            .map_err(|e| format!("Failed to estimate PNG size: {}", e))?;
    } else {
        let rgb = img.to_rgb8();
        encoder
            .write_image(
                rgb.as_raw(),
                rgb.width(),
                rgb.height(),
                ExtendedColorType::Rgb8,
            )
            .map_err(|e| format!("Failed to estimate PNG size: {}", e))?;
    }

    Ok(counter.bytes_written as u32)
}

pub fn estimate_heic_to_jpg_inner(
    input: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    alpha_confidence: u8,
    alpha_meaningful: u8,
) -> Result<u32, String> {
    validate_heic_input(input)?;
    validate_quality(quality)?;
    inspect_and_validate(input)?;

    let img = decode_heic_to_dynamic(input)?;
    let alpha_hint = assessment_from_wasm_hint(alpha_confidence, alpha_meaningful);
    let rgb = if meaningful_alpha_for_estimate(&img, alpha_hint) {
        flatten_rgba_on_background(&img.to_rgba8(), bg_r, bg_g, bg_b)
    } else {
        img.to_rgb8()
    };

    let mut counter = CountingWriter::default();
    let mut encoder = JpegEncoder::new_with_quality(&mut counter, quality);
    encoder
        .encode_image(&rgb)
        .map_err(|e| format!("Failed to estimate JPEG size: {}", e))?;

    Ok(counter.bytes_written as u32)
}

pub fn assess_heic_alpha(input: &[u8]) -> Result<AlphaAssessment, String> {
    validate_heic_input(input)?;
    let info = inspect_and_validate(input)?;
    if !info.has_alpha_channel {
        return Ok(AlphaAssessment::OPAQUE);
    }
    let img = decode_heic_to_dynamic(input)?;
    Ok(assess_dynamic_image_probe(&img, true))
}

#[wasm_bindgen]
pub fn inspect_heic_meta(input_bytes: &[u8]) -> Result<HeicMeta, String> {
    validate_heic_input(input_bytes)?;
    let info = inspect_and_validate(input_bytes)?;
    verify_heic_decodable(input_bytes)?;
    Ok(HeicMeta { inner: info })
}

#[wasm_bindgen]
pub fn transmutar_heic_a_png(input_bytes: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    transmutar_heic_a_png_inner(input_bytes, compression)
}

#[wasm_bindgen]
pub fn transmutar_heic_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    transmutar_heic_a_jpg_inner(input_bytes, quality, bg_r, bg_g, bg_b)
}

#[wasm_bindgen]
pub fn estimate_heic_to_png_size(
    input_bytes: &[u8],
    compression: u8,
    alpha_confidence: u8,
    alpha_meaningful: u8,
) -> Result<u32, String> {
    estimate_heic_to_png_inner(input_bytes, compression, alpha_confidence, alpha_meaningful)
}

#[wasm_bindgen]
pub fn estimate_heic_to_jpg_size(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    alpha_confidence: u8,
    alpha_meaningful: u8,
) -> Result<u32, String> {
    estimate_heic_to_jpg_inner(
        input_bytes,
        quality,
        bg_r,
        bg_g,
        bg_b,
        alpha_confidence,
        alpha_meaningful,
    )
}

#[wasm_bindgen]
pub fn assess_heic_meaningful_alpha(input_bytes: &[u8]) -> Result<AlphaAssessmentJs, String> {
    Ok(AlphaAssessmentJs::from_assessment(assess_heic_alpha(input_bytes)?))
}

#[wasm_bindgen]
pub fn set_session_input_limit(bytes: u32) {
    core_utils::set_session_max_input_bytes(bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}

#[wasm_bindgen]
pub fn set_risk_mode(enabled: bool) {
    core_utils::set_risk_mode(enabled);
}

#[wasm_bindgen]
pub fn risk_mode_enabled() -> bool {
    core_utils::risk_mode_enabled()
}
