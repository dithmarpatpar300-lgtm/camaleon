use std::io::Cursor;

use image::ImageReader;
use wasm_bindgen::prelude::*;

pub fn jpg_bytes_to_png_bytes(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    let img = ImageReader::new(Cursor::new(input_bytes))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt JPEG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode JPEG: {}", e))?;

    let mut png_bytes = Cursor::new(Vec::new());
    img.write_to(&mut png_bytes, image::ImageFormat::Png)
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;

    Ok(png_bytes.into_inner())
}

/// Full transmutation pipeline (validation + conversion). Used by Wasm and native tests.
pub fn transmutar_jpg_a_png_inner(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input_bytes)?;
    jpg_bytes_to_png_bytes(input_bytes)
}

#[wasm_bindgen]
pub fn transmutar_jpg_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_jpg_a_png_inner(input_bytes)
}
