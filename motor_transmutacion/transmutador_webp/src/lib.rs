//! WebP → PNG transmutator. Decodes WebP (lossy or lossless), re-encodes as PNG.
//!
//! ## Color-type policy
//! Output PNG is RGBA (color type 6) if source has alpha, RGB (color type 2) if not.
//!
//! ## Compression
//! Default DEFLATE compression level: **6**. Configurable via
//! `transmutar_webp_a_png_with_compression` (1–9).
//!
//! ## Metadata
//! StripAll (SPEC §5.10). Decode→encode does not copy source metadata.

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{ExtendedColorType, ImageEncoder, ImageReader};
use wasm_bindgen::prelude::*;

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

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

fn webp_bytes_to_png_bytes(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt WebP data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode WebP: {}", e))?;

    let has_alpha = img.color().has_alpha();

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
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;
    let img = ImageReader::new(Cursor::new(input_bytes))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt WebP data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode WebP: {}", e))?;

    let has_alpha = img.color().has_alpha();
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
