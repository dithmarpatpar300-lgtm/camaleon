//! PNG → JPEG transmutator. Decodes PNG, re-encodes as JPEG at quality 85.
//!
//! Metadata policy: StripAll (SPEC §5.10).
//! Decode→encode does not copy source tEXt/eXIf/iCCP chunks.

use std::io::Cursor;

use image::codecs::jpeg::JpegEncoder;
use image::ImageReader;
use wasm_bindgen::prelude::*;

pub const DEFAULT_JPEG_QUALITY: u8 = 85;

pub fn png_bytes_to_jpg_bytes(input: &[u8]) -> Result<Vec<u8>, String> {
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode PNG: {}", e))?;

    let mut jpg_bytes = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut jpg_bytes, DEFAULT_JPEG_QUALITY);
    encoder
        .encode_image(&img)
        .map_err(|e| format!("Failed to encode JPEG: {}", e))?;

    Ok(jpg_bytes.into_inner())
}

/// Full transmutation pipeline (validation + conversion). Used by Wasm and native tests.
pub fn transmutar_png_a_jpg_inner(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input_bytes)?;
    png_bytes_to_jpg_bytes(input_bytes)
}

#[wasm_bindgen]
pub fn transmutar_png_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_png_a_jpg_inner(input_bytes)
}
