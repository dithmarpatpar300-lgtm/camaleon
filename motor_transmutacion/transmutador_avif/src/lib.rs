//! AVIF → PNG transmutator (Tier 3 Phase 3.1).
//!
//! Decode via zenavif (pure Rust rav1d-safe); re-encode PNG with configurable DEFLATE level.
//! Metadata strip: StripAll (SPEC §5.10) — HEIF EXIF/XMP/ICC not propagated.

mod avif_decode;
mod avif_probe;

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use core_utils::semantic_alpha::{
    assessment_from_wasm_hint, dynamic_image_has_meaningful_alpha, meaningful_alpha_for_estimate,
};
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{DynamicImage, ExtendedColorType, ImageEncoder};
pub use avif_decode::decode_avif_to_dynamic;
pub use avif_probe::{inspect_and_validate, inspect_avif, AvifInfo};
use wasm_bindgen::prelude::*;

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

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
    Ok(AvifMeta {
        inner: inspect_and_validate(input_bytes)?,
    })
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

fn avif_bytes_to_png_bytes(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    let img = decode_avif_to_dynamic(input)?;
    encode_png_from_dynamic(&img, compression)
}

pub fn transmutar_avif_a_png_inner(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_compression(compression)?;
    inspect_and_validate(input)?;

    let output = avif_bytes_to_png_bytes(input, compression)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_avif_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_avif_a_png_inner(input_bytes, DEFAULT_COMPRESSION)
}

#[wasm_bindgen]
pub fn transmutar_avif_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
) -> Result<Vec<u8>, String> {
    transmutar_avif_a_png_inner(input_bytes, compression)
}

#[wasm_bindgen]
pub fn decode_avif_preview_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_avif_a_png_inner(input_bytes, 1)
}

#[wasm_bindgen]
pub fn estimate_avif_to_png_size(
    input_bytes: &[u8],
    compression: u8,
    alpha_confidence: u8,
    alpha_meaningful: u8,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;
    inspect_and_validate(input_bytes)?;

    let img = decode_avif_to_dynamic(input_bytes)?;
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

#[wasm_bindgen]
pub fn set_session_input_limit(max_bytes: u32) {
    core_utils::set_session_max_input_bytes(max_bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}
