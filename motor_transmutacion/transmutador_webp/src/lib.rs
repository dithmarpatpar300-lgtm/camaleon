//! WebP → PNG transmutator. Decodes WebP (lossy or lossless), re-encodes as PNG.
//!
//! Also supports WebP → JPEG with alpha flatten (white background default).
//!
//! ## Color-type policy
//! Output PNG is RGBA (color type 6) if source has alpha, RGB (color type 2) if not.
//! JPEG output always flattens alpha onto the chosen background.
//!
//! ## Compression / Quality
//! PNG: default DEFLATE compression level **6** (1–9).
//! JPEG: default quality **85** (1–100), white background, chroma 4:2:0.
//!
//! ## Metadata
//! StripAll (SPEC §5.10). Decode→encode does not copy source metadata.

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use core_utils::semantic_alpha::{
    assess_dynamic_image_probe, assessment_from_wasm_hint, dynamic_image_has_meaningful_alpha,
    meaningful_alpha_for_estimate, webp_has_alpha_channel,
    AlphaAssessment, AlphaAssessmentJs,
};
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{ExtendedColorType, ImageEncoder, ImageReader};
use wasm_bindgen::prelude::*;

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

pub const DEFAULT_QUALITY: u8 = 85;
pub const MIN_QUALITY: u8 = 1;
pub const MAX_QUALITY: u8 = 100;

fn validate_compression(c: u8) -> Result<u8, String> {
    if c == 0 { return Err("PNG compression level must be at least 1".into()); }
    if c > MAX_COMPRESSION { return Err(format!("PNG compression level {} exceeds maximum ({})", c, MAX_COMPRESSION)); }
    Ok(c)
}

fn validate_quality(q: u8) -> Result<u8, String> {
    if q == 0 { return Err("JPEG quality must be at least 1".into()); }
    if q > MAX_QUALITY { return Err(format!("JPEG quality {} exceeds maximum ({})", q, MAX_QUALITY)); }
    Ok(q)
}

fn webp_bytes_to_png_bytes(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt WebP data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode WebP: {}", e))?;

    let has_alpha = dynamic_image_has_meaningful_alpha(&img);

    let mut buf = Cursor::new(Vec::new());
    let encoder = PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if has_alpha {
        let rgba = img.to_rgba8();
        encoder
            .write_image(rgba.as_raw(), rgba.width(), rgba.height(), ExtendedColorType::Rgba8)
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    } else {
        let rgb = img.to_rgb8();
        encoder
            .write_image(rgb.as_raw(), rgb.width(), rgb.height(), ExtendedColorType::Rgb8)
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    }

    Ok(buf.into_inner())
}

pub fn transmutar_webp_a_png_inner(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_compression(compression)?;
    let output = webp_bytes_to_png_bytes(input, compression)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

pub fn assess_webp_alpha(input: &[u8]) -> Result<AlphaAssessment, String> {
    core_utils::validate_input(input)?;
    let structural = webp_has_alpha_channel(input);
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt WebP data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode WebP: {}", e))?;
    let has_channel = structural || img.color().has_alpha();
    Ok(assess_dynamic_image_probe(&img, has_channel))
}

#[wasm_bindgen]
pub fn assess_alpha(input_bytes: &[u8]) -> Result<AlphaAssessmentJs, String> {
    Ok(AlphaAssessmentJs::from_assessment(assess_webp_alpha(input_bytes)?))
}

#[wasm_bindgen]
pub fn transmutar_webp_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_webp_a_png_inner(input_bytes, DEFAULT_COMPRESSION)
}

#[wasm_bindgen]
pub fn transmutar_webp_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
) -> Result<Vec<u8>, String> {
    transmutar_webp_a_png_inner(input_bytes, compression)
}

#[wasm_bindgen]
pub fn estimate_webp_to_png_size(
    input_bytes: &[u8],
    compression: u8,
    alpha_confidence: u8,
    alpha_meaningful: u8,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;
    let img = ImageReader::new(Cursor::new(input_bytes))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt WebP data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode WebP: {}", e))?;

    let alpha_hint = assessment_from_wasm_hint(alpha_confidence, alpha_meaningful);
    let has_alpha = meaningful_alpha_for_estimate(&img, alpha_hint);
    let mut writer = CountingWriter::default();
    let encoder = PngEncoder::new_with_quality(
        &mut writer,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if has_alpha {
        let rgba = img.to_rgba8();
        encoder
            .write_image(rgba.as_raw(), rgba.width(), rgba.height(), ExtendedColorType::Rgba8)
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    } else {
        let rgb = img.to_rgb8();
        encoder
            .write_image(rgb.as_raw(), rgb.width(), rgb.height(), ExtendedColorType::Rgb8)
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    }

    Ok(writer.bytes_written as u32)
}

// ---------------------------------------------------------------------------
// WebP → JPEG exports
// ---------------------------------------------------------------------------

fn webp_bytes_to_jpg_bytes(input: &[u8], quality: u8, bg_r: u8, bg_g: u8, bg_b: u8) -> Result<Vec<u8>, String> {
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt WebP data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode WebP: {}", e))?;

    let rgb = if dynamic_image_has_meaningful_alpha(&img) {
        let rgba = img.to_rgba8();
        core_utils::flatten_rgba::flatten_rgba_on_background(&rgba, bg_r, bg_g, bg_b)
    } else {
        img.to_rgb8()
    };

    let mut buf = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut buf, quality);
    encoder.encode_image(&rgb).map_err(|e| format!("Failed to encode JPEG: {}", e))?;
    Ok(buf.into_inner())
}

pub fn transmutar_webp_a_jpg_inner(input: &[u8], quality: u8, bg_r: u8, bg_g: u8, bg_b: u8) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_quality(quality)?;
    let output = webp_bytes_to_jpg_bytes(input, quality, bg_r, bg_g, bg_b)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_webp_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_webp_a_jpg_inner(input_bytes, DEFAULT_QUALITY, 255, 255, 255)
}

#[wasm_bindgen]
pub fn transmutar_webp_a_jpg_with_options(
    input_bytes: &[u8], quality: u8, bg_r: u8, bg_g: u8, bg_b: u8,
) -> Result<Vec<u8>, String> {
    transmutar_webp_a_jpg_inner(input_bytes, quality, bg_r, bg_g, bg_b)
}

#[wasm_bindgen]
pub fn estimate_webp_to_jpg_size(
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
        .map_err(|e| format!("Invalid or corrupt WebP data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode WebP: {}", e))?;

    let alpha_hint = assessment_from_wasm_hint(alpha_confidence, alpha_meaningful);
    let rgb = if meaningful_alpha_for_estimate(&img, alpha_hint) {
        let rgba = img.to_rgba8();
        core_utils::flatten_rgba::flatten_rgba_on_background(&rgba, bg_r, bg_g, bg_b)
    } else {
        img.to_rgb8()
    };

    let mut writer = CountingWriter::default();
    let mut encoder = JpegEncoder::new_with_quality(&mut writer, quality);
    encoder.encode_image(&rgb).map_err(|e| format!("Failed to encode JPEG: {}", e))?;
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
