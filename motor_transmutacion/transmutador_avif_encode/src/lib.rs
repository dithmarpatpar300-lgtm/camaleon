//! PNG/JPEG → AVIF encoder (Tier 3 Phase 3.2).
//!
//! Isolated from `transmutador_avif` (decode) so each Wasm module stays within NFR-7.
//! Encode backend: `ravif` 0.13 (`default-features = false`; rav1e `wasm` on wasm32).

use std::io::Cursor;
use std::time::Instant;

use core_utils::semantic_alpha::dynamic_image_has_meaningful_alpha;
use image::{DynamicImage, ImageReader};
use imgref::Img;
use ravif::{Encoder, RGBA8};
use wasm_bindgen::prelude::*;

pub const DEFAULT_ENCODE_QUALITY: u8 = 60;
pub const MIN_ENCODE_QUALITY: u8 = 1;
pub const MAX_ENCODE_QUALITY: u8 = 100;

pub const DEFAULT_ENCODE_SPEED: u8 = 6;
pub const MIN_ENCODE_SPEED: u8 = 1;
pub const MAX_ENCODE_SPEED: u8 = 10;

pub struct EncodeTiming {
    pub encode_ms: u64,
    pub output_bytes: usize,
}

pub fn validate_encode_quality(q: u8) -> Result<u8, String> {
    if q < MIN_ENCODE_QUALITY {
        return Err(format!(
            "AVIF quality must be at least {}",
            MIN_ENCODE_QUALITY
        ));
    }
    if q > MAX_ENCODE_QUALITY {
        return Err(format!(
            "AVIF quality {} exceeds maximum ({})",
            q, MAX_ENCODE_QUALITY
        ));
    }
    Ok(q)
}

pub fn validate_encode_speed(s: u8) -> Result<u8, String> {
    if s < MIN_ENCODE_SPEED {
        return Err(format!("AVIF speed must be at least {}", MIN_ENCODE_SPEED));
    }
    if s > MAX_ENCODE_SPEED {
        return Err(format!(
            "AVIF speed {} exceeds maximum ({})",
            s, MAX_ENCODE_SPEED
        ));
    }
    Ok(s)
}

fn dynamic_image_to_ravif_pixels(img: &DynamicImage) -> (Vec<RGBA8>, usize, usize) {
    let meaningful_alpha = dynamic_image_has_meaningful_alpha(img);
    let (w, h) = (img.width() as usize, img.height() as usize);

    if meaningful_alpha {
        let rgba = img.to_rgba8();
        let pixels = rgba
            .pixels()
            .map(|p| RGBA8::new(p.0[0], p.0[1], p.0[2], p.0[3]))
            .collect();
        (pixels, w, h)
    } else {
        let rgb = img.to_rgb8();
        let pixels = rgb
            .pixels()
            .map(|p| RGBA8::new(p.0[0], p.0[1], p.0[2], 255))
            .collect();
        (pixels, w, h)
    }
}

pub fn encode_dynamic_to_avif(
    img: &DynamicImage,
    quality: u8,
    speed: u8,
) -> Result<Vec<u8>, String> {
    validate_encode_quality(quality)?;
    validate_encode_speed(speed)?;

    let (pixels, w, h) = dynamic_image_to_ravif_pixels(img);
    let img_ref = Img::new(pixels.as_slice(), w, h);

    let mut encoder = Encoder::new()
        .with_quality(f32::from(quality))
        .with_speed(speed);

    if dynamic_image_has_meaningful_alpha(img) {
        encoder = encoder.with_alpha_quality(f32::from(quality));
    }

    encoder
        .encode_rgba(img_ref)
        .map(|res| res.avif_file)
        .map_err(|e| format!("Failed to encode AVIF: {}", e))
}

pub fn encode_dynamic_to_avif_timed(
    img: &DynamicImage,
    quality: u8,
    speed: u8,
) -> Result<(Vec<u8>, EncodeTiming), String> {
    let started = Instant::now();
    let output = encode_dynamic_to_avif(img, quality, speed)?;
    let encode_ms = started.elapsed().as_millis() as u64;
    let output_bytes = output.len();
    Ok((
        output,
        EncodeTiming {
            encode_ms,
            output_bytes,
        },
    ))
}

pub fn transmutar_png_a_avif_inner(
    input: &[u8],
    quality: u8,
    speed: u8,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_encode_quality(quality)?;
    validate_encode_speed(speed)?;

    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode PNG: {}", e))?;

    let output = encode_dynamic_to_avif(&img, quality, speed)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Avif)?;
    Ok(output)
}

pub fn transmutar_jpg_a_avif_inner(
    input: &[u8],
    quality: u8,
    speed: u8,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_encode_quality(quality)?;
    validate_encode_speed(speed)?;

    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt JPEG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode JPEG: {}", e))?;

    let output = encode_dynamic_to_avif(&img, quality, speed)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Avif)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_png_a_avif(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_png_a_avif_inner(
        input_bytes,
        DEFAULT_ENCODE_QUALITY,
        DEFAULT_ENCODE_SPEED,
    )
}

#[wasm_bindgen]
pub fn transmutar_png_a_avif_with_options(
    input_bytes: &[u8],
    quality: u8,
    speed: u8,
) -> Result<Vec<u8>, String> {
    transmutar_png_a_avif_inner(input_bytes, quality, speed)
}

#[wasm_bindgen]
pub fn transmutar_jpg_a_avif(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_jpg_a_avif_inner(
        input_bytes,
        DEFAULT_ENCODE_QUALITY,
        DEFAULT_ENCODE_SPEED,
    )
}

#[wasm_bindgen]
pub fn transmutar_jpg_a_avif_with_options(
    input_bytes: &[u8],
    quality: u8,
    speed: u8,
) -> Result<Vec<u8>, String> {
    transmutar_jpg_a_avif_inner(input_bytes, quality, speed)
}

pub fn estimate_png_to_avif_inner(
    input: &[u8],
    quality: u8,
    speed: u8,
) -> Result<u32, String> {
    Ok(transmutar_png_a_avif_inner(input, quality, speed)?.len() as u32)
}

pub fn estimate_jpg_to_avif_inner(
    input: &[u8],
    quality: u8,
    speed: u8,
) -> Result<u32, String> {
    Ok(transmutar_jpg_a_avif_inner(input, quality, speed)?.len() as u32)
}

#[wasm_bindgen]
pub fn estimate_png_to_avif_size(
    input_bytes: &[u8],
    quality: u8,
    speed: u8,
) -> Result<u32, String> {
    estimate_png_to_avif_inner(input_bytes, quality, speed)
}

#[wasm_bindgen]
pub fn estimate_jpg_to_avif_size(
    input_bytes: &[u8],
    quality: u8,
    speed: u8,
) -> Result<u32, String> {
    estimate_jpg_to_avif_inner(input_bytes, quality, speed)
}

#[wasm_bindgen]
pub fn set_session_input_limit(max_bytes: u32) {
    core_utils::set_session_max_input_bytes(max_bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}
