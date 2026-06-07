//! PNG → WebP lossless encoder (VP8L via `image` 0.25).
//!
//! ## Color-type policy
//! RGBA when source has alpha; RGB when opaque.
//!
//! ## Metadata
//! StripAll (SPEC §5.10) — decode→encode does not copy source metadata.

use std::io::Cursor;

use core_utils::counting_writer::count_webp_bytes;
use image::ImageReader;
use wasm_bindgen::prelude::*;

fn png_bytes_to_webp_bytes(input: &[u8]) -> Result<Vec<u8>, String> {
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode PNG: {}", e))?;

    let mut buf = Cursor::new(Vec::new());

    if img.color().has_alpha() {
        let rgba = img.to_rgba8();
        rgba.write_to(&mut buf, image::ImageFormat::WebP)
            .map_err(|e| format!("Failed to encode WebP: {}", e))?;
    } else {
        let rgb = img.to_rgb8();
        rgb.write_to(&mut buf, image::ImageFormat::WebP)
            .map_err(|e| format!("Failed to encode WebP: {}", e))?;
    }

    Ok(buf.into_inner())
}

pub fn transmutar_png_a_webp_inner(input: &[u8]) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    let output = png_bytes_to_webp_bytes(input)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::WebP)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_png_a_webp(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_png_a_webp_inner(input_bytes)
}

#[wasm_bindgen]
pub fn estimate_png_to_webp_size(input_bytes: &[u8]) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    let img = ImageReader::new(Cursor::new(input_bytes))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode PNG: {}", e))?;

    let bytes = if img.color().has_alpha() {
        count_webp_bytes(&img.to_rgba8())?
    } else {
        count_webp_bytes(&img.to_rgb8())?
    };

    Ok(bytes as u32)
}

// ---------------------------------------------------------------------------
// JPEG → WebP exports
// ---------------------------------------------------------------------------

fn jpg_bytes_to_webp_bytes(input: &[u8]) -> Result<Vec<u8>, String> {
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt JPEG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode JPEG: {}", e))?;

    let rgb = img.to_rgb8();
    let mut buf = Cursor::new(Vec::new());
    rgb.write_to(&mut buf, image::ImageFormat::WebP)
        .map_err(|e| format!("Failed to encode WebP: {}", e))?;
    Ok(buf.into_inner())
}

pub fn transmutar_jpg_a_webp_inner(input: &[u8]) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    let output = jpg_bytes_to_webp_bytes(input)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::WebP)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_jpg_a_webp(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_jpg_a_webp_inner(input_bytes)
}

#[wasm_bindgen]
pub fn estimate_jpg_to_webp_size(input_bytes: &[u8]) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    let img = ImageReader::new(Cursor::new(input_bytes))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt JPEG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode JPEG: {}", e))?;

    let bytes = count_webp_bytes(&img.to_rgb8())?;
    Ok(bytes as u32)
}
