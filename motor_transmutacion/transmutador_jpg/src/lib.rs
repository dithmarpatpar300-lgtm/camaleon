//! JPEG → PNG transmutator. Decodes JPEG, re-encodes as PNG.
//!
//! ## Color-type policy
//!
//! Output PNG is always **RGB (color type 2)**, never RGBA (color type 6)
//! for JPEG sources (SPEC §5.4.3 P2). JPEG has no alpha channel;
//! emitting RGBA wastes ~33% raster size. Grayscale JPEG sources
//! expand to RGB (same luminance replicated across channels).
//!
//! ## Compression
//!
//! Default DEFLATE compression level: **6** (balanced CPU/size tradeoff).
//! Configurable via `transmutar_jpg_a_png_with_compression` (1–9).
//! Filter type: **Adaptive** (per-scanline heuristic selection).
//! Higher compression → smaller files at higher CPU cost.
//!
//! ## File size expectation
//!
//! JPEG→PNG transmutation typically produces files **5–15× larger**
//! than the source for photographic content (SPEC §5.4.2).
//! This is expected and correct — PNG stores the decoded raster
//! losslessly; JPEG discards ~89% of raster entropy via quantization.
//!
//! ## Metadata
//!
//! StripAll (SPEC §5.10). Decode→encode does not copy source
//! EXIF/XMP/APP segments into output PNG chunks.

use std::io::Cursor;

use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{ExtendedColorType, ImageEncoder, ImageReader};
use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

pub const DEFAULT_PNG_COMPRESSION: u8 = 6;
pub const MIN_PNG_COMPRESSION: u8 = 1;
pub const MAX_PNG_COMPRESSION: u8 = 9;

// ---------------------------------------------------------------------------
// Bounded newtypes (§5.11.4)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Compression(u8);

impl Compression {
    pub const DEFAULT: Compression = Compression(DEFAULT_PNG_COMPRESSION);

    pub fn try_new(value: u8) -> Result<Self, String> {
        if value == 0 {
            return Err("PNG compression level must be at least 1".into());
        }
        if value > MAX_PNG_COMPRESSION {
            return Err(format!(
                "PNG compression level {} exceeds maximum ({})",
                value, MAX_PNG_COMPRESSION
            ));
        }
        Ok(Compression(value))
    }

    pub fn value(&self) -> u8 {
        self.0
    }
}

// ---------------------------------------------------------------------------
// Options types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct JpgToPngOptions {
    pub compression: u8,
}

impl Default for JpgToPngOptions {
    fn default() -> Self {
        Self {
            compression: Compression::DEFAULT.value(),
        }
    }
}

// ---------------------------------------------------------------------------
// Validation (kept for backward compat; newtype is preferred constructor)
// ---------------------------------------------------------------------------

pub fn validate_compression(compression: u8) -> Result<u8, String> {
    Compression::try_new(compression)?;
    Ok(compression)
}

// ---------------------------------------------------------------------------
// Core conversion
// ---------------------------------------------------------------------------

pub fn jpg_bytes_to_png_bytes(
    input: &[u8],
    options: &JpgToPngOptions,
) -> Result<Vec<u8>, String> {
    validate_compression(options.compression)?;

    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt JPEG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode JPEG: {}", e))?;

    let rgb = img.to_rgb8();

    let mut buf = Cursor::new(Vec::new());
    let encoder = PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Level(options.compression),
        FilterType::Adaptive,
    );
    encoder
        .write_image(rgb.as_raw(), rgb.width(), rgb.height(), ExtendedColorType::Rgb8)
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;

    Ok(buf.into_inner())
}

// ---------------------------------------------------------------------------
// IHDR color type reader (for tests)
// ---------------------------------------------------------------------------

pub fn png_ihdr_color_type(png: &[u8]) -> Option<u8> {
    if png.len() < 26 || &png[0..8] != b"\x89PNG\r\n\x1a\n" {
        return None;
    }
    Some(png[25])
}

// ---------------------------------------------------------------------------
// Pipeline wrappers (validation + conversion)
// ---------------------------------------------------------------------------

pub fn transmutar_jpg_a_png_inner(
    input_bytes: &[u8],
    options: &JpgToPngOptions,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input_bytes)?;
    let output = jpg_bytes_to_png_bytes(input_bytes, options)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

// ---------------------------------------------------------------------------
// Wasm exports (backward-compatible)
// ---------------------------------------------------------------------------

#[wasm_bindgen]
pub fn transmutar_jpg_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_jpg_a_png_inner(input_bytes, &JpgToPngOptions::default())
}

#[wasm_bindgen]
pub fn transmutar_jpg_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
) -> Result<Vec<u8>, String> {
    validate_compression(compression)?;
    let options = JpgToPngOptions { compression };
    transmutar_jpg_a_png_inner(input_bytes, &options)
}

// ---------------------------------------------------------------------------
// Size-only estimate (Phase B — CountingWriter, no output allocation)
// ---------------------------------------------------------------------------

use core_utils::counting_writer::CountingWriter;

#[wasm_bindgen]
pub fn estimate_jpg_to_png_size(
    input_bytes: &[u8],
    compression: u8,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;

    let img = ImageReader::new(Cursor::new(input_bytes))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt JPEG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode JPEG: {}", e))?;

    let rgb = img.to_rgb8();

    let mut writer = CountingWriter::default();
    let encoder = PngEncoder::new_with_quality(
        &mut writer,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );
    encoder
        .write_image(rgb.as_raw(), rgb.width(), rgb.height(), ExtendedColorType::Rgb8)
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;

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
