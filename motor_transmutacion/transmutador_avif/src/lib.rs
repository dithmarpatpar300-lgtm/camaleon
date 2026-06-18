//! AVIF → PNG/JPEG transmutator (Tier 3 Phase 3.1).
//!
//! Decode via zenavif (pure Rust rav1d-safe); re-encode PNG/JPEG with configurable options.
//! PNG/JPEG → AVIF encode lives in `transmutador_avif_encode` (Phase 3.2+).
//! Metadata strip: StripAll (SPEC §5.10) — HEIF EXIF/XMP/ICC not propagated.

mod avif_container;
mod avif_decode;
mod avif_diagnose;
mod avif_probe;
mod avif_session;

pub use avif_container::normalize_avif_input;

pub use avif_diagnose::{diagnose_avif, AvifDiagnosis};

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use core_utils::semantic_alpha::{
    assess_dynamic_image_probe, assessment_from_wasm_hint, dynamic_image_has_meaningful_alpha,
    meaningful_alpha_for_estimate, AlphaAssessment, AlphaAssessmentJs,
};
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{DynamicImage, ExtendedColorType, ImageEncoder};
pub use avif_decode::{decode_avif_frame_to_dynamic, decode_avif_to_dynamic, verify_avif_decodable};
pub use avif_probe::{inspect_and_validate, inspect_avif, validate_frame_index, AvifInfo};
pub use avif_session::{open_avif_session, open_avif_session_with_progress, AvifSession};
use wasm_bindgen::prelude::*;

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

pub const DEFAULT_QUALITY: u8 = 85;
pub const MIN_QUALITY: u8 = 1;
pub const MAX_QUALITY: u8 = 100;

#[wasm_bindgen]
pub struct AvifMeta {
    inner: AvifInfo,
}

#[wasm_bindgen]
impl AvifMeta {
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
    pub fn is_sequence(&self) -> bool {
        self.inner.is_sequence
    }

    #[wasm_bindgen(getter)]
    pub fn frame_count(&self) -> u32 {
        self.inner.frame_count
    }

    #[wasm_bindgen(getter)]
    pub fn lossless(&self) -> bool {
        self.inner.lossless.unwrap_or(false)
    }
}

#[wasm_bindgen]
pub fn inspect_avif_meta(input_bytes: &[u8]) -> Result<AvifMeta, String> {
    core_utils::validate_input(input_bytes)?;
    let info = inspect_and_validate(input_bytes)?;
    verify_avif_decodable(input_bytes)?;
    Ok(AvifMeta { inner: info })
}

fn validate_quality(q: u8) -> Result<u8, String> {
    if q == 0 {
        return Err("JPEG quality must be at least 1".into());
    }
    if q > MAX_QUALITY {
        return Err(format!(
            "JPEG quality {} exceeds maximum ({})",
            q, MAX_QUALITY
        ));
    }
    Ok(q)
}

fn validate_compression(c: u8) -> Result<u8, String> {
    if c == 0 {
        return Err("PNG compression level must be at least 1".into());
    }
    if c > MAX_COMPRESSION {
        return Err(format!(
            "PNG compression level {} exceeds maximum ({})",
            c, MAX_COMPRESSION
        ));
    }
    Ok(c)
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

fn avif_bytes_to_png_bytes(
    input: &[u8],
    compression: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    let img = decode_avif_frame_to_dynamic(input, frame_index)?;
    encode_png_from_dynamic(&img, compression)
}

pub fn transmutar_avif_a_png_inner(
    input: &[u8],
    compression: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_compression(compression)?;
    let info = inspect_and_validate(input)?;
    validate_frame_index(info.frame_count, frame_index)?;

    let output = avif_bytes_to_png_bytes(input, compression, frame_index)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_avif_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_avif_a_png_inner(input_bytes, DEFAULT_COMPRESSION, 0)
}

#[wasm_bindgen]
pub fn transmutar_avif_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_avif_a_png_inner(input_bytes, compression, frame_index)
}

#[wasm_bindgen]
pub fn decode_avif_preview_png(input_bytes: &[u8], frame_index: u32) -> Result<Vec<u8>, String> {
    transmutar_avif_a_png_inner(input_bytes, 1, frame_index)
}

#[wasm_bindgen]
pub fn estimate_avif_to_png_size(
    input_bytes: &[u8],
    compression: u8,
    frame_index: u32,
    alpha_confidence: u8,
    alpha_meaningful: u8,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;
    let info = inspect_and_validate(input_bytes)?;
    validate_frame_index(info.frame_count, frame_index)?;

    let img = decode_avif_frame_to_dynamic(input_bytes, frame_index)?;
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

    Ok(writer.bytes_written as u32)
}

pub fn assess_avif_alpha(input: &[u8]) -> Result<AlphaAssessment, String> {
    core_utils::validate_input(input)?;
    let info = inspect_and_validate(input)?;
    if !info.has_alpha_channel {
        return Ok(AlphaAssessment::OPAQUE);
    }
    let img = decode_avif_frame_to_dynamic(input, 0)?;
    Ok(assess_dynamic_image_probe(&img, true))
}

#[wasm_bindgen]
pub fn assess_alpha(input_bytes: &[u8]) -> Result<AlphaAssessmentJs, String> {
    Ok(AlphaAssessmentJs::from_assessment(assess_avif_alpha(input_bytes)?))
}

fn avif_bytes_to_jpg_bytes(
    input: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    let img = decode_avif_frame_to_dynamic(input, frame_index)?;

    let rgb = if dynamic_image_has_meaningful_alpha(&img) {
        let rgba = img.to_rgba8();
        core_utils::flatten_rgba::flatten_rgba_on_background(&rgba, bg_r, bg_g, bg_b)
    } else {
        img.to_rgb8()
    };

    let mut buf = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut buf, quality);
    encoder
        .encode_image(&rgb)
        .map_err(|e| format!("Failed to encode JPEG: {}", e))?;
    Ok(buf.into_inner())
}

pub fn transmutar_avif_a_jpg_inner(
    input: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_quality(quality)?;
    let info = inspect_and_validate(input)?;
    validate_frame_index(info.frame_count, frame_index)?;

    let output = avif_bytes_to_jpg_bytes(input, quality, bg_r, bg_g, bg_b, frame_index)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_avif_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_avif_a_jpg_inner(input_bytes, DEFAULT_QUALITY, 255, 255, 255, 0)
}

#[wasm_bindgen]
pub fn transmutar_avif_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_avif_a_jpg_inner(input_bytes, quality, bg_r, bg_g, bg_b, frame_index)
}

#[wasm_bindgen]
pub fn estimate_avif_to_jpg_size(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    frame_index: u32,
    alpha_confidence: u8,
    alpha_meaningful: u8,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_quality(quality)?;
    let info = inspect_and_validate(input_bytes)?;
    validate_frame_index(info.frame_count, frame_index)?;

    let img = decode_avif_frame_to_dynamic(input_bytes, frame_index)?;
    let alpha_hint = assessment_from_wasm_hint(alpha_confidence, alpha_meaningful);
    let rgb = if meaningful_alpha_for_estimate(&img, alpha_hint) {
        let rgba = img.to_rgba8();
        core_utils::flatten_rgba::flatten_rgba_on_background(&rgba, bg_r, bg_g, bg_b)
    } else {
        img.to_rgb8()
    };

    let mut writer = CountingWriter::default();
    let mut encoder = JpegEncoder::new_with_quality(&mut writer, quality);
    encoder
        .encode_image(&rgb)
        .map_err(|e| format!("Failed to estimate JPEG size: {}", e))?;
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
